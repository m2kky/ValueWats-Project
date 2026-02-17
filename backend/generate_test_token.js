require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find a Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { status: 'active' }
  });

  if (!tenant) {
    console.log('No active tenant found. Creating one...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        email: 'test@example.com',
        status: 'active'
      }
    });
  }

  // 2. Find a User
  let user = await prisma.user.findFirst({
    where: { tenantId: tenant.id }
  });
  
  if (!user) {
    console.log('No user found. Creating one...');
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@example.com',
        passwordHash: 'hashedpassword', // Dummy
        role: 'admin',
        emailVerified: true
      }
    });
  }

  // 3. Generate Token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role, 
      tenantId: tenant.id 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('TOKEN_START');
  console.log(token);
  console.log('TOKEN_END');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
