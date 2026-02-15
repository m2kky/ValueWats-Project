const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// All routes are already protected by tenantContext middleware in server.js

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.post('/messages/send', chatController.sendMessage);

module.exports = router;
