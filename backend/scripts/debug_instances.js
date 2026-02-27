const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const instances = await prisma.instance.findMany();
        console.log('Current Instances:', JSON.stringify(instances, null, 2));
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
