const fs = require('fs');

let code = fs.readFileSync('src/services/toolService.js', 'utf8');

// 1. Add requirement
code = code.replace(
  "const driveService = require('./driveService');",
  "const driveService = require('./driveService');\nconst sheetsService = require('./sheetsService');"
);

// 2. Add Handlers to constructor
code = code.replace(
  "search_drive_files: this.handleDriveSearch.bind(this)",
  "search_drive_files: this.handleDriveSearch.bind(this),\n            create_spreadsheet: this.handleCreateSpreadsheet.bind(this),\n            append_sheet_row: this.handleAppendSheetRow.bind(this),\n            read_sheet_data: this.handleReadSheetData.bind(this)"
);

// 3. Add Tool Definitions
const sheetsDefinitions = `
        // Sheets
        if (actionConfig.google_sheets?.enabled) {
            tools.push({
                type: 'function',
                function: {
                    name: 'create_spreadsheet',
                    description: 'Create a new blank Google Spreadsheet',
                    parameters: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', description: 'Name of the new spreadsheet' }
                        },
                        required: ['title']
                    }
                }
            });

            tools.push({
                type: 'function',
                function: {
                    name: 'append_sheet_row',
                    description: 'Append a new row of data to a Google Spreadsheet',
                    parameters: {
                        type: 'object',
                        properties: {
                            spreadsheetId: { type: 'string', description: 'The ID of the spreadsheet (found in its URL)' },
                            range: { type: 'string', description: 'The range or sheet name, e.g. Sheet1!A1' },
                            values: { type: 'array', items: { type: 'string' }, description: 'Array of string values to append as a row, e.g. ["John", "Doe", "john@email.com"]' }
                        },
                        required: ['spreadsheetId', 'values']
                    }
                }
            });

            tools.push({
                type: 'function',
                function: {
                    name: 'read_sheet_data',
                    description: 'Read rows of data from a Google Spreadsheet',
                    parameters: {
                        type: 'object',
                        properties: {
                            spreadsheetId: { type: 'string', description: 'The ID of the spreadsheet' },
                            range: { type: 'string', description: 'The range to read, e.g. Sheet1!A1:D10' }
                        },
                        required: ['spreadsheetId']
                    }
                }
            });
        }
`;

code = code.replace(
  'return tools;',
  sheetsDefinitions + '\n        return tools;'
);

// 4. Add Helper Handlers
const sheetsHandlers = `
    /**
     * HANDLER: Create Spreadsheet
     */
    async handleCreateSpreadsheet(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_sheets');
            return await sheetsService.createSpreadsheet(credentials, args.title);
        } catch (error) {
            console.error('[ToolService] Create Spreadsheet Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * HANDLER: Append Sheet Row
     */
    async handleAppendSheetRow(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_sheets');
            return await sheetsService.appendRow(credentials, args.spreadsheetId, args.range, args.values);
        } catch (error) {
            console.error('[ToolService] Append Sheet Row Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * HANDLER: Read Sheet Data
     */
    async handleReadSheetData(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_sheets');
            return await sheetsService.readRows(credentials, args.spreadsheetId, args.range);
        } catch (error) {
            console.error('[ToolService] Read Sheet Data Error:', error);
            return { success: false, error: error.message };
        }
    }
`;

code = code.replace(
  'module.exports = new ToolService();',
  sheetsHandlers + '\nmodule.exports = new ToolService();'
);

fs.writeFileSync('src/services/toolService.js', code);
console.log('patched toolService.js for google sheets');
