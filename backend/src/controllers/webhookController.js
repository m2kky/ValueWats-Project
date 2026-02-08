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

    // Only process text messages
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

    // Find instance and tenant to check AI settings (future: enable/disable AI per tenant)
    const instance = await prisma.instance.findUnique({
      where: { instanceName },
      include: { tenant: true } // Assuming we might store AI prompt in tenant settings later
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
      remoteJid.replace('@s.whatsapp.net', ''), // Extract number
      aiResponse
    );

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { handleIncomingMessage };
