const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('./queueService');

/**
 * Campaign Scheduler Service
 * Checks every 30 seconds for SCHEDULED campaigns that are due to launch,
 * then queues their pending messages and updates status to PROCESSING.
 */
async function checkScheduledCampaigns() {
  try {
    const now = new Date();

    // Find scheduled campaigns that are due
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      },
      include: {
        campaignInstances: { include: { instance: true }, orderBy: { orderIndex: 'asc' } },
        messageTemplates: { orderBy: { orderIndex: 'asc' } }
      }
    });

    for (const campaign of dueCampaigns) {
      console.log(`[Scheduler] Launching scheduled campaign: "${campaign.name}" (${campaign.id})`);

      // Get pending messages
      const pendingMessages = await prisma.message.findMany({
        where: { campaignId: campaign.id, status: 'pending' },
        include: { instance: true }
      });

      if (pendingMessages.length === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED' }
        });
        console.log(`[Scheduler] Campaign "${campaign.name}" has no pending messages, marked as COMPLETED`);
        continue;
      }

      // Queue the messages
      const { messageQueue } = queueService;
      let cumulativeDelay = 0;
      const delayMin = campaign.delayMin || 5;
      const delayMax = campaign.delayMax || 15;

      for (let i = 0; i < pendingMessages.length; i++) {
        const msg = pendingMessages[i];
        const randomDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
        cumulativeDelay += randomDelay * 1000;

        await messageQueue.add({
          instanceName: msg.instance.instanceName,
          number: msg.recipientNumber,
          message: msg.messageText,
          campaignId: campaign.id,
          messageRecordId: msg.id,
          tenantId: campaign.tenantId
        }, {
          delay: i === 0 ? 0 : cumulativeDelay,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        });
      }

      // Update status to PROCESSING
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PROCESSING' }
      });

      console.log(`[Scheduler] Campaign "${campaign.name}" launched! ${pendingMessages.length} messages queued.`);
    }
  } catch (error) {
    console.error('[Scheduler] Error checking scheduled campaigns:', error);
  }
}

// Start the scheduler (runs every 30 seconds)
let schedulerInterval = null;

function startScheduler() {
  if (schedulerInterval) return;
  console.log('[Scheduler] Campaign scheduler started (checking every 30s)');
  schedulerInterval = setInterval(checkScheduledCampaigns, 30000);
  // Run immediately on start
  checkScheduledCampaigns();
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Campaign scheduler stopped');
  }
}

module.exports = { startScheduler, stopScheduler, checkScheduledCampaigns };
