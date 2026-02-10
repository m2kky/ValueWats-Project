const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('../services/queueService');

const fs = require('fs');
const { parseCsv } = require('../services/csvService');

const createCampaign = async (req, res) => {
  try {
    const { name, instanceIds, message, messages, numbers, delayMin = 5, delayMax = 15, instanceSwitchCount = 50, messageRotationCount = 1 } = req.body;
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
    // If instanceIds is provided, use it. If not, check for instanceId (legacy)
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
    if (req.file) {
      try {
        const results = await parseCsv(req.file.buffer);
        contacts = results.map(row => ({ number: row.number }));
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

    // Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        messageTemplate: messageList[0], // Primary message
        status: 'PROCESSING',
        totalContacts: contacts.length,
        delayMin: parseInt(delayMin),
        delayMax: parseInt(delayMax),
        instanceSwitchCount: parseInt(instanceSwitchCount),
        messageRotationCount: parseInt(messageRotationCount),
        instanceId: instances[0].id, // Default to first instance
        tenantId
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

    console.log(`[Campaign] Created campaign ${campaign.id} with ${contacts.length} contacts, instances: ${instances.length}, templates: ${messageList.length}`);

    // Add to Queue
    await queueService.addToQueue(
      instances,
      contacts,
      messageList,
      campaign.id,
      tenantId,
      parseInt(delayMin),
      parseInt(delayMax),
      parseInt(instanceSwitchCount),
      parseInt(messageRotationCount)
    );

    res.status(201).json({ 
      message: 'Campaign created and processing started', 
      campaignId: campaign.id,
      totalContacts: contacts.length,
      instanceCount: instances.length,
      templateCount: messageList.length
    });

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

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getActiveCampaigns
};
