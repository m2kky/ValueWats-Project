const emailService = require('./emailService');
const calendarService = require('./calendarService');

class ToolService {
    constructor() {
        this.handlers = {
            send_email: this.handleSendEmail.bind(this),
            create_calendar_event: this.handleCreateCalendarEvent.bind(this),
            get_calendar_events: this.handleGetCalendarEvents.bind(this)
        };
    }

    /**
     * Get tool definitions for the AI model
     */
    getToolDefinitions() {
        return [
            {
                type: 'function',
                function: {
                    name: 'send_email',
                    description: 'Send an email to a recipient',
                    parameters: {
                        type: 'object',
                        properties: {
                            to: { type: 'string', description: 'Recipient email address' },
                            subject: { type: 'string', description: 'Email subject' },
                            body: { type: 'string', description: 'Email body content (HTML or Plain Text)' }
                        },
                        required: ['to', 'subject', 'body']
                    }
                }
            },
            {
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
            },
            {
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
            }
        ];
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
     * HANDLER: Create Calendar Event
     */
    async handleCreateCalendarEvent(args, { tenantId }) {
        // In a future phase, we would fetch per-tenant Google tokens here
        return await calendarService.createEvent(args);
    }

    /**
     * HANDLER: Get Calendar Events
     */
    async handleGetCalendarEvents(args, { tenantId }) {
        return await calendarService.listEvents(args.maxResults || 10);
    }
}

module.exports = new ToolService();
