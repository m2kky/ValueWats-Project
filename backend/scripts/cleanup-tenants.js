require('dotenv').config();
const prisma = require('../src/config/database');

async function cleanup() {
  const KEEP_EMAIL = 'nextacademyedu@gmail.com';

  const toDelete = await prisma.tenant.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, name: true }
  });

  if (toDelete.length === 0) {
    console.log('No tenants to delete.');
    return;
  }

  console.log('Will delete:');
  toDelete.forEach(t => console.log(` - ${t.email} (${t.name})`));

  for (const t of toDelete) {
    await prisma.tenant.delete({ where: { id: t.id } });
    console.log(`Deleted: ${t.email}`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

cleanup().catch(e => { console.error(e); process.exit(1); });
