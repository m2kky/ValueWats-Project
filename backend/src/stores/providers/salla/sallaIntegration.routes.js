const express = require('express');
const checkPermission = require('../../../middleware/checkPermission');
const { createSallaOAuthService } = require('./sallaOAuthService');
const { createSallaEasyModeService } = require('./sallaEasyModeService');
const { createStoreOAuthVerifier } = require('../../storeOAuthState');
const { createSallaPublicService } = require('./sallaPublicService');

function setVerifierCookie(res, result) {
  if (!result.authUrl) return;
  const state = new URL(result.authUrl).searchParams.get('state');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `salla_oauth_verifier=${createStoreOAuthVerifier(state)}; Max-Age=600; Path=/api/oauth/salla/callback; HttpOnly; SameSite=Lax${secure}`);
}

function createSallaIntegrationRouter() {
  const router = express.Router();
  const dependencies = (req) => req.app.locals.dependencies || {};
  const context = (req) => {
    const values = dependencies(req);
    const prisma = values.prisma || require('../../../config/database');
    const queue = values.queues?.storeSync;
    return {
      prisma,
      queue,
      easyMode: String(values.sallaAuthMode || process.env.SALLA_AUTH_MODE || 'custom').trim().toLowerCase() === 'easy',
      sallaOAuthService: values.sallaOAuthService || createSallaOAuthService({
        prisma, queue, clock: values.clock
      }),
      sallaEasyModeService: values.sallaEasyModeService || createSallaEasyModeService({
        prisma, queue, clock: values.clock
      }),
      sallaPublicService: values.sallaPublicService || createSallaPublicService({ prisma, queue })
    };
  };

  router.post('/auth-url', checkPermission('integrations.manage'), async (req, res) => {
    try {
      const values = context(req);
      const result = values.easyMode
        ? await values.sallaEasyModeService.createConnection({ tenantId: req.user.tenantId })
        : await values.sallaOAuthService.createAuthUrl({ tenantId: req.user.tenantId });
      setVerifierCookie(res, result);
      res.json(result);
    } catch (error) {
      const unavailable = ['SALLA_NOT_CONFIGURED', 'SALLA_EASY_MODE_NOT_CONFIGURED'].includes(error.code);
      res.status(unavailable ? 503 : 500).json({ error: error.code || 'SALLA_OAUTH_FAILED' });
    }
  });

  router.post('/public', checkPermission('integrations.manage'), async (req, res) => {
    try {
      const { sallaPublicService } = context(req);
      const result = await sallaPublicService.connect({
        tenantId: req.user.tenantId,
        name: req.body?.name,
        storeUrl: req.body?.storeUrl
      });
      res.status(201).json(result);
    } catch (error) {
      const clientError = [
        'SALLA_PUBLIC_STORE_URL_INVALID',
        'SALLA_PUBLIC_STORE_UNREACHABLE',
        'SALLA_PUBLIC_STORE_NOT_DETECTED'
      ].includes(error.code);
      res.status(clientError ? 400 : 500).json({ error: error.code || 'SALLA_PUBLIC_STORE_CONNECT_FAILED' });
    }
  });

  router.post('/:id/sync', checkPermission('integrations.manage'), async (req, res) => {
    const { prisma, queue } = context(req);
    const integration = await prisma.integration.findFirst({ where: { id: req.params.id, tenantId: req.user.tenantId, type: 'store_salla' } });
    if (!integration) return res.status(404).json({ error: 'STORE_INTEGRATION_NOT_FOUND' });
    const where = { id: integration.id, tenantId: req.user.tenantId, type: 'store_salla' };
    const activated = integration.status === 'error';
    if (activated) {
      const updated = await prisma.integration.updateMany({ where: { ...where, status: 'error' }, data: { status: 'active' } });
      if (updated.count !== 1) return res.status(404).json({ error: 'STORE_INTEGRATION_NOT_FOUND' });
    }
    try {
      await queue.enqueueFullSync({ tenantId: req.user.tenantId, integrationId: integration.id });
      res.status(202).json({ success: true });
    } catch (_) {
      if (activated) await prisma.integration.updateMany({ where: { ...where, status: 'active' }, data: { status: 'error' } });
      res.status(503).json({ error: 'STORE_SYNC_UNAVAILABLE' });
    }
  });

  router.post('/:id/reconnect', checkPermission('integrations.manage'), async (req, res) => {
    try {
      const values = context(req);
      const input = { tenantId: req.user.tenantId, integrationId: req.params.id };
      const result = values.easyMode
        ? await values.sallaEasyModeService.reconnect(input)
        : await values.sallaOAuthService.reconnect(input);
      setVerifierCookie(res, result);
      res.json(result);
    } catch (error) {
      const unavailable = ['SALLA_NOT_CONFIGURED', 'SALLA_EASY_MODE_NOT_CONFIGURED'].includes(error.code);
      const status = error.code === 'STORE_INTEGRATION_NOT_FOUND' ? 404 : unavailable ? 503 : 500;
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
