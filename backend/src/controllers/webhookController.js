const aiService = require('../services/aiService');
const evolutionApi = require('../services/evolutionApi');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleIncomingMessage = async (req, res) => {
  try {
    const { event, instance: instanceName, data } = req.body;

    console.log(`[Webhook] Received event: ${event} for instance: ${instanceName}`);

    // Handle connection status updates
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      console.log(`[Webhook] Connection update for ${instanceName}:`, data);
      
      if (data.state === 'open') {
        await prisma.instance.update({
          where: { instanceName },
          data: { 
            status: 'connected',
            phoneNumber: data.phoneNumber || null
          }
        });
        console.log(`[Webhook] Instance ${instanceName} marked as connected`);
      }
      
      return res.status(200).send('OK');
    }

    // Handle message status updates (DELIVERED, READ)
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      const messageUpdate = data[0];
      if (!messageUpdate) return res.status(200).send('OK');

      const { key, update } = messageUpdate;
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

             const socketService = require('../services/socketService');
             if (message.campaignId) {
                socketService.emitCampaignProgress(message.campaignId, message.campaign.tenantId, {
                  type: 'MESSAGE_UPDATE',
                  messageId: message.id,
                  status: statusString,
                  campaignName: message.campaign.name,
                  totalContacts: message.campaign.totalContacts,
                });
             }
          } else {
             console.log(`[Webhook] Message with wamid ${wamid} not found in DB`);
          }
        } catch (err) {
          console.error('[Webhook] Error updating message status:', err);
        }
      }
      return res.status(200).send('OK');
    }

    // Only process text messages (Upsert)
    if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      return res.status(200).send('OK');
    }

    const messageData = data.message;
    if (!messageData) return res.status(200).send('OK');

    const text = messageData.conversation || messageData.extendedTextMessage?.text;
    const remoteJid = data.key.remoteJid;
    const fromMe = data.key.fromMe;

    // Ignore messages sent by me
    if (fromMe || !text) {
      return res.status(200).send('OK');
    }

    console.log(`[Webhook] Received message from ${remoteJid}: ${text}`);

    // Find instance
    const instance = await prisma.instance.findUnique({
      where: { instanceName },
      include: { tenant: true }
    });

    if (!instance) {
      console.error(`[Webhook] Instance ${instanceName} not found`);
      return res.status(200).send('OK');
    }

    // ====== AUTOMATION RULES CHECK ======
    // Find active automation rules for this instance
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
          // Check if message contains the keyword (case-insensitive)
          if (rule.triggerValue && text.toLowerCase().includes(rule.triggerValue.toLowerCase())) {
            shouldTrigger = true;
          }
          break;

        case 'any_message':
          // Trigger on any incoming message
          shouldTrigger = true;
          break;

        case 'welcome':
          // Check if this is the first message from this contact
          const existingMessages = await prisma.message.count({
            where: {
              instanceId: instance.id,
              recipientNumber: remoteJid.replace('@s.whatsapp.net', ''),
              tenantId: instance.tenantId
            }
          });
          if (existingMessages === 0) {
            shouldTrigger = true;
          }
          break;
      }

      if (shouldTrigger) {
        console.log(`[Webhook] Automation rule matched: "${rule.name}" (${rule.triggerType})`);
        
        // Send the automation response
        await evolutionApi.sendMessage(
          instance.tenantId,
          instanceName,
          remoteJid.replace('@s.whatsapp.net', ''),
          rule.responseText
        );

        matched = true;
        break; // Stop after first match
      }
    }

    // ====== FALLBACK: AI Response (if no automation rule matched) ======
    if (!matched) {
      const aiResponse = await aiService.generateResponse(
        text,
        'You are a helpful customer support agent for ' + (instance.tenant?.name || 'our company') + '. Keep responses concise.'
      );

      console.log(`[Webhook] AI Response: ${aiResponse}`);

      await evolutionApi.sendMessage(
        instance.tenantId,
        instanceName,
        remoteJid.replace('@s.whatsapp.net', ''),
        aiResponse
      );
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { handleIncomingMessage };
