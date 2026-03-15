import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class DatadogConnector implements MCPConnector {
  name = 'datadog';
  version = '1.0.0';
  private apiKey = '';
  private appKey = '';
  private site = 'datadoghq.com';

  async connect(config: ConnectorConfig) {
    this.apiKey = config.apiKey ?? '';
    this.appKey = config.appKey ?? '';
    this.site = config.site ?? 'datadoghq.com';
  }

  private async dd(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.${this.site}/api/v1${path}`, {
      method,
      headers: {
        'DD-API-KEY': this.apiKey,
        'DD-APPLICATION-KEY': this.appKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Datadog ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Get metrics
        case 'metrics.query':
          const from = Math.floor(Date.now() / 1000) - (params.minutesBack as number || 60) * 60;
          data = await this.dd('GET',
            `/query?from=${from}&to=${Math.floor(Date.now() / 1000)}&query=${encodeURIComponent(params.query as string)}`
          );
          break;

        // List monitors (alerts)
        case 'monitors.list':
          data = await this.dd('GET', `/monitor?page=0&page_size=${params.limit || 20}`);
          break;

        // Get monitor status
        case 'monitor.get':
          data = await this.dd('GET', `/monitor/${params.monitorId}`);
          break;

        // Mute a monitor
        case 'monitor.mute':
          data = await this.dd('POST', `/monitor/${params.monitorId}/mute`, {
            end: params.end,
            message: params.message || 'Muted by NexusOS agent',
          });
          break;

        // Create event
        case 'event.create':
          data = await this.dd('POST', '/events', {
            title: params.title,
            text: params.text,
            tags: params.tags || ['source:nexusos'],
            alert_type: params.alertType || 'info',
          });
          break;

        // Get logs
        case 'logs.search':
          const logRes = await fetch(`https://api.${this.site}/api/v2/logs/events/search`, {
            method: 'POST',
            headers: {
              'DD-API-KEY': this.apiKey,
              'DD-APPLICATION-KEY': this.appKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filter: { query: params.query, from: params.from || 'now-1h', to: 'now' },
              page: { limit: params.limit || 20 },
            }),
          });
          data = await logRes.json();
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Datadog error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
