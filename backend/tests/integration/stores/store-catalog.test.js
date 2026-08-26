const { createTestDatabase, resetDatabase } = require('../../helpers/database');
const { createStoreService } = require('../../../src/stores/storeService');

const prisma = createTestDatabase(process.env.DATABASE_URL);

function service() {
  return createStoreService({
    prisma,
    registry: { get: () => ({ searchProducts: async () => [], getProduct: async () => null }) },
    clock: () => new Date('2026-08-26T12:00:00.000Z'),
    enqueueRefresh: async () => {}
  });
}

async function integration(tenantId, externalAccountId) {
  return prisma.integration.create({ data: {
    tenantId, type: 'store_salla', name: 'Store', credentials: 'store:v1:test', status: 'active', externalAccountId
  } });
}

describe('Store catalog service', () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('soft deletes only stale products from a completed tenant-scoped full sync', async () => {
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({ data: { name: 'A', email: 'catalog-a@example.test' } }),
      prisma.tenant.create({ data: { name: 'B', email: 'catalog-b@example.test' } })
    ]);
    const [integrationA, integrationB] = await Promise.all([integration(tenantA.id, 'merchant-a'), integration(tenantB.id, 'merchant-b')]);
    const startedAt = new Date('2026-08-26T11:00:00.000Z');
    await prisma.storeProduct.createMany({ data: [
      { tenantId: tenantA.id, integrationId: integrationA.id, externalId: 'stale', name: 'Stale', status: 'sale', syncedAt: new Date('2026-08-26T10:00:00.000Z') },
      { tenantId: tenantA.id, integrationId: integrationA.id, externalId: 'current', name: 'Current', status: 'sale', syncedAt: startedAt },
      { tenantId: tenantB.id, integrationId: integrationB.id, externalId: 'other', name: 'Other', status: 'sale', syncedAt: new Date('2026-08-26T10:00:00.000Z') }
    ] });

    await service().completeFullSync({ tenantId: tenantA.id, integrationId: integrationA.id, syncStartedAt: startedAt, completed: false });
    expect((await prisma.storeProduct.findUnique({ where: { integrationId_externalId: { integrationId: integrationA.id, externalId: 'stale' } } })).deletedAt).toBeNull();

    await service().completeFullSync({ tenantId: tenantA.id, integrationId: integrationA.id, syncStartedAt: startedAt, completed: true });
    expect((await prisma.storeProduct.findUnique({ where: { integrationId_externalId: { integrationId: integrationA.id, externalId: 'stale' } } })).deletedAt).toEqual(expect.any(Date));
    expect((await prisma.storeProduct.findUnique({ where: { integrationId_externalId: { integrationId: integrationA.id, externalId: 'current' } } })).deletedAt).toBeNull();
    expect((await prisma.storeProduct.findUnique({ where: { integrationId_externalId: { integrationId: integrationB.id, externalId: 'other' } } })).deletedAt).toBeNull();
  });
});
