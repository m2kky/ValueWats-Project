const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const queueService = require('../services/queueService');

const fs = require('fs');
const { parseCsv } = require('../services/csvService');

const createCampaign = async (req, res) => {
  try {
    const { name, instanceId, message, numbers } = req.body;
    const file = req.file;
    const tenantId = req.user.tenantId;

    // Validate inputs
    if (!name || !instanceId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let contacts = [];

    // Handle manual numbers input
    if (numbers) {
      const manualContacts = numbers.split('\n')
        .map(n => n.trim())
        .filter(n => n)
        .map(n => ({ number: n.replace(/\D/g, '') }));
      contacts = [...contacts, ...manualContacts];
    }

    // Handle CSV file upload
    if (file) {
      try {
        const fileContacts = await parseCsv(file.path);
        contacts = [...contacts, ...fileContacts];
        // Clean up file
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('CSV Parse Error:', err);
        return res.status(400).json({ error: 'Failed to parse CSV file' });
      }
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No valid contacts provided' });
    }

    // Check if instance exists and belongs to tenant
    const instance = await prisma.instance.findUnique({
      where: { 
        id: instanceId,
        tenantId
      }
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({ error: 'Instance is not connected' });
    }

    // Create Campaign with total contacts count
    const campaign = await prisma.campaign.create({
      data: {
        name,
        messageTemplate: message,
        status: 'PROCESSING',
        totalContacts: contacts.length,
        tenantId,
        instanceId
      }
    });

    // Add to Queue
    await queueService.addToQueue(
      instance.instanceName,
      instance.id,      // instanceId
      contacts,
      message,
      campaign.id,
      tenantId
    );

    res.status(201).json({ 
      message: 'Campaign created and processing started', 
      campaignId: campaign.id,
      totalContacts: contacts.length 
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
