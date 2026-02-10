const axios = require('axios');
const prisma = require('../config/database');

class EvolutionAPI {
  constructor() {
    this.baseURL = process.env.EVOLUTION_API_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY?.trim();
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(tenantId, instanceName) {
    try {
      // Sanitize instance name (remove spaces)
      const sanitizedInstanceName = instanceName.replace(/\s+/g, '');
      console.log('Creating instance:', sanitizedInstanceName, 'at', this.baseURL);
      
      const response = await axios.post(
        `${this.baseURL}/instance/create`,
        {
          instanceName: sanitizedInstanceName,
          token: sanitizedInstanceName, // Often used as token too
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS', // Required for v2
        },
        {
          headers: { apikey: this.apiKey },
          timeout: 40000 // Increase timeout to 40s
        }
      );

      console.log('Instance created at Evolution API:', JSON.stringify(response.data));

      let qrCode = response.data.qrcode?.base64 || response.data.qrcode;

      // Fallback: If no QR code returned, try to fetch it via connect endpoint
      if (!qrCode) {
        console.log('QR code not returned in create response, fetching via /connect...');
        try {
          const connectRes = await axios.get(
            `${this.baseURL}/instance/connect/${sanitizedInstanceName}`,
            {
              headers: { apikey: this.apiKey },
              timeout: 20000
            }
          );
          qrCode = connectRes.data?.qrcode?.base64 || connectRes.data?.base64;
          console.log('QR code fetched via /connect:', qrCode ? 'Success' : 'Failed');
        } catch (connectErr) {
          console.error('Failed to fetch QR via /connect:', connectErr.message);
        }
      }

      // Save to database
      const instance = await prisma.instance.create({
        data: {
          tenantId,
          instanceName: sanitizedInstanceName,
          status: 'qr_pending',
          qrCode: qrCode || null,
        },
      });

    // ✨ Auto-configure webhook
    // Use internal service name for Docker network communication
    // ✨ Auto-configure webhook
    // Use public or internal URL from env
    const webhookUrl = process.env.WEBHOOK_INTERNAL_URL 
      || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhooks/whatsapp`;
    
    console.log('Setting webhook for instance:', sanitizedInstanceName, 'URL:', webhookUrl);
    // Don't await webhook setup to speed up response
    this.setWebhook(sanitizedInstanceName, webhookUrl, true).catch(err => 
      console.error('Background webhook setup failed:', err.message)
    );

      return {
        ...instance,
        qrCode: qrCode,
      };
    } catch (error) {
      const fs = require('fs');
      const errorResponse = error.response?.data;
      const errorLog = `
Timestamp: ${new Date().toISOString()}
Message: ${error.message}
Response Data: ${JSON.stringify(errorResponse, null, 2)}
Status: ${error.response?.status}
Stack: ${error.stack}
----------------------------------------
`;
      fs.appendFileSync('error.log', errorLog);

      console.error('Create instance error details:', {
        message: error.message,
        response: errorResponse,
        status: error.response?.status
      });
      
      // Extract specific validation message if available
      const specificMessage = errorResponse?.response?.message || errorResponse?.message || error.message;
      throw new Error('Failed to create instance: ' + (Array.isArray(specificMessage) ? specificMessage.join(', ') : specificMessage));
    }
  }

  /**
   * Get instance connection status
   */
  async getInstanceStatus(instanceName) {
    try {
      const response = await axios.get(
        `${this.baseURL}/instance/connectionState/${instanceName}`,
        {
          headers: { apikey: this.apiKey },
        }
      );

      console.log(`[getInstanceStatus] ${instanceName}:`, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Get status error:', error.response?.data || error.message);
      throw new Error('Failed to get instance status');
    }
  }

  /**
   * Send a single text message via Evolution API
   * Note: Message DB record should be created by the caller (queueService)
   */
  async sendMessage(tenantId, instanceName, number, text, mediaUrl = null, mediaType = null) {
    try {
      console.log(`[sendMessage] Sending to ${number} via ${instanceName} (Media: ${mediaUrl ? 'Yes' : 'No'})`);
      
      let response;
      
      if (mediaUrl) {
        // Send Media Message
        response = await axios.post(
          `${this.baseURL}/message/sendMedia/${instanceName}`,
          {
            number,
            mediatype: mediaType || 'document',
            mimetype: mediaType === 'image' ? 'image/jpeg' : (mediaType === 'video' ? 'video/mp4' : 'application/pdf'), // Simple fallback
            caption: text,
            media: mediaUrl,
            fileName: mediaUrl.split('/').pop()
          },
          {
            headers: { apikey: this.apiKey },
          }
        );
      } else {
        // Send Text Message
        response = await axios.post(
          `${this.baseURL}/message/sendText/${instanceName}`,
          {
            number,
            text,
          },
          {
            headers: { apikey: this.apiKey },
          }
        );
      }

      console.log(`[sendMessage] Success:`, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('[sendMessage] Error:', error.response?.data || error.message);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Delete an instance
   */
  async deleteInstance(instanceName) {
    try {
      await axios.delete(
        `${this.baseURL}/instance/delete/${instanceName}`,
        {
          headers: { apikey: this.apiKey },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Delete instance error:', error.response?.data || error.message);
      throw new Error('Failed to delete instance');
    }
  }

  /**
   * Fetch QR Code for an existing instance
   */
  async fetchQrCode(instanceName) {
    try {
      console.log(`Fetching QR code for ${instanceName}...`);
      const response = await axios.get(
        `${this.baseURL}/instance/connect/${instanceName}`,
        {
          headers: { apikey: this.apiKey },
          timeout: 20000
        }
      );
      return response.data?.qrcode?.base64 || response.data?.base64 || response.data?.qrcode;
    } catch (error) {
      console.error('Fetch QR error:', error.response?.data || error.message);
      throw new Error('Failed to fetch QR code');
    }
  }
  /**
   * Set Webhook for instance
   */
  async setWebhook(instanceName, webhookUrl, enabled = true) {
    try {
      const response = await axios.post(
        `${this.baseURL}/webhook/set/${instanceName}`,
        {
          webhook: {
            url: webhookUrl,
            byEvents: true,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED'
            ],
            enabled
          }
        },
        {
          headers: { apikey: this.apiKey },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Set webhook error:', error.response?.data || error.message);
      // Don't throw, just log. Webhook might already be set or API might vary.
      return null; 
    }
  }
}

module.exports = new EvolutionAPI();
