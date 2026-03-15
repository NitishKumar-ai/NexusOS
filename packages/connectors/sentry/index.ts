import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class SentryConnector implements MCPConnector {
  name = 'sentry';
  version = '1.0.0';
  private token = '';
  private org = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
    this.org = config.orgSlug ?? '';
  }

  private async sentry(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://sentry.io/api/0${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Sentry ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'issues.list':
          data = await this.sentry('GET',
            `/organizations/${this.org}/issues/?project=${params.project}&limit=${params.limit || 10}`
          );
          break;
        case 'issue.get':
          data = await this.sentry('GET', `/issues/${params.issueId}/`);
          break;
        case 'issue.resolve':
          data = await this.sentry('PUT', `/issues/${params.issueId}/`, { status: 'resolved' });
          break;
        case 'releases.list':
          data = await this.sentry('GET',
            `/organizations/${this.org}/releases/?limit=${params.limit || 5}`
          );
          break;
        case 'events.list':
          data = await this.sentry('GET',
            `/organizations/${this.org}/events/?project=${params.project}&limit=${params.limit || 20}`
          );
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Sentry error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
