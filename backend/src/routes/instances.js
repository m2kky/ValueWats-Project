const express = require('express');
const evolutionApi = require('../services/evolutionApi');
const prisma = require('../config/database');

const router = express.Router();

/**
 * GET /api/instances - List all instances for tenant
 * Syncs status from Evolution API for each instance
 */
router.get('/', async (req, res) => {
  try {
    const instances = await prisma.instance.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Sync status from Evolution API for each instance
    const syncedInstances = await Promise.all(
      instances.map(async (instance) => {
        try {
          const status = await evolutionApi.getInstanceStatus(instance.instanceName);
          const newStatus = status.state === 'open' ? 'connected' : 
                           status.state === 'connecting' ? 'qr_pending' : 'disconnected';
          
          // Update in DB if status changed
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
    const fs = require('fs');
    fs.appendFileSync('route_debug.log', `[${new Date().toISOString()}] POST /instances called\n`);
    fs.appendFileSync('route_debug.log', `Body: ${JSON.stringify(req.body)}\n`);
    fs.appendFileSync('route_debug.log', `TenantID: ${req.tenantId}\n`);
    
    const { instanceName } = req.body;

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

    const instance = await evolutionApi.createInstance(req.tenantId, instanceName);

    res.status(201).json({
      message: 'Instance created successfully',
      instance,
    });
  } catch (error) {
    const fs = require('fs');
    fs.appendFileSync('route_debug.log', `[${new Date().toISOString()}] ERROR: ${error.message}\nStack: ${error.stack}\n`);
    console.error('Create instance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instances/:id/status - Get instance status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const status = await evolutionApi.getInstanceStatus(instance.instanceName);

    // Update status in database
    await prisma.instance.update({
      where: { id: instance.id },
      data: {
        status: status.state === 'open' ? 'connected' : 'disconnected',
      },
    });

    res.json({ status });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get instance status' });
  }
});

/**
 * DELETE /api/instances/:id - Delete instance
 */
router.delete('/:id', async (req, res) => {
  try {
    const instance = await prisma.instance.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Delete from Evolution API
    await evolutionApi.deleteInstance(instance.instanceName);

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
 * POST /api/instances/:id/send - Send single message
 */
router.post('/:id/send', async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ error: 'Number and message are required' });
    }

    const instance = await prisma.instance.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({ error: 'Instance is not connected' });
    }

    const result = await evolutionApi.sendMessage(
      req.tenantId,
      instance.instanceName,
      number,
      message
    );

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
