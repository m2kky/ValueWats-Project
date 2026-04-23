const prisma = require('../config/database');
const queueService = require('../services/queueService');
const googleSheetService = require('../services/googleSheetService');
const crmService = require('../services/crmService');
const { resolveTenantPlanByTenant } = require('../services/planLimit.service');

const fs = require('fs');
const xlsx = require('xlsx');
const storageService = require('../services/storageService');
const contactResolverService = require('../services/contactResolver.service');
const campaignService = require('../services/campaign.service');

// Helper to extract URLs from text
const urlRegex = /(https?:\/\/[^\s]+)/g;
// Strip invisible/zero-width unicode characters from URLs
const sanitizeUrl = (url) => url.replace(/[\u200B-\u200D\uFEFF\u00AD\u200C\u200E\u200F]/g, '').trim();
const CONNECT_NUMBER_FIRST_ERROR = 'Please connect a WhatsApp number first before launching a campaign.';

const createCampaign = async (req, res) => {
  try {
    const { name, instanceIds, message, messages, numbers, googleSheetUrl, phoneColumn, segmentId, delayMin = 15, delayMax = 25, instanceSwitchCount = 50, messageRotationCount = 1, scheduledAt, endAt, type = 'marketing', targetConfig } = req.body;
    const tenantId = req.user.tenantId;

    // 1. Double-Submit Check
    const duplicateCheck = await prisma.campaign.findFirst({
      where: {
        tenantId,
        name,
        status: { in: ['PENDING', 'PROCESSING', 'SCHEDULED'] },
        createdAt: { gte: new Date(Date.now() - 30 * 1000) }
      }
    });

    if (duplicateCheck) {
      console.warn(`[Campaign] Duplicate creation attempt blocked for tenant ${tenantId}, name: ${name}`);
      return res.status(400).json({ error: 'A campaign with this name was recently created. Please wait a moment.' });
    }

    // 2. Validate basic inputs & Sanitize Messages
    const sanitizeMsg = (text) => text.replace(/(https?:\/\/\S+)/g, (url) => url.replace(/[\u200B-\u200D\uFEFF\u00AD\u200C\u200E\u200F]/g, ''));
    let messageList = (messages && Array.isArray(messages)) ? messages : (message ? [message] : []);
    messageList = messageList.filter(m => m.trim().length > 0).map(sanitizeMsg);

    if (!name || messageList.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: name, message' });
    }

    // 3. Resolve Instances
    let instances = [];
    if (type === 'retargeting') {
      instances = await prisma.instance.findMany({ where: { tenantId, status: 'connected' } });
      if (instances.length === 0) return res.status(400).json({ error: 'No connected instances available for retargeting.' });
    } else {
      let instanceIdList = instanceIds ? (Array.isArray(instanceIds) ? instanceIds : [instanceIds]) : (req.body.instanceId ? [req.body.instanceId] : []);
      instanceIdList = [...new Set(instanceIdList.filter(Boolean))];
      if (instanceIdList.length === 0) return res.status(400).json({ error: CONNECT_NUMBER_FIRST_ERROR });

      instances = await prisma.instance.findMany({ where: { id: { in: instanceIdList }, tenantId, status: 'connected' } });
      if (instances.length !== instanceIdList.length) return res.status(400).json({ error: 'One or more selected instances are not connected. Please reconnect your number(s) and try again.' });
    }

    // 4. Resolve Contacts (Delegated to ContactResolverService)
    const file = req.files && req.files['file'] ? req.files['file'][0] : null;
    let contacts = await contactResolverService.resolveContacts(req.body, file, tenantId);

    // 5. Enforce Limits and Filter Blacklist (Delegated to CampaignService)
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { plan: true } });
    const { filteredContacts, plan } = await campaignService.enforceLimitsAndFilter(contacts, tenant);
    contacts = filteredContacts;

    // 6. Process Media (Delegated to CampaignService)
    const mediaFile = req.files && req.files['media'] ? req.files['media'][0] : null;
    const { mediaUrl, mediaType } = await campaignService.processMedia(mediaFile);

    // 7. Create Database Records (Delegated to CampaignService)
    const { campaign, isScheduled } = await campaignService.createCampaignRecord({
      name, type, targetConfig, messageList, contactsCount: contacts.length,
      delayMin, delayMax, instanceSwitchCount, messageRotationCount,
      scheduledAt, endAt, mediaUrl, mediaType, tenantId, instances, segmentId
    });

    console.log(`[Campaign] Created campaign ${campaign.id} with ${contacts.length} contacts, instances: ${instances.length}`);

    // 8. Queue or Schedule
    if (isScheduled) {
      await campaignService.scheduleMessages(campaign, instances, contacts, messageList, mediaUrl, mediaType, type, tenantId);
      res.status(201).json({
        message: `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        campaignId: campaign.id,
        totalContacts: contacts.length,
        status: 'SCHEDULED',
        scheduledAt
      });
    } else {
      await queueService.addToQueue(
        instances, contacts, messageList, campaign.id, tenantId,
        parseInt(delayMin), parseInt(delayMax), parseInt(instanceSwitchCount),
        parseInt(messageRotationCount), mediaUrl, mediaType, plan, type
      );

      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'PROCESSING' } });

      res.status(201).json({
        message: 'Campaign created and processing started',
        campaignId: campaign.id,
        totalContacts: contacts.length,
        instanceCount: instances.length,
        templateCount: messageList.length
      });
    }

  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(error.status || 400).json({ error: error.message || 'Failed to create campaign', ...error.data });
  }
};
const getCampaigns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        instance: true,
        campaignInstances: {
          include: { instance: true }
        },
        messageTemplates: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get message stats
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { id: true }
    });

    const stats = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
    messageStats.forEach(stat => {
      const status = stat.status.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status] = stat._count.id;
      }
    });

    res.json({
      ...campaign,
      stats
    });

  } catch (error) {
    console.error('Get Campaign Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
};

// Get active (PROCESSING) campaigns for the tenant
const getActiveCampaigns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const campaigns = await prisma.campaign.findMany({
      where: { tenantId, status: 'PROCESSING' },
      select: {
        id: true,
        name: true,
        totalContacts: true,
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Get Active Campaigns Error:', error);
    res.status(500).json({ error: 'Failed to fetch active campaigns' });
  }
};

// Pause a campaign (set status to PAUSED, pending jobs stay in queue)
const pauseCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'PROCESSING') {
      return res.status(400).json({ error: 'Only PROCESSING campaigns can be paused' });
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' }
    });

    // Remove pending jobs for this campaign from the queue
    const { messageQueue } = require('../services/queueService');
    const jobs = await messageQueue.getDelayed();
    for (const job of jobs) {
      if (job.data.campaignId === id) {
        await job.remove();
      }
    }

    res.json({ message: 'Campaign paused' });
  } catch (error) {
    console.error('Pause Campaign Error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
};

// Resume a paused campaign (re-queue pending messages)
const resumeCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Only PAUSED campaigns can be resumed' });
    }

    // Get pending messages for this campaign
    const pendingMessages = await prisma.message.findMany({
      where: { campaignId: id, status: 'pending' },
      include: { instance: true }
    });

    if (pendingMessages.length === 0) {
      // No pending messages, mark as completed
      await prisma.campaign.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });
      return res.json({ message: 'No pending messages. Campaign marked as completed.' });
    }

    // Re-queue pending messages
    const { messageQueue } = require('../services/queueService');
    let cumulativeDelay = 0;

    for (let i = 0; i < pendingMessages.length; i++) {
      const msg = pendingMessages[i];
      const delayMin = campaign.delayMin || 5;
      const delayMax = campaign.delayMax || 15;
      const randomDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      cumulativeDelay += randomDelay * 1000;

      await messageQueue.add({
        instanceName: msg.instance.instanceName,
        number: msg.recipientNumber,
        message: msg.messageText,
        campaignId: id,
        messageRecordId: msg.id,
        tenantId,
        mediaUrl: msg.mediaUrl || campaign.mediaUrl,
        mediaType: msg.mediaType || campaign.mediaType,
        channelType: msg.instance.channelType || 'whatsapp',
        accessToken: msg.instance.accessToken || null,
        phoneNumberId: msg.instance.phoneNumberId || null
      }, {
        delay: i === 0 ? 0 : cumulativeDelay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'PROCESSING' }
    });

    res.json({ message: `Campaign resumed. ${pendingMessages.length} messages re-queued.` });
  } catch (error) {
    console.error('Resume Campaign Error:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
};

// Stop a campaign (cancel all pending messages permanently)
const stopCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'COMPLETED' || campaign.status === 'FAILED') {
      return res.status(400).json({ error: 'Campaign is already finished' });
    }

    // Remove pending jobs from queue
    const { messageQueue } = require('../services/queueService');
    const delayedJobs = await messageQueue.getDelayed();
    const waitingJobs = await messageQueue.getWaiting();
    const allJobs = [...delayedJobs, ...waitingJobs];
    let removed = 0;
    for (const job of allJobs) {
      if (job.data.campaignId === id) {
        await job.remove();
        removed++;
      }
    }

    // Mark remaining pending messages as CANCELLED
    await prisma.message.updateMany({
      where: { campaignId: id, status: 'pending' },
      data: { status: 'FAILED' }
    });

    await prisma.campaign.update({
      where: { id },
      data: { status: 'FAILED' }
    });

    res.json({ message: `Campaign stopped. ${removed} queued jobs removed.` });
  } catch (error) {
    console.error('Stop Campaign Error:', error);
    res.status(500).json({ error: 'Failed to stop campaign' });
  }
};

// Delete a campaign and all its messages
const deleteCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // If campaign is still processing, stop it first
    if (campaign.status === 'PROCESSING' || campaign.status === 'PAUSED') {
      const { messageQueue } = require('../services/queueService');
      const delayedJobs = await messageQueue.getDelayed();
      const waitingJobs = await messageQueue.getWaiting();
      for (const job of [...delayedJobs, ...waitingJobs]) {
        if (job.data.campaignId === id) {
          await job.remove();
        }
      }
    }

    // Delete related records first, then campaign
    await prisma.message.deleteMany({ where: { campaignId: id } });
    await prisma.messageTemplate.deleteMany({ where: { campaignId: id } });
    await prisma.campaignInstance.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete Campaign Error:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
};

// Get messages for a campaign (with optional status filter)
const getCampaignMessages = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status, limit = 100, page = 1 } = req.query;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const where = { campaignId: id };
    if (status) where.status = status.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where,
      select: { id: true, recipientNumber: true, status: true, failReason: true, sentAt: true, instance: { select: { instanceName: true, channelType: true } } },
      take: parseInt(limit),
      skip,
      orderBy: { sentAt: 'desc' }
    });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const exportCampaignContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status } = req.query; // 'SENT', 'FAILED', 'CANCELLED'

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const where = { campaignId: id };
    if (status) where.status = status.toUpperCase();

    const messages = await prisma.message.findMany({
      where,
      select: { recipientNumber: true, status: true, failReason: true, sentAt: true, instance: { select: { instanceName: true, channelType: true } } }
    });

    const lines = ['number,channel,instance,status,failReason,sentAt'];
    messages.forEach(m => {
      const channel = m.instance?.channelType || 'whatsapp';
      const instanceName = m.instance?.instanceName || '';
      lines.push(`${m.recipientNumber},${channel},"${instanceName}",${m.status},"${m.failReason || ''}",${m.sentAt || ''}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign_${id}_${status || 'all'}.csv"`);
    res.send(lines.join('\n'));
  } catch (error) {
    console.error('Export Campaign Error:', error);
    res.status(500).json({ error: 'Failed to export contacts' });
  }
};

const previewSheet = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const columns = await googleSheetService.fetchSheetHeaders(url);
    res.json({ columns });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a campaign (Edit & Resume feature)
const updateCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { message, messages, contacts } = req.body;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Only allow editing if PAUSED or PENDING (Scheduled)
    if (campaign.status !== 'PAUSED' && campaign.status !== 'PENDING' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Campaign can only be edited when PAUSED, PENDING or SCHEDULED.' });
    }

    // Handle messages list similar to create
    let messageList = [];
    if (messages && Array.isArray(messages)) {
      messageList = messages.filter(m => m.trim().length > 0);
    } else if (message) {
      messageList = [message];
    }

    if (messageList.length === 0) {
      return res.status(400).json({ error: 'At least one message template is required' });
    }

    // 1. Update Campaign Record
    await prisma.campaign.update({
      where: { id },
      data: { messageTemplate: messageList[0] }
    });

    // 2. Update Message Templates
    await prisma.messageTemplate.deleteMany({ where: { campaignId: id } });
    await prisma.messageTemplate.createMany({
      data: messageList.map((content, index) => ({ campaignId: id, content, orderIndex: index }))
    });

    // 3. If contacts list provided — replace pending messages with new list
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      // Get existing pending messages to find instanceId
      const firstPending = await prisma.message.findFirst({ where: { campaignId: id, status: 'pending' } });
      const instanceId = firstPending?.instanceId || campaign.instanceId;

      // Delete all pending messages
      await prisma.message.deleteMany({ where: { campaignId: id, status: 'pending' } });

      // Create new pending messages for the new contact list
      await prisma.message.createMany({
        data: contacts.map((number, index) => ({
          campaignId: id,
          instanceId,
          tenantId,
          recipientNumber: number,
          messageText: messageList[index % messageList.length],
          status: 'pending'
        }))
      });

      // Update totalContacts count
      const sentCount = await prisma.message.count({ where: { campaignId: id, status: { in: ['sent', 'delivered', 'read'] } } });
      await prisma.campaign.update({
        where: { id },
        data: { totalContacts: sentCount + contacts.length }
      });

      return res.json({ message: `Campaign updated. Contacts replaced with ${contacts.length} new numbers.` });
    }

    // 3b. Regenerate Pending Messages with new templates
    const pendingMessages = await prisma.message.findMany({ where: { campaignId: id, status: 'pending' } });
    await Promise.all(pendingMessages.map((msg, index) => {
      let newText = messageList[index % messageList.length];
      if (msg.variables) {
        Object.keys(msg.variables).forEach(key => {
          newText = newText.replace(new RegExp(`{{${key}}}`, 'gi'), msg.variables[key] || '');
        });
      }
      return prisma.message.update({ where: { id: msg.id }, data: { messageText: newText } });
    }));

    res.json({ message: `Campaign updated. ${pendingMessages.length} pending messages regenerated.` });

  } catch (error) {
    console.error('Update Campaign Error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

// Duplicate a campaign
const duplicateCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const original = await prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        campaignInstances: true,
        messageTemplates: true
      }
    });

    if (!original) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        tenantId,
        instanceId: original.instanceId,
        type: original.type,
        targetConfig: original.targetConfig || undefined,
        name: `Copy of ${original.name}`,
        messageTemplate: original.messageTemplate,
        status: 'DRAFT',
        totalContacts: 0,
        sentCount: 0,
        failedCount: 0,
        delayMin: original.delayMin,
        delayMax: original.delayMax,
        instanceSwitchCount: original.instanceSwitchCount,
        messageRotationCount: original.messageRotationCount,
        mediaUrl: original.mediaUrl,
        mediaType: original.mediaType,
        savedSegmentId: original.savedSegmentId,
        campaignInstances: {
          create: original.campaignInstances.map(ci => ({
            instanceId: ci.instanceId,
            orderIndex: ci.orderIndex
          }))
        },
        messageTemplates: {
          create: original.messageTemplates.map(mt => ({
            content: mt.content,
            orderIndex: mt.orderIndex
          }))
        }
      }
    });

    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Duplicate Campaign Error:', error);
    res.status(500).json({ error: 'Failed to duplicate campaign' });
  }
};

const calculateAudienceCoverage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { targetConfig } = req.body;

    if (!targetConfig) {
      return res.status(400).json({ error: 'targetConfig is required' });
    }

    const config = typeof targetConfig === 'string' ? JSON.parse(targetConfig) : targetConfig;

    let crmReq = { limit: 9999999 };
    if (config.segmentId) {
      const segment = await prisma.savedSegment.findUnique({ where: { id: config.segmentId, tenantId } });
      if (segment) {
        crmReq.search = segment.rules.search;
        crmReq.lifecycleStageId = segment.rules.filters?.lifecycleStageId;
        crmReq.labelIds = segment.rules.filters?.labelIds?.length > 0 ? segment.rules.filters.labelIds : undefined;
        crmReq.governorate = segment.rules.filters?.governorate;
        crmReq.source = segment.rules.filters?.source;
      }
    }

    // Override segment rules with specific selections from advanced filters
    if (config.lifecycleStageId) crmReq.lifecycleStageId = config.lifecycleStageId;
    if (config.labelIds && config.labelIds.length > 0) crmReq.labelIds = config.labelIds;
    if (config.source) crmReq.source = config.source;

    const result = await crmService.listContacts(tenantId, crmReq);
    
    // Calculate how many contacts
    const count = result.contacts ? result.contacts.length : 0;

    res.json({ count });
  } catch (error) {
    console.error('Calculate Audience Coverage Error:', error);
    res.status(500).json({ error: 'Failed to calculate audience coverage' });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  calculateAudienceCoverage,

  getCampaignById,
  getCampaignMessages,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  duplicateCampaign,
  deleteCampaign,
  getActiveCampaigns,
  exportCampaignContacts,
  previewSheet,
  updateCampaign
};
