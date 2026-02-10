const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const users = await prisma.user.groupBy({
    by: ['email'],
    _count: {
      email: true,
    },
    having: {
      email: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (users.length > 0) {
    console.log('Found duplicate emails:', users);
    process.exit(1);
  } else {
    console.log('No duplicate emails found.');
    process.exit(0);
  }
}

checkDuplicates();
