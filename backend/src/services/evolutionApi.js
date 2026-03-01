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
      // Sanitize instance name: only ASCII alphanumeric, hyphens, underscores
      // Arabic/Unicode chars crash Evolution API webhook headers (ERR_INVALID_CHAR)
      const sanitizedInstanceName = instanceName
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .substring(0, 50) || `instance_${Date.now()}`;
      console.log('Creating instance:', sanitizedInstanceName, 'at', this.baseURL);

      const response = await axios.post(
        `${this.baseURL}/instance/create`,
        {
          instanceName: sanitizedInstanceName,
          token: sanitizedInstanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          // ✨ Stabilization flags for v2
          reject_call: false,
          always_online: true,
          groups_ignore: true,
        },
        {
          headers: { apikey: this.apiKey },
          timeout: 40000 // Increase timeout to 40s
        }
      );

      console.log('Instance created at Evolution API:', JSON.stringify(response.data));

      let qrCode = response.data.qrcode?.base64 || response.data.qrcode;

      // Ensure qrCode is a string, not an object, to prevent Prisma validation errors
      if (qrCode && typeof qrCode === 'object') {
        qrCode = qrCode.base64 || JSON.stringify(qrCode);
      }

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
      // Use Docker internal networking (both containers share the 'coolify' network)
      // Container name may change on redeploy — override with WEBHOOK_INTERNAL_URL env var if needed
      const defaultWebhookBase = 'http://i0kwck044gc80s0osco8w0wg-043518589710:3000';
      const webhookUrl = `${process.env.WEBHOOK_INTERNAL_URL || defaultWebhookBase}/api/webhooks/receive`;

      console.log('Setting webhook for instance:', sanitizedInstanceName, 'URL:', webhookUrl);
      // Don't await webhook setup to speed up response
      this.setWebhook(sanitizedInstanceName, webhookUrl, true, tenantId).catch(err =>
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

  async sendMessage(tenantId, instanceName, number, text, mediaUrl = null, mediaType = null) {
    let response;
    let attempts = 0;
    const maxAttempts = 2;
    const sendTimeout = 60000; // Increase to 60 seconds for higher reliability

    while (attempts < maxAttempts) {
      try {
        attempts++;
        if (mediaUrl) {
          // Send Media Message
          response = await axios.post(
            `${this.baseURL}/message/sendMedia/${instanceName}`,
            {
              number,
              mediatype: mediaType || 'document',
              mimetype: mediaType === 'image' ? 'image/jpeg' : (mediaType === 'video' ? 'video/mp4' : 'application/pdf'),
              caption: text,
              media: mediaUrl,
              fileName: mediaUrl.split('/').pop()
            },
            {
              headers: { apikey: this.apiKey },
              timeout: sendTimeout
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
              timeout: sendTimeout
            }
          );
        }

        console.log(`[sendMessage] Success (Attempt ${attempts}):`, JSON.stringify(response.data));
        return response.data;
      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const errMsg = isTimeout
          ? `Timeout after ${sendTimeout / 1000}s calling ${this.baseURL}`
          : (error.response?.data?.message || error.message);

        console.error(`[sendMessage] Error (Attempt ${attempts}/${maxAttempts}) sending to ${number} via ${instanceName}:`, errMsg);

        if (attempts >= maxAttempts) {
          throw new Error('Failed to send message: ' + errMsg);
        }

        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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
   * Fetch all conversations for an instance
   */
  async fetchConversations(instanceName) {
    try {
      const response = await axios.get(
        `${this.baseURL}/chat/findChat/${instanceName}`,
        {
          headers: { apikey: this.apiKey },
          timeout: 20000
        }
      );
      return response.data;
    } catch (error) {
      console.error(`[fetchConversations] Error for ${instanceName}:`, error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Fetch messages for a specific conversation
   */
  async fetchMessages(instanceName, number, count = 50) {
    try {
      const response = await axios.get(
        `${this.baseURL}/chat/findMessages/${instanceName}`,
        {
          params: { number, count },
          headers: { apikey: this.apiKey },
          timeout: 20000
        }
      );
      return response.data;
    } catch (error) {
      console.error(`[fetchMessages] Error for ${number} in ${instanceName}:`, error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Set Webhook for instance
   */
  async setWebhook(instanceName, webhookUrl, enabled = true, tenantId = null) {
    try {
      const webhookHeaders = {
        'X-Instance-Name': encodeURIComponent(instanceName)
      };
      if (tenantId) webhookHeaders['X-Tenant-ID'] = tenantId;

      const response = await axios.post(
        `${this.baseURL}/webhook/set/${instanceName}`,
        {
          webhook: {
            enabled,
            url: webhookUrl,
            webhookByEvents: false, // ✅ Important for v2 compatibility
            webhookBase64: false,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
              'SEND_MESSAGE'
            ],
            headers: webhookHeaders
          }
        },
        {
          headers: { apikey: this.apiKey },
        }
      );

      console.log(`✅ Webhook configured for ${instanceName} → ${webhookUrl}`);
      return response.data;
    } catch (error) {
      console.error('Set webhook error:', error.response?.data || error.message);
      // Don't throw, just log. Webhook might already be set or API might vary.
      return null;
    }
  }
}

module.exports = new EvolutionAPI();
