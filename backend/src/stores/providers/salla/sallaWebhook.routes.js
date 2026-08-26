const express = require('express');
const { verifySallaSignature } = require('./sallaWebhookSecurity');
const { createSallaEasyModeService } = require('./sallaEasyModeService');

const REFRESH_EVENTS = new Set([
  'product.created',
  'product.price.updated',
  'product.status.updated',
  'product.image.updated',
  'product.category.updated',
  'product.brand.updated',
  'product.tags.updated',
  'product.quantity.low'
]);
const APP_EVENTS = new Set(['app.store.authorize', 'app.settings.updated', 'app.uninstalled']);
const KNOWN_EVENTS = new Set([...REFRESH_EVENTS, 'product.deleted', ...APP_EVENTS]);
const CLIENT_EVENT_ERRORS = new Set([
  'SALLA_INVALID_AUTHORIZATION_EVENT',
  'SALLA_REQUIRED_SCOPE_MISSING'
]);

function identifier(value) {
  if (!['string', 'number'].includes(typeof value)) return null;
  const result = String(value).trim();
  return result && result.length <= 128 ? result : null;
}

function createSallaWebhookRouter({
  prisma,
  queues,
  sallaEasyModeService,
  sallaAuthMode = process.env.SALLA_AUTH_MODE || 'custom',
  sallaWebhookSecret = process.env.SALLA_WEBHOOK_SECRET
} = {}) {
  const router = express.Router();
  const queue = queues?.storeSync;
  const easyMode = String(sallaAuthMode).trim().toLowerCase() === 'easy';
  const easyService = sallaEasyModeService || createSallaEasyModeService({ prisma, queue });

  router.post('/', async (req, res) => {
    const startedAt = Date.now();
    let event;
    let merchantId;
    const log = (outcome, errorCode) => console.info('store.salla.webhook', {
      ...(event ? { event } : {}),
      ...(merchantId ? { merchantId } : {}),
      outcome,
      durationMs: Date.now() - startedAt,
      ...(errorCode ? { errorCode } : {})
    });

    if (!sallaWebhookSecret) {
      log('rejected', 'SALLA_NOT_CONFIGURED');
      return res.status(503).json({ error: 'SALLA_NOT_CONFIGURED' });
    }

    if (!verifySallaSignature({
      rawBody: req.body,
      signature: req.get('x-salla-signature'),
      secret: sallaWebhookSecret
    })) {
      log('rejected', 'INVALID_SALLA_SIGNATURE');
      return res.status(401).json({ error: 'INVALID_SALLA_SIGNATURE' });
    }

    let body;
    try {
      body = JSON.parse(req.body.toString('utf8'));
      event = typeof body?.event === 'string' && body.event.length <= 128 ? body.event : null;
      merchantId = identifier(body?.merchant);
      if (!event || !merchantId) throw new TypeError('Invalid Salla webhook body');
    } catch (_) {
      log('rejected', 'INVALID_SALLA_BODY');
      return res.status(400).json({ error: 'INVALID_SALLA_BODY' });
    }

    if (!KNOWN_EVENTS.has(event)) {
      log('ignored');
      return res.sendStatus(202);
    }

    try {
      if (easyMode && event === 'app.store.authorize') {
        await easyService.handleAuthorization({ merchantId, data: body.data });
        log('accepted');
        return res.sendStatus(202);
      }
      if (easyMode && event === 'app.settings.updated') {
        await easyService.handleSettingsUpdated({ merchantId, settings: body.data?.settings });
        log('accepted');
        return res.sendStatus(202);
      }
      if (easyMode && event === 'app.uninstalled') {
        await easyService.handleUninstalled({ merchantId });
        log('accepted');
        return res.sendStatus(202);
      }
      if (APP_EVENTS.has(event) && event !== 'app.uninstalled') {
        log('ignored');
        return res.sendStatus(202);
      }

      const integration = await prisma.integration.findFirst({
        where: { type: 'store_salla', externalAccountId: merchantId }
      });
      if (!integration || (event !== 'app.uninstalled' && integration.status !== 'active')) {
        log('ignored', 'STORE_INTEGRATION_NOT_FOUND');
        return res.sendStatus(202);
      }

      if (event === 'app.uninstalled') {
        await prisma.integration.update({ where: { id: integration.id }, data: { status: 'revoked' } });
      } else {
        const productId = identifier(body?.data?.id);
        if (!productId) {
          log('rejected', 'INVALID_SALLA_BODY');
          return res.status(400).json({ error: 'INVALID_SALLA_BODY' });
        }
        const input = { tenantId: integration.tenantId, integrationId: integration.id, merchantId, productId };
        if (event === 'product.deleted') await queue.enqueueDelete(input);
        else await queue.enqueueProductRefresh(input);
      }
      log('accepted');
      return res.sendStatus(202);
    } catch (error) {
      if (CLIENT_EVENT_ERRORS.has(error?.code)) {
        log('rejected', error.code);
        return res.status(400).json({ error: error.code });
      }
      log('error', 'SALLA_WEBHOOK_PROCESSING_FAILED');
      return res.status(503).json({ error: 'SALLA_WEBHOOK_PROCESSING_FAILED' });
    }
  });

  return router;
}

module.exports = { createSallaWebhookRouter };
