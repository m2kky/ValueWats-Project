const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Public route for Evolution API webhooks
router.post('/evolution', webhookController.handleIncomingMessage);

module.exports = router;
