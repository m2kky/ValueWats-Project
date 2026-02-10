const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('../services/queueService');

const fs = require('fs');
const { parseCsv } = require('../services/csvService');

const createCampaign = async (req, res) => {
  try {
    const { name, instanceIds, message, messages, numbers, delayMin = 5, delayMax = 15, instanceSwitchCount = 50, messageRotationCount = 1, scheduledAt, endAt } = req.body;
    const tenantId = req.user.tenantId;

    // Handle messages (support both single 'message' and array 'messages')
    let messageList = [];
    if (messages && Array.isArray(messages)) {
      messageList = messages.filter(m => m.trim().length > 0);
    } else if (message) {
      messageList = [message];
    }

    // Validate required fields
    if (!name || messageList.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: name, message' });
    }

    // Handle instanceIds (can be array or single value back-compat)
    let instanceIdList = [];
    if (instanceIds) {
      instanceIdList = Array.isArray(instanceIds) ? instanceIds : [instanceIds];
    } else if (req.body.instanceId) {
      instanceIdList = [req.body.instanceId];
    } else {
      return res.status(400).json({ error: 'At least one instance is required' });
    }
    
    // Verify instances exist and are connected
    const instances = await prisma.instance.findMany({
      where: {
        id: { in: instanceIdList },
        tenantId,
        status: 'connected'
      }
    });

    if (instances.length === 0) {
      return res.status(400).json({ error: 'No connected instances found' });
    }

    // Parse contacts
    let contacts = [];
    if (req.files && req.files['file']) {
      try {
        const fileBuffer = fs.readFileSync(req.files['file'][0].path);
        const results = await parseCsv(fileBuffer);
        contacts = results.map(row => ({ number: row.number }));
        // Clean up temp file? Multer diskStorage keeps it. We might want to keep it or delete it.
        // For CSVs, we probably don't need to keep them after parsing.
        try { fs.unlinkSync(req.files['file'][0].path); } catch(e) {}
      } catch (err) {
        console.error('CSV Parse Error:', err);
        return res.status(400).json({ error: 'Failed to parse CSV file' });
      }
    } else if (numbers) {
      const lines = numbers.split('\n');
      contacts = lines.map(line => ({ number: line.trim() })).filter(c => c.number);
    } else {
      return res.status(400).json({ error: 'No contacts provided' });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No valid contacts provided' });
    }

    // Handle Media Attachment
    let mediaUrl = null;
    let mediaType = null;
    if (req.files && req.files['media']) {
      const mediaFile = req.files['media'][0];
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      mediaUrl = `${backendUrl}/uploads/${mediaFile.filename}`;
      
      // Determine media type
      if (mediaFile.mimetype.startsWith('image/')) mediaType = 'image';
      else if (mediaFile.mimetype.startsWith('video/')) mediaType = 'video';
      else mediaType = 'document'; // default fallback
    }

    // Determine if this is a scheduled campaign
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const campaignStatus = isScheduled ? 'SCHEDULED' : 'PROCESSING';

    // Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        messageTemplate: messageList[0], // Primary message
        status: campaignStatus,
        totalContacts: contacts.length,
        delayMin: parseInt(delayMin),
        delayMax: parseInt(delayMax),
        instanceSwitchCount: parseInt(instanceSwitchCount),
        messageRotationCount: parseInt(messageRotationCount),
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        instanceId: instances[0].id, // Default to first instance
        tenantId,
        mediaUrl,
        mediaType
      }
    });

    // Create CampaignInstance records
    if (instances.length > 0) {
      await prisma.campaignInstance.createMany({
        data: instances.map((instance, index) => ({
          campaignId: campaign.id,
          instanceId: instance.id,
          orderIndex: index
        }))
      });
    }

    // Create MessageTemplate records
    if (messageList.length > 0) {
      await prisma.messageTemplate.createMany({
        data: messageList.map((content, index) => ({
          campaignId: campaign.id,
          content,
          orderIndex: index
        }))
      });
    }

    console.log(`[Campaign] Created campaign ${campaign.id} with ${contacts.length} contacts, instances: ${instances.length}, templates: ${messageList.length}, status: ${campaignStatus}`);

    if (isScheduled) {
      // For scheduled campaigns: create message records but don't queue yet
      // Store contacts as pending messages so the scheduler can re-queue them
      const instanceList = Array.isArray(instances) ? instances : [instances];
      const templates = Array.isArray(messageList) ? messageList : [messageList];

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const instanceIndex = Math.floor(i / parseInt(instanceSwitchCount)) % instanceList.length;
        const currentInstance = instanceList[instanceIndex];
        const templateIndex = Math.floor(i / parseInt(messageRotationCount)) % templates.length;
        const currentMessage = templates[templateIndex];

        await prisma.message.create({
          data: {
            campaignId: campaign.id,
            instanceId: currentInstance.id,
            messageText: currentMessage,
            status: 'pending',
            recipientNumber: contact.number,
            tenantId,
            mediaUrl,
            mediaType
          }
        });
      }

      res.status(201).json({ 
        message: `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`, 
        campaignId: campaign.id,
        totalContacts: contacts.length,
        status: 'SCHEDULED',
        scheduledAt: scheduledAt
      });
    } else {
      // Add to Queue immediately
      await queueService.addToQueue(
        instances,
        contacts,
        messageList,
        campaign.id,
        tenantId,
        parseInt(delayMin),
        parseInt(delayMax),
        parseInt(instanceSwitchCount),
        parseInt(messageRotationCount),
        mediaUrl,
        mediaType
      );

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
    res.status(500).json({ error: 'Failed to create campaign' });
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
        tenantId
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
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getActiveCampaigns,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign
};
