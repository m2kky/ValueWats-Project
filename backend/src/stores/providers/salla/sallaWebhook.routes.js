const express = require('express');
const { verifySallaSignature } = require('./sallaWebhookSecurity');

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
const KNOWN_EVENTS = new Set([...REFRESH_EVENTS, 'product.deleted', 'app.uninstalled']);

function identifier(value) {
  if (!['string', 'number'].includes(typeof value)) return null;
  const result = String(value).trim();
  return result && result.length <= 128 ? result : null;
}

function createSallaWebhookRouter({ prisma, queues, sallaWebhookSecret = process.env.SALLA_WEBHOOK_SECRET } = {}) {
  const router = express.Router();
  const queue = queues?.storeSync;

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
    } catch (_) {
      log('error', 'SALLA_WEBHOOK_PROCESSING_FAILED');
      return res.status(503).json({ error: 'SALLA_WEBHOOK_PROCESSING_FAILED' });
    }
  });

  return router;
}

module.exports = { createSallaWebhookRouter };
