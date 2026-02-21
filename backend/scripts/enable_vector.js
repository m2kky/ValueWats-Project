require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enableVector() {
    try {
        console.log('Enabling pgvector extension...');
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
        console.log('✅ Extension enabled (or already exists).');

        const result = await prisma.$queryRaw`SELECT * FROM pg_extension WHERE extname = 'vector'`;
        console.log('Verification:', result);
    } catch (error) {
        console.error('❌ Error enabling vector extension:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

enableVector();
