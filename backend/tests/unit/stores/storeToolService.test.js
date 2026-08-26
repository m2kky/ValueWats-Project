const { createStoreToolService } = require('../../../src/stores/storeToolService');
const { ToolService } = require('../../../src/services/toolService');

function setup({ action = null } = {}) {
  const prisma = {
    agentAction: {
      findFirst: vi.fn().mockResolvedValue(action)
    }
  };
  const storeService = {
    searchProducts: vi.fn(),
    getProduct: vi.fn()
  };
  const logger = { info: vi.fn() };
  return {
    prisma,
    storeService,
    logger,
    service: createStoreToolService({ prisma, storeService, logger, now: () => 100 })
  };
}

const capability = (overrides = {}) => ({
  id: 'action-1',
  agentId: 'agent-1',
  key: 'store_catalog_read',
  type: 'store_catalog_read',
  isEnabled: true,
  integrationId: 'store-1',
  instructions: 'Use for product facts.',
  config: { maxResults: 5 },
  ...overrides
});

describe('Store tool definitions', () => {
  it('exposes both tools only for one enabled canonical Store capability', () => {
    const { service } = setup();

    expect(service.getToolDefinitions([capability()]).map((tool) => tool.function.name)).toEqual([
      'search_store_products',
      'get_store_product'
    ]);
    expect(service.getToolDefinitions([])).toEqual([]);
    expect(service.getToolDefinitions([capability(), capability({ id: 'action-2' })])).toEqual([]);
  });

  it('uses strict schemas with no integration or tenant identifiers', () => {
    const { service } = setup();
    const [search, detail] = service.getToolDefinitions([capability()]);

    expect(search.function.parameters).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: { query: expect.objectContaining({ type: 'string' }) },
      required: ['query']
    });
    expect(detail.function.parameters).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: { productId: expect.objectContaining({ type: 'string' }) },
      required: ['productId']
    });
    expect(JSON.stringify([search, detail])).not.toMatch(/integrationId|tenantId/);
  });

  it('appends bounded plain-text capability instructions', () => {
    const { service } = setup();
    const [search] = service.getToolDefinitions([
      capability({ instructions: '<b>Use\nproduct facts.</b>\u0000' })
    ]);

    expect(search.function.description).toContain('Use product facts.');
    expect(search.function.description).not.toMatch(/[<>\u0000]/);
    expect(search.function.description.length).toBeLessThan(800);
  });
});

describe('Store tool execution', () => {
  it.each([
    ['missing tenantId', { agentId: 'agent-1' }],
    ['missing agentId', { tenantId: 'tenant-1' }],
    ['blank tenantId', { tenantId: ' ', agentId: 'agent-1' }],
    ['non-string agentId', { tenantId: 'tenant-1', agentId: 1 }]
  ])('rejects %s before authorization', async (label, context) => {
    const { service, prisma, storeService } = setup({ action: capability() });

    await expect(service.execute('search_store_products', { query: 'greens' }, context)).resolves.toEqual({
      success: false,
      code: 'STORE_CAPABILITY_DISABLED',
      message: 'Live store data is unavailable.'
    });

    expect(prisma.agentAction.findFirst).not.toHaveBeenCalled();
    expect(storeService.searchProducts).not.toHaveBeenCalled();
    expect(storeService.getProduct).not.toHaveBeenCalled();
  });

  it('re-reads capability authorization before executing a Store call', async () => {
    const { service, prisma, storeService } = setup();

    await expect(service.execute('search_store_products', { query: 'greens' }, {
      tenantId: 'tenant-1',
      agentId: 'agent-1',
      conversationId: 'conversation-1'
    })).resolves.toEqual({
      success: false,
      code: 'STORE_CAPABILITY_DISABLED',
      message: 'Live store data is unavailable.'
    });

    expect(prisma.agentAction.findFirst).toHaveBeenCalledWith({
      where: {
        agentId: 'agent-1',
        key: 'store_catalog_read',
        type: 'store_catalog_read',
        isEnabled: true,
        agent: { tenantId: 'tenant-1', isActive: true, deletedAt: null },
        integration: { tenantId: 'tenant-1', type: 'store_salla', status: 'active' }
      },
      select: { integrationId: true, config: true }
    });
    expect(storeService.searchProducts).not.toHaveBeenCalled();
  });

  it('rejects extra arguments before authorization', async () => {
    const { service, prisma, storeService } = setup({ action: capability() });

    await expect(service.execute('search_store_products', {
      query: 'greens',
      integrationId: 'attacker-selected-store'
    }, {
      tenantId: 'tenant-1',
      agentId: 'agent-1'
    })).resolves.toEqual({
      success: false,
      code: 'STORE_INVALID_ARGUMENTS',
      message: 'Store request is invalid.'
    });

    expect(prisma.agentAction.findFirst).not.toHaveBeenCalled();
    expect(storeService.searchProducts).not.toHaveBeenCalled();
  });

  it('returns at most five compact sanitized search products', async () => {
    const { service, storeService } = setup({ action: capability({ config: { maxResults: 4 } }) });
    storeService.searchProducts.mockResolvedValue({
      source: 'live',
      products: Array.from({ length: 6 }, (_, index) => ({
        externalId: index + 1,
        name: `<b>Product ${index + 1}</b>`,
        sku: `SKU-${index + 1}`,
        description: `<script>bad()</script><p>${'Fresh '.repeat(80)}</p>`,
        price: '10.00',
        salePrice: null,
        currency: 'SAR',
        isAvailable: true,
        productUrl: `https://store.test/${index + 1}`,
        liveVerified: true,
        verifiedAt: '2026-08-26T10:00:00.000Z'
      }))
    });

    const result = await service.execute('search_store_products', { query: 'greens' }, {
      tenantId: 'tenant-1',
      agentId: 'agent-1',
      conversationId: 'conversation-1'
    });

    expect(storeService.searchProducts).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      integrationId: 'store-1',
      query: 'greens',
      maxResults: 4
    });
    expect(result).toMatchObject({ success: true, source: 'live' });
    expect(result.products).toHaveLength(4);
    expect(result.products[0]).toEqual({
      id: '1',
      name: 'Product 1',
      sku: 'SKU-1',
      descriptionSnippet: expect.any(String),
      price: '10.00',
      salePrice: null,
      currency: 'SAR',
      available: true,
      url: 'https://store.test/1',
      liveVerified: true,
      verifiedAt: '2026-08-26T10:00:00.000Z'
    });
    expect(result.products[0].descriptionSnippet.length).toBeLessThanOrEqual(300);
    expect(JSON.stringify(result)).not.toMatch(/<script>|bad\(\)|<p>/);
  });

  it('returns compact product detail and preserves unverified fields as null', async () => {
    const { service, storeService } = setup({ action: capability() });
    storeService.getProduct.mockResolvedValue({
      source: 'cache',
      product: {
        externalId: 'product-1',
        name: 'Cached item',
        description: '<p>Cached description</p>',
        liveVerified: false,
        verifiedAt: '2026-08-25T10:00:00.000Z'
      }
    });

    await expect(service.execute('get_store_product', { productId: 'product-1' }, {
      tenantId: 'tenant-1',
      agentId: 'agent-1'
    })).resolves.toEqual({
      success: true,
      source: 'cache',
      product: {
        id: 'product-1',
        name: 'Cached item',
        sku: null,
        description: 'Cached description',
        price: null,
        salePrice: null,
        currency: null,
        available: null,
        quantity: null,
        unlimitedQuantity: false,
        variants: [],
        imageUrl: null,
        url: null,
        liveVerified: false,
        verifiedAt: '2026-08-25T10:00:00.000Z'
      }
    });
  });

  it('logs one metadata-only completion record on failure', async () => {
    const { service, storeService, logger } = setup({ action: capability() });
    storeService.searchProducts.mockRejectedValue(Object.assign(new Error('provider body: secret product'), {
      code: 'STORE_LOOKUP_FAILED'
    }));

    await service.execute('search_store_products', { query: 'customer secret text' }, {
      tenantId: 'tenant-1',
      agentId: 'agent-1'
    });

    expect(logger.info).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith('store.tool.complete', {
      toolName: 'search_store_products',
      agentId: 'agent-1',
      integrationId: 'store-1',
      source: 'none',
      durationMs: 0,
      resultCount: 0,
      outcome: 'error',
      errorCode: 'STORE_LOOKUP_FAILED'
    });
    expect(JSON.stringify(logger.info.mock.calls)).not.toMatch(/customer secret text|secret product/);
  });
});

describe('production Store tool wiring', () => {
  it('lets server boot inject the StoreToolService backed by the queue StoreService', async () => {
    const storeToolService = {
      getToolDefinitions: vi.fn().mockReturnValue([{ type: 'function', function: { name: 'search_store_products' } }]),
      execute: vi.fn().mockResolvedValue({ success: true, source: 'cache', products: [] })
    };
    const toolService = new ToolService();

    toolService.configureStoreToolService(storeToolService);

    expect(toolService.getToolDefinitions({ actions: [] })).toContainEqual({
      type: 'function', function: { name: 'search_store_products' }
    });
    await expect(toolService.execute('search_store_products', { query: 'greens' }, { tenantId: 'tenant-1' }))
      .resolves.toEqual({ success: true, source: 'cache', products: [] });
    expect(storeToolService.execute).toHaveBeenCalledWith('search_store_products', { query: 'greens' }, { tenantId: 'tenant-1' });
  });
});
