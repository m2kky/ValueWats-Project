const aiService = require('../services/aiService');
const evolutionApi = require('../services/evolutionApi');
const chatService = require('../services/chat.service');
const agentService = require('../agents/agent.service');
const socketService = require('../services/socketService');
const prisma = require('../config/database');
const { uploadBase64 } = require('../services/storageService');
const workflowService = require('../services/workflow.service');

// Download media from Evolution API and upload to MinIO, returns permanent URL or null
async function resolveMediaUrl(instanceName, msgKey, messageContent, messageType) {
  if (!['image', 'video', 'audio', 'document', 'sticker'].includes(messageType)) return null;
  try {
    const result = await evolutionApi.downloadMedia(instanceName, msgKey);
    if (!result?.base64) return null;
    const mimetype = result.mimetype ||
      (messageType === 'image' ? 'image/jpeg' :
       messageType === 'video' ? 'video/mp4' :
       messageType === 'audio' ? 'audio/ogg' :
       messageType === 'sticker' ? 'image/webp' : 'application/octet-stream');
    return await uploadBase64(result.base64, mimetype, 'chat-media');
  } catch (e) {
    console.warn('[Webhook] resolveMediaUrl failed:', e.message);
    return null;
  }
}

const handleIncomingMessage = async (req, res) => {
  try {
    const body = req.body;
    const event = body.event;

    // Extract instance name - Evolution API may send as string or object
    let instanceName;
    if (typeof body.instance === 'string') {
      instanceName = body.instance;
    } else if (body.instance && body.instance.instanceName) {
      instanceName = body.instance.instanceName;
    } else {
      instanceName = body.instanceName || 'unknown';
    }

    const data = body.data || body;

    console.log(`[Webhook] 🔵 Received event: ${event} for instance: ${instanceName}`);

    // Handle connection status updates
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      const state = data?.state || data?.status;
      const reason = data?.reason || 'none';
      console.log(`[Webhook] 🔌 Connection update for ${instanceName}: State=${state}, Reason=${reason}`);

      if (state === 'open') {
        try {
          await prisma.instance.update({
            where: { instanceName },
            data: {
              status: 'connected',
              phoneNumber: data.phoneNumber || null
            }
          });
          console.log(`[Webhook] ✅ Instance ${instanceName} marked as connected manually`);
        } catch (e) {
          console.error(`[Webhook] ❌ Failed to update instance ${instanceName}:`, e.message);
        }
      } else if (state === 'close' || state === 'refused') {
        console.warn(`[Webhook] ⚠️ Instance ${instanceName} connection ${state}. Reason: ${reason}`);
      }

      return res.status(200).send('OK');
    }

    // Handle message status updates (DELIVERED, READ)
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      const updates = Array.isArray(data) ? data : [data];
      const messageUpdate = updates[0];
      if (!messageUpdate) return res.status(200).send('OK');

      const { key, update } = messageUpdate;
      if (!key || !update) return res.status(200).send('OK');

      const remoteJid = key.remoteJid;
      const status = update.status;
      const wamid = key.id;

      let statusString = null;
      if (status === 3 || status === 'DELIVERY_ACK') statusString = 'DELIVERED';
      if (status === 4 || status === 'READ') statusString = 'READ';
      if (status === 5 || status === 'PLAYED') statusString = 'READ';

      if (statusString && wamid) {
        console.log(`[Webhook] Message update for ${remoteJid}: status ${status} (${statusString})`);

        try {
          // Update campaign messages
          const message = await prisma.message.findUnique({
            where: { wamid },
            include: { campaign: true }
          });

          if (message) {
            const updateData = { status: statusString };
            if (statusString === 'DELIVERED') updateData.deliveredAt = new Date();

            await prisma.message.update({
              where: { id: message.id },
              data: updateData
            });

            if (message.campaignId) {
              socketService.emitCampaignProgress(message.campaignId, message.campaign.tenantId, {
                type: 'MESSAGE_UPDATE',
                messageId: message.id,
                status: statusString,
                campaignName: message.campaign.name,
                totalContacts: message.campaign.totalContacts,
              });
            }
          }

          // Also update ChatMessage status
          await prisma.chatMessage.updateMany({
            where: { wamid },
            data: { status: statusString.toLowerCase() }
          }).catch(() => { }); // Ignore if not found

        } catch (err) {
          console.error('[Webhook] Error updating message status:', err.message);
        }
      }
      return res.status(200).send('OK');
    }

    // Handle send message confirmations
    if (event === 'send.message' || event === 'SEND_MESSAGE') {
      try {
        const wamid = data?.key?.id;
        if (wamid) {
          await prisma.message.updateMany({
            where: { wamid },
            data: { status: 'SENT', sentAt: new Date() }
          });
          console.log(`[Webhook] Send confirmed for wamid: ${wamid}`);
        }
      } catch (err) {
        console.error('[Webhook] Error processing send confirmation:', err.message);
      }
      return res.status(200).send('OK');
    }

    // Only process text messages (Upsert)
    if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      console.log(`[Webhook] Ignoring event: ${event}`);
      return res.status(200).send('OK');
    }

    // ====== EXTRACT MESSAGE DATA ======
    // Evolution API v2 may send messages in different structures:
    // Format A: data.key, data.message (flat)
    // Format B: data.messages[0].key, data.messages[0].message (array)
    let msgObj;
    if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
      msgObj = data.messages[0]; // Format B
    } else if (data.key && (data.message || data.messageType)) {
      msgObj = data; // Format A
    } else if (data.message && !data.key) {
      // Fallback: data has just .message (the content object directly)
      msgObj = { key: data.key, message: data.message };
    }

    if (!msgObj || !msgObj.key) {
      console.log('[Webhook] ⚠️ No valid message object found in data');
      return res.status(200).send('OK');
    }

    const messageContent = msgObj.message;
    const text = messageContent?.conversation ||
      messageContent?.extendedTextMessage?.text ||
      messageContent?.imageMessage?.caption ||
      '';
    const remoteJid = msgObj.key.remoteJid;
    const fromMe = msgObj.key.fromMe;
    const contactNumber = remoteJid.replace('@s.whatsapp.net', '');
    const wamid = msgObj.key.id;
    const messageType = messageContent?.imageMessage ? 'image' :
      messageContent?.videoMessage ? 'video' :
        messageContent?.audioMessage ? 'audio' :
          messageContent?.documentMessage ? 'document' :
            messageContent?.stickerMessage ? 'sticker' : 'text';

    console.log(`[Webhook] 📩 Message from ${contactNumber}, fromMe: ${fromMe}, type: ${messageType}`);
    console.log(`[Webhook] 💬 Text: ${text?.substring(0, 100) || '[no text]'}`);

    // Find instance
    const instance = await prisma.instance.findFirst({
      where: { instanceName }
    });

    if (!instance) {
      console.error(`[Webhook] ⚠️ Instance ${instanceName} not found in DB`);
      return res.status(200).send('OK');
    }

    console.log(`[Webhook] ✅ Instance found: ${instance.id} (tenant: ${instance.tenantId})`);

    // ====== CHAT INBOX PERSISTENCE ======
    let conversation;
    try {
      console.log('[Webhook] 💾 Saving to chat inbox...');

      // Extract pushName for contact name display
      const pushName = data.pushName || msgObj.pushName || null;
      const isGroup = remoteJid.endsWith('@g.us');

      // For group chats: fetch the real group name from Evolution API
      // For 1-on-1 chats: use pushName (WhatsApp display name)
      let resolvedContactName = null;
      if (isGroup) {
        // Try to get real group name — fallback to existing conversation name or null
        resolvedContactName = await evolutionApi.getGroupInfo(instanceName, remoteJid);
      } else {
        resolvedContactName = fromMe ? undefined : pushName;
      }

      conversation = await chatService.upsertConversation(
        instance.tenantId,
        contactNumber,
        {
          content: text || `[${messageType}]`,
          fromMe,
          // Only update contactName if we have a real name (preserve existing group name if API fails)
          contactName: resolvedContactName || undefined
        }
      );

      console.log(`[Webhook] ✅ Conversation upserted: ${conversation.id}`);

      // ====== AUTO-CREATE & LINK CONTACT ======
      // Ensure a CRM Contact record exists and link it to the conversation
      if (!fromMe && !isGroup) {
        try {
          const contact = await prisma.contact.upsert({
            where: {
              tenantId_phoneNumber: {
                tenantId: instance.tenantId,
                phoneNumber: contactNumber
              }
            },
            update: {
              // Only update name if we have a pushName and existing name is null
              ...(pushName ? { name: pushName } : {})
            },
            create: {
              tenantId: instance.tenantId,
              phoneNumber: contactNumber,
              name: pushName || null,
              source: 'whatsapp'
            }
          });

          // Link contact to conversation if not already linked
          if (!conversation.contactId) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { contactId: contact.id }
            });
            console.log(`[Webhook] 🔗 Linked Contact ${contact.id} to Conversation ${conversation.id}`);
          }
        } catch (contactErr) {
          console.error('[Webhook] Contact auto-create error:', contactErr.message);
        }
      }

      const chatMsg = await chatService.saveMessage(conversation.id, {
        instanceId: instance.id,
        fromMe,
        senderNumber: fromMe ? instanceName : contactNumber,
        recipientNumber: fromMe ? contactNumber : instanceName,
        messageType,
        content: text || null,
        mediaUrl: await resolveMediaUrl(instanceName, msgObj.key, messageContent, messageType),
        wamid,
        status: fromMe ? 'sent' : 'delivered'
      });

      if (chatMsg) {
        console.log(`[Webhook] ✅ ChatMessage saved: ${chatMsg.id}`);

        // Emit real-time event
        socketService.emitChatMessage(instance.tenantId, 'chat:message_received', {
          conversation,
          message: chatMsg
        });
        console.log('[Webhook] ✅ Socket event emitted');
      }
    } catch (chatErr) {
      console.error('[Webhook] ❌ Chat persistence error:', chatErr.message);
    }

    // Ignore outgoing or empty messages for automation processing
    if (fromMe || !text) {
      return res.status(200).send('OK');
    }

    console.log(`[Webhook] 🤖 Processing automations for: ${text.substring(0, 50)}`);

    // ====== OPT-OUT / BLACKLIST CHECK ======
    const tenant = await prisma.tenant.findUnique({
      where: { id: instance.tenantId },
      select: { optoutEnabled: true, optoutMessage: true, optoutKeywords: true }
    });
    const normalizedText = text.trim().toLowerCase();
    const optoutKeywords = tenant?.optoutKeywords?.length ? tenant.optoutKeywords : ['stop', 'وقف', 'انهاء', 'إلغاء', 'الغاء', 'لا رسائل', 'unsubscribe', 'إلغاء الاشتراك'];
    if (tenant?.optoutEnabled !== false && optoutKeywords.some(kw => normalizedText === kw.toLowerCase() || normalizedText.includes(kw.toLowerCase()))) {
      console.log(`[Webhook] 🚫 Opt-out keyword detected from ${contactNumber}. Blacklisting...`);
      try {
        await prisma.contact.updateMany({
          where: { tenantId: instance.tenantId, phoneNumber: contactNumber },
          data: { blacklisted: true, blacklistedAt: new Date() }
        });
        if (tenant?.optoutMessage) {
          await evolutionApi.sendMessage(
            instance.tenantId,
            instanceName,
            contactNumber,
            tenant.optoutMessage
          );
        }
        console.log(`[Webhook] ✅ Contact ${contactNumber} blacklisted and opt-out confirmation sent.`);
      } catch (optoutErr) {
        console.error('[Webhook] ❌ Opt-out error:', optoutErr.message);
      }
      return res.status(200).send('OK');
    }

    // ====== AUTOMATION RULES CHECK ======
    const automationRules = await prisma.automationRule.findMany({
      where: {
        instanceId: instance.id,
        tenantId: instance.tenantId,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    });

    let matched = false;

    for (const rule of automationRules) {
      let shouldTrigger = false;

      switch (rule.triggerType) {
        case 'keyword':
          if (rule.triggerValue && text.toLowerCase().includes(rule.triggerValue.toLowerCase())) {
            shouldTrigger = true;
          }
          break;

        case 'any_message':
          shouldTrigger = true;
          break;

        case 'welcome':
          const existingMessages = await prisma.message.count({
            where: {
              instanceId: instance.id,
              recipientNumber: contactNumber,
              tenantId: instance.tenantId
            }
          });
          if (existingMessages === 0) {
            shouldTrigger = true;
          }
          break;
      }

      if (shouldTrigger) {
        console.log(`[Webhook] ✅ Automation matched: "${rule.name}" (${rule.triggerType})`);

        await evolutionApi.sendMessage(
          instance.tenantId,
          instanceName,
          contactNumber,
          rule.responseText
        );

        matched = true;
        break;
      }
    }

    // ====== FALLBACK: AI Agent ======
    if (!matched && conversation && conversation.aiEnabled && !conversation.escalated) {
      try {
        console.log(`[Webhook] 🤖 Sending to Agent Service...`);
        const aiResult = await agentService.processMessage({
          conversationId: conversation.id,
          message: text,
          contactNumber,
          tenantId: conversation.tenantId
        });

        if (aiResult && aiResult.response) {
          console.log(`[Webhook] 🤖 AI Response: ${aiResult.response.substring(0, 50)}...`);

          // Send AI response via Evolution API
          await evolutionApi.sendMessage(
            instance.tenantId,
            instanceName,
            contactNumber,
            aiResult.response
          );

          // Save AI response to database
          const aiChatMsg = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              content: aiResult.response,
              direction: 'outgoing',
              senderNumber: instanceName,
              recipientNumber: contactNumber,
              messageType: 'text',
              wamid: `ai-${Date.now()}`,
              status: 'sent'
            }
          });

          // Emit real-time socket event for the AI response
          socketService.emitChatMessage(instance.tenantId, 'chat:message_received', {
            conversation,
            message: aiChatMsg
          });
          console.log(`[Webhook] 📡 AI response emitted via Socket.io`);
        }
      } catch (error) {
        console.error('[Webhook] AI processing error:', error);
      }
    }

    // ====== WORKFLOW ENGINE: Auto-trigger workflows ======
    if (conversation) {
      try {
        const contact = await prisma.contact.findFirst({
          where: { tenantId: instance.tenantId, phoneNumber: contactNumber }
        });
        await workflowService.executeTriggeredWorkflows('inbound_message', {
          tenantId: instance.tenantId,
          conversation,
          contact,
          instance,
          message: { content: text, text, type: messageType }
        });
      } catch (wfErr) {
        console.error('[Webhook] Workflow trigger error:', wfErr.message);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('[Webhook] ❌ Error:', error.message);
    console.error('[Webhook] Stack:', error.stack);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { handleIncomingMessage };
