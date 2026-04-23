const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');
const verifyWebhookContext = require('../middleware/verifyWebhookContext');

// Meta Cloud API webhook (public — verified by hub.challenge token)
router.get('/meta', verifyWebhook);
router.post('/meta', handleMetaWebhook);

// Evolution API webhooks
// Security: verifyWebhookContext checks x-api-key / apikey header against EVOLUTION_WEBHOOK_SECRET.
// IMPORTANT: Configure Evolution API instances to send `apikey` header matching the env var.
router.post('/whatsapp', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/evolution', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/receive', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/receive/:event', verifyWebhookContext, webhookController.handleIncomingMessage);

module.exports = router;
