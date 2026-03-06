const prisma = require('../config/database');
const queueService = require('../services/queueService');
const googleSheetService = require('../services/googleSheetService');
const crmService = require('../services/crmService');

const fs = require('fs');
const xlsx = require('xlsx');
const storageService = require('../services/storageService');

// Helper to extract IPs from text
const urlRegex = /(https?:\/\/[^\s]+)/g;

const createCampaign = async (req, res) => {
  try {
    const { name, instanceIds, message, messages, numbers, googleSheetUrl, phoneColumn, segmentId, delayMin = 15, delayMax = 25, instanceSwitchCount = 50, messageRotationCount = 1, scheduledAt, endAt } = req.body;

    const tenantId = req.user.tenantId;

    // Load tenant + plan for limit enforcement
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true }
    });

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

    // Handle Contacts (CSV File or Manual Input or Google Sheet)
    let contacts = [];

    // 1. CSV File Upload
    // 1. File Upload (CSV or Excel)
    if (req.files && req.files['file']) {
      const filePath = req.files['file'][0].path;

      try {
        // Read file using xlsx (supports CSV, XLS, XLSX)
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON array
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" }); // defval ensures empty cells are empty strings

        if (jsonData.length === 0) {
          try { fs.unlinkSync(filePath); } catch (e) { }
          return res.status(400).json({ error: 'File is empty.' });
        }

        // Detect phone column
        const headers = Object.keys(jsonData[0]).map(h => h.trim().toLowerCase());
        const originalHeaders = Object.keys(jsonData[0]); // Keep original case for data extraction

        const numberIndex = headers.indexOf('number');
        const phoneIndex = headers.indexOf('phone');
        const mobileIndex = headers.indexOf('mobile');

        // Find the matching key in original headers
        let targetKey = null;
        if (numberIndex !== -1) targetKey = originalHeaders[numberIndex];
        else if (phoneIndex !== -1) targetKey = originalHeaders[phoneIndex];
        else if (mobileIndex !== -1) targetKey = originalHeaders[mobileIndex];

        if (!targetKey) {
          try { fs.unlinkSync(filePath); } catch (e) { }
          return res.status(400).json({ error: "File must contain a 'number', 'phone', or 'mobile' column header." });
        }

        contacts = jsonData.map(row => {
          const number = String(row[targetKey]).trim();
          if (number && number.length >= 7) {
            return { number, variables: row };
          }
          return null;
        }).filter(Boolean);

      } catch (err) {
        console.error('File Parse Error:', err);
        return res.status(400).json({ error: 'Failed to parse file. Ensure it is a valid CSV or Excel file.' });
      } finally {
        try { fs.unlinkSync(filePath); } catch (e) { } // Clean up
      }
    }
    // 2. Google Sheet Import
    else if (googleSheetUrl) {
      const sheetData = await googleSheetService.fetchSheetData(googleSheetUrl);

      if (sheetData.length === 0) {
        return res.status(400).json({ error: "Google Sheet is empty or could not be read." });
      }

      // Identify Phone Column
      if (!phoneColumn) {
        return res.status(400).json({ error: "Please specify which column contains the Phone Number for Google Sheet." });
      }

      // Map rows to contacts with all data (for variable interpolation)
      contacts = sheetData.map(row => {
        const number = row[phoneColumn];
        if (!number) return null;

        return {
          number: number.trim(),
          variables: row // Store all row data for interpolation
        };
      }).filter(Boolean);

    }
    // 3. Saved Segment Input
    else if (segmentId) {
      const segment = await prisma.savedSegment.findUnique({
        where: { id: segmentId, tenantId }
      });
      if (!segment) {
        return res.status(404).json({ error: 'Saved segment not found.' });
      }

      // Convert stored filters JSON into the format crmService.listContacts expects
      const rules = segment.rules.filters || {};
      const search = segment.rules.search;
      
      const crmReq = {
        search,
        lifecycleStageId: rules.lifecycleStageId,
        labelIds: rules.labelIds?.length > 0 ? rules.labelIds : undefined,
        governorate: rules.governorate,
        source: rules.source,
        limit: 9999999 // Pull everyone matching
      };

      const result = await crmService.listContacts(tenantId, crmReq);
      
      if (!result.contacts || result.contacts.length === 0) {
        return res.status(400).json({ error: 'Selected segment contains no contacts.' });
      }

      contacts = result.contacts.map(c => ({
        number: c.phoneNumber.trim(),
        variables: { name: c.name, email: c.email }
      })).filter(c => c.number);
    }
    // 4. Manual Input
    else if (numbers) {
      const lines = numbers.split('\n');
      contacts = lines.map(line => ({ number: line.trim() })).filter(c => c.number && c.number.length >= 7);
    } else {
      return res.status(400).json({ error: 'No contacts provided (CSV, Sheet, Segment, or Manual)' });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No valid contacts found.' });
    }

    // Sanitize phone numbers: strip non-digits, validate length
    contacts = contacts.map(c => ({
      ...c,
      number: c.number.replace(/[^0-9]/g, '')
    })).filter(c => c.number.length >= 7 && c.number.length <= 15);

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No valid phone numbers found. Numbers must be 7-15 digits.' });
    }

    // ====== PHASE 2: Plan-Based Contact Limit ======
    const plan = tenant?.plan;
    if (plan && contacts.length > plan.maxContactsPerCampaign) {
      return res.status(402).json({
        error: `Contact list exceeds your plan limit of ${plan.maxContactsPerCampaign} contacts per campaign. Please upgrade your plan or reduce the contact list.`,
        limit: plan.maxContactsPerCampaign,
        requested: contacts.length
      });
    }

    // ====== PHASE 3: Filter Out Blacklisted Contacts (Opt-out) ======
    const phoneNumbers = contacts.map(c => c.number);
    const blacklistedContacts = await prisma.contact.findMany({
      where: { tenantId, phoneNumber: { in: phoneNumbers }, blacklisted: true },
      select: { phoneNumber: true }
    });
    const blacklistedSet = new Set(blacklistedContacts.map(c => c.phoneNumber));
    const filteredContacts = contacts.filter(c => !blacklistedSet.has(c.number));
    if (blacklistedSet.size > 0) {
      console.log(`[Campaign] Filtered out ${blacklistedSet.size} blacklisted contact(s) from campaign.`);
    }
    contacts = filteredContacts;

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'All provided contacts have opted out of marketing messages.' });
    }

    // Handle Media Attachment
    let mediaUrl = null;
    let mediaType = null;
    if (req.files && req.files['media']) {
      const mediaFile = req.files['media'][0];

      // Upload to S3/MinIO
      mediaUrl = await storageService.uploadFile(mediaFile);

      // Determine media type
      if (mediaFile.mimetype.startsWith('image/')) mediaType = 'image';
      else if (mediaFile.mimetype.startsWith('video/')) mediaType = 'video';
      else mediaType = 'document'; // default fallback
    }

    // Determine if this is a scheduled campaign
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const campaignStatus = isScheduled ? 'SCHEDULED' : 'PENDING'; // Initial status for new flow

    // Create Campaign in DB
    const campaign = await prisma.campaign.create({
      data: {
        name,
        messageTemplate: messageList[0], // Store primary message for display/reference
        status: campaignStatus,
        totalContacts: contacts.length,
        delayMin: parseInt(delayMin),
        delayMax: parseInt(delayMax),
        instanceSwitchCount: parseInt(instanceSwitchCount),
        messageRotationCount: parseInt(messageRotationCount),
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        mediaUrl,
        mediaType,
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

    // Link Saved Segment if applicable
    if (segmentId) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { savedSegmentId: segmentId }
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
        let currentMessage = templates[templateIndex];

        // Anti-Ban Spintax & Dynamic Global Variables
        const generateInvisibleString = () => {
          const chars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
          let str = '';
          const len = Math.floor(Math.random() * 5) + 3;
          for (let j = 0; j < len; j++) str += chars[Math.floor(Math.random() * chars.length)];
          return str;
        };

        currentMessage += generateInvisibleString();
        currentMessage = currentMessage.replace(/{{rand}}/gi, Math.floor(Math.random() * 10000).toString());
        currentMessage = currentMessage.replace(/{{date}}/gi, new Date().toLocaleString('ar-EG'));

        const finalMessage = currentMessage;

        const messageRecord = await prisma.message.create({
          data: {
            campaignId: campaign.id,
            instanceId: currentInstance.id,
            messageText: finalMessage,
            status: 'pending',
            recipientNumber: contact.number,
            tenantId,
            mediaUrl,
            mediaType,
            variables: contact.variables || null
          }
        });

        // If we want per-user tracking to be traceable to the specific message, we'd need to update the links created above
        // with the messageRecord.id. This adds N updates. 
        // For V1, let's stick to campaign-level tracking or efficient batching if needed.
        // But for "Advanced Analytics", user wants to know WHO clicked.
        // So we should ideally update the Link records.
        // Optimization: Generate shortCode, Create Message, Create Link with MessageID.
        // But we need the shortCode to put in the message text *before* creating the message.
        // So: 
        // 1. Generate shortCode/Link (messageId: null)
        // 2. Create Message (messageText: ...shortUrl...)
        // 3. Update Link (messageId: messageRecord.id)

        // Re-parsing to find the short codes we just inserted might be complex.
        // Let's rely on the previous loop. We need to track which links belong to this message.
        // Ideally linkShortener returns the Link object, not just URL.

        // Refined Logic below in next chunk for addToQueue
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
      // Process Contacts & Queue
      // We need to do the link shortening loop here too if we want immediate processing to have tracking.
      // QueueService.addToQueue usually just pushes to BullMQ.
      // If we want tracking, we should probably create the Message records HERE (like scheduled) 
      // and then push to queue with the messageID.
      // But `addToQueue` might be designed to create records. Let's check `addToQueue` implementation.
      // If `addToQueue` creates records, we should move that logic here or update `addToQueue`.
      // Given `addToQueue` handles rotation/delay logic, updating it to handle Link Shortening is better.

      // Update: Passing full contact objects with variables to addToQueue. 
      // Link shortening should ideally happen INSIDE the worker or just before queuing.
      // If we do it before queuing, we can track who clicked.

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
        mediaType,
        plan // Phase 4 Working Hours config
      );


      // Update status to PROCESSING now that messages are queued
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PROCESSING' }
      });

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
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
};

// Get messages for a campaign (with optional status filter)
const getCampaignMessages = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status, limit = 100 } = req.query;

    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const where = { campaignId: id };
    if (status) where.status = status.toUpperCase();

    const messages = await prisma.message.findMany({
      where,
      select: { recipientNumber: true, status: true, failReason: true, sentAt: true },
      take: parseInt(limit),
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
      select: { recipientNumber: true, status: true, failReason: true, sentAt: true }
    });

    const lines = ['number,status,failReason,sentAt'];
    messages.forEach(m => {
      lines.push(`${m.recipientNumber},${m.status},"${m.failReason || ''}",${m.sentAt || ''}`);
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
    const { message, messages } = req.body;

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
      data: {
        messageTemplate: messageList[0] // Update primary display
      }
    });

    // 2. Update Message Templates
    // First delete old ones, then create new ones
    await prisma.messageTemplate.deleteMany({ where: { campaignId: id } });
    await prisma.messageTemplate.createMany({
      data: messageList.map((content, index) => ({
        campaignId: id,
        content,
        orderIndex: index
      }))
    });

    // 3. Regenerate Pending Messages
    // Fetch all pending messages for this campaign
    const pendingMessages = await prisma.message.findMany({
      where: { campaignId: id, status: 'pending' }
    });

    console.log(`[Campaign] Regenerating ${pendingMessages.length} pending messages for campaign ${id}`);

    // Update each message with new template (Round Robin)
    // We use a transaction or parallel promises
    const updatePromises = pendingMessages.map(async (msg, index) => {
      // Determine new template
      const templateIndex = index % messageList.length;
      let newText = messageList[templateIndex];

      // Re-interpolate variables if they exist
      if (msg.variables) {
        // msg.variables is Json type
        const vars = msg.variables;
        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'gi');
          newText = newText.replace(regex, vars[key] || '');
        });
      }

      // Return the update query preserving the original newText

      return prisma.message.update({
        where: { id: msg.id },
        data: { messageText: newText }
      });
    });

    await Promise.all(updatePromises);

    res.json({
      message: `Campaign updated. ${pendingMessages.length} pending messages regenerated.`
    });

  } catch (error) {
    console.error('Update Campaign Error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignMessages,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
  getActiveCampaigns,
  exportCampaignContacts,
  previewSheet,
  updateCampaign
};
