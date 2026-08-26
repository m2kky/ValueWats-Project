const { createTestDatabase, resetDatabase } = require('../../helpers/database');
const { decryptStoreCredentials, encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createSallaTokenService } = require('../../../src/stores/providers/salla/sallaTokenService');

const prisma = createTestDatabase(process.env.DATABASE_URL);

describe('Salla token refresh concurrency', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const originalClientId = process.env.SALLA_CLIENT_ID;
  const originalClientSecret = process.env.SALLA_CLIENT_SECRET;

  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    process.env.SALLA_CLIENT_ID = 'client-id';
    process.env.SALLA_CLIENT_SECRET = 'client-secret';
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = originalKey;
    if (originalClientId === undefined) delete process.env.SALLA_CLIENT_ID; else process.env.SALLA_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.SALLA_CLIENT_SECRET; else process.env.SALLA_CLIENT_SECRET = originalClientSecret;
  });

  it('serializes rotating refreshes across token-service instances with an advisory lock', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Salla Tenant', email: 'salla-refresh@example.test' } });
    const integration = await prisma.integration.create({
      data: {
        tenantId: tenant.id, type: 'store_salla', name: 'Salla', status: 'active',
        credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-08-01T00:00:00.000Z' })
      }
    });
    const http = { post: vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: 1209600 } };
    }) };
    const clock = () => new Date('2026-08-26T10:00:00Z');
    const first = createSallaTokenService({ prisma, http, clock });
    const second = createSallaTokenService({ prisma, http, clock });

    await expect(Promise.all([
      first.getAccessToken({ tenantId: tenant.id, integrationId: integration.id, forceRefresh: true }),
      second.getAccessToken({ tenantId: tenant.id, integrationId: integration.id, forceRefresh: true })
    ])).resolves.toEqual(['new-a', 'new-a']);

    const stored = await prisma.integration.findFirst({ where: { id: integration.id, tenantId: tenant.id, type: 'store_salla' } });
    expect(http.post).toHaveBeenCalledOnce();
    expect(decryptStoreCredentials(stored.credentials)).toMatchObject({ accessToken: 'new-a', refreshToken: 'new-r' });
  });
});
