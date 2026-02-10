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
        // Instance is connected
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
      const messageUpdate = data[0]; // Usually an array of updates
      if (!messageUpdate) return res.status(200).send('OK');

      const { key, update } = messageUpdate;
      const remoteJid = key.remoteJid;
      const status = update.status; 
      const wamid = key.id;

      // Status codes: 3 = DELIVERED, 4 = READ
      // Note: Evolution API might send 'DELIVERY_ACK' or similar depending on version, 
      // but 'messages.update' usually has numeric status or string status.
      // 3 = delivered, 4 = read, 5 = played
      
      let statusString = null;
      if (status === 3 || status === 'DELIVERY_ACK') statusString = 'DELIVERED';
      if (status === 4 || status === 'READ') statusString = 'READ';
      if (status === 5 || status === 'PLAYED') statusString = 'READ';

      if (statusString && wamid) {
        console.log(`[Webhook] Message update for ${remoteJid}: status ${status} (${statusString})`);
        
        try {
          // Find the message by wamid
          const message = await prisma.message.findUnique({
            where: { wamid },
            include: { campaign: true }
          });

          if (message) {
             // Update status
             const updateData = { status: statusString };
             if (statusString === 'DELIVERED') updateData.deliveredAt = new Date();
             
             await prisma.message.update({
               where: { id: message.id },
               data: updateData
             });

             // Update campaign stats
             // If transitioning from SENT to DELIVERED or DELIVERED to READ
             // For simplicity, we might just re-count or increment specific counters if we had them.
             // Currently Campaign has sentCount and failedCount. 
             // We could add deliveredCount and readCount to Campaign schema later.
             
             // Emit socket event
             // Emit socket event
             const socketService = require('../services/socketService');
             // Emit to campaign room if campaignId exists
             if (message.campaignId) {
                // Fetch latest stats only if needed, or pass minimal info.
                // For global progress, we need campaign name.
                // message.campaign is included in the query above.
                
                socketService.emitCampaignProgress(message.campaignId, message.campaign.tenantId, {
                  type: 'MESSAGE_UPDATE',
                  messageId: message.id,
                  status: statusString,
                  campaignName: message.campaign.name,
                  totalContacts: message.campaign.totalContacts,
                  // We could calculate percent here if we tracked counters on campaign
                  // For now frontend will have to approximate or fetch
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

    // Extract message content (support text and conversation)
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

    // Generate AI Response
    const aiResponse = await aiService.generateResponse(
      text,
      'You are a helpful customer support agent for ' + (instance.tenant?.name || 'our company') + '. Keep responses concise.'
    );

    console.log(`[Webhook] AI Response: ${aiResponse}`);

    // Send Response
    await evolutionApi.sendMessage(
      instance.tenantId,
      instanceName,
      remoteJid.replace('@s.whatsapp.net', ''),
      aiResponse
    );

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { handleIncomingMessage };
