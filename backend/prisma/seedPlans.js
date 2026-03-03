/**
 * Seed Default Subscription Plans
 * Run with: node prisma/seedPlans.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const plans = [
        {
            name: 'basic',
            maxMessagesPerDay: 200,
            maxContactsPerCampaign: 300,
            maxInstances: 1,
            workingHoursEnabled: false,
            workingHoursStart: '09:00',
            workingHoursEnd: '22:00',
            price: 99.00
        },
        {
            name: 'pro',
            maxMessagesPerDay: 1000,
            maxContactsPerCampaign: 2000,
            maxInstances: 5,
            workingHoursEnabled: true,
            workingHoursStart: '08:00',
            workingHoursEnd: '23:00',
            price: 299.00
        },
        {
            name: 'enterprise',
            maxMessagesPerDay: 5000,
            maxContactsPerCampaign: 10000,
            maxInstances: 20,
            workingHoursEnabled: true,
            workingHoursStart: '00:00',
            workingHoursEnd: '23:59',
            price: 999.00
        }
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan
        });
        console.log(`✅ Plan "${plan.name}" upserted.`);
    }

    console.log('\n🎉 Plans seeded successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
