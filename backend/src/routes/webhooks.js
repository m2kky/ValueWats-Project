const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');

// Meta Cloud API webhook
router.get('/meta', verifyWebhook);
router.post('/meta', handleMetaWebhook);

// Evolution API webhooks (keeping for reference — can be removed later)
router.post('/whatsapp', webhookController.handleIncomingMessage);
router.post('/evolution', webhookController.handleIncomingMessage);
router.post('/receive', webhookController.handleIncomingMessage);
router.post('/receive/:event', webhookController.handleIncomingMessage);

module.exports = router;
