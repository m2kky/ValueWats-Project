const chatService = require('../services/chat.service');
const socketService = require('../services/socketService');
const storageService = require('../services/storageService');
const prisma = require('../config/database');
const { sanitizeError } = require('../logging/redaction');
const {
  conversationOwnershipGateway
} = require('../conversations/conversationOwnershipGateway');

function ownershipHttpStatus(error) {
  if (error?.code === 'TENANT_MISMATCH') return 404;
  if (['OWNERSHIP_STALE', 'CONVERSATION_CLOSED'].includes(error?.code)) return 409;
  if (['TARGET_INELIGIBLE', 'SOURCE_TARGET_DENIED', 'ASSIGNMENT_TYPE_INVALID'].includes(error?.code)) return 400;
  return 500;
}

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
    console.error('Get conversations error:', sanitizeError(error));
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
    console.error('Get conversation error:', sanitizeError(error));
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// POST /api/chat/messages/send
const sendMessage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { conversationId, instanceId, content, mediaUrl, messageType, isPrivate } = req.body;

    if (!conversationId || !instanceId || !content) {
      return res.status(400).json({ error: 'conversationId, instanceId, and content are required' });
    }

    const messageData = {
      conversationId,
      instanceId,
      content,
      mediaUrl,
      messageType,
      isPrivate: isPrivate === true,
      userId: req.user.id
    };
    const message = await chatService.sendMessage(tenantId, messageData);

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
    const safeError = sanitizeError(error);
    console.error('Send message error:', safeError);
    res.status(500).json({ error: safeError.message || 'Failed to send message' });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,

  uploadMessageFile: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { conversationId, instanceId } = req.body;
      const file = req.file;

      if (!conversationId || !instanceId || !file) {
        return res.status(400).json({ error: 'conversationId, instanceId, and file are required' });
      }

      // Upload to MinIO
      const mediaUrl = await storageService.uploadFile(file);

      // Determine message type based on mimetype
      let messageType = 'document';
      if (file.mimetype.startsWith('image/')) messageType = 'image';
      else if (file.mimetype.startsWith('video/')) messageType = 'video';
      else if (file.mimetype.startsWith('audio/')) messageType = 'audio';

      const messageData = {
        conversationId,
        instanceId,
        content: file.originalname, // Fallback content
        mediaUrl,
        messageType,
        userId: req.user.id
      };

      const message = await chatService.sendMessage(tenantId, messageData);

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
      const safeError = sanitizeError(error);
      console.error('Upload message file error:', safeError);
      res.status(500).json({ error: safeError.message || 'Failed to upload file' });
    }
  },

  updateContact: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data = req.body; // { contactName, labels, lifecycleStageId, customFields }

      const updated = await chatService.updateContact(tenantId, id, data);
      res.json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Update contact error:', sanitizeError(error));
      res.status(500).json({ error: 'Failed to update contact' });
    }
  },

  assignConversation: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const assignmentData = req.body;
      if (assignmentData.type === 'me') {
        assignmentData.userId = req.user.id;
      }
      assignmentData.actorUserId = req.user.id;

      const updated = await chatService.updateAssignment(tenantId, id, assignmentData);
      res.json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Assign conversation error:', sanitizeError(error));
      res.status(ownershipHttpStatus(error)).json({
        error: error.message || 'Failed to assign conversation',
        code: error.code
      });
    }
  },

  // PUT /api/chat/conversations/:id/status
  updateConversationStatus: async (req, res) => {
    try {

      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const { status } = req.body; // 'open', 'closed', 'pending'

      if (!['open', 'closed', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use: open, closed, pending' });
      }

      if (status === 'closed') {
        await conversationOwnershipGateway.close({
          tenantId,
          conversationId: id,
          actorUserId: req.user.id,
          reasonCode: 'manual_close',
          reason: 'Conversation manually closed'
        });
      }

      const conversation = await prisma.conversation.updateMany({
        where: { id, tenantId },
        data: status === 'closed'
          ? { unreadCount: 0 }
          : { status }
      });

      if (conversation.count === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const updated = await prisma.conversation.findFirst({
        where: { id, tenantId },
        include: { lifecycleStage: true, assignedUser: { select: { id: true, email: true } } }
      });

      res.json({ success: true, conversation: updated });
    } catch (error) {
      console.error('Update conversation status error:', sanitizeError(error));
      res.status(ownershipHttpStatus(error)).json({
        error: error.message || 'Failed to update conversation status',
        code: error.code
      });
    }
  },

  getLifecycleStages: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;


      const stages = await prisma.lifecycleStage.findMany({
        where: { tenantId },
        orderBy: { order: 'asc' }
      });

      res.json({ stages });
    } catch (error) {
      console.error('Get stages error:', sanitizeError(error));
      res.status(500).json({ error: 'Failed to fetch stages' });
    }
  },

  // GET /api/chat/labels
  getLabels: async (req, res) => {
    try {

      const tenantId = req.user.tenantId;

      // Fetch all label arrays from conversations and flatten to unique values
      const conversations = await prisma.conversation.findMany({
        where: { tenantId },
        select: { labels: true }
      });

      const allLabels = conversations.flatMap(c => c.labels || []);
      const uniqueLabels = [...new Set(allLabels)].filter(Boolean).sort();

      res.json({ labels: uniqueLabels });
    } catch (error) {
      console.error('Get labels error:', sanitizeError(error));
      res.status(500).json({ error: 'Failed to fetch labels' });
    }
  },

  // POST /api/chat/ai-assist
  aiAssist: async (req, res) => {
    try {
      const { messages, contactName, instruction } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array is required' });
      }

      const axios = require('axios');
      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: 'AI service not configured' });
      }

      // Build a conversation context for DeepSeek
      const systemPrompt = `You are a helpful customer support agent assistant. 
The customer's name is: ${contactName || 'Unknown'}.
${instruction ? `Special instruction: ${instruction}` : ''}
Based on the conversation history, suggest ONE SHORT professional reply in the same language the customer is using.
Reply with ONLY the suggested message text, no quotes, no explanations.`;

      const conversationContext = messages.slice(-10).map(m => ({
        role: m.direction === 'outgoing' ? 'assistant' : 'user',
        content: m.content || '[Media]'
      }));

      const response = await axios.post(
        process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'qwen/qwen3.5-flash-02-23',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationContext,
            { role: 'user', content: 'Suggest a reply for the last message.' }
          ],
          temperature: 0.7,
          max_tokens: 200
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://valuewats.com',
            'X-Title': 'ValueWats'
          },
          timeout: 15000
        }
      );

      const suggestion = response.data.choices?.[0]?.message?.content?.trim();
      res.json({ suggestion });
    } catch (error) {
      console.error('AI assist error:', sanitizeError(error));
      res.status(500).json({ error: 'AI assist failed. Please try again.' });
    }
  },

  syncConversations: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const result = await chatService.syncConversations(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Sync conversations error:', sanitizeError(error));
      res.status(500).json({ error: 'Failed to sync conversations' });
    }
  }
};
