const { redactForLog } = require('../logging/redaction');

const REFRESH_DELAY_MS = 60_000;
const TRANSIENT_PROVIDER_ERRORS = new Set([
  'STORE_PROVIDER_TIMEOUT', 'STORE_RATE_LIMITED', 'STORE_PROVIDER_UNAVAILABLE'
]);

function storeError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function atMostFive(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? Math.min(number, 5) : 5;
}

function normalizeSearchToken(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLocaleLowerCase();
}

function words(value) {
  return String(value || '').match(/[\p{L}\p{N}]+/gu) || [];
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const above = previous[rightIndex];
      previous[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : 1 + Math.min(diagonal, above, previous[rightIndex - 1]);
      diagonal = above;
    }
  }
  return previous[right.length];
}

function closestCachedTerm(products, query) {
  const queryTokens = words(query).map(normalizeSearchToken).filter((token) => token.length >= 3);
  let best = null;
  for (const product of products) {
    for (const rawTerm of words(product.name)) {
      const term = normalizeSearchToken(rawTerm);
      if (term.length < 3) continue;
      for (const queryToken of queryTokens) {
        const score = 1 - (editDistance(term, queryToken) / Math.max(term.length, queryToken.length));
        if (score >= 0.6 && (!best || score > best.score)) best = { rawTerm, score };
      }
    }
  }
  return best?.rawTerm || null;
}

function productData(product, tenantId, integrationId, syncedAt) {
  return {
    externalId: String(product.externalId),
    sku: product.sku || null,
    name: product.name || '',
    description: product.description || null,
    imageUrl: product.imageUrl || null,
    productUrl: product.productUrl || product.storefrontUrl || null,
    price: product.price || null,
    salePrice: product.salePrice || null,
    currency: product.currency || null,
    status: product.status || (product.isAvailable ? 'sale' : 'out'),
    isAvailable: Boolean(product.isAvailable),
    quantity: Number.isInteger(product.quantity) ? product.quantity : null,
    unlimitedQuantity: Boolean(product.unlimitedQuantity),
    variants: Array.isArray(product.variants) ? product.variants : [],
    providerUpdatedAt: product.providerUpdatedAt || null,
    syncedAt,
    lastVerifiedAt: syncedAt,
    deletedAt: null,
    ...(tenantId ? { tenantId, integrationId } : {})
  };
}

function compactProduct(product, { liveVerified, verifiedAt }) {
  const result = {
    externalId: product.externalId,
    sku: product.sku || null,
    name: product.name || '',
    description: product.description || null,
    imageUrl: product.imageUrl || null,
    productUrl: product.productUrl || product.storefrontUrl || null,
    liveVerified,
    currentPriceVerified: liveVerified,
    currentAvailabilityVerified: liveVerified,
    verifiedAt: liveVerified ? new Date(verifiedAt).toISOString() : (product.lastVerifiedAt ? new Date(product.lastVerifiedAt).toISOString() : null)
  };

  if (liveVerified) {
    Object.assign(result, {
      price: product.price || null,
      salePrice: product.salePrice || null,
      currency: product.currency || null,
      isAvailable: Boolean(product.isAvailable),
      quantity: Number.isInteger(product.quantity) ? product.quantity : null,
      unlimitedQuantity: Boolean(product.unlimitedQuantity),
      variants: Array.isArray(product.variants) ? product.variants : []
    });
  }
  return result;
}

function createStoreService({ prisma, registry, clock = () => new Date(), enqueueRefresh = async () => {} } = {}) {
  async function scheduleRepair(input) {
    try {
      await enqueueRefresh(input);
    } catch (_) {
      console.info('store.repair.enqueue', redactForLog({
        integrationId: input.integrationId,
        operation: input.operation,
        outcome: 'error',
        errorCode: 'STORE_QUEUE_UNAVAILABLE'
      }));
    }
  }

  const repairDelay = (error) => error?.code === 'STORE_RATE_LIMITED'
    ? Math.min(60_000, Math.max(1000, Number(error.retryAfterMs) || 1000))
    : REFRESH_DELAY_MS;

  async function integrationFor(tenantId, integrationId) {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, tenantId, type: 'store_salla', status: 'active' }
    });
    if (!integration) throw storeError('STORE_INTEGRATION_NOT_FOUND');
    return integration;
  }

  async function upsertProduct({ tenantId, integrationId, product, syncedAt = clock() }) {
    if (!product?.externalId) return;
    const data = productData(product, tenantId, integrationId, syncedAt);
    const {
      tenantId: ignoredTenantId,
      integrationId: ignoredIntegrationId,
      externalId: ignoredExternalId,
      ...update
    } = data;
    await prisma.storeProduct.upsert({
      where: { integrationId_externalId: { integrationId, externalId: String(product.externalId) } },
      create: data,
      update
    });
  }

  function logLookup({ integrationId, operation, source, startedAt, resultCount, outcome, errorCode }) {
    console.info('store.lookup', redactForLog({
      integrationId, operation, source, durationMs: Date.now() - startedAt, resultCount, outcome,
      ...(errorCode ? { errorCode } : {})
    }));
  }

  async function searchProducts({ tenantId, integrationId, query, maxResults } = {}) {
    const startedAt = Date.now();
    const limit = atMostFive(maxResults);
    let source = 'cache';
    try {
      const integration = await integrationFor(tenantId, integrationId);
      let cached = await prisma.storeProduct.findMany({
        where: {
          tenantId, integrationId, deletedAt: null,
          OR: ['name', 'sku', 'description'].map((field) => ({ [field]: { contains: String(query || ''), mode: 'insensitive' } }))
        },
        take: limit
      });
      const adapter = registry.get(integration.type);
      try {
        let live = await adapter.searchProducts({ tenantId, integrationId }, String(query || ''));
        if ((!Array.isArray(live) || live.length === 0) && cached.length === 0) {
          const catalog = await prisma.storeProduct.findMany({
            where: { tenantId, integrationId, deletedAt: null },
            take: 100
          });
          const retryTerm = closestCachedTerm(catalog, query);
          if (retryTerm) {
            cached = catalog.filter((product) => words(product.name).some(
              (term) => normalizeSearchToken(term) === normalizeSearchToken(retryTerm)
            )).slice(0, limit);
            live = await adapter.searchProducts({ tenantId, integrationId }, retryTerm);
          }
        }
        const verifiedAt = clock();
        await Promise.all((Array.isArray(live) ? live : []).slice(0, 5).map((product) => upsertProduct({ tenantId, integrationId, product, syncedAt: verifiedAt })));
        const merged = new Map();
        for (const product of (Array.isArray(live) ? live : []).slice(0, 5)) {
          if (product?.externalId) merged.set(String(product.externalId), { product, liveVerified: true, verifiedAt });
        }
        for (const product of cached) {
          if (!merged.has(product.externalId)) merged.set(product.externalId, { product, liveVerified: false });
        }
        const products = [...merged.values()].slice(0, limit).map(({ product, liveVerified, verifiedAt: productVerifiedAt }) => compactProduct(product, { liveVerified, verifiedAt: productVerifiedAt }));
        source = 'live';
        logLookup({ integrationId, operation: 'search_products', source, startedAt, resultCount: products.length, outcome: 'success' });
        return { source, products };
      } catch (error) {
        if (!TRANSIENT_PROVIDER_ERRORS.has(error?.code)) throw storeError('STORE_LOOKUP_FAILED');
        const products = cached.slice(0, limit).map((product) => compactProduct(product, { liveVerified: false }));
        await scheduleRepair({ tenantId, integrationId, operation: 'search_products', delayMs: repairDelay(error) });
        logLookup({ integrationId, operation: 'search_products', source, startedAt, resultCount: products.length, outcome: 'fallback', errorCode: error.code });
        return { source, products };
      }
    } catch (error) {
      logLookup({ integrationId, operation: 'search_products', source, startedAt, resultCount: 0, outcome: 'error', errorCode: error?.code || 'STORE_LOOKUP_FAILED' });
      throw error?.code ? error : storeError('STORE_LOOKUP_FAILED');
    }
  }

  async function getProduct({ tenantId, integrationId, productId } = {}) {
    const startedAt = Date.now();
    let source = 'cache';
    try {
      const integration = await integrationFor(tenantId, integrationId);
      const cached = await prisma.storeProduct.findFirst({
        where: { tenantId, integrationId, externalId: String(productId), deletedAt: null }
      });
      if (!cached) throw storeError('STORE_PRODUCT_NOT_FOUND');
      const adapter = registry.get(integration.type);
      const requestedProductId = String(productId);
      const notFound = async () => {
        await prisma.storeProduct.updateMany({
          where: { tenantId, integrationId, externalId: requestedProductId, deletedAt: null }, data: { deletedAt: clock() }
        });
        source = 'live';
        logLookup({ integrationId, operation: 'get_product', source, startedAt, resultCount: 0, outcome: 'not_found' });
        return { source, product: null, notFound: true };
      };
      try {
        const product = await adapter.getProduct({ tenantId, integrationId }, requestedProductId);
        if (!product) return notFound();
        if (String(product.externalId) !== requestedProductId) throw storeError('STORE_INVALID_PROVIDER_RESPONSE');
        await upsertProduct({ tenantId, integrationId, product });
        source = 'live';
        const result = compactProduct(product, { liveVerified: true, verifiedAt: clock() });
        logLookup({ integrationId, operation: 'get_product', source, startedAt, resultCount: 1, outcome: 'success' });
        return { source, product: result };
      } catch (error) {
        if (error?.code === 'STORE_PROVIDER_NOT_FOUND') return notFound();
        if (error?.code === 'STORE_INVALID_PROVIDER_RESPONSE') throw error;
        if (!TRANSIENT_PROVIDER_ERRORS.has(error?.code)) throw storeError('STORE_LOOKUP_FAILED');
        const result = compactProduct(cached, { liveVerified: false });
        await scheduleRepair({
          tenantId, integrationId, productId: requestedProductId,
          operation: 'get_product', delayMs: repairDelay(error)
        });
        logLookup({ integrationId, operation: 'get_product', source, startedAt, resultCount: 1, outcome: 'fallback', errorCode: error.code });
        return { source, product: result };
      }
    } catch (error) {
      logLookup({ integrationId, operation: 'get_product', source, startedAt, resultCount: 0, outcome: 'error', errorCode: error?.code || 'STORE_LOOKUP_FAILED' });
      throw error?.code ? error : storeError('STORE_LOOKUP_FAILED');
    }
  }

  async function syncCatalogPage({ tenantId, integrationId, products, syncStartedAt } = {}) {
    await integrationFor(tenantId, integrationId);
    const syncedAt = syncStartedAt || clock();
    const items = Array.isArray(products) ? products : [];
    await Promise.all(items.map((product) => upsertProduct({ tenantId, integrationId, product, syncedAt })));
    return { scanned: items.length };
  }

  async function completeFullSync({ tenantId, integrationId, syncStartedAt, completed = false } = {}) {
    await integrationFor(tenantId, integrationId);
    if (!completed) return { deleted: 0 };
    const startedAt = new Date(syncStartedAt);
    if (!Number.isFinite(startedAt.getTime())) throw storeError('STORE_SYNC_INCOMPLETE');
    const deleted = await prisma.storeProduct.updateMany({
      where: { tenantId, integrationId, deletedAt: null, syncedAt: { lt: startedAt } }, data: { deletedAt: clock() }
    });
    return { deleted: deleted.count };
  }

  async function deleteCachedProduct({ tenantId, integrationId, productId } = {}) {
    await integrationFor(tenantId, integrationId);
    const deleted = await prisma.storeProduct.updateMany({
      where: { tenantId, integrationId, externalId: String(productId), deletedAt: null }, data: { deletedAt: clock() }
    });
    return { deleted: deleted.count };
  }

  return { searchProducts, getProduct, syncCatalogPage, completeFullSync, deleteCachedProduct };
}

module.exports = { createStoreService };
