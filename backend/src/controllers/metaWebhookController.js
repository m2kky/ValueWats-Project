const metaApi = require('../services/metaApi');
const chatService = require('../services/chat.service');
const agentService = require('../agents/agent.service');
const socketService = require('../services/socketService');
const prisma = require('../config/database');
const { getChannelConfig } = require('../services/channelConfig.service');
const { sanitizeError } = require('../logging/redaction');
const {
  normalizeFacebookComment,
  normalizeInstagramComment
} = require('../commentReplies/commentEventNormalizer');
const { createCommentReplyRuntime } = require('../commentReplies/commentReplyRuntime');
const { createOutboxService } = require('../events/outboxService');

const privateReplyCache = new Map();
const commentReplyRuntime = createCommentReplyRuntime({
  prisma,
  outboxService: createOutboxService(prisma)
});

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

const findMetaInstance = async (identifier, channelType, recipientId = null) => {
  let instance = await prisma.instance.findFirst({
    where: { phoneNumberId: String(identifier), channelType }
  });

  if (!instance && recipientId) {
    instance = await prisma.instance.findFirst({
      where: { phoneNumberId: String(recipientId), channelType }
    });
  }

  if (!instance) {
    instance = await prisma.instance.findFirst({
      where: { phoneNumberId: String(identifier) }
    });
  }

  return instance;
};

const shouldSkipByAge = (createdTimeRaw) => {
  if (!createdTimeRaw) return false;

  const createdDate = Number.isFinite(Number(createdTimeRaw))
    ? new Date(Number(createdTimeRaw) * 1000)
    : new Date(createdTimeRaw);

  if (Number.isNaN(createdDate.getTime())) return false;

  const ageMs = Date.now() - createdDate.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return ageMs > sevenDaysMs;
};

const processPageFeedPrivateReplies = async (entry) => {
  const pageId = String(entry.id || '');
  if (!pageId) return;

  const instance = await prisma.instance.findFirst({
    where: {
      phoneNumberId: pageId,
      channelType: 'messenger'
    }
  });

  if (!instance) return;

  const config = await getChannelConfig({
    tenantId: instance.tenantId,
    instanceId: instance.id
  });

  if (!config.privateReplies?.enabled) return;

  const changes = Array.isArray(entry.changes) ? entry.changes : [];
  if (changes.length) {
    console.log(`[MetaWebhook] Processing ${changes.length} page feed changes for page ${pageId}`);
  }

  for (const change of changes) {
    if (change.field !== 'feed') continue;

    const value = change.value || {};

    if ((value.verb || '').toLowerCase() !== 'add') continue;
    if (String(value.from?.id || '') === pageId) continue;
    if (shouldSkipByAge(value.created_time)) continue;

    const commentId = String(value.comment_id || '').trim();
    const postId = String(value.post_id || '').trim();
    if (!commentId && !postId) continue;

    if (config.privateReplies.track === 'specific' && config.privateReplies.postId) {
      if (config.privateReplies.postId !== postId) continue;
    }

    const dedupeKey = `${instance.id}:${commentId || postId}`;
    if (privateReplyCache.has(dedupeKey)) continue;

    const replyText = String(config.privateReplies.message || '').trim();
    if (!replyText) continue;

    try {
      await metaApi.sendMessengerPrivateReply(instance, {
        commentId: commentId || null,
        postId: postId || null,
        text: replyText
      });
      console.log(`[MetaWebhook] Auto private reply sent for page ${pageId} (${commentId || postId})`);

      privateReplyCache.set(dedupeKey, Date.now());
      setTimeout(() => privateReplyCache.delete(dedupeKey), 30 * 60 * 1000);
    } catch (error) {
      console.warn('[MetaWebhook] Private reply failed:', sanitizeError(error));
    }
  }
};

const processIncomingMessage = async ({
  instance,
  channelType,
  contactNumber,
  pushName,
  text,
  messageType,
  mediaUrl,
  wamid
}) => {
  if (!contactNumber) return;

  const safeText = text || (messageType ? `[${messageType}]` : '[Message]');

  const conversation = await chatService.upsertConversation(
    instance.tenantId,
    contactNumber,
    {
      instanceId: instance.id,
      content: safeText,
      fromMe: false,
      contactName: pushName,
      channelType
    }
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
    socketService.emitChatMessage(instance.tenantId, 'chat:message_received', {
      conversation,
      message: chatMsg
    });
  }

  if (!chatMsg) return;
  if (!text) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: instance.tenantId },
    select: { optoutEnabled: true, optoutMessage: true, optoutKeywords: true }
  });

  const optoutKeywords = tenant?.optoutKeywords?.length
    ? tenant.optoutKeywords
    : ['stop', 'unsubscribe', 'cancel', 'remove', 'optout'];

  const normalizedText = text.toLowerCase().trim();
  const shouldOptOut = tenant?.optoutEnabled !== false && optoutKeywords.some((kw) => {
    const normalizedKeyword = String(kw || '').toLowerCase();
    return normalizedText === normalizedKeyword || normalizedText.includes(normalizedKeyword);
  });

  if (shouldOptOut) {
    await prisma.contact.updateMany({
      where: { tenantId: instance.tenantId, phoneNumber: contactNumber },
      data: { blacklisted: true, blacklistedAt: new Date() }
    });

    const optOutMsg = tenant?.optoutMessage || 'You have been unsubscribed successfully. You will not receive marketing messages from us anymore.';

    if (channelType === 'whatsapp') {
      await metaApi.sendMessage(instance, contactNumber, optOutMsg);
    } else {
      await metaApi.sendMetaMessage(instance, contactNumber, optOutMsg);
    }
    return;
  }

  const rules = await prisma.automationRule.findMany({
    where: { instanceId: instance.id, isActive: true }
  });

  let matched = false;
  for (const rule of rules) {
    if (rule.triggerType === 'keyword' && text.toLowerCase().includes(rule.triggerValue.toLowerCase())) {
      matched = true;
    }
    if (rule.triggerType === 'any_message') {
      matched = true;
    }

    if (matched) {
      if (channelType === 'whatsapp') {
        await metaApi.sendMessage(instance, contactNumber, rule.responseText);
      } else {
        await metaApi.sendMetaMessage(instance, contactNumber, rule.responseText);
      }
      break;
    }
  }

  if (!matched && conversation.aiEnabled && !conversation.escalated) {
    const aiResult = await agentService.processMessage({
      conversationId: conversation.id,
      message: text,
      contactNumber,
      tenantId: instance.tenantId,
      inboundMessageId: chatMsg.id
    });

    if (aiResult?.response) {
      if (channelType === 'whatsapp') {
        await metaApi.sendMessage(instance, contactNumber, aiResult.response);
      } else {
        await metaApi.sendMetaMessage(instance, contactNumber, aiResult.response);
      }

      const saved = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          instanceId: conversation.instanceId || instance.id,
          content: aiResult.response,
          direction: 'outgoing',
          senderNumber: instance.phoneNumberId,
          recipientNumber: contactNumber,
          messageType: 'text',
          wamid: `ai-${Date.now()}`,
          status: 'sent'
        }
      });

      socketService.emitChatMessage(instance.tenantId, 'chat:message_received', {
        conversation,
        message: saved
      });
    }
  }
};

const ingestVerifiedCommentReplies = async (body, runtime = commentReplyRuntime) => {
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  const normalize = body?.object === 'page'
    ? normalizeFacebookComment
    : body?.object === 'instagram'
      ? normalizeInstagramComment
      : null;
  if (!normalize) return;

  for (const entry of entries) {
    for (const event of normalize(entry)) {
      try {
        await runtime.ingest(event);
      } catch (error) {
        if (error?.code !== 'COMMENT_BINDING_NOT_FOUND') throw error;
      }
    }
  }
};

const handleMetaWebhook = async (req, res) => {
  if (req.metaWebhookVerified !== true) {
    return res.status(401).json({ error: 'UNVERIFIED_META_BODY' });
  }

  try {
    await ingestVerifiedCommentReplies(req.body);
  } catch (error) {
    console.error('[MetaWebhook] Comment ingestion failed:', sanitizeError(error));
    return res.sendStatus(503);
  }

  res.sendStatus(200);

  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    if (!entries.length) return;
    
    for (const entry of entries) {
      if (entry.messaging?.length) {
        const payload = entry.messaging[0];
        const channelType = req.body.object === 'instagram' ? 'instagram' : 'messenger';
        const identifier = String(entry.id || payload.recipient?.id || '');

        if (!identifier) continue;

        const instance = await findMetaInstance(identifier, channelType, payload.recipient?.id);
        if (!instance) continue;

        if (payload.read || payload.delivery) continue;

        const contactNumber = String(payload.sender?.id || '').trim();
        if (!contactNumber) continue;

        let messageType = 'text';
        let text = '';
        let mediaUrl = null;
        const wamid = payload.message?.mid || payload.postback?.mid || `meta-${Date.now()}`;

        if (payload.postback) {
          messageType = 'postback';
          text = payload.postback.payload || payload.postback.title || '[Postback]';
        } else if (payload.message) {
          text = payload.message.text || '';

          if (Array.isArray(payload.message.attachments) && payload.message.attachments.length > 0) {
            const attachment = payload.message.attachments[0];
            messageType = attachment.type || 'file';
            if (messageType === 'file') messageType = 'document';
            mediaUrl = attachment.payload?.url || null;

            if (!text) {
              text = `[${messageType.charAt(0).toUpperCase()}${messageType.slice(1)}]`;
            }
          }
        } else {
          continue;
        }

        const profile = await metaApi.getUserProfile(instance, contactNumber);

        await processIncomingMessage({
          instance,
          channelType,
          contactNumber,
          pushName: profile.name,
          text,
          messageType,
          mediaUrl,
          wamid
        });

        continue;
      }

      if (req.body.object === 'whatsapp_business_account' && entry.changes?.length) {
        const payload = entry.changes[0]?.value;
        if (!payload) continue;

        const identifier = String(payload.metadata?.phone_number_id || '').trim();
        if (!identifier) continue;

        const instance = await findMetaInstance(identifier, 'whatsapp');
        if (!instance) continue;

        if (Array.isArray(payload.statuses) && payload.statuses.length) {
          for (const statusItem of payload.statuses) {
            if (['delivered', 'read'].includes(statusItem.status)) {
              await prisma.message.updateMany({
                where: { wamid: statusItem.id },
                data: { status: statusItem.status }
              }).catch(() => {});

              await prisma.chatMessage.updateMany({
                where: { wamid: statusItem.id },
                data: { status: statusItem.status }
              }).catch(() => {});
            }
          }
          continue;
        }

        if (!Array.isArray(payload.messages) || !payload.messages.length) continue;

        const msg = payload.messages[0];
        const contactNumber = String(msg.from || '').trim();
        if (!contactNumber) continue;

        const pushName = payload.contacts?.[0]?.profile?.name || null;
        let messageType = msg.type || 'text';
        let text = '';
        let mediaUrl = null;
        const wamid = msg.id || `wa-${Date.now()}`;

        if (messageType === 'text') {
          text = msg.text?.body || '';
        } else if (['image', 'video', 'audio', 'document'].includes(messageType)) {
          text = msg[messageType]?.caption || '';
          try {
            mediaUrl = await metaApi.getMediaUrl(instance, msg[messageType].id);
          } catch (_) {
            mediaUrl = null;
          }
        }

        await processIncomingMessage({
          instance,
          channelType: 'whatsapp',
          contactNumber,
          pushName,
          text,
          messageType,
          mediaUrl,
          wamid
        });

        continue;
      }

      if (req.body.object === 'page' && entry.changes?.length) {
        await processPageFeedPrivateReplies(entry);
      }
    }
  } catch (error) {
    console.error('[MetaWebhook] Error:', sanitizeError(error));
  }
};

module.exports = {
  handleMetaWebhook,
  ingestVerifiedCommentReplies,
  verifyWebhook
};

