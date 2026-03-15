import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class GoogleCalendarConnector implements MCPConnector {
  name = 'google-calendar';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';  // OAuth2 access token
  }

  private async gcal(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GCal ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // List upcoming events
        case 'event.list':
          data = await this.gcal('GET',
            `/calendars/${params.calendarId || 'primary'}/events?timeMin=${new Date().toISOString()}&maxResults=${params.limit || 10}&orderBy=startTime&singleEvents=true`
          );
          break;

        // Create an event (e.g. mission review meeting)
        case 'event.create':
          data = await this.gcal('POST', `/calendars/${params.calendarId || 'primary'}/events`, {
            summary: params.title,
            description: params.description,
            start: { dateTime: params.startTime, timeZone: params.timezone || 'Asia/Kolkata' },
            end:   { dateTime: params.endTime,   timeZone: params.timezone || 'Asia/Kolkata' },
            attendees: params.attendees,
          });
          break;

        // Quick-add natural language event
        case 'event.quickAdd':
          data = await this.gcal('POST',
            `/calendars/${params.calendarId || 'primary'}/events/quickAdd?text=${encodeURIComponent(params.text as string)}`
          );
          break;

        // Delete event
        case 'event.delete':
          await this.gcal('DELETE', `/calendars/${params.calendarId || 'primary'}/events/${params.eventId}`);
          data = { deleted: true };
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'GCal error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
