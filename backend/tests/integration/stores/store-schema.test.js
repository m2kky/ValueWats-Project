const { createTestDatabase, resetDatabase } = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);

describe('Store persistence', () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
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
});
