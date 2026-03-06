const express = require('express');
const evolutionApi = require('../services/evolutionApi');
const prisma = require('../config/database');

const router = express.Router();

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
        // For messenger/instagram, status is always 'connected' for now
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
      // Messenger/Instagram handled manually via Meta tokens
      if (!phoneNumberId || !accessToken) {
        return res.status(400).json({ error: 'Page ID and Access Token are required for this channel type' });
      }

      instance = await prisma.instance.create({
        data: {
          tenantId: req.tenantId,
          instanceName,
          channelType,
          phoneNumberId,
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
