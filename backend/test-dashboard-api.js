const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const req = { user: { tenantId: '9ecdd8c7-b2eb-4b5e-8266-98151e99fcd2' } };
  const res = {
    json: (data) => console.log('SUCCESS JSON:', JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(`ERROR ${code}:`, data) })
  };

  const getStats = require('./src/controllers/dashboardController').getStats;
  
  // mock req and res
  await getStats(req, res);
}

main().finally(() => prisma.$disconnect());
