const express = require('express');
const axios = require('axios');
const evolutionApi = require('../services/evolutionApi');
const metaApi = require('../services/metaApi');
const {
  getChannelConfig,
  saveChannelConfig,
  sanitizeChannelConfig,
  DEFAULT_CHANNEL_CONFIG
} = require('../services/channelConfig.service');
const prisma = require('../config/database');

const router = express.Router();
const META_API_VERSION = process.env.META_API_VERSION || 'v20.0';
const FB_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const resolveTenantPlan = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  if (!tenant) return { tenant: null, plan: null };
  if (tenant.plan) return { tenant, plan: tenant.plan };
  if (!tenant.subscriptionPlan) return { tenant, plan: null };

  const fallbackPlan = await prisma.plan.findUnique({
    where: { name: tenant.subscriptionPlan }
  });

  return { tenant, plan: fallbackPlan || null };
};

const enforceInstanceLimit = async (tenantId) => {
  const { plan } = await resolveTenantPlan(tenantId);
  if (!plan) return;

  const existingInstancesCount = await prisma.instance.count({
    where: { tenantId }
  });

  if (existingInstancesCount >= plan.maxInstances) {
    const err = new Error(`You reached your plan limit (${plan.maxInstances}) for connected channels. Please upgrade your plan to add more channels.`);
    err.status = 402;
    err.payload = {
      error: err.message,
      limit: plan.maxInstances,
      current: existingInstancesCount
    };
    throw err;
  }
};

const ensureUniqueInstanceName = async (tenantId, preferredName) => {
  const baseName = (preferredName || 'Meta Channel').trim().slice(0, 120);
  let candidate = baseName || 'Meta Channel';
  let suffix = 2;

  while (true) {
    const existing = await prisma.instance.findFirst({
      where: { tenantId, instanceName: candidate },
      select: { id: true }
    });
    if (!existing) return candidate;
    candidate = `${baseName} (${suffix})`;
    suffix += 1;
  }
};

const subscribeMetaPage = async ({ pageId, pageAccessToken, channelType }) => {
  if (!pageId || !pageAccessToken) return;

  const subscribedFields = channelType === 'instagram'
    ? 'messages,messaging_postbacks,messaging_referrals'
    : 'messages,messaging_postbacks,messaging_referrals,message_reads,message_deliveries,feed';

  try {
    await axios.post(`${FB_BASE}/${pageId}/subscribed_apps`, null, {
      params: {
        subscribed_fields: subscribedFields,
        access_token: pageAccessToken
      }
    });
  } catch (err) {
    console.warn(
      `[Meta] Failed to subscribe page ${pageId} for ${channelType}:`,
      err.response?.data?.error?.message || err.message
    );
  }
};

const getMetaPagesFromUserToken = async (userAccessToken) => {
  const response = await axios.get(`${FB_BASE}/me/accounts`, {
    params: {
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      access_token: userAccessToken
    }
  });

  const pages = response.data?.data || [];
  return pages.map((page) => ({
    pageId: String(page.id),
    pageName: page.name || `Page ${page.id}`,
    pageAccessToken: page.access_token || null,
    instagramId: page.instagram_business_account?.id
      ? String(page.instagram_business_account.id)
      : null,
    instagramUsername: page.instagram_business_account?.username || null
  }));
};

const getTenantInstanceById = async (tenantId, instanceId) => {
  return prisma.instance.findFirst({
    where: { id: instanceId, tenantId }
  });
};

/**
 * POST /api/instances/meta/embedded
 * Connect Messenger / Instagram via Meta Embedded Signup (no manual token input)
 */
router.post('/meta/embedded', async (req, res) => {
  try {
    const { channelType, userAccessToken, selectedPageId, instanceName } = req.body;

    if (!['messenger', 'instagram'].includes(channelType)) {
      return res.status(400).json({ error: 'channelType must be messenger or instagram' });
    }

    if (!userAccessToken) {
      return res.status(400).json({ error: 'userAccessToken is required' });
    }

    await enforceInstanceLimit(req.tenantId);

    const pages = await getMetaPagesFromUserToken(userAccessToken);
    const eligiblePages = pages.filter((page) => {
      if (!page.pageAccessToken) return false;
      if (channelType === 'instagram') return Boolean(page.instagramId);
      return true;
    });

    if (!eligiblePages.length) {
      return res.status(400).json({
        error: channelType === 'instagram'
          ? 'No Instagram Professional account linked to your pages was found.'
          : 'No eligible Facebook pages were found for this account.'
      });
    }

    if (!selectedPageId && eligiblePages.length > 1) {
      return res.status(409).json({
        code: 'MULTIPLE_PAGES',
        error: 'Multiple pages found. Please choose the page to connect.',
        pages: eligiblePages.map((page) => ({
          pageId: page.pageId,
          pageName: page.pageName,
          instagramId: page.instagramId,
          instagramUsername: page.instagramUsername
        }))
      });
    }

    const chosenPage = selectedPageId
      ? eligiblePages.find((page) => page.pageId === String(selectedPageId))
      : eligiblePages[0];

    if (!chosenPage) {
      return res.status(400).json({ error: 'Selected page not found in your Meta account.' });
    }

    const identifier = channelType === 'instagram'
      ? chosenPage.instagramId
      : chosenPage.pageId;

    if (!identifier) {
      return res.status(400).json({
        error: 'Selected page is missing the required identifier for this channel.'
      });
    }

    const alreadyConnected = await prisma.instance.findFirst({
      where: {
        tenantId: req.tenantId,
        channelType,
        phoneNumberId: String(identifier)
      }
    });

    if (alreadyConnected) {
      return res.json({
        message: 'This channel is already connected.',
        alreadyConnected: true,
        instance: alreadyConnected
      });
    }

    const defaultName = channelType === 'instagram'
      ? `Instagram ${chosenPage.instagramUsername ? `@${chosenPage.instagramUsername}` : chosenPage.pageName}`
      : `Messenger ${chosenPage.pageName}`;

    const uniqueName = await ensureUniqueInstanceName(req.tenantId, instanceName || defaultName);

    const instance = await prisma.instance.create({
      data: {
        tenantId: req.tenantId,
        channelType,
        instanceName: uniqueName,
        phoneNumberId: String(identifier),
        phoneNumber: channelType === 'instagram' ? chosenPage.pageId : null,
        accessToken: chosenPage.pageAccessToken,
        status: 'connected'
      }
    });

    await subscribeMetaPage({
      pageId: chosenPage.pageId,
      pageAccessToken: chosenPage.pageAccessToken,
      channelType
    });

    res.status(201).json({
      message: `${channelType === 'instagram' ? 'Instagram' : 'Messenger'} connected successfully via Embedded Signup.`,
      instance,
      connectedAsset: {
        pageId: chosenPage.pageId,
        pageName: chosenPage.pageName,
        instagramId: chosenPage.instagramId,
        instagramUsername: chosenPage.instagramUsername
      }
    });
  } catch (error) {
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }

    console.error('Meta embedded connect error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to connect via Meta Embedded Signup' });
  }
});

/**
 * GET /api/instances - List all instances for tenant
 * Syncs status from Evolution API for WhatsApp instances
 */
router.get('/', async (req, res) => {
  try {
    const instances = await prisma.instance.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Sync status for each instance
    const syncedInstances = await Promise.all(
      instances.map(async (instance) => {
        const channelType = instance.channelType || 'whatsapp';
        
        if (channelType === 'whatsapp') {
          try {
            const status = await evolutionApi.getInstanceStatus(instance.instanceName);
            const state = status?.instance?.state || status?.state || 'disconnected';
            const newStatus = state === 'open' ? 'connected' : 
                             state === 'connecting' ? 'qr_pending' : 'disconnected';
            
            if (instance.status !== newStatus) {
              await prisma.instance.update({
                where: { id: instance.id },
                data: { status: newStatus }
              });
              instance.status = newStatus;
            }
          } catch (err) {
            console.log(`Could not sync status for ${instance.instanceName}:`, err.message);
            // Default to disconnected if API is unreachable
            if (instance.status !== 'disconnected') {
              await prisma.instance.update({
                where: { id: instance.id },
                data: { status: 'disconnected' }
              });
              instance.status = 'disconnected';
            }
          }
        }
        // For messenger/instagram/whatsapp_cloud, status is always 'connected' for now
        return instance;
      })
    );

    res.json({ instances: syncedInstances });
  } catch (error) {
    console.error('List instances error:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

/**
 * POST /api/instances - Create new instance
 */
router.post('/', async (req, res) => {
  try {
    const { instanceName, channelType = 'whatsapp', phoneNumberId, accessToken } = req.body;

    if (!instanceName) {
      return res.status(400).json({ error: 'Instance name is required' });
    }

    await enforceInstanceLimit(req.tenantId);

    // Check if instance name already exists for this tenant
    const existing = await prisma.instance.findFirst({
      where: {
        tenantId: req.tenantId,
        instanceName,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Instance name already exists' });
    }

    let instance;

    if (channelType === 'whatsapp') {
      // WhatsApp handled via Evolution API
      instance = await evolutionApi.createInstance(req.tenantId, instanceName);
    } else if (channelType === 'messenger' || channelType === 'instagram') {
      return res.status(400).json({
        error: `${channelType} must be connected using Meta Embedded Signup.`,
        code: 'USE_META_EMBEDDED_SIGNUP'
      });
    } else if (channelType === 'whatsapp_cloud') {
      if (!accessToken) {
        return res.status(400).json({ error: 'Access Token is required for WhatsApp Cloud API' });
      }

      if (!phoneNumberId) {
        return res.status(400).json({ error: 'Phone Number ID is required for WhatsApp Cloud API' });
      }

      instance = await prisma.instance.create({
        data: {
          tenantId: req.tenantId,
          instanceName,
          channelType,
          phoneNumberId: String(phoneNumberId),
          accessToken,
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid channel type' });
    }

    res.status(201).json({
      message: 'Instance created successfully',
      instance,
    });
  } catch (error) {
    console.error('Create instance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instances/:id/details - Get single instance details
 */
router.get('/:id/details', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    // Sync status for WhatsApp
    if ((instance.channelType || 'whatsapp') === 'whatsapp') {
      try {
        const status = await evolutionApi.getInstanceStatus(instance.instanceName);
        const state = status.instance?.state || status.state;
        const newStatus = state === 'open' ? 'connected' :
                         state === 'connecting' ? 'qr_pending' : 'disconnected';
        if (instance.status !== newStatus) {
          await prisma.instance.update({
            where: { id: instance.id },
            data: { status: newStatus }
          });
          instance.status = newStatus;
        }
      } catch (err) {
        console.log(`Could not sync status for ${instance.instanceName}:`, err.message);
      }
    }

    res.json({ instance });
  } catch (error) {
    console.error('Get instance details error:', error);
    res.status(500).json({ error: 'Failed to fetch instance details' });
  }
});

/**
 * GET /api/instances/:id/channel-config
 * Retrieve saved channel feature config (chat menu, private replies, templates)
 */
router.get('/:id/channel-config', async (req, res) => {
  try {
    const instance = await getTenantInstanceById(req.tenantId, req.params.id);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const config = await getChannelConfig({
      tenantId: req.tenantId,
      instanceId: instance.id
    });

    res.json({ config });
  } catch (error) {
    console.error('Get channel config error:', error);
    res.status(500).json({ error: 'Failed to load channel configuration' });
  }
});

/**
 * PUT /api/instances/:id/channel-config
 * Save channel feature config (chat menu, private replies, templates)
 */
router.put('/:id/channel-config', async (req, res) => {
  try {
    const instance = await getTenantInstanceById(req.tenantId, req.params.id);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const sanitized = sanitizeChannelConfig(req.body?.config || DEFAULT_CHANNEL_CONFIG);
    const config = await saveChannelConfig({
      tenantId: req.tenantId,
      instanceId: instance.id,
      config: sanitized
    });

    res.json({ message: 'Channel configuration saved', config });
  } catch (error) {
    console.error('Save channel config error:', error);
    res.status(400).json({ error: error.message || 'Failed to save channel configuration' });
  }
});

/**
 * POST /api/instances/:id/messenger/chat-menu/sync
 * Sync saved chat menu config to Meta Messenger Profile API
 */
router.post('/:id/messenger/chat-menu/sync', async (req, res) => {
  try {
    const instance = await getTenantInstanceById(req.tenantId, req.params.id);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });
    if (instance.channelType !== 'messenger') {
      return res.status(400).json({ error: 'Chat Menu is currently supported only for Messenger channels.' });
    }
    if (!instance.accessToken || !instance.phoneNumberId) {
      return res.status(400).json({ error: 'Messenger channel is missing required access token or page id.' });
    }

    const existingConfig = await getChannelConfig({ tenantId: req.tenantId, instanceId: instance.id });
    const incomingChatMenu = req.body?.chatMenu || existingConfig.chatMenu;
    const mergedConfig = sanitizeChannelConfig(
      {
        ...existingConfig,
        chatMenu: incomingChatMenu
      },
      { strictButtons: true }
    );

    const menu = mergedConfig.chatMenu;
    let metaResponse;

    if (!menu.enabled || menu.buttons.length === 0) {
      metaResponse = await metaApi.clearMessengerPersistentMenu(instance);
    } else {
      metaResponse = await metaApi.setMessengerPersistentMenu(instance, {
        locale: menu.locale,
        allowUserInput: menu.allowUserInput,
        buttons: menu.buttons
      });
    }

    await saveChannelConfig({
      tenantId: req.tenantId,
      instanceId: instance.id,
      config: mergedConfig
    });

    res.json({
      message: menu.enabled && menu.buttons.length > 0
        ? 'Messenger chat menu synced successfully.'
        : 'Messenger chat menu cleared successfully.',
      metaResponse,
      config: mergedConfig
    });
  } catch (error) {
    console.error('Sync messenger chat menu error:', error.response?.data || error.message);
    res.status(400).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to sync Messenger chat menu'
    });
  }
});

/**
 * POST /api/instances/:id/messenger/templates/send-test
 * Send a template test message to a PSID
 */
router.post('/:id/messenger/templates/send-test', async (req, res) => {
  try {
    const instance = await getTenantInstanceById(req.tenantId, req.params.id);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });
    if (instance.channelType !== 'messenger') {
      return res.status(400).json({ error: 'Template testing here is supported only for Messenger channels.' });
    }

    const recipientId = String(req.body?.recipientId || '').trim();
    const templatePayload = req.body?.templatePayload;

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId (PSID) is required.' });
    }

    if (!templatePayload || typeof templatePayload !== 'object') {
      return res.status(400).json({ error: 'templatePayload is required and must be a valid object.' });
    }

    if (!templatePayload.template_type) {
      return res.status(400).json({ error: 'templatePayload.template_type is required.' });
    }

    const result = await metaApi.sendMessengerTemplate(instance, recipientId, templatePayload);
    res.json({ message: 'Template sent successfully', result });
  } catch (error) {
    console.error('Send messenger template test error:', error.response?.data || error.message);
    res.status(400).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to send template test message'
    });
  }
});

/**
 * POST /api/instances/:id/messenger/private-replies/send
 * Send one private reply to a post or comment (manual test endpoint)
 */
router.post('/:id/messenger/private-replies/send', async (req, res) => {
  try {
    const instance = await getTenantInstanceById(req.tenantId, req.params.id);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });
    if (instance.channelType !== 'messenger') {
      return res.status(400).json({ error: 'Private Replies are currently supported only for Messenger channels.' });
    }

    const postId = String(req.body?.postId || '').trim();
    const commentId = String(req.body?.commentId || '').trim();
    const text = String(req.body?.text || '').trim();

    if (!text) return res.status(400).json({ error: 'Reply text is required.' });
    if (!postId && !commentId) {
      return res.status(400).json({ error: 'Either postId or commentId is required.' });
    }

    const result = await metaApi.sendMessengerPrivateReply(instance, { postId, commentId, text });
    res.json({ message: 'Private reply sent successfully', result });
  } catch (error) {
    console.error('Send private reply test error:', error.response?.data || error.message);
    res.status(400).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to send private reply'
    });
  }
});

/**
 * PATCH /api/instances/:id - Update instance name/settings
 */
router.patch('/:id', async (req, res) => {
  try {
    const { instanceName } = req.body;

    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const updateData = {};
    if (instanceName && instanceName !== instance.instanceName) {
      // Check for duplicate name
      const existing = await prisma.instance.findFirst({
        where: {
          tenantId: req.tenantId,
          instanceName,
          id: { not: instance.id }
        },
      });
      if (existing) {
        return res.status(409).json({ error: 'Instance name already exists' });
      }
      updateData.instanceName = instanceName;
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({ instance, message: 'No changes to save' });
    }

    const updated = await prisma.instance.update({
      where: { id: instance.id },
      data: updateData,
    });

    res.json({ instance: updated, message: 'Instance updated successfully' });
  } catch (error) {
    console.error('Update instance error:', error);
    res.status(500).json({ error: 'Failed to update instance' });
  }
});

/**
 * GET /api/instances/:id/status - Get instance status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const channelType = instance.channelType || 'whatsapp';

    if (channelType === 'whatsapp') {
      const status = await evolutionApi.getInstanceStatus(instance.instanceName);
      const newStatus = status.state === 'open' ? 'connected' : 'disconnected';

      await prisma.instance.update({
        where: { id: instance.id },
        data: { status: newStatus },
      });
      return res.json({ status });
    }

    // For non-whatsapp, assume connected
    res.json({ status: { state: 'open' } });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get instance status' });
  }
});

/**
 * GET /api/instances/:id/connect - Get QR code for existing instance
 */
router.get('/:id/connect', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    if (instance.channelType && instance.channelType !== 'whatsapp') {
      return res.status(400).json({ error: 'Connect with QR is only for WhatsApp' });
    }

    const qrCode = await evolutionApi.fetchQrCode(instance.instanceName);

    if (qrCode) {
      await prisma.instance.update({
        where: { id: instance.id },
        data: { qrCode }
      });
    }

    res.json({ qrCode });
  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

/**
 * POST /api/instances/:id/disconnect - Logout WhatsApp session
 */
router.post('/:id/disconnect', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    await evolutionApi.logoutInstance(instance.instanceName).catch(e => console.error('Evolution logout failed', e));
    await prisma.instance.update({ where: { id: instance.id }, data: { status: 'disconnected' } });
    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Disconnect instance error:', error);
    res.status(500).json({ error: 'Failed to disconnect instance' });
  }
});

/**
 * PATCH /api/instances/:id/toggle - Enable or disable an instance
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const newStatus = instance.status === 'disabled' ? 'disconnected' : 'disabled';
    const updated = await prisma.instance.update({
      where: { id: instance.id },
      data: { status: newStatus },
    });
    res.json({ instance: updated });
  } catch (error) {
    console.error('Toggle instance error:', error);
    res.status(500).json({ error: 'Failed to toggle instance' });
  }
});

/**
 * DELETE /api/instances/:id - Delete instance
 */
router.delete('/:id', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    // Delete from Evolution API only for WhatsApp
    if ((instance.channelType || 'whatsapp') === 'whatsapp') {
      await evolutionApi.deleteInstance(instance.instanceName).catch(e => console.error('Evolution delete failed', e));
    }

    // Delete from database
    await prisma.instance.delete({
      where: { id: instance.id },
    });

    res.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({ error: 'Failed to delete instance' });
  }
});

/**
 * POST /api/instances/:id/send - Send single message (Campaign/Direct)
 */
router.post('/:id/send', async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ error: 'Number and message are required' });
    }

    const instance = await prisma.instance.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });

    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    if (instance.status !== 'connected') {
      return res.status(400).json({ error: 'Instance is not connected' });
    }

    let result;
    const channelType = instance.channelType || 'whatsapp';

    if (channelType === 'whatsapp') {
      result = await evolutionApi.sendMessage(req.tenantId, instance.instanceName, number, message);
    } else {
      const metaApi = require('../services/metaApi');
      result = await metaApi.sendMetaMessage(instance, number, message);
    }

    res.json({
      message: 'Message sent successfully',
      result,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
