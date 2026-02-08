const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('../services/queueService');

const fs = require('fs');
const { parseCsv } = require('../services/csvService');

const createCampaign = async (req, res) => {
  try {
    const { name, instanceIds, message, numbers, delayMin = 5, delayMax = 15, instanceSwitchCount = 50 } = req.body;
    const tenantId = req.user.tenantId;

    // Validate required fields
    if (!name || !message) {
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
        messageTemplate: message,
        status: 'PROCESSING',
        totalContacts: contacts.length,
        delayMin: parseInt(delayMin),
        delayMax: parseInt(delayMax),
        instanceSwitchCount: parseInt(instanceSwitchCount),
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

    console.log(`[Campaign] Created campaign ${campaign.id} with ${contacts.length} contacts, instances: ${instances.length}, switch: ${instanceSwitchCount}`);

    // Add to Queue
    await queueService.addToQueue(
      instances,
      contacts,
      message,
      campaign.id,
      tenantId,
      parseInt(delayMin),
      parseInt(delayMax),
      parseInt(instanceSwitchCount)
    );

    res.status(201).json({ 
      message: 'Campaign created and processing started', 
      campaignId: campaign.id,
      totalContacts: contacts.length,
      instanceCount: instances.length
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

module.exports = {
  createCampaign,
  getCampaigns
};
