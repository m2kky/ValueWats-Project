const emailService = require('./emailService');
const calendarService = require('./calendarService');
const driveService = require('./driveService');
const prisma = require('../config/database');
const { decrypt } = require('../utils/encryption');

class ToolService {
    constructor() {
        this.handlers = {
            send_email: this.handleSendEmail.bind(this),
            create_calendar_event: this.handleCreateCalendarEvent.bind(this),
            get_calendar_events: this.handleGetCalendarEvents.bind(this),
            upload_drive_file: this.handleDriveUpload.bind(this),
            search_drive_files: this.handleDriveSearch.bind(this)
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
}

module.exports = new ToolService();
