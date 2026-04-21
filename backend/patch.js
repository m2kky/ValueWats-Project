const fs = require('fs');
let code = fs.readFileSync('src/services/integration.service.js', 'utf8');
const newMethods = `
  async createOAuthPending(tenantId, name, clientId, clientSecret, redirectUri) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly']
    });

    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: 'google_oauth',
        name,
        credentials: encrypt(JSON.stringify({ clientId, clientSecret, redirectUri })),
        status: 'pending'
      }
    });
    return { authUrl: url + '&state=' + integration.id };
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
`;
code = code.replace('// --- Handlers ---', newMethods + '\n  // --- Handlers ---');
fs.writeFileSync('src/services/integration.service.js', code);
console.log('Done!');
