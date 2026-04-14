/**
 * Migration Script: Promote first admin per tenant to 'owner' role
 * Run this in Coolify terminal AFTER deploying the RBAC update.
 * 
 * Usage: node backend/prisma/migrateOwnerRole.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOwnerRole() {
  console.log('🔍 Finding tenants without an owner...');

  // Find all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, email: true }
  });

  console.log(`Found ${tenants.length} tenant(s)`);

  let promoted = 0;

  for (const tenant of tenants) {
    // Check if tenant already has an owner
    const existingOwner = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'owner' }
    });

    if (existingOwner) {
      console.log(`  ✅ ${tenant.name || tenant.email} — already has owner: ${existingOwner.email}`);
      continue;
    }

    // Find the first admin (earliest created)
    const firstAdmin = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'admin' },
      orderBy: { createdAt: 'asc' }
    });

    if (!firstAdmin) {
      console.log(`  ⚠️  ${tenant.name || tenant.email} — no admin found, skipping`);
      continue;
    }

    // Promote to owner
    await prisma.user.update({
      where: { id: firstAdmin.id },
      data: { role: 'owner' }
    });

    console.log(`  🔑 ${tenant.name || tenant.email} — promoted ${firstAdmin.email} to owner`);
    promoted++;
  }

  console.log(`\n✅ Done! Promoted ${promoted} user(s) to owner.`);
  
  // Show final role distribution
  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { _all: true }
  });
  console.log('\n📊 Current role distribution:');
  roleCounts.forEach(r => console.log(`   ${r.role}: ${r._count._all}`));
}

migrateOwnerRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
