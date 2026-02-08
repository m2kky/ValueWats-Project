const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const evolutionApi = require('./evolutionApi');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create the message queue
const messageQueue = new Queue('campaign-messages', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Process jobs
messageQueue.process(async (job) => {
  const { instanceName, number, message, campaignId, messageRecordId, tenantId } = job.data;
  
  try {
    console.log(`Processing message for ${number} via ${instanceName}`);
    
    const result = await evolutionApi.sendMessage(tenantId, instanceName, number, message);
    
    // Update message status in database
    await prisma.message.update({
      where: { id: messageRecordId },
      data: { 
        status: 'SENT',
        sentAt: new Date()
      }
    });

    return result;
  } catch (error) {
    console.error(`Failed to send message to ${number}:`, error.message);
    
    await prisma.message.update({
      where: { id: messageRecordId },
      data: { status: 'FAILED' }
    });
    
    throw error;
  }
});

// Queue events logging
messageQueue.on('completed', async (job) => {
  console.log(`Job ${job.id} completed!`);
  
  // Update campaign sent count
  try {
    const { campaignId } = job.data;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { sentCount: { increment: 1 } }
    });
    
    // Check if all messages for this campaign are processed
    await checkCampaignCompletion(campaignId);
  } catch (err) {
    console.error('Error updating campaign count:', err.message);
  }
});

messageQueue.on('failed', async (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
  
  // Update campaign failed count
  try {
    const { campaignId } = job.data;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { failedCount: { increment: 1 } }
    });
    
    // Check if all messages for this campaign are processed
    await checkCampaignCompletion(campaignId);
  } catch (err) {
    console.error('Error updating campaign failed count:', err.message);
  }
});

/**
 * Check if all messages for a campaign are processed and update status
 */
async function checkCampaignCompletion(campaignId) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });
  
  if (!campaign) return;
  
  const totalProcessed = campaign.sentCount + campaign.failedCount;
  
  if (totalProcessed >= campaign.totalContacts && campaign.status === 'PROCESSING') {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' }
    });
    console.log(`Campaign ${campaignId} completed! Sent: ${campaign.sentCount}, Failed: ${campaign.failedCount}`);
  }
}

/**
 * Add messages to the queue for a campaign
 * @param {string} instanceName - The WhatsApp instance to use
 * @param {string} instanceId - DB ID of the instance
 * @param {Array} contacts - List of contacts [{ number, ... }]
 * @param {string} messageTemplate - Message text
 * @param {string} campaignId - DB ID of the campaign
 * @param {string} tenantId - Tenant ID
 */
const addToQueue = async (instanceName, instanceId, contacts, messageTemplate, campaignId, tenantId) => {
  const jobs = contacts.map(async (contact) => {
    // Create DB record first with correct field names from Schema
    const messageRecord = await prisma.message.create({
      data: {
        campaignId,
        instanceId,
        messageText: messageTemplate,
        status: 'pending',
        recipientNumber: contact.number,
        tenantId
      }
    });

    return messageQueue.add({
      instanceName,
      number: contact.number,
      message: messageTemplate,
      campaignId,
      messageRecordId: messageRecord.id,
      tenantId  // Pass tenantId to job for sendMessage
    }, {
      // Add simple rate limiting delay if needed, though Bull has rate lmiters too
    });
  });

  return Promise.all(jobs);
};

module.exports = {
  messageQueue,
  addToQueue
};
