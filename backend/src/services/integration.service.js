const prisma = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const axios = require('axios');

class IntegrationService {

  /**
   * List all integrations for a tenant
   */
  async listIntegrations(tenantId) {
    const integrations = await prisma.integration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    // Do not return full credentials, just mask them or return status
    return integrations.map(i => ({
      ...i,
      credentials: i.credentials ? '******' : null
    }));
  }

  /**
   * Create or Update an integration
   */
  async upsertIntegration(tenantId, type, name, credentials) {
    const encryptedCreds = encrypt(credentials);

    // Check if exists by name/type preference? unique constraint is not on name, but let's assume multiple allowed
    // For now, simple create
    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type,
        name,
        credentials: encryptedCreds,
        status: 'active'
      }
    });

    return integration;
  }

  /**
   * Get integration with decrypted credentials (Internal use only)
   */
  async getIntegrationInternal(id) {
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) throw new Error('Integration not found');

    return {
      ...integration,
      credentials: decrypt(integration.credentials)
    };
  }

  /**
   * Execute an action on an integration
   * @param {string} integrationId 
   * @param {string} action - e.g. 'append_row'
   * @param {object} params - e.g. { spreadsheetId: '...', values: ['a', 'b'] }
   */
  async executeAction(integrationId, action, params) {
    const integration = await this.getIntegrationInternal(integrationId);

    try {
      if (integration.type === 'google_sheets') {
        return await this.handleGoogleSheetsAction(integration, action, params);
      } else if (integration.type === 'webhook') {
        return await this.handleWebhookAction(integration, action, params);
      } else {
        throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      console.error(`[IntegrationService] Action failed: ${error.message}`);
      // Update status if auth failed?
      throw error;
    }
  }

  // --- Handlers ---

  async handleGoogleSheetsAction(integration, action, params) {
    const { google } = require('googleapis');
    const credentials = decrypt(integration.credentials); // { client_email, private_key }
    const { spreadsheetId, range, values } = params;

    if (action === 'append_row') {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Append values
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: range || 'Sheet1!A1',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [values] // values must be an array of arrays [[col1, col2]]
          }
        });

        console.log(`[GoogleSheets] Appended to ${spreadsheetId}`, response.data.updates);
        return { success: true, updates: response.data.updates };
      } catch (error) {
        console.error('[GoogleSheets] Error:', error);
        throw new Error(`Google Sheets API Error: ${error.message}`);
      }
    }

    throw new Error(`Unknown Google Sheets action: ${action}`);
  }

  async handleWebhookAction(integration, action, params) {
    const { url, method = 'POST', headers = {}, body } = params;
    // 'credentials' might store a default Token/API Key if needed

    const response = await axios({
      method,
      url,
      headers,
      data: body
    });

    return response.data;
  }
}

module.exports = new IntegrationService();
