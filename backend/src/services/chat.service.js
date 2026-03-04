const prisma = require('../config/database');
const evolutionApi = require('./evolutionApi');

class ChatService {
  /**
   * Create or update a conversation
   */
  async upsertConversation(tenantId, contactNumber, messageData = {}) {
    try {
      const conversation = await prisma.conversation.upsert({
        where: {
          tenantId_contactNumber: { tenantId, contactNumber }
        },
        update: {
          lastMessage: messageData.content?.substring(0, 100) || '[Media]',
          lastMessageAt: new Date(),
          unreadCount: messageData.fromMe ? { set: 0 } : { increment: 1 },
          status: 'open',
          // Update contact name if provided and not just a phone number
          ...(messageData.contactName && { contactName: messageData.contactName })
        },
        create: {
          tenantId,
          contactNumber,
          contactName: messageData.contactName || contactNumber,
          lastMessage: messageData.content?.substring(0, 100) || '[Media]',
          lastMessageAt: new Date(),
          unreadCount: messageData.fromMe ? 0 : 1,
          status: 'open'
        }
      });

      return conversation;
    } catch (error) {
      console.error('[ChatService] Error upserting conversation:', error);
      throw error;
    }
  }

  /**
   * Save a chat message
   */
  async saveMessage(conversationId, messageData) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          conversationId,
          instanceId: messageData.instanceId || null,
          direction: messageData.fromMe ? 'outgoing' : 'incoming',
          senderNumber: messageData.senderNumber,
          recipientNumber: messageData.recipientNumber,
          messageType: messageData.messageType || 'text',
          content: messageData.content,
          mediaUrl: messageData.mediaUrl || null,
          wamid: messageData.wamid || null,
          status: messageData.status || 'sent'
        }
      });

      return message;
    } catch (error) {
      // Skip duplicate wamid errors silently
      if (error.code === 'P2002' && error.meta?.target?.includes('wamid')) {
        console.log(`[ChatService] Duplicate wamid skipped: ${messageData.wamid}`);
        return null;
      }
      console.error('[ChatService] Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversations list for a tenant
   */
  async getConversations(tenantId, filters = {}) {
    const { status, search, limit = 50, offset = 0 } = filters;

    const where = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { contactName: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search } }
        ]
      })
    };

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        lifecycleStage: true,
        assignedUser: { select: { id: true, email: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            instance: { select: { id: true, instanceName: true } }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Attach instance info from most recent message for easy access on frontend
    return conversations.map(conv => ({
      ...conv,
      instanceName: conv.messages?.[0]?.instance?.instanceName || null,
      isGroup: conv.contactNumber?.includes('@g.us') || false
    }));
  }

  /**
   * Get a single conversation with its messages
   */
  async getConversation(conversationId, tenantId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        lifecycleStage: true,
        assignedUser: { select: { id: true, email: true } },
        messages: {
          include: {
            instance: {
              select: { id: true, instanceName: true }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 200
        }
      }
    });

    if (conversation) {
      // Fetch associated contact with notes
      const contact = await prisma.contact.findFirst({
        where: {
          tenantId,
          phoneNumber: conversation.contactNumber
        },
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, email: true } } }
          }
        }
      });
      conversation.contact = contact;

      // Fetch contact fields
      const contactFields = await prisma.contactField.findMany({
        where: {
          tenantId,
          contactNumber: conversation.contactNumber
        }
      });
      conversation.contactFields = contactFields;
    }

    return conversation;
  }

  /**
   * Update contact details (name, labels, stage, fields)
   */
  async updateContact(tenantId, conversationId, data) {
    const { contactName, labels, lifecycleStageId, customFields } = data;

    // 1. Update Conversation (Name, Labels, Stage)
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(contactName !== undefined && { contactName }),
        ...(labels !== undefined && { labels }),
        ...(lifecycleStageId !== undefined && { lifecycleStageId })
      },
      include: { lifecycleStage: true }
    });

    // 2. Sync to Contacts Table
    const contactData = {
      tenantId,
      phoneNumber: conversation.contactNumber,
      name: conversation.contactName || undefined,
      lifecycleStageId: lifecycleStageId !== undefined ? lifecycleStageId : undefined,
    };

    const customFieldsToSave = {};
    if (customFields && Array.isArray(customFields)) {
      for (const field of customFields) {
        if (!field.name || !field.value) continue;

        // Save dynamically to Contact Field table
        await prisma.contactField.upsert({
          where: {
            tenantId_contactNumber_fieldName: {
              tenantId,
              contactNumber: conversation.contactNumber,
              fieldName: field.name
            }
          },
          update: { fieldValue: field.value },
          create: {
            tenantId,
            contactNumber: conversation.contactNumber,
            fieldName: field.name,
            fieldValue: field.value
          }
        });

        // Set standard fields for Contact if they match
        if (field.name.toLowerCase() === 'email') contactData.email = field.value;
        if (field.name.toLowerCase() === 'gender') contactData.gender = field.value;
        if (field.name.toLowerCase() === 'address') contactData.address = field.value;
        if (field.name.toLowerCase() === 'governorate') contactData.governorate = field.value;
        if (field.name.toLowerCase() === 'district') contactData.district = field.value;

        // Keep a neat JSON of all fields for `customFields` JSON column inside
        customFieldsToSave[field.name] = field.value;
      }

      contactData.customFields = customFieldsToSave;
    }

    await prisma.contact.upsert({
      where: {
        tenantId_phoneNumber: {
          tenantId,
          phoneNumber: conversation.contactNumber
        }
      },
      update: {
        ...contactData,
        // Make sure we don't accidentally overwrite with undefined
        ...(contactData.name && { name: contactData.name }),
        ...(contactData.email && { email: contactData.email }),
        ...(contactData.gender && { gender: contactData.gender }),
        ...(contactData.address && { address: contactData.address })
      },
      create: contactData
    });

    return conversation;
  }

  /**
   * Update conversation assignment
   */
  async updateAssignment(tenantId, conversationId, assignmentData) {
    const { type, agentId, userId } = assignmentData; // type: 'agent', 'user', 'me', 'unassign'

    let updateData = {};
    if (type === 'agent') {
      updateData = {
        currentAgentId: agentId,
        assignedUserId: null,
        escalated: false,
        aiEnabled: true
      };

      // End any other agent session
      await prisma.conversationAgent.updateMany({
        where: { conversationId, endedAt: null },
        data: { endedAt: new Date(), handoffReason: 'user_reassigned' }
      });

      // Start new agent session
      await prisma.conversationAgent.create({
        data: {
          conversationId,
          agentId,
          startedAt: new Date()
        }
      });
    } else if (type === 'user' || type === 'me') {
      updateData = {
        currentAgentId: null,
        assignedUserId: userId,
        escalated: true,
        aiEnabled: false
      };

      // End AI sessions if taken over by human
      await prisma.conversationAgent.updateMany({
        where: { conversationId, endedAt: null },
        data: { endedAt: new Date(), handoffReason: 'human_takeover' }
      });
    } else if (type === 'unassign') {
      updateData = {
        currentAgentId: null,
        assignedUserId: null,
        escalated: false,
        aiEnabled: true
      };
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        lifecycleStage: true,
        assignedUser: { select: { id: true, email: true } }
      }
    });

    return conversation;
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId, tenantId) {
    await prisma.conversation.updateMany({
      where: { id: conversationId, tenantId },
      data: { unreadCount: 0 }
    });
  }

  /**
   * Send a message from the inbox
   */
  async sendMessage(tenantId, messageData) {
    const { conversationId, instanceId, content, mediaUrl, messageType } = messageData;

    // Validate conversation
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId }
    });
    if (!conversation) throw new Error('Conversation not found');

    // Validate instance
    const instance = await prisma.instance.findFirst({
      where: { id: instanceId, tenantId }
    });
    if (!instance) throw new Error('Instance not found');

    // Send via Evolution API
    const result = await evolutionApi.sendMessage(
      tenantId,
      instance.instanceName,
      conversation.contactNumber,
      content
    );

    // Save to DB
    const savedMessage = await this.saveMessage(conversationId, {
      instanceId,
      fromMe: true,
      senderNumber: instance.instanceName,
      recipientNumber: conversation.contactNumber,
      messageType: messageType || 'text',
      content,
      mediaUrl,
      wamid: result?.key?.id || null,
      status: 'sent',
    });

    if (messageData.userId && savedMessage) {
      await prisma.chatMessage.update({
        where: { id: savedMessage.id },
        data: { senderUserId: messageData.userId }
      });
    }

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content?.substring(0, 100) || '[Media]',
        lastMessageAt: new Date(),
        unreadCount: 0
      }
    });

    return savedMessage;
  }

  /**
   * Sync all conversations and recent messages from Evolution API
   */
  async syncConversations(tenantId) {
    try {
      // 1. Get all connected instances for the tenant
      const instances = await prisma.instance.findMany({
        where: { tenantId, status: 'connected' }
      });

      if (instances.length === 0) return { success: true, count: 0, message: 'No connected instances' };

      let syncCount = 0;

      for (const instance of instances) {
        console.log(`[ChatSync] Syncing for instance: ${instance.instanceName}`);

        // 2. Fetch conversations from Evolution API
        const remoteChats = await evolutionApi.fetchConversations(instance.instanceName);

        if (!Array.isArray(remoteChats)) continue;

        for (const chat of remoteChats) {
          const isGroup = chat.id.endsWith('@g.us');
          const contactNumber = isGroup ? chat.id : chat.id.replace('@s.whatsapp.net', '');

          // Determine display name: group subject, pushName, or phone number
          const displayName = isGroup
            ? (chat.subject || chat.name || contactNumber)
            : (chat.pushName || chat.name || contactNumber);

          // 3. Upsert conversation
          const conversation = await this.upsertConversation(tenantId, contactNumber, {
            content: chat.message || chat.lastMessage?.message?.conversation || '',
            contactName: displayName,
            fromMe: false // Default to false for sync
          });

          syncCount++;

          // 4. (Optional) Fetch last few messages
          // NOTE: We do this sparingly to avoid rate limits
          const messages = await evolutionApi.fetchMessages(instance.instanceName, contactNumber, 10);

          if (Array.isArray(messages)) {
            for (const msg of messages) {
              const msgData = {
                instanceId: instance.id,
                fromMe: msg.key?.fromMe || false,
                senderNumber: msg.key?.fromMe ? instance.instanceName : contactNumber,
                recipientNumber: msg.key?.fromMe ? contactNumber : instance.instanceName,
                messageType: msg.messageType || 'text',
                content: msg.message?.conversation || msg.message?.extendedTextMessage?.text || null,
                wamid: msg.key?.id,
                status: 'delivered',
                createdAt: new Date(msg.messageTimestamp * 1000)
              };

              if (msgData.content) {
                await this.saveMessage(conversation.id, msgData).catch(() => { });
              }
            }
          }
        }
      }

      return { success: true, count: syncCount };
    } catch (error) {
      console.error('[ChatService] Sync error:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
