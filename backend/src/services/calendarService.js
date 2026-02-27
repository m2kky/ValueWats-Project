const { google } = require('googleapis');

/**
 * Google Calendar Service
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 * and per-user/tenant tokens (access_token, refresh_token)
 */
class CalendarService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Set credentials for the current operation
     */
    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }

    /**
     * Get calendar client
     */
    getCalendar() {
        return google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Create an event
     */
    async createEvent({ summary, description, start, end }) {
        try {
            const calendar = this.getCalendar();
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
    async listEvents(maxResults = 10) {
        try {
            const calendar = this.getCalendar();
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
