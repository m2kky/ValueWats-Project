const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');
const verifyWebhookContext = require('../middleware/verifyWebhookContext');

// Meta Cloud API webhook
router.get('/meta', verifyWebhook);
router.post('/meta', handleMetaWebhook);

// Evolution API webhooks (secured with middleware)
router.post('/whatsapp', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/evolution', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/receive', verifyWebhookContext, webhookController.handleIncomingMessage);
router.post('/receive/:event', verifyWebhookContext, webhookController.handleIncomingMessage);

module.exports = router;
