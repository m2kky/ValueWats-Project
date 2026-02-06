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
  const { instanceName, number, message, campaignId, messageRecordId } = job.data;
  
  try {
    console.log(`Processing message for ${number} via ${instanceName}`);
    
    const result = await evolutionApi.sendMessage(instanceName, number, message);
    
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
messageQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

messageQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

/**
 * Add messages to the queue for a campaign
 * @param {string} instanceName - The WhatsApp instance to use
 * @param {Array} contacts - List of contacts [{ number, ... }]
 * @param {string} messageTemplate - Message text
 * @param {string} campaignId - DB ID of the campaign
 * @param {string} tenantId - Tenant ID
 */
const addToQueue = async (instanceName, contacts, messageTemplate, campaignId, tenantId) => {
  const jobs = contacts.map(async (contact) => {
    // Create DB record first
    const messageRecord = await prisma.message.create({
      data: {
        campaignId,
        content: messageTemplate,
        status: 'PENDING',
        to: contact.number,
        tenantId
      }
    });

    return messageQueue.add({
      instanceName,
      number: contact.number,
      message: messageTemplate,
      campaignId,
      messageRecordId: messageRecord.id
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
