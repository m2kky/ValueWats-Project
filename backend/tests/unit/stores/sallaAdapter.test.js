const { createSallaAdapter, normalizeSallaProduct } = require('../../../src/stores/providers/salla/sallaAdapter');
const { createSallaClient } = require('../../../src/stores/providers/salla/sallaClient');

describe('Salla adapter', () => {
  it('normalizes Salla money, availability, links, and variants without raw payloads', () => {
    const product = normalizeSallaProduct({
      id: 44,
      name: 'Vitamin C',
      sku: 'VC-1',
      description: '<p>Daily &amp; effective support</p><script>ignore()</script>',
      price: { amount: 120, currency: 'SAR' },
      sale_price: { amount: 99, currency: 'SAR' },
      status: 'sale',
      quantity: 3,
      url: 'https://store.test/p/44',
      variants: [{ id: 55, name: 'Large', price: { amount: 100, currency: 'SAR' }, quantity: 1 }]
    });

    expect(product).toMatchObject({
      externalId: '44', sku: 'VC-1', name: 'Vitamin C', description: 'Daily & effective support',
      price: '120.00', salePrice: '99.00', currency: 'SAR', isAvailable: true, quantity: 3,
      storefrontUrl: 'https://store.test/p/44', variants: [{ externalId: '55', price: '100.00', isAvailable: true }]
    });
    expect(product).not.toHaveProperty('raw');
  });

  it('bounds normalized detailed descriptions and search snippets', async () => {
    const longDescription = `<p>${'x'.repeat(5_000)}</p>`;
    const client = { searchProducts: vi.fn().mockResolvedValue([{ id: 1, description: longDescription }]) };
    const adapter = createSallaAdapter({ client });

    expect(normalizeSallaProduct({ id: 1, description: longDescription }).description).toHaveLength(4_000);
    expect((await adapter.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 'x'))[0].description).toHaveLength(300);
  });

  it('ignores malformed numeric entities from provider descriptions', () => {
    expect(normalizeSallaProduct({ id: 1, description: 'Safe &#999999999999999; text' }).description).toBe('Safe text');
  });

  it('strips tags encoded by the provider before returning descriptions', () => {
    expect(normalizeSallaProduct({ id: 1, description: 'Safe &lt;script&gt;ignore()&lt;/script&gt; text' }).description).toBe('Safe text');
  });

  it('does not pass unexpected provider objects into normalized fields', () => {
    const product = normalizeSallaProduct({
      id: 1, price: { amount: 1, currency: { secret: 'provider-body' } }, image: { secret: 'provider-body' },
      url: { secret: 'provider-body' }, is_available: { secret: 'provider-body' }
    });

    expect(product).toMatchObject({ currency: null, imageUrl: null, storefrontUrl: null, isAvailable: false });
    expect(JSON.stringify(product)).not.toContain('provider-body');
  });

  it('retries exactly once after a 401 with a forced token refresh', async () => {
    const http = { get: vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('unauthorized'), { response: { status: 401, data: { token: 'provider-secret' } } }))
      .mockResolvedValueOnce({ data: { data: [{ id: 44, name: 'Vitamin C' }] } }) };
    const tokenService = { getAccessToken: vi.fn().mockResolvedValueOnce('old-token').mockResolvedValueOnce('new-token') };
    const client = createSallaClient({ http, tokenService });

    await expect(client.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 'vitamin')).resolves.toEqual([{ id: 44, name: 'Vitamin C' }]);
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(tokenService.getAccessToken).toHaveBeenLastCalledWith({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true });
    expect(http.get.mock.calls[0][1]).toMatchObject({
      timeout: 2500,
      params: { keyword: 'vitamin', format: 'light', per_page: 5 },
      headers: { Authorization: 'Bearer old-token' }
    });
  });

  it('does not refresh a token that is missing the products scope', async () => {
    const http = { get: vi.fn().mockRejectedValue(Object.assign(new Error('unauthorized'), {
      response: {
        status: 401,
        data: { error: { code: 'Unauthorized', message: 'The access token should have access to one of those scopes: products.read,products.read_write' } }
      }
    })) };
    const tokenService = { getAccessToken: vi.fn().mockResolvedValue('token') };
    const client = createSallaClient({ http, tokenService });

    await expect(client.listProductsPage({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 1))
      .rejects.toMatchObject({ code: 'STORE_PROVIDER_SCOPE_MISSING' });
    expect(http.get).toHaveBeenCalledOnce();
    expect(tokenService.getAccessToken).toHaveBeenCalledOnce();
  });

  it('caps provider search responses at five products', async () => {
    const http = { get: vi.fn().mockResolvedValue({ data: { data: Array.from({ length: 8 }, (_, id) => ({ id })) } }) };
    const client = createSallaClient({ http, tokenService: { getAccessToken: vi.fn().mockResolvedValue('token') } });

    await expect(client.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 'vitamin'))
      .resolves.toEqual([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });

  it.each([0, -1, '2', null])('returns null for invalid Salla next pages: %s', async (nextPage) => {
    const http = { get: vi.fn().mockResolvedValue({ data: { data: [], pagination: { next_page: nextPage } } }) };
    const client = createSallaClient({ http, tokenService: { getAccessToken: vi.fn().mockResolvedValue('token') } });

    await expect(client.listProductsPage({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 1))
      .resolves.toEqual({ products: [], nextPage: null });
  });

  it('returns a positive integer Salla next page', async () => {
    const http = { get: vi.fn().mockResolvedValue({ data: { data: [], pagination: { next_page: 2 } } }) };
    const client = createSallaClient({ http, tokenService: { getAccessToken: vi.fn().mockResolvedValue('token') } });

    await expect(client.listProductsPage({ tenantId: 'tenant-1', integrationId: 'integration-1' }, 1))
      .resolves.toEqual({ products: [], nextPage: 2 });
  });

  it.each([
    ['7', '2026-08-26T12:00:00.000Z', 7000],
    ['Wed, 26 Aug 2026 12:00:20 GMT', '2026-08-26T12:00:00.000Z', 20000],
    ['0', '2026-08-26T12:00:00.000Z', 1000],
    ['999', '2026-08-26T12:00:00.000Z', 60000],
    ['invalid', '2026-08-26T12:00:00.000Z', 1000]
  ])('returns a bounded typed rate limit for Retry-After %s', async (retryAfter, now, expectedMs) => {
    const http = { get: vi.fn().mockRejectedValue(Object.assign(new Error('provider leaked token=provider-secret'), {
      response: {
        status: 429, headers: { 'retry-after': retryAfter },
        data: { access_token: 'provider-secret', details: 'do not log' }
      }
    })) };
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const client = createSallaClient({
      http,
      tokenService: { getAccessToken: vi.fn().mockResolvedValue('token') },
      clock: () => new Date(now).getTime()
    });

    await expect(client.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1' }, '44'))
      .rejects.toMatchObject({ code: 'STORE_RATE_LIMITED', retryAfterMs: expectedMs });
    expect(JSON.stringify(log.mock.calls)).not.toContain('provider-secret');
    expect(JSON.stringify(log.mock.calls)).not.toContain('do not log');
    log.mockRestore();
  });

  it.each([
    [{ code: 'ECONNABORTED' }, 'STORE_PROVIDER_TIMEOUT'],
    [{ response: { status: 500 } }, 'STORE_PROVIDER_UNAVAILABLE'],
    [{ response: { status: 404 } }, 'STORE_PROVIDER_NOT_FOUND']
  ])('returns %s for other typed provider failures', async (source, code) => {
    const http = { get: vi.fn().mockRejectedValue(Object.assign(new Error('provider failure'), source)) };
    const client = createSallaClient({ http, tokenService: { getAccessToken: vi.fn().mockResolvedValue('token') } });

    await expect(client.getProduct({ tenantId: 'tenant-1', integrationId: 'integration-1' }, '44')).rejects.toMatchObject({ code });
  });
});
