const metaApi = require('../services/metaApi');
const chatService = require('../services/chat.service');
const agentService = require('../agents/agent.service');
const socketService = require('../services/socketService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET: Meta webhook verification
const verifyWebhook = (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[MetaWebhook] ✅ Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

// POST: Incoming events from Meta
const handleMetaWebhook = async (req, res) => {
  // Always respond 200 immediately to Meta
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change) return;

    const phoneNumberId = change.metadata?.phone_number_id;

    // Find instance by phoneNumberId
    const instance = await prisma.instance.findFirst({
      where: { phoneNumberId }
    });

    if (!instance) {
      console.warn(`[MetaWebhook] No instance found for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    // ====== STATUS UPDATES (delivered / read) ======
    if (change.statuses?.length) {
      for (const s of change.statuses) {
        const statusMap = { delivered: 'DELIVERED', read: 'READ' };
        const statusString = statusMap[s.status];
        if (!statusString) continue;

        await prisma.message.updateMany({
          where: { wamid: s.id },
          data: { status: statusString, ...(statusString === 'DELIVERED' ? { deliveredAt: new Date() } : {}) }
        }).catch(() => {});

        await prisma.chatMessage.updateMany({
          where: { wamid: s.id },
          data: { status: s.status }
        }).catch(() => {});
      }
      return;
    }

    // ====== INCOMING MESSAGES ======
    if (!change.messages?.length) return;

    const msg = change.messages[0];
    const contact = change.contacts?.[0];
    const contactNumber = msg.from;
    const pushName = contact?.profile?.name || null;
    const wamid = msg.id;
    const fromMe = false;

    let text = '';
    let messageType = msg.type;
    let mediaUrl = null;

    if (msg.type === 'text') {
      text = msg.text?.body || '';
    } else if (['image', 'video', 'audio', 'document'].includes(msg.type)) {
      const mediaObj = msg[msg.type];
      text = mediaObj?.caption || '';
      // Resolve media URL from Meta
      try {
        mediaUrl = await metaApi.getMediaUrl(mediaObj.id);
      } catch (e) {
        console.error('[MetaWebhook] Failed to get media URL:', e.message);
      }
    }

    console.log(`[MetaWebhook] 📩 Message from ${contactNumber}, type: ${messageType}, text: ${text?.substring(0, 80)}`);

    // ====== PERSIST TO CHAT INBOX ======
    let conversation;
    try {
      conversation = await chatService.upsertConversation(
        instance.tenantId,
        contactNumber,
        { content: text || `[${messageType}]`, fromMe, contactName: pushName }
      );

      const chatMsg = await chatService.saveMessage(conversation.id, {
        instanceId: instance.id,
        fromMe,
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
    } catch (e) {
      console.error('[MetaWebhook] Chat persistence error:', e.message);
    }

    if (!text) return;

    // ====== AUTOMATION RULES ======
    const rules = await prisma.automationRule.findMany({
      where: { instanceId: instance.id, tenantId: instance.tenantId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    let matched = false;
    for (const rule of rules) {
      let trigger = false;
      if (rule.triggerType === 'keyword' && rule.triggerValue && text.toLowerCase().includes(rule.triggerValue.toLowerCase())) trigger = true;
      if (rule.triggerType === 'any_message') trigger = true;
      if (rule.triggerType === 'welcome') {
        const count = await prisma.message.count({ where: { instanceId: instance.id, recipientNumber: contactNumber, tenantId: instance.tenantId } });
        if (count === 0) trigger = true;
      }

      if (trigger) {
        await metaApi.sendMessage(contactNumber, rule.responseText);
        matched = true;
        break;
      }
    }

    // ====== AI AGENT ======
    if (!matched && conversation?.aiEnabled && !conversation?.escalated) {
      try {
        const aiResult = await agentService.processMessage({
          conversationId: conversation.id,
          message: text,
          contactNumber,
          tenantId: conversation.tenantId
        });

        if (aiResult?.response) {
          await metaApi.sendMessage(contactNumber, aiResult.response);
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
      } catch (e) {
        console.error('[MetaWebhook] AI error:', e.message);
      }
    }

  } catch (error) {
    console.error('[MetaWebhook] ❌ Error:', error.message);
  }
};

module.exports = { verifyWebhook, handleMetaWebhook };
