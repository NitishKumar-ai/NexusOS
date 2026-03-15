import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class ResendConnector implements MCPConnector {
  name = 'resend';
  version = '1.0.0';
  private key = '';

  async connect(config: ConnectorConfig) { this.key = config.apiKey ?? ''; }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'email.send':
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: params.from || 'NexusOS <noreply@nexusos.dev>',
              to: params.to,
              subject: params.subject,
              html: params.html || `<p>${params.text}</p>`,
              text: params.text,
            }),
          });
          if (!res.ok) throw new Error(`Resend ${res.status}`);
          data = await res.json();
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Resend error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
