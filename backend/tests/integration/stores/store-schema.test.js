const crypto = require('node:crypto');
const { createTestDatabase, resetDatabase } = require('../../helpers/database');
const tenantScopedPrisma = require('../../../src/config/database');
const { encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');

const prisma = createTestDatabase(process.env.DATABASE_URL);

describe('Store persistence', () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await tenantScopedPrisma.$disconnect();
  });

  it('stores one encrypted pending Salla authorization per merchant', async () => {
    const merchantId = `merchant-${crypto.randomUUID()}`;
    const credentials = encryptStoreCredentials({
      accessToken: 'pending-access',
      refreshToken: 'pending-refresh',
      expiresAt: '2026-08-28T00:00:00.000Z'
    });
    const row = await prisma.sallaPendingAuthorization.create({
      data: {
        merchantId,
        credentials,
        scope: 'products.read offline_access',
        expiresAt: new Date('2026-08-28T12:00:00.000Z')
      }
    });

    expect(row.credentials).not.toContain('pending-access');
    await expect(prisma.sallaPendingAuthorization.create({
      data: { merchantId, credentials, scope: row.scope, expiresAt: row.expiresAt }
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('isolates products by tenant and integration and cascades integration deletion', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Store A', email: 'store-a@example.test' } });
    const integration = await prisma.integration.create({
      data: {
        tenantId: tenant.id,
        type: 'store_salla',
        name: 'Main Store',
        credentials: 'store:v1:test',
        externalAccountId: 'merchant-1'
      }
    });
    await prisma.storeProduct.create({
      data: {
        tenantId: tenant.id,
        integrationId: integration.id,
        externalId: 'product-1',
        name: 'Greens',
        status: 'sale',
        isAvailable: true,
        syncedAt: new Date()
      }
    });

    await expect(prisma.storeProduct.create({
      data: {
        tenantId: tenant.id,
        integrationId: integration.id,
        externalId: 'product-1',
        name: 'Duplicate',
        status: 'sale',
        syncedAt: new Date()
      }
    })).rejects.toMatchObject({ code: 'P2002' });

    await prisma.integration.delete({ where: { id: integration.id } });
    expect(await prisma.storeProduct.count()).toBe(0);
  });

  it('rejects a product whose tenant differs from its integration tenant', async () => {
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({ data: { name: 'Store A', email: 'store-a@example.test' } }),
      prisma.tenant.create({ data: { name: 'Store B', email: 'store-b@example.test' } })
    ]);
    const integration = await prisma.integration.create({
      data: {
        tenantId: tenantA.id,
        type: 'store_salla',
        name: 'Main Store',
        credentials: 'store:v1:test',
        externalAccountId: 'merchant-1'
      }
    });

    await expect(prisma.storeProduct.create({
      data: {
        tenantId: tenantB.id,
        integrationId: integration.id,
        externalId: 'product-1',
        name: 'Wrong Tenant',
        status: 'sale',
        syncedAt: new Date()
      }
    })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('scopes StoreProduct writes to the active tenant', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Store A', email: 'store-a@example.test' } });
    const integration = await prisma.integration.create({
      data: {
        tenantId: tenant.id,
        type: 'store_salla',
        name: 'Main Store',
        credentials: 'store:v1:test',
        externalAccountId: 'merchant-1'
      }
    });
    const productData = (externalId) => ({
      integrationId: integration.id,
      externalId,
      name: externalId,
      status: 'sale',
      syncedAt: new Date()
    });

    await tenantScopedPrisma.tenantStorage.run(tenant.id, async () => {
      await tenantScopedPrisma.storeProduct.create({ data: productData('create') });
      await tenantScopedPrisma.storeProduct.createMany({ data: [productData('create-many')] });
      await tenantScopedPrisma.storeProduct.upsert({
        where: { integrationId_externalId: { integrationId: integration.id, externalId: 'upsert' } },
        create: productData('upsert'),
        update: { name: 'updated' }
      });

      await expect(tenantScopedPrisma.storeProduct.create({
        data: { ...productData('mismatch'), tenantId: 'other-tenant' }
      })).rejects.toThrow('StoreProduct tenantId does not match active tenant');

      await expect(tenantScopedPrisma.storeProduct.update({
        where: { integrationId_externalId: { integrationId: integration.id, externalId: 'create' } },
        data: { tenantId: 'other-tenant' }
      })).rejects.toThrow('StoreProduct tenantId does not match active tenant');

      await expect(tenantScopedPrisma.storeProduct.updateMany({
        where: { integrationId: integration.id, externalId: 'create-many' },
        data: { tenantId: 'other-tenant' }
      })).rejects.toThrow('StoreProduct tenantId does not match active tenant');
    });

    expect(await prisma.storeProduct.count({ where: { tenantId: tenant.id } })).toBe(3);
  });
});
