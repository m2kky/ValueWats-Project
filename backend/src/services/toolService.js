const emailService = require('./emailService');
const calendarService = require('./calendarService');
const prisma = require('../config/database');

class ToolService {
    constructor() {
        this.handlers = {
            send_email: this.handleSendEmail.bind(this),
            create_calendar_event: this.handleCreateCalendarEvent.bind(this),
            get_calendar_events: this.handleGetCalendarEvents.bind(this)
        };
    }

    /**
     * Get tool definitions for the AI model dynamically based on Agent Config
     */
    getToolDefinitions(actionConfig = {}) {
        const tools = [];

        // Always available or standard integration could be email
        // if (actionConfig.sendEmail?.enabled) ...

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

        return JSON.parse(integration.credentials);
    }

    /**
     * HANDLER: Create Calendar Event
     */
    async handleCreateCalendarEvent(args, { tenantId, actionConfig }) {
        try {
            const credentials = await this.getGoogleCredentials(tenantId, actionConfig, 'google_calendar_create');
            calendarService.setCredentials({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token,
                expiry_date: credentials.expiry_date
            });
            return await calendarService.createEvent(args);
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
            calendarService.setCredentials({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token,
                expiry_date: credentials.expiry_date
            });
            return await calendarService.listEvents(args.maxResults || 10);
        } catch (error) {
            console.error('[ToolService] Get Calendar Events Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ToolService();
