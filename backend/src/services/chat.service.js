const prisma = require('../config/database');
const evolutionApi = require('./evolutionApi');
const metaApi = require('./metaApi');
const {
  conversationOwnershipGateway
} = require('../conversations/conversationOwnershipGateway');

class ChatService {
  /**
   * Sanitize strings to strip ALL null byte variants that crash Prisma.
   * Covers literal \0, unicode \u0000, and stray control chars.
   */
  static sanitize(str) {
    if (typeof str !== 'string') return str;
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }

  /**
   * Create or update a conversation
   */
  async upsertConversation(tenantId, contactNumber, messageData = {}) {
    try {
      const channelType = messageData.channelType || 'whatsapp';
      const instanceId = messageData.instanceId ? String(messageData.instanceId).trim() : null;
      if (['messenger', 'instagram'].includes(channelType) && !instanceId) {
        const error = new Error('A resolved connected account is required for Meta conversations');
        error.code = 'CONVERSATION_INSTANCE_REQUIRED';
        throw error;
      }
      
      // Sanitize ALL string inputs to prevent Prisma hex escape errors
      const cleanContent = ChatService.sanitize(messageData.content)?.substring(0, 100) || '[Media]';
      const cleanContactName = ChatService.sanitize(messageData.contactName);
      const cleanContactNumber = ChatService.sanitize(contactNumber);

      const update = {
        lastMessage: cleanContent,
        lastMessageAt: new Date(),
        unreadCount: messageData.fromMe ? { set: 0 } : { increment: 1 },
        status: 'open',
        ...(cleanContactName && { contactName: cleanContactName })
      };
      const create = {
        tenantId,
        instanceId,
        channelType,
        contactNumber: cleanContactNumber,
        contactName: cleanContactName || cleanContactNumber,
        lastMessage: cleanContent,
        lastMessageAt: new Date(),
        unreadCount: messageData.fromMe ? 0 : 1,
        status: 'open'
      };

      let conversation;
      if (instanceId) {
        conversation = await prisma.conversation.upsert({
          where: {
            tenantId_instanceId_contactNumber_channelType: {
              tenantId,
              instanceId,
              contactNumber: cleanContactNumber,
              channelType
            }
          },
          update,
          create
        });
      } else {
        const legacy = await prisma.conversation.findFirst({
          where: { tenantId, instanceId: null, contactNumber: cleanContactNumber, channelType }
        });
        conversation = legacy
          ? await prisma.conversation.update({
            where: { id: legacy.id },
            data: update
          })
          : await prisma.conversation.create({ data: create });
      }

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
          channelType: messageData.channelType || 'whatsapp',
          senderNumber: messageData.senderNumber,
          recipientNumber: messageData.recipientNumber,
          messageType: messageData.messageType || 'text',
          content: ChatService.sanitize(messageData.content),
          mediaUrl: messageData.mediaUrl || null,
          wamid: messageData.wamid || null,
          status: messageData.status || 'sent',
          isPrivate: messageData.isPrivate || false
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
        instance: { select: { id: true, instanceName: true, channelType: true } },
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
      instanceName: conv.instance?.instanceName || conv.messages?.[0]?.instance?.instanceName || null,
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
        instance: { select: { id: true, instanceName: true, channelType: true } },
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
    const common = {
      tenantId,
      conversationId,
      actorUserId: assignmentData.actorUserId || null,
      reasonCode: 'manual_assignment'
    };
    if (type === 'agent') {
      await conversationOwnershipGateway.assignAi({
        ...common,
        targetAgentId: agentId,
        reason: 'Conversation manually assigned to AI agent'
      });
    } else if (type === 'user' || type === 'me') {
      await conversationOwnershipGateway.assignHuman({
        ...common,
        targetUserId: userId,
        reason: 'Conversation manually assigned to human'
      });
    } else if (type === 'unassign') {
      await conversationOwnershipGateway.unassign({
        ...common,
        reason: 'Conversation manually unassigned'
      });
    } else {
      const error = new Error('Unsupported assignment type');
      error.code = 'ASSIGNMENT_TYPE_INVALID';
      throw error;
    }

    return prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        lifecycleStage: true,
        assignedUser: { select: { id: true, email: true } }
      }
    });
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
    const { conversationId, instanceId, content, mediaUrl, messageType, isPrivate } = messageData;

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

    let result;
    const channelType = instance.channelType || 'whatsapp';

    if (!isPrivate) {
      if (channelType === 'whatsapp') {
        if (instance.accessToken) {
          // WhatsApp via Meta Cloud API
          result = await metaApi.sendMessage(
            instance,
            conversation.contactNumber,
            content,
            mediaUrl,
            messageType
          );
        } else {
          // WhatsApp via Evolution API
          result = await evolutionApi.sendMessage(
            tenantId,
            instance.instanceName,
            conversation.contactNumber,
            content,
            mediaUrl,
            messageType
          );
        }
      } else {
        // Send via Meta API (Messenger/Instagram)
        result = await metaApi.sendMetaMessage(
          instance,
          conversation.contactNumber,
          content,
          mediaUrl,
          messageType
        );
      }
    }

    // Save to DB
    const savedMessage = await this.saveMessage(conversationId, {
      instanceId,
      fromMe: true,
      senderNumber: instance.phoneNumberId || instance.instanceName,
      recipientNumber: conversation.contactNumber,
      messageType: messageType || 'text',
      channelType,
      content,
      mediaUrl,
      wamid: result?.key?.id || result?.message_id || null,
      status: isPrivate ? 'delivered' : 'sent',
      isPrivate: isPrivate || false,
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
        if (instance.channelType && instance.channelType !== 'whatsapp') continue;
        
        console.log(`[ChatSync] Syncing for instance: ${instance.instanceName}`);

        // 2. Fetch conversations from Evolution API
        const remoteChats = await evolutionApi.fetchConversations(instance.instanceName);

        if (!Array.isArray(remoteChats)) continue;

        for (const chat of remoteChats) {
          try {
            const chatId = chat.id || chat.remoteJid;
            if (!chatId) continue;
            
            const isGroup = chatId.endsWith('@g.us');
            const contactNumber = isGroup ? chatId : chatId.replace('@s.whatsapp.net', '');

            // Determine display name: group subject, pushName, or phone number
            const displayName = isGroup
              ? (chat.subject || chat.name || contactNumber)
              : (chat.pushName || chat.name || contactNumber);

            // 3. Upsert conversation
            const conversation = await this.upsertConversation(tenantId, contactNumber, {
              instanceId: instance.id,
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
          } catch (chatErr) {
            // Skip this single chat and continue syncing the rest
            console.warn(`[ChatSync] Skipping chat (${chat.id || chat.remoteJid}):`, chatErr.message);
            continue;
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
