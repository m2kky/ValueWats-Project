const { PrismaClient } = require('@prisma/client');

const TEST_DATABASE = 'valuewats_agent_test';
const testClients = new WeakMap();

function assertTestDatabase(url = process.env.DATABASE_URL) {
  if (!url || new URL(url).pathname.replace(/^\//, '') !== TEST_DATABASE) {
    throw new Error(`Refusing to reset a database other than ${TEST_DATABASE}`);
  }
}

function createTestDatabase(url = process.env.DATABASE_URL, PrismaClientClass = PrismaClient) {
  assertTestDatabase(url);
  const prisma = new PrismaClientClass({ datasources: { db: { url } } });
  testClients.set(prisma, url);
  return prisma;
}

async function resetDatabase(prisma) {
  const url = testClients.get(prisma);
  if (!url) throw new Error('Refusing to reset an unregistered database client');
  assertTestDatabase(url);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tenants" CASCADE');
}

function createMockPrisma(overrides = {}) {
  return overrides;
}

async function closeTestResources({ prisma, redis, queues = [], server, providers = [] } = {}) {
  await Promise.all([
    prisma?.$disconnect?.(), redis?.quit?.(), ...queues.map((queue) => queue?.close?.()), ...providers.map((provider) => provider?.close?.()),
    server && new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  ].filter(Boolean));
}

module.exports = { TEST_DATABASE, assertTestDatabase, createTestDatabase, createMockPrisma, resetDatabase, closeTestResources };
