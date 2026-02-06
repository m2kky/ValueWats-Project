const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const instances = await prisma.instance.findMany();
  console.log('Instances found:', instances);
}

check()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
