import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class GmailConnector implements MCPConnector {
  name = 'gmail';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
  }

  private async gmail(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Gmail ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // List recent emails
        case 'email.list':
          data = await this.gmail('GET',
            `/users/me/messages?maxResults=${params.limit || 10}&q=${encodeURIComponent(params.query as string || '')}`
          );
          break;

        // Send email
        case 'email.send':
          const raw = Buffer.from(
            `To: ${params.to}\r\nSubject: ${params.subject}\r\nContent-Type: text/plain\r\n\r\n${params.body}`
          ).toString('base64url');
          data = await this.gmail('POST', '/users/me/messages/send', { raw });
          break;

        // Get a specific email
        case 'email.get':
          data = await this.gmail('GET', `/users/me/messages/${params.messageId}?format=full`);
          break;

        // Search emails
        case 'email.search':
          data = await this.gmail('GET',
            `/users/me/messages?q=${encodeURIComponent(params.query as string)}&maxResults=${params.limit || 10}`
          );
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gmail error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
