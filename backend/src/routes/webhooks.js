const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');
const verifyWebhookContext = require('../middleware/verifyWebhookContext');

// Meta Cloud API webhook (public — verified by hub.challenge token)
router.get('/meta', verifyWebhook);
router.post('/meta', handleMetaWebhook);

// Evolution API webhooks
// Webhook routes are PUBLIC per rules.md
router.post('/whatsapp', webhookController.handleIncomingMessage);
router.post('/evolution', webhookController.handleIncomingMessage);
router.post('/receive', webhookController.handleIncomingMessage);
router.post('/receive/:event', webhookController.handleIncomingMessage);

module.exports = router;
