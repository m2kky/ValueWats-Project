const { PrismaClient } = require('@prisma/client');

const TEST_DATABASE = 'valuewats_agent_test';

function assertTestDatabase(url = process.env.DATABASE_URL) {
  if (!url || new URL(url).pathname.replace(/^\//, '') !== TEST_DATABASE) {
    throw new Error(`Refusing to reset a database other than ${TEST_DATABASE}`);
  }
}

function createTestDatabase(url = process.env.DATABASE_URL) {
  assertTestDatabase(url);
  return new PrismaClient({ datasources: { db: { url } } });
}

async function resetDatabase(prisma) {
  assertTestDatabase();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Tenant" CASCADE');
}

async function closeTestResources({ prisma, redis, queues = [], server, providers = [] } = {}) {
  await Promise.all([
    prisma?.$disconnect?.(), redis?.quit?.(), ...queues.map((queue) => queue?.close?.()), ...providers.map((provider) => provider?.close?.()),
    server && new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  ].filter(Boolean));
}

module.exports = { TEST_DATABASE, assertTestDatabase, createTestDatabase, resetDatabase, closeTestResources };
