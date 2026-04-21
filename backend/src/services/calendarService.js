const { google } = require('googleapis');

/**
 * Google Calendar Service
 * Uses dynamically supplied auth tokens and OAuth credentials.
 */
class CalendarService {
    constructor() {}

    /**
     * Get calendar client
     */
    getCalendar(creds) {
        const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        oauth2Client.setCredentials({
            access_token: creds.access_token,
            refresh_token: creds.refresh_token,
            expiry_date: creds.expiry_date
        });
        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    /**
     * Create an event
     */
    async createEvent(creds, { summary, description, start, end }) {
        try {
            const calendar = this.getCalendar(creds);
            const event = {
                summary,
                description,
                start: { dateTime: start, timeZone: 'UTC' },
                end: { dateTime: end, timeZone: 'UTC' }
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });

            return { success: true, event: response.data };
        } catch (error) {
            console.error('[CalendarService] Create Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * List events
     */
    async listEvents(creds, maxResults = 10) {
        try {
            const calendar = this.getCalendar(creds);
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: (new Date()).toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return { success: true, events: response.data.items };
        } catch (error) {
            console.error('[CalendarService] List Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new CalendarService();
