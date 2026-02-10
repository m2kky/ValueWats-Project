const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Public route for Evolution API webhooks
// Evolution API sends to /api/webhooks/whatsapp (as configured in setWebhook)
router.post('/whatsapp', webhookController.handleIncomingMessage);
router.post('/evolution', webhookController.handleIncomingMessage); // Legacy alias

module.exports = router;
