/**
 * Seed Default Subscription Plans
 * Run with: node prisma/seedPlans.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'starter',
      maxMessagesPerDay: 500,
      maxContactsPerCampaign: 1000,
      maxInstances: 1,
      includedUsers: 5,
      additionalUserPrice: 12.0,
      includedMac: 1000,
      macOveragePer100: 10.0,
      unlimitedUsers: false,
      workingHoursEnabled: false,
      workingHoursStart: '09:00',
      workingHoursEnd: '22:00',
      price: 69.0,
    },
    {
      name: 'growth',
      maxMessagesPerDay: 3000,
      maxContactsPerCampaign: 10000,
      maxInstances: 5,
      includedUsers: 10,
      additionalUserPrice: 18.0,
      includedMac: 3000,
      macOveragePer100: 12.0,
      unlimitedUsers: false,
      workingHoursEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '23:00',
      price: 149.0,
    },
    {
      name: 'scale',
      maxMessagesPerDay: 15000,
      maxContactsPerCampaign: 50000,
      maxInstances: 20,
      includedUsers: 20,
      additionalUserPrice: 24.0,
      includedMac: 10000,
      macOveragePer100: 15.0,
      unlimitedUsers: false,
      workingHoursEnabled: true,
      workingHoursStart: '00:00',
      workingHoursEnd: '23:59',
      price: 279.0,
    },
    {
      name: 'enterprise',
      maxMessagesPerDay: 100000,
      maxContactsPerCampaign: 500000,
      maxInstances: 100,
      includedUsers: 0,
      additionalUserPrice: 0,
      includedMac: 0,
      macOveragePer100: 0,
      unlimitedUsers: true,
      workingHoursEnabled: true,
      workingHoursStart: '00:00',
      workingHoursEnd: '23:59',
      price: 0.0,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`Plan \"${plan.name}\" upserted.`);
  }

  const legacyMap = {
    basic: 'starter',
    pro: 'growth',
    business: 'scale',
    advanced: 'scale',
  };

  for (const [legacy, target] of Object.entries(legacyMap)) {
    const legacyPlan = await prisma.plan.findUnique({ where: { name: legacy } });
    const targetPlan = await prisma.plan.findUnique({ where: { name: target } });

    if (!legacyPlan || !targetPlan) continue;

    await prisma.tenant.updateMany({
      where: {
        OR: [
          { planId: legacyPlan.id },
          { subscriptionPlan: legacy },
        ],
      },
      data: {
        planId: targetPlan.id,
        subscriptionPlan: targetPlan.name,
      },
    });

    await prisma.plan.delete({ where: { id: legacyPlan.id } });
    console.log(`Migrated legacy plan \"${legacy}\" -> \"${target}\"`);
  }

  console.log('\nPlans seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
