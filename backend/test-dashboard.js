const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantId = '9ecdd8c7-b2eb-4b5e-8266-98151e99fcd2';

    try {
        const totalCampaigns = await prisma.campaign.count({ where: { tenantId } });

        const campaignMessageStats = await prisma.message.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { id: true }
        });

        // 2.5 Get Inbox Chat Message Stats
        const chatMessageStats = await prisma.chatMessage.groupBy({
          by: ['status', 'direction'],
          where: { conversation: { tenantId } },
          _count: { id: true }
        });

        console.log("Groups:", {campaignMessageStats, chatMessageStats});

        const activeInstances = await prisma.instance.count({
          where: { tenantId, status: 'connected' }
        });
        
        const totalContacts = await prisma.conversation.count({
          where: { tenantId }
        });

        console.log("Counts:", {totalCampaigns, activeInstances, totalContacts});
    } catch(e) {
        console.error("ERROR:", e);
    }
}

main().finally(() => prisma.$disconnect());
