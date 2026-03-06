const metaApi = require('../services/metaApi');
const chatService = require('../services/chat.service');
const agentService = require('../agents/agent.service');
const socketService = require('../services/socketService');
const prisma = require('../config/database');

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

const handleMetaWebhook = async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    if (!entry) return;

    let channelType = 'whatsapp';
    let identifier = ''; // Page ID or Phone Number ID
    let payload = null;

    // Detect Channel Type
    if (entry.messaging) {
      // Messenger or Instagram
      payload = entry.messaging[0];
      identifier = payload.recipient?.id;
      channelType = req.body.object === 'instagram' ? 'instagram' : 'messenger';
    } else if (entry.changes) {
      // WhatsApp Cloud API
      const change = entry.changes[0].value;
      if (!change) return;
      identifier = change.metadata?.phone_number_id;
      channelType = 'whatsapp';
      payload = change;
    }

    if (!identifier) return;

    // Find instance by identifier and type
    const instance = await prisma.instance.findFirst({
      where: { phoneNumberId: identifier, channelType }
    });

    if (!instance) {
      console.warn(`[MetaWebhook] No instance found for ${channelType} identifier: ${identifier}`);
      return;
    }

    // ====== PROCESS PAYLOAD BY CHANNEL ======
    let contactNumber = '';
    let pushName = null;
    let text = '';
    let messageType = 'text';
    let mediaUrl = null;
    let wamid = '';

    if (channelType === 'whatsapp') {
      // Status updates
      if (payload.statuses?.length) {
        for (const s of payload.statuses) {
          const statusMap = { delivered: 'DELIVERED', read: 'READ' };
          const statusString = statusMap[s.status];
          if (statusString) {
            await prisma.message.updateMany({ where: { wamid: s.id }, data: { status: statusString } }).catch(() => { });
            await prisma.chatMessage.updateMany({ where: { wamid: s.id }, data: { status: s.status } }).catch(() => { });
          }
        }
        return;
      }
      if (!payload.messages?.length) return;
      const msg = payload.messages[0];
      contactNumber = msg.from;
      pushName = payload.contacts?.[0]?.profile?.name || null;
      wamid = msg.id;
      messageType = msg.type;
      if (msg.type === 'text') text = msg.text?.body || '';
      else if (['image', 'video', 'audio', 'document'].includes(msg.type)) {
        text = msg[msg.type]?.caption || '';
        try { mediaUrl = await metaApi.getMediaUrl(msg[msg.type].id, instance.accessToken); } catch (e) { }
      }
    } else {
      // Messenger / Instagram
      if (payload.read || payload.delivery) return; // Ignore status updates for now
      if (!payload.message) return;
      contactNumber = payload.sender.id; // PSID
      wamid = payload.message.mid;
      text = payload.message.text || '';
      
      // Handle media for Messenger/Instagram
      if (payload.message.attachments && payload.message.attachments.length > 0) {
        const att = payload.message.attachments[0];
        messageType = att.type; // image, video, audio, file
        if (messageType === 'file') messageType = 'document';
        mediaUrl = att.payload?.url;
        
        if (!text && messageType !== 'text') {
           text = `[${messageType.charAt(0).toUpperCase() + messageType.slice(1)}]`;
        }
      }
    }

    if (!contactNumber) return;

    console.log(`[MetaWebhook:${channelType}] 📩 Message from ${contactNumber}: ${text?.substring(0, 50)}`);

    // ====== PERSIST TO CHAT INBOX ======
    let conversation = await chatService.upsertConversation(
      instance.tenantId,
      contactNumber,
      { content: text || `[${messageType}]`, fromMe: false, contactName: pushName, channelType }
    );

    const chatMsg = await chatService.saveMessage(conversation.id, {
      instanceId: instance.id,
      fromMe: false,
      senderNumber: contactNumber,
      recipientNumber: instance.phoneNumberId,
      messageType,
      content: text || null,
      mediaUrl,
      wamid,
      status: 'delivered'
    });

    if (chatMsg) {
      socketService.emitChatMessage(instance.tenantId, 'chat:message_received', { conversation, message: chatMsg });
    }

    // ====== AUTOMATION & AI ======
    if (!text) return;

    // Opt-out check
    const OPTOUT_KEYWORDS = ['stop', 'unsubscribe', 'الغاء'];
    if (OPTOUT_KEYWORDS.some(kw => text.toLowerCase().includes(kw))) {
      await prisma.contact.updateMany({ where: { tenantId: instance.tenantId, phoneNumber: contactNumber }, data: { blacklisted: true } });
      const optOutMsg = '✅ Subscription cancelled.';
      if (channelType === 'whatsapp') await metaApi.sendMessage(instance, contactNumber, optOutMsg);
      else await metaApi.sendMetaMessage(instance, contactNumber, optOutMsg);
      return;
    }

    // Standard rules
    const rules = await prisma.automationRule.findMany({ where: { instanceId: instance.id, isActive: true } });
    let matched = false;
    for (const rule of rules) {
      if (rule.triggerType === 'keyword' && text.toLowerCase().includes(rule.triggerValue.toLowerCase())) matched = true;
      if (rule.triggerType === 'any_message') matched = true;
      if (matched) {
        if (channelType === 'whatsapp') await metaApi.sendMessage(instance, contactNumber, rule.responseText);
        else await metaApi.sendMetaMessage(instance, contactNumber, rule.responseText);
        break;
      }
    }

    // AI Agent fallback
    if (!matched && conversation.aiEnabled && !conversation.escalated) {
      const aiResult = await agentService.processMessage({ conversationId: conversation.id, message: text, contactNumber, tenantId: instance.tenantId });
      if (aiResult?.response) {
        if (channelType === 'whatsapp') await metaApi.sendMessage(instance, contactNumber, aiResult.response);
        else await metaApi.sendMetaMessage(instance, contactNumber, aiResult.response);

        const saved = await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            content: aiResult.response,
            direction: 'outgoing',
            senderNumber: instance.phoneNumberId,
            recipientNumber: contactNumber,
            messageType: 'text',
            wamid: `ai-${Date.now()}`,
            status: 'sent'
          }
        });
        socketService.emitChatMessage(instance.tenantId, 'chat:message_received', { conversation, message: saved });
      }
    }

  } catch (error) {
    console.error('[MetaWebhook] ❌ Error:', error.message);
  }
};

module.exports = { verifyWebhook, handleMetaWebhook };
