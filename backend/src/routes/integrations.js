const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration.service');
const prisma = require('@prisma/client').PrismaClient;
const checkPermission = require('../middleware/checkPermission');
const { createSallaIntegrationRouter } = require('../stores/providers/salla/sallaIntegration.routes');
// Instantiate prisma for direct queries in controller logic if needed, 
// though we should move logic to service. 
// reusing existing services where possible.

// --- INTEGRATIONS ---

router.use('/salla', createSallaIntegrationRouter());

router.get('/', async (req, res) => {
  try {
    const integrations = await integrationService.listIntegrations(req.user.tenantId);
    res.json({ integrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, name, credentials } = req.body;
    if (/^store_/.test(type || '')) {
      return res.status(400).json({ error: 'Store integrations must use provider authorization', code: 'RESERVED_INTEGRATION_TYPE' });
    }
    const integration = await integrationService.upsertIntegration(
      req.user.tenantId,
      type,
      name,
      credentials // JSON string or object? frontend should send object, service encrypts
    );
    res.json({ integration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('integrations.manage'), async (req, res) => {
  try {
    const db = req.app.locals.dependencies?.prisma || require('../config/database');
    const integration = await db.integration.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }, select: { type: true }
    });
    if (!integration) return res.status(404).json({ error: 'Integration not found' });
    if (/^store_/.test(integration.type)) {
      return res.status(400).json({ error: 'Store integrations must use provider deletion', code: 'RESERVED_INTEGRATION_TYPE' });
    }
    const deleted = await db.integration.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId, type: integration.type }
    });
    if (deleted.count !== 1) return res.status(404).json({ error: 'Integration not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/google/auth-url', async (req, res) => {
  try {
    const { name, clientId, clientSecret, redirectUri, type } = req.body;
    if (!['google_sheets_oauth', 'google_calendar_oauth', 'google_drive_oauth'].includes(type)) {
      return res.status(400).json({ error: 'Unsupported Google integration type' });
    }
    if (!clientId || !clientSecret || !redirectUri) {
       return res.status(400).json({ error: 'Missing OAuth parameters' });
    }
    const result = await integrationService.createOAuthPending(
      req.user.tenantId,
      name || 'Google Connection',
      clientId,
      clientSecret,
      redirectUri,
      type
    );
    res.json(result); // { authUrl }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notion/auth-url', async (req, res) => {
  try {
    const result = await integrationService.createNotionOAuthPending(req.user.tenantId);
    res.json(result); // { authUrl }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WORKFLOWS ---

router.get('/workflows', async (req, res) => {
  try {
    const db = new prisma();
    const workflows = await db.workflow.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { executions: true } }
      }
    });
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflows', async (req, res) => {
  try {
    const db = new prisma();
    const { name, description, triggerType, triggerConfig, steps } = req.body;
    
    const workflow = await db.workflow.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        description,
        triggerType,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
        steps: JSON.stringify(steps), // array
        isActive: true
      }
    });
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/workflows/:id', async (req, res) => {
  try {
    const db = new prisma();
    const { name, description, steps, isActive } = req.body;
    
    const workflow = await db.workflow.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(steps && { steps: JSON.stringify(steps) }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/workflows/:id', async (req, res) => {
  try {
    const db = new prisma();
    await db.workflow.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
