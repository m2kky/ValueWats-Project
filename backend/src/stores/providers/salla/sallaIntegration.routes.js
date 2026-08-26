const express = require('express');
const checkPermission = require('../../../middleware/checkPermission');
const { createSallaOAuthService } = require('./sallaOAuthService');

function createSallaIntegrationRouter() {
  const router = express.Router();
  const dependencies = (req) => req.app.locals.dependencies || {};
  const context = (req) => {
    const values = dependencies(req);
    return {
      prisma: values.prisma || require('../../../config/database'),
      queue: values.queues?.storeSync,
      sallaOAuthService: values.sallaOAuthService || createSallaOAuthService({
        prisma: values.prisma || require('../../../config/database'), queue: values.queues?.storeSync, clock: values.clock
      })
    };
  };

  router.post('/auth-url', checkPermission('integrations.manage'), async (req, res) => {
    try {
      res.json(await context(req).sallaOAuthService.createAuthUrl({ tenantId: req.user.tenantId }));
    } catch (error) {
      res.status(error.code === 'SALLA_NOT_CONFIGURED' ? 503 : 500).json({ error: error.code || 'SALLA_OAUTH_FAILED' });
    }
  });

  router.post('/:id/sync', checkPermission('integrations.manage'), async (req, res) => {
    const { prisma, queue } = context(req);
    const integration = await prisma.integration.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId, type: 'store_salla' } });
    if (!integration) return res.status(404).json({ error: 'STORE_INTEGRATION_NOT_FOUND' });
    try {
      await queue.enqueueFullSync({ tenantId: req.user.tenantId, integrationId: integration.id });
      res.status(202).json({ success: true });
    } catch (_) {
      res.status(503).json({ error: 'STORE_SYNC_UNAVAILABLE' });
    }
  });

  router.post('/:id/reconnect', checkPermission('integrations.manage'), async (req, res) => {
    try {
      res.json(await context(req).sallaOAuthService.reconnect({ tenantId: req.user.tenantId, integrationId: req.params.id }));
    } catch (error) {
      const status = error.code === 'STORE_INTEGRATION_NOT_FOUND' ? 404 : error.code === 'SALLA_NOT_CONFIGURED' ? 503 : 500;
      res.status(status).json({ error: error.code || 'SALLA_OAUTH_FAILED' });
    }
  });

  router.delete('/:id', checkPermission('integrations.manage'), async (req, res) => {
    const { prisma } = context(req);
    const deleted = await prisma.integration.deleteMany({ where: { id: req.params.id, tenantId: req.user.tenantId, type: 'store_salla' } });
    if (deleted.count !== 1) return res.status(404).json({ error: 'STORE_INTEGRATION_NOT_FOUND' });
    res.json({ success: true });
  });

  return router;
}

module.exports = { createSallaIntegrationRouter };
