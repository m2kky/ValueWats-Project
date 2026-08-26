const { createStoreService } = require('../../../src/stores/storeService');

const now = new Date('2026-08-26T12:00:00.000Z');

function cachedProduct(overrides = {}) {
  return {
    externalId: '1', sku: 'GREENS-1', name: 'Cached Greens', description: 'Daily support',
    imageUrl: 'https://store.test/greens.jpg', productUrl: 'https://store.test/greens',
    price: '80.00', salePrice: null, currency: 'SAR', status: 'sale', isAvailable: true,
    quantity: 2, unlimitedQuantity: false, variants: [], lastVerifiedAt: now, ...overrides
  };
}

function liveProduct(overrides = {}) {
  return {
    externalId: '2', sku: 'LIVE-2', name: 'Live Greens', description: 'Fresh support',
    price: '90.00', salePrice: null, currency: 'SAR', status: 'sale', isAvailable: true,
    quantity: 4, unlimitedQuantity: false, imageUrl: null, storefrontUrl: 'https://store.test/live', variants: [], ...overrides
  };
}

function createService({ cached = [cachedProduct()], live = [liveProduct()] } = {}) {
  const adapter = {
    searchProducts: vi.fn().mockResolvedValue(live),
    getProduct: vi.fn().mockResolvedValue(liveProduct({ externalId: cached[0]?.externalId || '1' })),
    listProductsPage: vi.fn()
  };
  const prisma = {
    integration: { findFirst: vi.fn().mockResolvedValue({ id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active' }) },
    storeProduct: {
      findMany: vi.fn().mockResolvedValue(cached), findFirst: vi.fn().mockResolvedValue(cached[0] || null),
      upsert: vi.fn().mockResolvedValue({}), updateMany: vi.fn().mockResolvedValue({ count: 1 })
    }
  };
  const registry = { get: vi.fn().mockReturnValue(adapter) };
  const enqueueRefresh = vi.fn().mockResolvedValue();
  return { service: createStoreService({ prisma, registry, clock: () => now, enqueueRefresh }), prisma, registry, adapter, enqueueRefresh };
}

describe('Store service', () => {
  it('merges one live search into tenant-scoped cached results', async () => {
    const { service, prisma, adapter } = createService();

    const result = await service.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1', query: 'greens', maxResults: 99 });

    expect(adapter.searchProducts).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('live');
    expect(result.products.find((product) => product.externalId === '2')).toMatchObject({ liveVerified: true, currentPriceVerified: true, currentAvailabilityVerified: true });
    expect(result.products).toHaveLength(2);
    expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-1', integrationId: 'integration-1', deletedAt: null, OR: [
        { name: { contains: 'greens', mode: 'insensitive' } },
        { sku: { contains: 'greens', mode: 'insensitive' } },
        { description: { contains: 'greens', mode: 'insensitive' } }
      ] }), take: 5
    }));
  });

  it('deduplicates by external ID and prefers live fields', async () => {
    const { service } = createService({ cached: [cachedProduct({ externalId: '2', name: 'Stale name', price: '10.00' })], live: [liveProduct()] });

    const result = await service.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1', query: 'greens', maxResults: 5 });

    expect(result.products).toEqual([expect.objectContaining({ externalId: '2', name: 'Live Greens', price: '90.00', liveVerified: true })]);
  });

  it.each(['STORE_PROVIDER_TIMEOUT', 'STORE_RATE_LIMITED', 'STORE_PROVIDER_UNAVAILABLE'])('returns descriptive cache and enqueues a delayed full sync after %s', async (code) => {
    const { service, adapter, enqueueRefresh } = createService();
    adapter.searchProducts.mockRejectedValue(Object.assign(new Error('provider-secret'), {
      code, ...(code === 'STORE_RATE_LIMITED' ? { retryAfterMs: 7000 } : {})
    }));
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});

    const result = await service.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1', query: 'greens', maxResults: 5 });

    expect(result).toMatchObject({ source: 'cache', products: [{ externalId: '1', liveVerified: false, currentPriceVerified: false, currentAvailabilityVerified: false }] });
    expect(result.products[0]).not.toHaveProperty('price');
    expect(result.products[0]).not.toHaveProperty('isAvailable');
    expect(enqueueRefresh).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1', integrationId: 'integration-1', operation: 'search_products',
      delayMs: code === 'STORE_RATE_LIMITED' ? 7000 : 60000
    }));
    expect(JSON.stringify(log.mock.calls)).not.toContain('provider-secret');
    log.mockRestore();
  });

  it('returns cached details and enqueues a delayed product refresh after a transient failure', async () => {
    const { service, adapter, enqueueRefresh } = createService();
    adapter.getProduct.mockRejectedValue(Object.assign(new Error('rate limited'), {
      code: 'STORE_RATE_LIMITED', retryAfterMs: 9000
    }));

    const result = await service.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' });

    expect(result).toMatchObject({ source: 'cache', product: { externalId: '1', liveVerified: false } });
    expect(enqueueRefresh).toHaveBeenCalledWith({
      tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1',
      operation: 'get_product', delayMs: 9000
    });
  });

  it('keeps the cached response when repair enqueue fails and logs only a stable error', async () => {
    const { service, adapter, enqueueRefresh } = createService();
    adapter.searchProducts.mockRejectedValue(Object.assign(new Error('provider-secret'), { code: 'STORE_PROVIDER_TIMEOUT' }));
    enqueueRefresh.mockRejectedValue(new Error('redis-password=queue-secret'));
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(service.searchProducts({
      tenantId: 'tenant-1', integrationId: 'integration-1', query: 'greens', maxResults: 5
    })).resolves.toMatchObject({ source: 'cache', products: [{ externalId: '1', liveVerified: false }] });

    expect(JSON.stringify(log.mock.calls)).toContain('STORE_QUEUE_UNAVAILABLE');
    expect(JSON.stringify(log.mock.calls)).not.toContain('queue-secret');
    log.mockRestore();
  });

  it('denies an inactive or cross-tenant integration before adapter lookup', async () => {
    const { service, prisma, adapter } = createService();
    prisma.integration.findFirst.mockResolvedValue(null);

    await expect(service.searchProducts({ tenantId: 'tenant-2', integrationId: 'integration-1', query: 'greens', maxResults: 5 }))
      .rejects.toMatchObject({ code: 'STORE_INTEGRATION_NOT_FOUND' });
    expect(prisma.integration.findFirst).toHaveBeenCalledWith({ where: { id: 'integration-1', tenantId: 'tenant-2', type: 'store_salla', status: 'active' } });
    expect(adapter.searchProducts).not.toHaveBeenCalled();
  });

  it('proves product ownership before loading live details and variants', async () => {
    const { service, prisma, adapter } = createService();

    const result = await service.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' });

    expect(prisma.storeProduct.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', integrationId: 'integration-1', externalId: '1', deletedAt: null } });
    expect(adapter.getProduct).toHaveBeenCalledWith({ tenantId: 'tenant-1', integrationId: 'integration-1' }, '1');
    expect(result.product).toMatchObject({ externalId: '1', liveVerified: true, currentPriceVerified: true, variants: [] });
  });

  it('soft deletes a cached product when the provider reports it missing', async () => {
    const { service, prisma, adapter } = createService();
    adapter.getProduct.mockResolvedValue(null);

    await expect(service.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' }))
      .resolves.toEqual({ source: 'live', product: null, notFound: true });
    expect(prisma.storeProduct.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', integrationId: 'integration-1', externalId: '1', deletedAt: null }, data: { deletedAt: now }
    });
  });

  it('soft deletes only the requested cached product when the provider rejects it as missing', async () => {
    const { service, prisma, adapter } = createService();
    adapter.getProduct.mockRejectedValue(Object.assign(new Error('provider body'), { code: 'STORE_PROVIDER_NOT_FOUND' }));

    await expect(service.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' }))
      .resolves.toEqual({ source: 'live', product: null, notFound: true });
    expect(prisma.storeProduct.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', integrationId: 'integration-1', externalId: '1', deletedAt: null }, data: { deletedAt: now }
    });
  });

  it('rejects a mismatched provider product ID before any cache write', async () => {
    const { service, prisma, adapter } = createService();
    adapter.getProduct.mockResolvedValue(liveProduct({ externalId: '2' }));

    await expect(service.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' }))
      .rejects.toMatchObject({ code: 'STORE_INVALID_PROVIDER_RESPONSE', message: 'STORE_INVALID_PROVIDER_RESPONSE' });
    expect(prisma.storeProduct.upsert).not.toHaveBeenCalled();
  });

  it('upserts sync pages with the tenant and only deletes stale rows after a completed full sync', async () => {
    const { service, prisma } = createService();
    const syncStartedAt = new Date('2026-08-26T11:00:00.000Z');

    await service.syncCatalogPage({ tenantId: 'tenant-1', integrationId: 'integration-1', products: [liveProduct()], syncStartedAt });
    await service.completeFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1', syncStartedAt, completed: false });
    expect(prisma.storeProduct.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { integrationId_externalId: { integrationId: 'integration-1', externalId: '2' } },
      create: expect.objectContaining({
        tenantId: 'tenant-1', integrationId: 'integration-1', externalId: '2', syncedAt: syncStartedAt
      }),
      update: expect.not.objectContaining({ externalId: expect.anything() })
    }));
    expect(prisma.storeProduct.updateMany).not.toHaveBeenCalled();

    await service.completeFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1', syncStartedAt, completed: true });
    expect(prisma.storeProduct.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', integrationId: 'integration-1', deletedAt: null, syncedAt: { lt: syncStartedAt } }, data: { deletedAt: now }
    });
  });

  it('rejects completed sync without a sync start timestamp', async () => {
    const { service, prisma } = createService();

    await expect(service.completeFullSync({ tenantId: 'tenant-1', integrationId: 'integration-1', completed: true }))
      .rejects.toMatchObject({ code: 'STORE_SYNC_INCOMPLETE' });
    expect(prisma.storeProduct.updateMany).not.toHaveBeenCalled();
  });

  it('soft deletes one tenant-owned cached product for a webhook', async () => {
    const { service, prisma } = createService();

    await service.deleteCachedProduct({ tenantId: 'tenant-1', integrationId: 'integration-1', productId: '1' });

    expect(prisma.storeProduct.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', integrationId: 'integration-1', externalId: '1', deletedAt: null }, data: { deletedAt: now }
    });
  });
});
