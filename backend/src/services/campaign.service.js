const prisma = require('../config/database');
const storageService = require('./storageService');
const queueService = require('./queueService');
const { resolveTenantPlanByTenant } = require('./planLimit.service');

class CampaignService {
  /**
   * Filter contacts based on tenant plan limits and blacklisted (opt-out) status
   */
  async enforceLimitsAndFilter(contacts, tenant) {
    const plan = await resolveTenantPlanByTenant(tenant);
    if (plan && contacts.length > plan.maxContactsPerCampaign) {
      const error = new Error(`Contact list exceeds your plan limit of ${plan.maxContactsPerCampaign} contacts per campaign. Please upgrade your plan or reduce the contact list.`);
      error.status = 402;
      error.data = { limit: plan.maxContactsPerCampaign, requested: contacts.length };
      throw error;
    }

    const phoneNumbers = contacts.map(c => c.number);
    const blacklistedContacts = await prisma.contact.findMany({
      where: { tenantId: tenant.id, phoneNumber: { in: phoneNumbers }, blacklisted: true },
      select: { phoneNumber: true }
    });
    
    const blacklistedSet = new Set(blacklistedContacts.map(c => c.phoneNumber));
    const filteredContacts = contacts.filter(c => !blacklistedSet.has(c.number));
    
    if (blacklistedSet.size > 0) {
      console.log(`[CampaignService] Filtered out ${blacklistedSet.size} blacklisted contact(s) from campaign.`);
    }

    if (filteredContacts.length === 0) {
      const error = new Error('All provided contacts have opted out of marketing messages.');
      error.status = 400;
      throw error;
    }

    return { filteredContacts, plan };
  }

  /**
   * Handle media upload to storage service
   */
  async processMedia(file) {
    if (!file) return { mediaUrl: null, mediaType: null };
    
    const mediaUrl = await storageService.uploadFile(file);
    let mediaType = 'document';
    if (file.mimetype.startsWith('image/')) mediaType = 'image';
    else if (file.mimetype.startsWith('video/')) mediaType = 'video';
    
    return { mediaUrl, mediaType };
  }

  /**
   * Create Campaign, Instances, and Templates in DB
   */
  async createCampaignRecord({
    name, type, targetConfig, messageList, contactsCount, delayMin, delayMax,
    instanceSwitchCount, messageRotationCount, scheduledAt, endAt, 
    mediaUrl, mediaType, tenantId, instances, segmentId
  }) {
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const campaignStatus = isScheduled ? 'SCHEDULED' : 'PENDING';

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        targetConfig: type === 'retargeting' ? (targetConfig || null) : null,
        messageTemplate: messageList[0],
        status: campaignStatus,
        totalContacts: contactsCount,
        delayMin: parseInt(delayMin),
        delayMax: parseInt(delayMax),
        instanceSwitchCount: parseInt(instanceSwitchCount),
        messageRotationCount: parseInt(messageRotationCount),
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        mediaUrl,
        mediaType,
        tenantId,
        savedSegmentId: segmentId || null
      }
    });

    if (instances && instances.length > 0) {
      await prisma.campaignInstance.createMany({
        data: instances.map((instance, index) => ({
          campaignId: campaign.id,
          instanceId: instance.id,
          orderIndex: index
        }))
      });
    }

    if (messageList && messageList.length > 0) {
      await prisma.messageTemplate.createMany({
        data: messageList.map((content, index) => ({
          campaignId: campaign.id,
          content,
          orderIndex: index
        }))
      });
    }

    return { campaign, isScheduled };
  }

  /**
   * Generates pending message records for scheduled campaigns 
   * (so they can be picked up by the cron scheduler later)
   */
  async scheduleMessages(campaign, instances, contacts, messageList, mediaUrl, mediaType, type, tenantId) {
    const instanceList = Array.isArray(instances) ? instances : [instances];
    const templates = Array.isArray(messageList) ? messageList : [messageList];

    let failedCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const instanceIndex = Math.floor(i / parseInt(campaign.instanceSwitchCount)) % instanceList.length;
      let currentInstance = instanceList[instanceIndex];
      
      if (type === 'retargeting' && contact.source) {
        const mappedChannel = String(contact.source).toLowerCase() === 'system' ? 'whatsapp' : String(contact.source).toLowerCase();
        const matchedInstance = instanceList.find(inst => String(inst.channelType).toLowerCase() === mappedChannel);
        if (matchedInstance) {
          currentInstance = matchedInstance;
        } else {
           console.log(`[Retargeting] Skipping contact ${contact.number} due to missing connected instance for channel ${mappedChannel}`);
           await prisma.message.create({
            data: {
              campaignId: campaign.id,
              status: 'FAILED',
              failReason: `No connected instance for channel ${mappedChannel}`,
              recipientNumber: contact.number,
              tenantId,
              mediaUrl,
              mediaType,
              variables: contact.variables || null
            }
          });
          failedCount++;
          continue;
        }
      }

      const templateIndex = Math.floor(i / parseInt(campaign.messageRotationCount)) % templates.length;
      let currentMessage = templates[templateIndex];

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

      await prisma.message.create({
        data: {
          campaignId: campaign.id,
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
    }

    if (failedCount > 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { failedCount: { increment: failedCount } }
      });
    }
  }

  /**
   * Helper to fetch campaigns with common includes
   */
  async getCampaignsByTenant(tenantId, options = {}) {
    return prisma.campaign.findMany({
      where: { tenantId, ...options.where },
      include: {
        instances: { include: { instance: true } },
        templates: true,
        ...options.include
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new CampaignService();
