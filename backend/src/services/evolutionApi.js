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
      console.log('Creating instance:', instanceName, 'at', this.baseURL);
      const response = await axios.post(
        `${this.baseURL}/instance/create`,
        {
          instanceName,
          qrcode: true,
        },
        {
          headers: { apikey: this.apiKey },
        }
      );

      console.log('Instance created at Evolution API:', response.data);

      // Save to database
      const instance = await prisma.instance.create({
        data: {
          tenantId,
          instanceName,
          status: 'qr_pending',
          qrCode: response.data.qrcode?.base64 || null,
        },
      });

      // ✨ Auto-configure webhook
      if (process.env.BACKEND_URL && process.env.BACKEND_URL !== 'http://localhost:3000') {
          const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/whatsapp`;
          console.log('Setting webhook for instance:', instanceName, 'URL:', webhookUrl);
          await this.setWebhook(instanceName, webhookUrl, true);
      } else {
          console.warn('⚠️ Webhook NOT set: BACKEND_URL is missing or localhost');
      }

      return {
        ...instance,
        qrCode: response.data.qrcode?.base64,
      };
    } catch (error) {
      const fs = require('fs');
      const errorLog = `
Timestamp: ${new Date().toISOString()}
Message: ${error.message}
Response Data: ${JSON.stringify(error.response?.data, null, 2)}
Status: ${error.response?.status}
Stack: ${error.stack}
----------------------------------------
`;
      fs.appendFileSync('error.log', errorLog);

      console.error('Create instance error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to create instance: ' + (error.response?.data?.error || error.message));
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

      return response.data;
    } catch (error) {
      console.error('Get status error:', error.response?.data || error.message);
      throw new Error('Failed to get instance status');
    }
  }

  /**
   * Send a single text message
   */
  async sendMessage(tenantId, instanceName, number, text) {
    try {
      // Check tenant quota (basic implementation)
      // TODO: Implement proper quota checking based on subscription plan

      const response = await axios.post(
        `${this.baseURL}/message/sendText/${instanceName}`,
        {
          number,
          text,
        },
        {
          headers: { apikey: this.apiKey },
        }
      );

      // Log message to database
      await prisma.message.create({
        data: {
          tenantId,
          instanceId: (await prisma.instance.findFirst({
            where: { instanceName, tenantId },
          })).id,
          recipientNumber: number,
          messageText: text,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Send message error:', error.response?.data || error.message);
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
            events: ['MESSAGES_UPSERT'],
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
