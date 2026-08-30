const { decryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createSallaPublicService } = require('../../../src/stores/providers/salla/sallaPublicService');

describe('Salla public storefront connection', () => {
  const previousKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = previousKey;
  });

  it('discovers the public Store ID and categories, then queues an initial sync', async () => {
    const homepage = `
      <script src="https://cdn.salla.network/theme/112506134/app.js"></script>
      <salla-products-slider source="categories" source-value="[874096460,1793115053]"></salla-products-slider>
    `;
    const http = { get: vi.fn().mockResolvedValue({ data: homepage }) };
    const created = {};
    const prisma = {
      integration: {
        create: vi.fn(async ({ data }) => Object.assign(created, { id: 'public-1', ...data }))
      }
    };
    const queue = { enqueueFullSync: vi.fn().mockResolvedValue({ id: 'sync-1' }) };
    const service = createSallaPublicService({
      prisma, queue, http,
      resolveHostname: vi.fn().mockResolvedValue([{ address: '104.21.1.1', family: 4 }])
    });

    const result = await service.connect({
      tenantId: 'tenant-1', name: 'Greens', storeUrl: 'https://greens-cg.com/products/'
    });

    expect(result).toMatchObject({ id: 'public-1', status: 'active', metadata: { accessMode: 'public_storefront' } });
    expect(result).not.toHaveProperty('credentials');
    expect(http.get).toHaveBeenCalledWith('https://greens-cg.com/', expect.objectContaining({ maxRedirects: 0 }));
    const lookup = http.get.mock.calls[0][1].httpsAgent.options.lookup;
    await expect(new Promise((resolve, reject) => lookup('greens-cg.com', { all: true }, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    }))).resolves.toEqual([{ address: '104.21.1.1', family: 4 }]);
    expect(decryptStoreCredentials(created.credentials)).toEqual({
      provider: 'salla_public',
      storeUrl: 'https://greens-cg.com/',
      storeIdentifier: '112506134',
      categoryIds: ['874096460', '1793115053']
    });
    expect(queue.enqueueFullSync).toHaveBeenCalledWith({ tenantId: 'tenant-1', integrationId: 'public-1' });
  });

  it('rejects private destinations before requesting the storefront', async () => {
    const http = { get: vi.fn() };
    const service = createSallaPublicService({
      prisma: {}, queue: {}, http,
      resolveHostname: vi.fn().mockResolvedValue([{ address: '127.0.0.1', family: 4 }])
    });

    await expect(service.connect({
      tenantId: 'tenant-1', name: 'Private', storeUrl: 'https://internal.example/'
    })).rejects.toMatchObject({ code: 'SALLA_PUBLIC_STORE_URL_INVALID' });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('connects by Store ID through Salla API without requesting the storefront domain', async () => {
    const http = { get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: [
          { url: 'https://greens-cg.com/-/c2040974692', children: [] },
          { url: '#', children: [{ url: 'https://greens-cg.com/-/c2138383176' }] }
        ]
      }
    }) };
    let created;
    const prisma = { integration: { create: vi.fn(async ({ data }) => (created = { id: 'public-2', ...data })) } };
    const queue = { enqueueFullSync: vi.fn().mockResolvedValue({ id: 'sync-2' }) };
    const resolveHostname = vi.fn();
    const service = createSallaPublicService({ prisma, queue, http, resolveHostname });

    await service.connect({
      tenantId: 'tenant-1', name: 'Greens', storeUrl: 'https://greens-cg.com/',
      storeIdentifier: '112506134'
    });

    expect(resolveHostname).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(
      'https://api.salla.dev/store/v1/menus/header?store_id=112506134&lang=ar',
      expect.objectContaining({ headers: expect.objectContaining({ 'store-identifier': '112506134' }) })
    );
    expect(decryptStoreCredentials(created.credentials).categoryIds).toEqual(['2040974692', '2138383176']);
  });

  it('returns a stable client error when DNS discovery fails', async () => {
    const service = createSallaPublicService({
      prisma: {}, queue: {}, http: { get: vi.fn() },
      resolveHostname: vi.fn().mockRejectedValue(new Error('dns details'))
    });

    await expect(service.connect({
      tenantId: 'tenant-1', name: 'Missing', storeUrl: 'https://missing.example/'
    })).rejects.toMatchObject({ code: 'SALLA_PUBLIC_STORE_UNREACHABLE' });
  });
});
