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
    
    // Extract wamid (message ID) from Evolution API response
    // V2 structure: result.key.id
    const wamid = result.key?.id || result.id;
    
    // Update message status in database
    await prisma.message.update({
      where: { id: messageRecordId },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
        wamid
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
 * Add messages to the queue for a campaign with staggered delays, multi-instance support, and message rotation
 * @param {Array} instances - List of instances to use [{ id, instanceName }]
 * @param {Array} contacts - List of contacts [{ number, ... }]
 * @param {Array} messageTemplates - List of message templates (strings)
 * @param {string} campaignId - DB ID of the campaign
 * @param {string} tenantId - Tenant ID
 * @param {number} delayMin - Minimum delay between messages (seconds)
 * @param {number} delayMax - Maximum delay between messages (seconds)
 * @param {number} instanceSwitchCount - Switch instance every N messages
 * @param {number} messageRotationCount - Switch template every N messages
 */
const addToQueue = async (instances, contacts, messageTemplates, campaignId, tenantId, delayMin = 5, delayMax = 15, instanceSwitchCount = 50, messageRotationCount = 1) => {
  let cumulativeDelay = 0;
  const jobs = [];
  
  // Ensure inputs are arrays
  const instanceList = Array.isArray(instances) ? instances : [instances];
  // Backwards compatibility: if messageTemplates is a string, wrap in array
  const templates = Array.isArray(messageTemplates) ? messageTemplates : [messageTemplates];
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    // Determine which instance to use
    const instanceIndex = Math.floor(i / instanceSwitchCount) % instanceList.length;
    const currentInstance = instanceList[instanceIndex];
    
    // Determine which message template to use
    const templateIndex = Math.floor(i / messageRotationCount) % templates.length;
    const currentMessage = templates[templateIndex];
    
    if (!currentInstance) {
      console.error(`[Queue] No instance available for message ${i}`);
      continue;
    }

    // Create DB record first
    const messageRecord = await prisma.message.create({
      data: {
        campaignId,
        instanceId: currentInstance.id,
        messageText: currentMessage,
        status: 'pending',
        recipientNumber: contact.number,
        tenantId
      }
    });
    
    // Random delay between delayMin and delayMax (in seconds, convert to ms)
    const randomDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
    cumulativeDelay += randomDelay * 1000; // Convert to milliseconds
    
    console.log(`[Queue] Scheduling message ${i + 1}/${contacts.length} to ${contact.number} via ${currentInstance.instanceName} (Template ${templateIndex + 1}) with ${cumulativeDelay}ms delay`);
    
    const job = messageQueue.add({
      instanceName: currentInstance.instanceName,
      number: contact.number,
      message: currentMessage,
      campaignId,
      messageRecordId: messageRecord.id,
      tenantId
    }, {
      delay: i === 0 ? 0 : cumulativeDelay, // First message immediate, rest with delay
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    
    jobs.push(job);
  }

  return Promise.all(jobs);
};

module.exports = {
  messageQueue,
  addToQueue
};
