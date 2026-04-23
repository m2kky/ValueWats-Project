const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const evolutionApi = require('./evolutionApi');
const metaApi = require('./metaApi');
const prisma = require('../config/database');
const { emitCampaignProgress } = require('./socketService');



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
    removeOnComplete: { count: 100 },  // Fix 2.5: Keep last 100 completed jobs (prevents Redis memory bloat)
    removeOnFail: { count: 500 },      // Keep last 500 failed for debugging
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Process jobs
messageQueue.process(async (job) => {
  const { instanceName, number, message, campaignId, messageRecordId, tenantId, mediaUrl, mediaType, channelType, accessToken, phoneNumberId } = job.data;

  try {
    // Route by channel type — Meta Cloud API for messenger/instagram, Evolution API for whatsapp
    const isMetaChannel = channelType && channelType !== 'whatsapp';
    console.log(`Processing message for ${number} via ${instanceName} (Channel: ${channelType || 'whatsapp'}, Media: ${mediaUrl ? 'Yes' : 'No'})`);

    let result;
    if (isMetaChannel) {
      // Meta Cloud API (Messenger / Instagram)
      const metaInstance = { phoneNumberId, accessToken, channelType };
      if (mediaUrl && mediaType) {
        result = await metaApi.sendMedia(metaInstance, number, mediaUrl, mediaType, message);
      } else {
        result = await metaApi.sendMessage(metaInstance, number, message);
      }
    } else {
      // Evolution API (WhatsApp) — with typing presence simulation
      const typingDelay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
      await evolutionApi.sendPresence(instanceName, number, typingDelay);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      result = await evolutionApi.sendMessage(tenantId, instanceName, number, message, mediaUrl, mediaType);
    }

    // Extract message ID from response
    // Evolution: result.key.id  |  Meta: result.messages[0].id
    const wamid = result.key?.id || result.messages?.[0]?.id || result.id;

    // Update message status in database
    await prisma.message.update({
      where: { id: messageRecordId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        wamid
      }
    });

    return result;
  } catch (error) {
    console.error(`Failed to send message to ${number}:`, error.message);

    // Translate technical errors to human-readable reasons
    const rawError = error.response?.data?.message || error.response?.data?.error?.message || error.response?.data?.error || error.message || '';
    let failReason = 'Unknown error';
    if (/not connected|disconnected|closed|logout/i.test(rawError)) {
      failReason = 'Instance disconnected — channel is not connected';
    } else if (/invalid number|not registered|does not exist/i.test(rawError)) {
      failReason = 'Invalid recipient — not registered on this channel';
    } else if (/rate limit|too many|flood|throttl/i.test(rawError)) {
      failReason = 'Rate limit — too many messages sent too quickly';
    } else if (/blocked|banned/i.test(rawError)) {
      failReason = 'Recipient blocked or banned';
    } else if (/timeout|ECONNREFUSED|ENOTFOUND/i.test(rawError)) {
      failReason = `Connection timeout — ${channelType === 'whatsapp' ? 'Evolution API' : 'Meta API'} unreachable`;
    } else if (/OAuthException|invalid.*token|expired/i.test(rawError)) {
      failReason = 'Meta API auth error — access token invalid or expired';
    } else if (rawError) {
      failReason = rawError;
    }

    await prisma.message.update({
      where: { id: messageRecordId },
      data: { status: 'failed', failReason }
    });

    throw error;
  }
});

// Queue events logging
messageQueue.on('completed', async (job) => {
  console.log(`Job ${job.id} completed!`);

  // Update campaign sent count
  try {
    const { campaignId, tenantId, number, channelType, instanceName } = job.data;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { sentCount: { increment: 1 } }
    });

    // Emit real-time update for live feed
    emitCampaignProgress(campaignId, tenantId, {
      type: 'MESSAGE_SENT',
      recipientNumber: number,
      channelType: channelType || 'whatsapp',
      instanceName: instanceName,
      status: 'sent',
      sentAt: new Date().toISOString()
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
    const { campaignId, tenantId, number, channelType, instanceName } = job.data;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { failedCount: { increment: 1 } }
    });

    // Emit real-time failure for live feed
    emitCampaignProgress(campaignId, tenantId, {
      type: 'MESSAGE_FAILED',
      recipientNumber: number,
      channelType: channelType || 'whatsapp',
      instanceName: instanceName,
      status: 'failed',
      error: err.message,
      sentAt: new Date().toISOString()
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

const redis = require('../config/redis');

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
const addToQueue = async (instances, contacts, messageTemplates, campaignId, tenantId, delayMin = 15, delayMax = 25, instanceSwitchCount = 50, messageRotationCount = 1, mediaUrl = null, mediaType = null, plan = null, type = 'marketing') => {
  // Phase 4: Working Hours — offset the entire campaign start time
  const workingHoursOffset = getWorkingHoursOffset(plan);
  const jobs = [];

  // Ensure inputs are arrays
  const instanceList = Array.isArray(instances) ? instances : [instances];
  const templates = Array.isArray(messageTemplates) ? messageTemplates : [messageTemplates];

  // Fix 2.6: Track next available time per instance in Redis to allow parallel instances
  // while maintaining per-instance cooldown across campaigns.
  const instanceNextAvailable = new Map();

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    // Determine which instance to use
    const instanceIndex = Math.floor(i / intVal(instanceSwitchCount)) % instanceList.length;
    let currentInstance = instanceList[instanceIndex];
    
    if (type === 'retargeting' && contact.source) {
       const mappedChannel = String(contact.source).toLowerCase() === 'system' ? 'whatsapp' : String(contact.source).toLowerCase();
       const matchedInstance = instanceList.find(inst => String(inst.channelType).toLowerCase() === mappedChannel);
       if (matchedInstance) {
          currentInstance = matchedInstance;
       } else {
          // If retargeting and no connected instance exists for their platform, skip & fail.
          console.log(`[Queue] Skipping contact ${contact.number} due to missing channel instance ${mappedChannel}`);
          await prisma.message.create({
            data: {
              campaignId,
              status: 'FAILED',
              failReason: `No connected instance for channel ${mappedChannel}`,
              recipientNumber: contact.number,
              tenantId,
              mediaUrl,
              mediaType,
              variables: contact.variables || null
            }
          });
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { failedCount: { increment: 1 } }
          });
          continue;
       }
    }

    if (!currentInstance) {
      console.error(`[Queue] No instance available for message ${i}`);
      continue;
    }

    // Determine which message template to use
    const templateIndex = Math.floor(i / intVal(messageRotationCount)) % templates.length;
    let currentMessage = templates[templateIndex];

    // Anti-Ban Spintax & Dynamic Global Variables
    const generateInvisibleString = () => {
      const chars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
      let str = '';
      const len = Math.floor(Math.random() * 5) + 3;
      for (let j = 0; j < len; j++) str += chars[Math.floor(Math.random() * chars.length)];
      return str;
    };

    currentMessage += '\n' + generateInvisibleString();
    currentMessage = currentMessage.replace(/{{rand}}/gi, Math.floor(Math.random() * 10000).toString());
    currentMessage = currentMessage.replace(/{{date}}/gi, new Date().toLocaleString('ar-EG'));

    if (contact.variables) {
      Object.keys(contact.variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        currentMessage = currentMessage.replace(regex, contact.variables[key] || '');
      });
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

    // Calculate delay using Redis-backed per-instance cooldown
    const redisKey = `instance_next_time:${currentInstance.id}`;
    
    // Get last scheduled time for this instance from local cache OR Redis
    let lastTime = instanceNextAvailable.get(currentInstance.id);
    if (!lastTime) {
      const redisVal = await redis.get(redisKey);
      lastTime = redisVal ? parseInt(redisVal) : Date.now();
    }

    // Ensure we start after working hours if applicable
    lastTime = Math.max(lastTime, Date.now() + workingHoursOffset);

    const randomDelay = Math.floor(Math.random() * (intVal(delayMax) - intVal(delayMin) + 1)) + intVal(delayMin);
    const nextTime = lastTime + (randomDelay * 1000);
    
    // Update local cache and Redis
    instanceNextAvailable.set(currentInstance.id, nextTime);
    await redis.set(redisKey, nextTime, 'PX', 2 * 3600000); // 2 hours TTL

    const jobDelay = nextTime - Date.now();

    console.log(`[Queue] Scheduling message ${i + 1}/${contacts.length} to ${contact.number} via ${currentInstance.instanceName} with ${Math.round(jobDelay/1000)}s delay`);

    const job = messageQueue.add({
      instanceName: currentInstance.instanceName,
      number: contact.number,
      message: currentMessage,
      campaignId,
      messageRecordId: messageRecord.id,
      tenantId,
      mediaUrl,
      mediaType,
      channelType: currentInstance.channelType || 'whatsapp',
      accessToken: currentInstance.accessToken || null,
      phoneNumberId: currentInstance.phoneNumberId || null
    }, {
      delay: Math.max(0, jobDelay),
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
