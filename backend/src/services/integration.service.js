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

  
  async createOAuthPending(tenantId, name, clientId, clientSecret, redirectUri, specificType) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets']
    });

    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: specificType || 'google_oauth',
        name,
        credentials: encrypt(JSON.stringify({ clientId, clientSecret, redirectUri })),
        status: 'pending'
      }
    });
    return { authUrl: url + '&state=' + integration.id };
  }

  async createNotionOAuthPending(tenantId) {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'https://valuechat.app'}/api/oauth/notion/callback`;
    
    if (!clientId) {
      throw new Error('NOTION_CLIENT_ID is not configured in environment variables');
    }

    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: 'notion_oauth',
        name: 'Notion Workspace',
        credentials: encrypt(JSON.stringify({ initialized: true })), // placeholder
        status: 'pending'
      }
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${integration.id}`;
    return { authUrl };
  }

  async completeOAuth(integrationId, code) {
    const { google } = require('googleapis');
    const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (!integration) throw new Error('Integration not found');
    const creds = JSON.parse(decrypt(integration.credentials));
    
    const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    const updatedCreds = { ...creds, ...tokens };
    await prisma.integration.update({
      where: { id: integrationId },
      data: { credentials: encrypt(JSON.stringify(updatedCreds)), status: 'active' }
    });
    return true;
  }

  async completeNotionOAuth(integrationId, code) {
    const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (!integration) throw new Error('Integration not found');

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${process.env.BACKEND_URL || 'https://valuechat.app'}/api/oauth/notion/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Notion OAuth credentials are not configured in the server');
    }

    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post('https://api.notion.com/v1/oauth/token', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encoded}`
        }
      });

      const tokens = response.data; // { access_token, workspace_id, workspace_name, bot_id }
      
      await prisma.integration.update({
        where: { id: integrationId },
        data: { 
          name: tokens.workspace_name ? `Notion (${tokens.workspace_name})` : 'Notion Workspace',
          credentials: encrypt(JSON.stringify(tokens)), 
          status: 'active' 
        }
      });

      return true;
    } catch (error) {
      console.error('[Notion OAuth] Token Exchange Error:', error.response?.data || error.message);
      throw new Error('Failed to authorize with Notion');
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
