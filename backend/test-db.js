const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { tenant: true } });
  
  for (const user of users) {
    const tenantId = user.tenantId;
    const campaigns = await prisma.campaign.count({ where: { tenantId } });
    const messages = await prisma.message.count({ where: { tenantId } });
    const chatMessages = await prisma.chatMessage.count({ where: { conversation: { tenantId } } });
    const convos = await prisma.conversation.count({ where: { tenantId } });
    
    console.log(`Resources for user ${user.email} (tenant ${tenantId}):`);
    console.log({ campaigns, messages, chatMessages, convos });
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
