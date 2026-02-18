const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration.service');
const prisma = require('@prisma/client').PrismaClient;
// Instantiate prisma for direct queries in controller logic if needed, 
// though we should move logic to service. 
// reusing existing services where possible.

// --- INTEGRATIONS ---

router.get('/integrations', async (req, res) => {
  try {
    const integrations = await integrationService.listIntegrations(req.user.tenantId);
    res.json({ integrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/integrations', async (req, res) => {
  try {
    const { type, name, credentials } = req.body;
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

router.delete('/integrations/:id', async (req, res) => {
  try {
    const db = new prisma();
    await db.integration.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId } // Ensure ownership
    });
    res.json({ success: true });
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
