const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const evolutionApi = require('./evolutionApi');
const prisma = require('../config/database');



// Helper to extract IPs from text
const urlRegex = /(https?:\/\/[^\s]+)/g;

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
  const { instanceName, number, message, campaignId, messageRecordId, tenantId, mediaUrl, mediaType } = job.data;

  try {
    console.log(`Processing message for ${number} via ${instanceName} (Media: ${mediaUrl ? 'Yes' : 'No'})`);

    // Send typing presence first to mimic human behavior (add random 2s to 4s delay internally)
    const typingDelay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    await evolutionApi.sendPresence(instanceName, number, typingDelay);

    // Wait for the simulated typing duration before dispatching the real message
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Now send the actual message
    const result = await evolutionApi.sendMessage(tenantId, instanceName, number, message, mediaUrl, mediaType);

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
      data: {
        status: 'FAILED',
        failReason: error.response?.data?.message || error.message || 'Unknown error'
      }
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

  if (totalProcessed >= campaign.totalContacts && ['PROCESSING', 'PENDING'].includes(campaign.status)) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' }
    });
    console.log(`Campaign ${campaignId} completed! Sent: ${campaign.sentCount}, Failed: ${campaign.failedCount}`);
  }
}

/**
 * Phase 4 — Working Hours
 * Returns ms until the next valid sending window based on plan config.
 * If currently inside working hours, returns 0 (start immediately).
 * Timezone: UTC+2 (Cairo / Egypt Standard Time)
 */
function getWorkingHoursOffset(plan) {
  if (!plan || !plan.workingHoursEnabled) return 0;

  const [startH, startM] = plan.workingHoursStart.split(':').map(Number);
  const [endH, endM] = plan.workingHoursEnd.split(':').map(Number);

  // Get current time in Cairo (UTC+2)
  const now = new Date();
  const cairoNow = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  const currentMinutes = cairoNow.getHours() * 60 + cairoNow.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return 0; // Currently inside working hours — start NOW
  }

  // Outside working hours — calculate delay to NEXT window
  let minutesToStart;
  if (currentMinutes < startMinutes) {
    // Before today's window
    minutesToStart = startMinutes - currentMinutes;
  } else {
    // After today's window — wait until tomorrow
    minutesToStart = (24 * 60 - currentMinutes) + startMinutes;
  }
  console.log(`[Queue] Working Hours active. Offsetting by ${minutesToStart} minutes until next window.`);
  return minutesToStart * 60 * 1000; // Convert to ms
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
 * @param {object|null} plan - Tenant's subscription plan (for working hours enforcement)
 */
const addToQueue = async (instances, contacts, messageTemplates, campaignId, tenantId, delayMin = 15, delayMax = 25, instanceSwitchCount = 50, messageRotationCount = 1, mediaUrl = null, mediaType = null, plan = null) => {
  // Phase 4: Working Hours — offset the entire campaign start time
  let cumulativeDelay = getWorkingHoursOffset(plan);
  const jobs = [];

  // Ensure inputs are arrays
  const instanceList = Array.isArray(instances) ? instances : [instances];
  // Backwards compatibility: if messageTemplates is a string, wrap in array
  const templates = Array.isArray(messageTemplates) ? messageTemplates : [messageTemplates];

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    // Determine which instance to use
    const instanceIndex = Math.floor(i / intVal(instanceSwitchCount)) % instanceList.length;
    const currentInstance = instanceList[instanceIndex];

    // Determine which message template to use
    const templateIndex = Math.floor(i / intVal(messageRotationCount)) % templates.length;
    let currentMessage = templates[templateIndex];

    // Anti-Ban Spintax & Dynamic Global Variables
    // Usage: {{rand}} = Random invisible characters to make each message slightly unique
    // Usage: {{date}} = Current date/time to make each message timestamped
    const generateInvisibleString = () => {
      const chars = ['\u200B', '\u200C', '\u200D', '\uFEFF']; // Zero-width characters
      let str = '';
      const len = Math.floor(Math.random() * 5) + 3; // 3 to 7 chars
      for (let j = 0; j < len; j++) str += chars[Math.floor(Math.random() * chars.length)];
      return str;
    };

    // Inject invisible random chars at the end of the message to bypass hash-matching spam filters
    currentMessage += generateInvisibleString();

    // Replace basic dynamic variables
    currentMessage = currentMessage.replace(/{{rand}}/gi, Math.floor(Math.random() * 10000).toString());
    currentMessage = currentMessage.replace(/{{date}}/gi, new Date().toLocaleString('ar-EG'));

    // Interpolate Contact Variables (from CSV mapping)
    if (contact.variables) {
      Object.keys(contact.variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        currentMessage = currentMessage.replace(regex, contact.variables[key] || '');
      });
    }

    // Links are preserved entirely in modern configurations (CTR disabled)

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
        tenantId,
        mediaUrl,
        mediaType,
        variables: contact.variables || null
      }
    });

    // Random delay between delayMin and delayMax
    const dMin = intVal(delayMin);
    const dMax = intVal(delayMax);
    const randomDelay = Math.floor(Math.random() * (dMax - dMin + 1)) + dMin;
    cumulativeDelay += randomDelay * 1000;

    console.log(`[Queue] Scheduling message ${i + 1}/${contacts.length} to ${contact.number} via ${currentInstance.instanceName} (Template ${templateIndex + 1}) with ${cumulativeDelay}ms delay`);

    const job = messageQueue.add({
      instanceName: currentInstance.instanceName,
      number: contact.number,
      message: currentMessage,
      campaignId,
      messageRecordId: messageRecord.id,
      tenantId,
      mediaUrl,
      mediaType
    }, {
      delay: i === 0 ? 0 : cumulativeDelay, // First message immediate
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

// Helper for safe int parsing
function intVal(val) {
  return parseInt(val) || 1;
}

module.exports = {
  messageQueue,
  addToQueue
};
