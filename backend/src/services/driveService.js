const { google } = require('googleapis');
const { Readable } = require('stream');

/**
 * Google Drive Service
 * Uses dynamically supplied auth tokens.
 */
class DriveService {
    constructor() {}

    /**
     * Get drive client with specific OAuth credentials
     */
    getDrive(creds) {
        const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        oauth2Client.setCredentials({
            access_token: creds.access_token,
            refresh_token: creds.refresh_token,
            expiry_date: creds.expiry_date
        });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    /**
     * Upload a string content as a generic file to Google Drive
     */
    async uploadFile(creds, { name, mimeType = 'text/plain', content }) {
        try {
            const drive = this.getDrive(creds);
            
            const fileMetadata = { name };
            const media = {
                mimeType,
                body: Readable.from([content])
            };

            const file = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink',
            });

            // Make public by default to ensure the user/agent can read it easily
            await drive.permissions.create({
                fileId: file.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
            });

            const link = (await drive.files.get({ fileId: file.data.id, fields: 'webViewLink' })).data.webViewLink;

            return { success: true, fileId: file.data.id, link };
        } catch (error) {
            console.error('[DriveService] Upload Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search files
     */
    async searchFiles(creds, queryStr) {
        try {
            const drive = this.getDrive(creds);
            
            // Format example: name contains 'invoice' or fullText contains 'invoice'
            let q = "trashed = false";
            if (queryStr) {
                q += ` and (name contains '${queryStr.replace(/'/g, "\\'")}')`;
            }

            const res = await drive.files.list({
                q,
                pageSize: 10,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            return { success: true, files: res.data.files };
        } catch (error) {
            console.error('[DriveService] Search Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new DriveService();
