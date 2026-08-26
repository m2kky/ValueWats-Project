const BullQueue = require('bull');
const { createStoreAdapterRegistry } = require('./storeAdapterRegistry');
const { createStoreService } = require('./storeService');
const { createSallaAdapter } = require('./providers/salla/sallaAdapter');
const { createSallaClient } = require('./providers/salla/sallaClient');
const { createSallaTokenService } = require('./providers/salla/sallaTokenService');
const { createSallaOAuthService } = require('./providers/salla/sallaOAuthService');

const RECONCILE_EVERY_MS = 6 * 60 * 60 * 1000;
const RECONCILE_JITTER_MS = 30_000;
const defaultSleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function safeCode(error) {
  return /^STORE_[A-Z0-9_]+$/.test(error?.code || '') ? error.code : 'STORE_SYNC_FAILED';
}

function stableError(code) {
  return Object.assign(new Error(code), { code });
}

function createStoreSyncQueue({
  prisma,
  registry,
  storeService,
  Queue = BullQueue,
  clock = () => new Date(),
  sleep = defaultSleep,
  random = Math.random
} = {}) {
  const queue = new Queue('store-catalog-sync', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnFail: 100
    }
  });

  if (!registry || !storeService) {
    const tokenService = createSallaTokenService({ prisma });
    const client = createSallaClient({ tokenService });
    registry ||= createStoreAdapterRegistry({ store_salla: createSallaAdapter({ client, tokenService }) });
    storeService ||= createStoreService({
      prisma,
      registry,
      enqueueRefresh: ({ operation, delayMs, ...input }) => operation === 'get_product'
        ? addProductRefresh(input, delayMs)
        : addFullSync(input, delayMs)
    });
  }

  async function activeIntegration(tenantId, integrationId) {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, tenantId, type: 'store_salla', status: 'active' }
    });
    if (!integration) throw stableError('STORE_INTEGRATION_NOT_FOUND');
    return integration;
  }

  async function mergeSyncMetadata(integrationId, fields) {
    const latest = await prisma.integration.findUnique({ where: { id: integrationId }, select: { metadata: true } });
    const metadata = latest?.metadata && !Array.isArray(latest.metadata) && typeof latest.metadata === 'object'
      ? latest.metadata
      : {};
    await prisma.integration.update({ where: { id: integrationId }, data: { metadata: { ...metadata, ...fields } } });
  }

  async function addFullSync({ tenantId, integrationId }, delay) {
    const jobId = `store-full:${integrationId}`;
    const existing = await queue.getJob?.(jobId);
    if (existing && ['completed', 'failed'].includes(await existing.getState())) await existing.remove();
    return queue.add('full_sync', { tenantId, integrationId }, {
      jobId,
      ...(delay === undefined ? {} : { delay }),
      removeOnComplete: true
    });
  }

  function addProductRefresh(input, delay) {
    return queue.add('product_refresh', input, {
      removeOnComplete: true,
      ...(delay === undefined ? {} : { delay })
    });
  }

  queue.process('full_sync', async (job) => {
    const { tenantId, integrationId } = job.data;
    const syncStartedAt = clock();
    try {
      const integration = await activeIntegration(tenantId, integrationId);
      const adapter = registry.get(integration.type);
      const visitedPages = new Set();
      let page = 1;
      let pages = 0;
      let scanned = 0;

      while (page !== null) {
        if (visitedPages.has(page)) throw stableError('STORE_SYNC_INVALID_PAGE');
        visitedPages.add(page);
        let result;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            result = await adapter.listProductsPage({ tenantId, integrationId }, page);
            break;
          } catch (error) {
            if (error?.code !== 'STORE_RATE_LIMITED') throw error;
            if (attempt === 3) {
              job.discard?.();
              throw error;
            }
            await sleep(Math.min(60_000, Math.max(1000, Number(error.retryAfterMs) || 1000)));
          }
        }
        await storeService.syncCatalogPage({ tenantId, integrationId, products: result.products, syncStartedAt });
        scanned += Array.isArray(result.products) ? result.products.length : 0;
        pages += 1;
        page = result.nextPage;
      }

      const { deleted } = await storeService.completeFullSync({
        tenantId, integrationId, syncStartedAt, completed: true
      });
      await mergeSyncMetadata(integrationId, {
        lastSyncStatus: 'success',
        lastSyncedAt: clock().toISOString(),
        lastSyncError: null
      });
      console.info('store.sync.complete', { integrationId, outcome: 'success', scanned, deleted, pages });
      return { scanned, deleted, pages };
    } catch (error) {
      const code = safeCode(error);
      try {
        const latest = await prisma.integration.findUnique({ where: { id: integrationId }, select: { metadata: true } });
        const lastSyncedAt = latest?.metadata && typeof latest.metadata === 'object' && !Array.isArray(latest.metadata)
          ? latest.metadata.lastSyncedAt || null
          : null;
        await mergeSyncMetadata(integrationId, {
          lastSyncStatus: 'failed', lastSyncedAt, lastSyncError: code
        });
      } catch (_) {}
      console.info('store.sync.complete', { integrationId, outcome: 'error', errorCode: code });
      throw stableError(code);
    }
  });

  queue.process('product_refresh', async (job) => {
    const { tenantId, integrationId, productId } = job.data;
    const integration = await activeIntegration(tenantId, integrationId);
    const adapter = registry.get(integration.type);
    let product;
    try {
      product = await adapter.getProduct({ tenantId, integrationId }, String(productId));
    } catch (error) {
      if (error?.code !== 'STORE_PROVIDER_NOT_FOUND') throw stableError(safeCode(error));
    }
    if (!product) return storeService.deleteCachedProduct({ tenantId, integrationId, productId: String(productId) });
    return storeService.syncCatalogPage({ tenantId, integrationId, products: [product], syncStartedAt: clock() });
  });

  queue.process('product_delete', (job) => storeService.deleteCachedProduct({
    tenantId: job.data.tenantId,
    integrationId: job.data.integrationId,
    productId: String(job.data.productId)
  }));

  queue.process('reconcile_all', async () => {
    if (typeof prisma.integration.deleteMany === 'function') {
      await createSallaOAuthService({ prisma, clock }).reconcilePending();
    }
    const integrations = await prisma.integration.findMany({
      where: { type: 'store_salla', status: 'active' },
      select: { id: true, tenantId: true }
    });
    let delay = 0;
    for (const integration of integrations) {
      await addFullSync({
        tenantId: integration.tenantId,
        integrationId: integration.id
      }, delay);
      delay += Math.floor(random() * RECONCILE_JITTER_MS);
    }
    return { integrations: integrations.length };
  });

  const enqueueFullSync = ({ delayMs, ...input }) => addFullSync(input, delayMs);

  const enqueueProductRefresh = ({ delayMs, ...input }) => addProductRefresh(input, delayMs);
  const enqueueDelete = (input) => queue.add('product_delete', input, { removeOnComplete: true });
  const enqueueReconciliation = () => queue.add('reconcile_all', {}, {
    jobId: 'store-reconcile-v1',
    repeat: { every: RECONCILE_EVERY_MS },
    removeOnComplete: true
  });

  return {
    enqueueFullSync,
    enqueueProductRefresh,
    enqueueDelete,
    enqueueReconciliation,
    storeService,
    close: () => queue.close()
  };
}

module.exports = { createStoreSyncQueue };
