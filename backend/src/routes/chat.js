const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const upload = require('../middleware/upload'); // Import the upload middleware

// All routes are already protected by tenantContext middleware in server.js

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.post('/messages/send', chatController.sendMessage);
router.post('/messages/upload', upload.single('file'), chatController.uploadMessageFile);
router.put('/conversations/:id/contact', chatController.updateContact);
router.put('/conversations/:id/assign', chatController.assignConversation);
router.put('/conversations/:id/status', chatController.updateConversationStatus);
router.get('/lifecycle-stages', chatController.getLifecycleStages);
router.get('/labels', chatController.getLabels);
router.post('/ai-assist', chatController.aiAssist);
router.post('/sync', chatController.syncConversations);

module.exports = router;
