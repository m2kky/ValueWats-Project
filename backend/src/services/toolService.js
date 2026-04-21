const emailService = require('./emailService');
const calendarService = require('./calendarService');
const driveService = require('./driveService');
const sheetsService = require('./sheetsService');
const prisma = require('../config/database');
const { decrypt } = require('../utils/encryption');
const NotionService = require('./notionService');

class ToolService {
    constructor() {
        this.handlers = {
            send_email: this.handleSendEmail.bind(this),
            create_calendar_event: this.handleCreateCalendarEvent.bind(this),
            get_calendar_events: this.handleGetCalendarEvents.bind(this),
            upload_drive_file: this.handleDriveUpload.bind(this),
            search_drive_files: this.handleDriveSearch.bind(this),
            create_spreadsheet: this.handleCreateSpreadsheet.bind(this),
            append_sheet_row: this.handleAppendSheetRow.bind(this),
            read_sheet_data: this.handleReadSheetData.bind(this),
            search_notion: this.handleSearchNotion.bind(this),
            create_notion_page: this.handleCreateNotionPage.bind(this),
            update_notion_page: this.handleUpdateNotionPage.bind(this),
            append_notion_block: this.handleAppendNotionBlock.bind(this),
            archive_notion_page: this.handleArchiveNotionPage.bind(this)
        };
    }

    /**
     * Get tool definitions for the AI model dynamically based on Agent Config
     */
    getToolDefinitions(actionConfig = {}) {
        const tools = [];

        // Calendar
        if (actionConfig.google_calendar_create?.enabled || actionConfig.google_calendar_read?.enabled) {
            if (actionConfig.google_calendar_create?.enabled) {
                tools.push({
                    type: 'function',
                    function: {
                        name: 'create_calendar_event',
                        description: 'Create a new event on Google Calendar',
                        parameters: {
                            type: 'object',
                            properties: {
                                summary: { type: 'string', description: 'Event title' },
                                description: { type: 'string', description: 'Event description' },
                                start: { type: 'string', description: 'Start time (ISO 8601 format, e.g. 2026-03-01T10:00:00Z)' },
                                end: { type: 'string', description: 'End time (ISO 8601 format)' }
                            },
                            required: ['summary', 'start', 'end']
                        }
                    }
                });
            }
            if (actionConfig.google_calendar_read?.enabled) {
                tools.push({
                    type: 'function',
                    function: {
                        name: 'get_calendar_events',
                        description: 'List upcoming events from Google Calendar',
                        parameters: {
                            type: 'object',
                            properties: {
                                maxResults: { type: 'number', description: 'Maximum number of events to return' }
                            }
                        }
                    }
                });
            }
        }

        // Drive
        if (actionConfig.google_drive_upload?.enabled || actionConfig.google_drive_search?.enabled) {
            if (actionConfig.google_drive_upload?.enabled) {
                tools.push({
                    type: 'function',
                    function: {
                        name: 'upload_drive_file',
                        description: 'Upload text or content as a file to Google Drive',
                        parameters: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Name of the file' },
                                content: { type: 'string', description: 'The text content to save in the file' }
                            },
                            required: ['name', 'content']
                        }
                    }
                });
            }

            if (actionConfig.google_drive_search?.enabled) {
                tools.push({
                    type: 'function',
                    function: {
                        name: 'search_drive_files',
                        description: 'Search Google Drive for files and get their links',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'The search query (e.g., file name like invoice, report)' }
                            },
                            required: ['query']
                        }
                    }
                });
            }
        }

        
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

        // Notion
        if (actionConfig.notion?.enabled) {
            tools.push({
                type: 'function',
                function: {
                    name: 'search_notion',
                    description: 'Search the Notion workspace for pages and databases',
                    parameters: {
                        type: 'object',
                        properties: { query: { type: 'string', description: 'Search term' } },
                        required: ['query']
                    }
                }
            });
            tools.push({
                type: 'function',
                function: {
                    name: 'create_notion_page',
                    description: 'Create a new Notion page or add a database row',
                    parameters: {
                        type: 'object',
                        properties: {
                            parent: { type: 'object', description: 'JSON object specifying the parent e.g., {"database_id": "..."}' },
                            properties: { type: 'object', description: 'JSON object of page properties / database row data' },
                            children: { type: 'array', description: 'Optional array of block objects to add into the new page' }
                        },
                        required: ['parent', 'properties']
                    }
                }
            });
            tools.push({
                type: 'function',
                function: {
                    name: 'update_notion_page',
                    description: 'Update properties of an existing Notion database row or page',
                    parameters: {
                        type: 'object',
                        properties: {
                            pageId: { type: 'string', description: 'ID of the page/row to update' },
                            properties: { type: 'object', description: 'JSON object of properties to update' }
                        },
                        required: ['pageId', 'properties']
                    }
                }
            });
            tools.push({
                type: 'function',
                function: {
                    name: 'append_notion_block',
                    description: 'Append content block to an existing Notion page',
                    parameters: {
                        type: 'object',
                        properties: {
                            blockId: { type: 'string', description: 'ID of the block/page to append to' },
                            children: { type: 'array', description: 'Array of block objects' }
                        },
                        required: ['blockId', 'children']
                    }
                }
            });
            tools.push({
                type: 'function',
                function: {
                    name: 'archive_notion_page',
                    description: 'Archive (delete) a Notion page or database row',
                    parameters: {
                        type: 'object',
                        properties: {
                            pageId: { type: 'string', description: 'ID of the page/row to archive' }
                        },
                        required: ['pageId']
                    }
                }
            });
        }

        return tools;
    }

    /**
     * Execute a tool call
     */
    async execute(name, args, context) {
        if (this.handlers[name]) {
            console.log(`[ToolService] Executing tool: ${name}`, args);
            return await this.handlers[name](args, context);
        }
        throw new Error(`Tool handler for "${name}" not found`);
    }

    /**
     * HANDLER: Send Email
     */
    async handleSendEmail(args, { tenantId }) {
        return await emailService.sendEmail({
            to: args.to,
            subject: args.subject,
            html: args.body
        });
    }

    /**
     * Helper: Fetch Google Credentials securely
     */
    async getGoogleCredentials(tenantId, actionConfig, actionKey) {
        const integrationId = actionConfig?.[actionKey]?.integrationId;

        if (!integrationId) {
            throw new Error(`Integration ID not configured for action: ${actionKey}`);
        }

        const integration = await prisma.integration.findUnique({
            where: { id: integrationId, tenantId }
        });

        if (!integration || integration.status !== 'active') {
            throw new Error(`Integration not found or inactive`);
        }

        return JSON.parse(decrypt(integration.credentials));
    }

    /**
     * HANDLER: Create Calendar Event
     */
    async handleCreateCalendarEvent(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_calendar_create');
            return await calendarService.createEvent(credentials, args);
        } catch (error) {
            console.error('[ToolService] Create Calendar Event Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * HANDLER: Get Calendar Events
     */
    async handleGetCalendarEvents(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_calendar_read');
            return await calendarService.listEvents(credentials, args.maxResults || 10);
        } catch (error) {
            console.error('[ToolService] Get Calendar Events Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * HANDLER: Drive Upload
     */
    async handleDriveUpload(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_drive_upload');
            return await driveService.uploadFile(credentials, { name: args.name, content: args.content });
        } catch (error) {
            console.error('[ToolService] Drive Upload Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * HANDLER: Drive Search
     */
    async handleDriveSearch(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_drive_search');
            return await driveService.searchFiles(credentials, args.query);
        } catch (error) {
            console.error('[ToolService] Drive Search Error:', error);
            return { success: false, error: error.message };
        }
    }

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

    async getNotionClient(tenantId, actionConfig) {
        const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'notion');
        return new NotionService(credentials.accessToken);
    }

    async handleSearchNotion(args, { tenantId, actionConfig }) {
        try {
            const client = await this.getNotionClient(tenantId, actionConfig);
            return await client.searchWorkspace(args.query);
        } catch (error) { return { success: false, error: `Notion API Error: ${error.response?.data?.message || error.message}` }; }
    }

    async handleCreateNotionPage(args, { tenantId, actionConfig }) {
        try {
            const client = await this.getNotionClient(tenantId, actionConfig);
            return await client.createPage(args.parent, args.properties, args.children);
        } catch (error) { return { success: false, error: `Notion API Error: ${error.response?.data?.message || error.message}` }; }
    }

    async handleUpdateNotionPage(args, { tenantId, actionConfig }) {
        try {
            const client = await this.getNotionClient(tenantId, actionConfig);
            return await client.updatePage(args.pageId, args.properties);
        } catch (error) { return { success: false, error: `Notion API Error: ${error.response?.data?.message || error.message}` }; }
    }

    async handleAppendNotionBlock(args, { tenantId, actionConfig }) {
        try {
            const client = await this.getNotionClient(tenantId, actionConfig);
            return await client.appendBlock(args.blockId, args.children);
        } catch (error) { return { success: false, error: `Notion API Error: ${error.response?.data?.message || error.message}` }; }
    }

    async handleArchiveNotionPage(args, { tenantId, actionConfig }) {
        try {
            const client = await this.getNotionClient(tenantId, actionConfig);
            return await client.archivePage(args.pageId);
        } catch (error) { return { success: false, error: `Notion API Error: ${error.response?.data?.message || error.message}` }; }
    }
}

module.exports = new ToolService();
