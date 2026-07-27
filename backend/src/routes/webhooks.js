const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');
const verifyWebhookContext = require('../middleware/verifyWebhookContext');
const { parseVerifiedMetaBody, verifyMetaSignature } = require('../meta/metaWebhookSecurity');

// Meta Cloud API webhook (public — verified by hub.challenge token)
router.get('/meta', verifyWebhook);
router.post('/meta', (req, res, next) => {
  if (!verifyMetaSignature({
    rawBody: req.body,
    signature: req.get('x-hub-signature-256'),
    appSecret: process.env.META_APP_SECRET
  })) {
    return res.status(401).json({ error: 'INVALID_META_SIGNATURE' });
  }

  try {
    req.body = parseVerifiedMetaBody(req);
    req.metaWebhookVerified = true;
  } catch (_) {
    return res.status(400).json({ error: 'INVALID_META_BODY' });
  }
  return next();
}, handleMetaWebhook);

// Evolution API webhooks
// Webhook routes are PUBLIC per rules.md
router.post('/whatsapp', webhookController.handleIncomingMessage);
router.post('/evolution', webhookController.handleIncomingMessage);
router.post('/receive', webhookController.handleIncomingMessage);
router.post('/receive/:event', webhookController.handleIncomingMessage);

module.exports = router;
