// Script to manually make a specific user a SUPER ADMIN
// Run with: node scripts/makeSuperAdmin.js <email>

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address.');
    console.error('Usage: node makeSuperAdmin.js user@example.com');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
          isSuperAdmin: true,
          role: 'admin' // Ensure they are at least an admin of their tenant
      },
    });

    console.log(`Success! User ${updatedUser.email} is now a Super Admin.`);
    console.log('You can now log in and navigate to the /admin route.');
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
