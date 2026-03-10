const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');

// Meta Cloud API webhook (public — verified by hub.challenge token)
router.get('/meta', verifyWebhook);
router.post('/meta', handleMetaWebhook);

// Evolution API webhooks
// NOTE: verifyWebhookContext was removed because Evolution API doesn't send apikey header by default.
// To re-enable: configure Evolution API to send `apikey` header, set EVOLUTION_WEBHOOK_SECRET in Coolify,
// then add: const verifyWebhookContext = require('../middleware/verifyWebhookContext');
// and prepend it to the routes below.
router.post('/whatsapp', webhookController.handleIncomingMessage);
router.post('/evolution', webhookController.handleIncomingMessage);
router.post('/receive', webhookController.handleIncomingMessage);
router.post('/receive/:event', webhookController.handleIncomingMessage);

module.exports = router;
