const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('./queueService');

/**
 * Campaign Scheduler Service
 * 
 * Two jobs run every 30 seconds:
 * 1. Launch SCHEDULED campaigns that are due (scheduledAt <= now)
 * 2. Auto-stop PROCESSING campaigns that have passed their endAt time
 */
async function checkScheduledCampaigns() {
  try {
    const now = new Date();

    // ====== JOB 1: Launch scheduled campaigns ======
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

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PROCESSING' }
      });

      console.log(`[Scheduler] Campaign "${campaign.name}" launched! ${pendingMessages.length} messages queued.`);
    }

    // ====== JOB 2: Auto-stop campaigns past their endAt ======
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'PROCESSING',
        endAt: { not: null, lte: now }
      }
    });

    for (const campaign of expiredCampaigns) {
      console.log(`[Scheduler] Campaign "${campaign.name}" (${campaign.id}) has reached its end time. Auto-stopping...`);

      // Remove pending jobs from queue
      const { messageQueue } = queueService;
      const delayedJobs = await messageQueue.getDelayed();
      const waitingJobs = await messageQueue.getWaiting();
      let removed = 0;
      for (const job of [...delayedJobs, ...waitingJobs]) {
        if (job.data.campaignId === campaign.id) {
          await job.remove();
          removed++;
        }
      }

      // Mark remaining pending messages as FAILED
      await prisma.message.updateMany({
        where: { campaignId: campaign.id, status: 'pending' },
        data: { status: 'FAILED' }
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'COMPLETED' }
      });

      console.log(`[Scheduler] Campaign "${campaign.name}" auto-stopped. ${removed} queued jobs removed.`);
    }

  } catch (error) {
    console.error('[Scheduler] Error:', error);
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
