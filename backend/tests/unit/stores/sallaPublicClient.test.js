const { encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createSallaPublicClient } = require('../../../src/stores/providers/salla/sallaPublicClient');

describe('Salla public storefront client', () => {
  const previousKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 8).toString('base64');
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = previousKey;
  });

  function harness(response) {
    const integration = {
      credentials: encryptStoreCredentials({
        provider: 'salla_public', storeUrl: 'https://greens-cg.com/',
        storeIdentifier: '112506134', categoryIds: ['10', '20']
      })
    };
    const prisma = { integration: { findFirst: vi.fn().mockResolvedValue(integration) } };
    const http = { get: vi.fn().mockResolvedValue({ data: response }) };
    return { client: createSallaPublicClient({ prisma, http }), http };
  }

  it('searches the storefront using only public store headers', async () => {
    const { client, http } = harness({ status: 200, success: true, data: [{ id: 1, name: 'Bellogen' }] });

    const products = await client.searchProducts({ tenantId: 'tenant-1', integrationId: 'public-1' }, 'بيلوجين');

    expect(products).toEqual([{ id: 1, name: 'Bellogen' }]);
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('source=search'),
      expect.objectContaining({ headers: expect.objectContaining({
        'store-identifier': '112506134', Referer: 'https://greens-cg.com/'
      }) })
    );
    expect(JSON.stringify(http.get.mock.calls)).not.toContain('Authorization');
  });

  it('lists configured categories and follows only Salla cursor URLs', async () => {
    const next = 'https://api.salla.dev/store/v1/products?cursor=next-page';
    const { client, http } = harness({ status: 200, success: true, data: [{ id: 1 }], cursor: { next } });

    await expect(client.listProductsPage({ tenantId: 'tenant-1', integrationId: 'public-1' }, 1))
      .resolves.toEqual({ products: [{ id: 1 }], nextPage: next });
    expect(http.get.mock.calls[0][0]).toContain('source_value%5B%5D=10');
    expect(http.get.mock.calls[0][0]).toContain('source_value%5B%5D=20');

    await expect(client.listProductsPage(
      { tenantId: 'tenant-1', integrationId: 'public-1' }, 'https://evil.example/products?cursor=x'
    )).rejects.toMatchObject({ code: 'STORE_INVALID_PROVIDER_RESPONSE' });
  });

  it('rejects malformed successful product details instead of reporting a deletion', async () => {
    const { client } = harness({ status: 200, success: true, data: null });

    await expect(client.getProduct(
      { tenantId: 'tenant-1', integrationId: 'public-1' }, '44'
    )).rejects.toMatchObject({ code: 'STORE_INVALID_PROVIDER_RESPONSE' });
  });
});
