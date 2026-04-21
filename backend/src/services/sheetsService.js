const { google } = require('googleapis');

/**
 * Google Sheets Service
 * Uses dynamically supplied auth tokens.
 */
class SheetsService {
    constructor() {}

    /**
     * Get sheets client with specific OAuth credentials
     */
    getSheets(creds) {
        const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        oauth2Client.setCredentials({
            access_token: creds.access_token,
            refresh_token: creds.refresh_token,
            expiry_date: creds.expiry_date
        });
        return google.sheets({ version: 'v4', auth: oauth2Client });
    }

    /**
     * Create a new blank Google Spreadsheet
     */
    async createSpreadsheet(creds, title) {
        try {
            const sheets = this.getSheets(creds);
            
            const spRes = await sheets.spreadsheets.create({
                resource: {
                    properties: { title: title || 'ValueWats Export Sheet' }
                },
                fields: 'spreadsheetId, spreadsheetUrl'
            });

            // Since it's created by OAuth user, they already own it. 
            // We just return the id and url so the AI can give it to them.
            return { 
                success: true, 
                spreadsheetId: spRes.data.spreadsheetId,
                url: spRes.data.spreadsheetUrl 
            };
        } catch (error) {
            console.error('[SheetsService] Create Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Append a row of data to a sheet
     */
    async appendRow(creds, spreadsheetId, range, values) {
        try {
            const sheets = this.getSheets(creds);
            
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: range || 'Sheet1!A1',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [values] // Must be a 2D array: [ ["row1col1", "row1col2"] ]
                }
            });

            return { 
                success: true, 
                updates: response.data.updates 
            };
        } catch (error) {
            console.error('[SheetsService] Append Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Read data from a sheet
     */
    async readRows(creds, spreadsheetId, range) {
        try {
            const sheets = this.getSheets(creds);
            
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: range || 'Sheet1!A:Z',
            });

            return { 
                success: true, 
                rows: response.data.values || [] 
            };
        } catch (error) {
            console.error('[SheetsService] Read Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SheetsService();
