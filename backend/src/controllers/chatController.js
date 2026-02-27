const chatService = require('../services/chat.service');
const socketService = require('../services/socketService');

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const filters = {
      status: req.query.status,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const conversations = await chatService.getConversations(tenantId, filters);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// GET /api/chat/conversations/:id
const getConversation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const conversation = await chatService.getConversation(id, tenantId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark as read
    await chatService.markAsRead(id, tenantId);

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// POST /api/chat/messages/send
const sendMessage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { conversationId, instanceId, content, mediaUrl, messageType } = req.body;

    if (!conversationId || !instanceId || !content) {
      return res.status(400).json({ error: 'conversationId, instanceId, and content are required' });
    }

    const message = await chatService.sendMessage(tenantId, {
      conversationId,
      instanceId,
      content,
      mediaUrl,
      messageType
    });

    // Emit real-time event
    try {
      const io = socketService.getIo();
      io.to(`tenant_${tenantId}`).emit('chat:message_sent', {
        conversationId,
        message
      });
    } catch (e) {
      // Socket not initialized, skip
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,
  updateContact: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data = req.body; // { contactName, labels, lifecycleStageId, customFields }

      const updated = await chatService.updateContact(tenantId, id, data);
      res.json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Update contact error:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  },

  getLifecycleStages: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const stages = await prisma.lifecycleStage.findMany({
        where: { tenantId },
        orderBy: { order: 'asc' }
      });

      res.json({ stages });
    } catch (error) {
      console.error('Get stages error:', error);
      res.status(500).json({ error: 'Failed to fetch stages' });
    }
  },

  syncConversations: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const result = await chatService.syncConversations(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Sync conversations error:', error);
      res.status(500).json({ error: 'Failed to sync conversations' });
    }
  }
};
