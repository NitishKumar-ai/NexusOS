import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class PosthogConnector implements MCPConnector {
  name = 'posthog';
  version = '1.0.0';
  private apiKey = '';
  private host = 'https://app.posthog.com';
  private projectId = '';

  async connect(config: ConnectorConfig) {
    this.apiKey = config.apiKey ?? '';
    this.host = config.host ?? 'https://app.posthog.com';
    this.projectId = config.projectId ?? '';
  }

  private async ph(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.host}/api${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PostHog ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Capture an event (track agent action)
        case 'event.capture':
          data = await fetch(`${this.host}/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: this.apiKey,
              event: params.event,
              distinct_id: params.userId || 'nexusos-agent',
              properties: params.properties || {},
            }),
          }).then(r => r.json());
          break;

        // Get feature flags
        case 'flags.list':
          data = await this.ph('GET', `/projects/${this.projectId}/feature_flags/?limit=${params.limit || 20}`);
          break;

        // Get insights
        case 'insights.list':
          data = await this.ph('GET', `/projects/${this.projectId}/insights/?limit=${params.limit || 10}`);
          break;

        // Get persons
        case 'persons.list':
          data = await this.ph('GET', `/projects/${this.projectId}/persons/?limit=${params.limit || 20}`);
          break;

        // Query with HogQL
        case 'query.run':
          data = await this.ph('POST', `/projects/${this.projectId}/query/`, {
            query: { kind: 'HogQLQuery', query: params.sql },
          });
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'PostHog error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
