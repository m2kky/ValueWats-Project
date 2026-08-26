const { createStoreSyncQueue } = require('../../../src/stores/storeSyncQueue');

class FakeQueue {
  constructor(name, options) {
    FakeQueue.instance = this;
    this.name = name;
    this.options = options;
    this.add = vi.fn(async (jobName, data, jobOptions) => ({ id: jobOptions?.jobId || 'job', name: jobName, data }));
    this.close = vi.fn().mockResolvedValue(undefined);
    this.processors = {};
  }

  process(name, handler) {
    this.processors[name] = handler;
  }
}

function createHarness(overrides = {}) {
  const integrations = [
    {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active',
      externalAccountId: 'merchant-1', metadata: { merchantName: 'Keep Me', credentialVersion: 2 }
    }
  ];
  const prisma = {
    integration: {
      findFirst: vi.fn().mockResolvedValue(integrations[0]),
      findMany: vi.fn().mockResolvedValue(integrations),
      findUnique: vi.fn().mockResolvedValue(integrations[0]),
      update: vi.fn().mockResolvedValue(integrations[0])
    }
  };
  const adapter = {
    listProductsPage: vi.fn()
      .mockResolvedValueOnce({ products: [{ externalId: '1' }, { externalId: '2' }], nextPage: 2 })
      .mockResolvedValueOnce({ products: [{ externalId: '3' }], nextPage: null }),
    getProduct: vi.fn().mockResolvedValue({ externalId: '44' })
  };
  const storeService = {
    syncCatalogPage: vi.fn().mockResolvedValue({ scanned: 0 }),
    completeFullSync: vi.fn().mockResolvedValue({ deleted: 2 }),
    deleteCachedProduct: vi.fn().mockResolvedValue({ deleted: 1 })
  };
  const registry = { get: vi.fn().mockReturnValue(adapter) };
  const clock = vi.fn().mockReturnValue(new Date('2026-08-26T12:00:00.000Z'));
  const sleep = vi.fn().mockResolvedValue(undefined);
  const sallaEasyModeService = overrides.sallaEasyModeService || {
    reconcilePending: vi.fn().mockResolvedValue({ integrations: 0, authorizations: 0 })
  };
  const queueApi = createStoreSyncQueue({
    prisma, registry, storeService, Queue: FakeQueue, clock, sleep, random: () => 0.5,
    ...overrides, sallaEasyModeService
  });
  return {
    queueApi, queue: FakeQueue.instance, prisma, registry, adapter, storeService,
    integrations, sleep, sallaEasyModeService
  };
}

describe('Store catalog sync queue', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses bounded Bull retries and stable job identities', async () => {
    const { queueApi, queue } = createHarness();

    expect(queue.name).toBe('store-catalog-sync');
    expect(queue.options).toMatchObject({
      redis: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) },
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnFail: 100 }
    });

    await queueApi.enqueueFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1' });
    await queueApi.enqueueProductRefresh({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44' });
    await queueApi.enqueueDelete({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44' });
    await queueApi.enqueueReconciliation();

    expect(queue.add).toHaveBeenNthCalledWith(1, 'full_sync', {
      tenantId: 'tenant-1', integrationId: 'integration-1'
    }, expect.objectContaining({ jobId: 'store-full:integration-1' }));
    expect(queue.add).toHaveBeenNthCalledWith(2, 'product_refresh', expect.any(Object), { removeOnComplete: true });
    expect(queue.add).toHaveBeenNthCalledWith(3, 'product_delete', expect.any(Object), { removeOnComplete: true });
    expect(queue.add).toHaveBeenNthCalledWith(4, 'reconcile_all', {}, {
      jobId: 'store-reconcile-v1', repeat: { every: 6 * 60 * 60 * 1000 }, removeOnComplete: true
    });
  });

  it('replaces a retained failed full sync without bypassing active-job deduplication', async () => {
    const { queueApi, queue } = createHarness();
    const failed = { getState: vi.fn().mockResolvedValue('failed'), remove: vi.fn().mockResolvedValue(undefined) };
    const active = { getState: vi.fn().mockResolvedValue('active'), remove: vi.fn() };
    queue.getJob = vi.fn().mockResolvedValueOnce(failed).mockResolvedValueOnce(active);

    await queueApi.enqueueFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1' });
    await queueApi.enqueueFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1' });

    expect(failed.remove).toHaveBeenCalledOnce();
    expect(active.remove).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it('syncs catalog pages sequentially, reports counts, and merges safe metadata', async () => {
    const { queue, prisma, adapter, storeService } = createHarness();

    const result = await queue.processors.full_sync({
      data: { tenantId: 'tenant-1', integrationId: 'integration-1' }
    });

    expect(adapter.listProductsPage.mock.calls).toEqual([
      [{ tenantId: 'tenant-1', integrationId: 'integration-1' }, 1],
      [{ tenantId: 'tenant-1', integrationId: 'integration-1' }, 2]
    ]);
    expect(storeService.syncCatalogPage).toHaveBeenCalledTimes(2);
    expect(storeService.completeFullSync).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1', integrationId: 'integration-1', completed: true
    }));
    expect(result).toEqual({ scanned: 3, deleted: 2, pages: 2 });
    expect(prisma.integration.update).toHaveBeenCalledWith({
      where: { id: 'integration-1' },
      data: { metadata: {
        merchantName: 'Keep Me', credentialVersion: 2,
        lastSyncStatus: 'success', lastSyncedAt: '2026-08-26T12:00:00.000Z', lastSyncError: null
      } }
    });
  });

  it('retries only the rate-limited current page after bounded injected sleep', async () => {
    const { queue, adapter, sleep } = createHarness();
    adapter.listProductsPage.mockReset()
      .mockResolvedValueOnce({ products: [{ externalId: '1' }], nextPage: 2 })
      .mockRejectedValueOnce(Object.assign(new Error('rate limit'), { code: 'STORE_RATE_LIMITED', retryAfterMs: 120000 }))
      .mockResolvedValueOnce({ products: [{ externalId: '2' }], nextPage: null });

    await queue.processors.full_sync({
      data: { tenantId: 'tenant-1', integrationId: 'integration-1' }, discard: vi.fn()
    });

    expect(adapter.listProductsPage.mock.calls.map((call) => call[1])).toEqual([1, 2, 2]);
    expect(sleep).toHaveBeenCalledWith(60000);
  });

  it('stops after three rate-limited page attempts and prevents a whole-job restart', async () => {
    const { queue, adapter, sleep } = createHarness();
    const error = Object.assign(new Error('rate limit'), { code: 'STORE_RATE_LIMITED', retryAfterMs: 0 });
    adapter.listProductsPage.mockReset().mockRejectedValue(error);
    const job = { data: { tenantId: 'tenant-1', integrationId: 'integration-1' }, discard: vi.fn() };

    await expect(queue.processors.full_sync(job)).rejects.toMatchObject({ code: 'STORE_RATE_LIMITED' });

    expect(adapter.listProductsPage).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[1000], [1000]]);
    expect(job.discard).toHaveBeenCalledOnce();
  });

  it('schedules delayed full and product repair jobs through the queue API', async () => {
    const { queueApi, queue } = createHarness();

    await queueApi.enqueueFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1', delayMs: 7000 });
    await queueApi.enqueueProductRefresh({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44', delayMs: 9000 });

    expect(queue.add).toHaveBeenNthCalledWith(1, 'full_sync', {
      tenantId: 'tenant-1', integrationId: 'integration-1'
    }, expect.objectContaining({ jobId: 'store-full:integration-1', delay: 7000 }));
    expect(queue.add).toHaveBeenNthCalledWith(2, 'product_refresh', {
      tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44'
    }, { removeOnComplete: true, delay: 9000 });
  });

  it('stores and throws only a stable internal code after a failed full sync', async () => {
    const { queue, prisma, adapter } = createHarness();
    adapter.listProductsPage.mockReset().mockRejectedValue(Object.assign(new Error('provider-secret-body'), {
      code: 'STORE_PROVIDER_UNAVAILABLE', response: { data: { token: 'provider-secret' } }
    }));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(queue.processors.full_sync({
      data: { tenantId: 'tenant-1', integrationId: 'integration-1' }
    })).rejects.toMatchObject({ code: 'STORE_PROVIDER_UNAVAILABLE', message: 'STORE_PROVIDER_UNAVAILABLE' });

    expect(prisma.integration.update).toHaveBeenCalledWith({
      where: { id: 'integration-1' },
      data: { metadata: expect.objectContaining({
        merchantName: 'Keep Me', lastSyncStatus: 'failed', lastSyncedAt: null,
        lastSyncError: 'STORE_PROVIDER_UNAVAILABLE'
      }) }
    });
    expect(JSON.stringify([prisma.integration.update.mock.calls, info.mock.calls])).not.toContain('provider-secret');
  });

  it('refreshes one provider product and soft deletes one cached product', async () => {
    const { queue, adapter, storeService } = createHarness();

    await queue.processors.product_refresh({
      data: { tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44' }
    });
    await queue.processors.product_delete({
      data: { tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44' }
    });

    expect(adapter.getProduct).toHaveBeenCalledWith({ tenantId: 'tenant-1', integrationId: 'integration-1' }, '44');
    expect(storeService.syncCatalogPage).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1', integrationId: 'integration-1', products: [{ externalId: '44' }]
    }));
    expect(storeService.deleteCachedProduct).toHaveBeenCalledWith({
      tenantId: 'tenant-1', integrationId: 'integration-1', productId: '44'
    });
  });

  it('enumerates active Salla integrations sequentially with bounded jitter', async () => {
    const { queue, prisma, sallaEasyModeService } = createHarness();
    prisma.integration.findMany.mockResolvedValue([
      { id: 'integration-1', tenantId: 'tenant-1' },
      { id: 'integration-2', tenantId: 'tenant-2' },
      { id: 'integration-3', tenantId: 'tenant-3' }
    ]);
    let activeAdds = 0;
    let maxActiveAdds = 0;
    queue.add.mockImplementation(async () => {
      activeAdds += 1;
      maxActiveAdds = Math.max(maxActiveAdds, activeAdds);
      await Promise.resolve();
      activeAdds -= 1;
    });

    const result = await queue.processors.reconcile_all({ data: {} });

    expect(prisma.integration.findMany).toHaveBeenCalledWith({
      where: { type: 'store_salla', status: 'active' },
      select: { id: true, tenantId: true }
    });
    expect(sallaEasyModeService.reconcilePending).toHaveBeenCalledOnce();
    expect(maxActiveAdds).toBe(1);
    expect(queue.add.mock.calls.map((call) => [call[2].jobId, call[2].delay])).toEqual([
      ['store-full:integration-1', 0],
      ['store-full:integration-2', 15000],
      ['store-full:integration-3', 30000]
    ]);
    expect(result).toEqual({ integrations: 3 });
  });

  it('closes the Bull queue', async () => {
    const { queueApi, queue } = createHarness();

    await queueApi.close();

    expect(queue.close).toHaveBeenCalledOnce();
  });
});
