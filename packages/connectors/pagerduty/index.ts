import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class PagerDutyConnector implements MCPConnector {
  name = 'pagerduty';
  version = '1.0.0';
  private apiKey = '';

  async connect(config: ConnectorConfig) {
    this.apiKey = config.apiKey ?? '';
  }

  private async pd(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.pagerduty.com${path}`, {
      method,
      headers: {
        'Authorization': `Token token=${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pagerduty+json;version=2',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PagerDuty ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'incidents.list':
          data = await this.pd('GET', `/incidents?statuses[]=triggered&statuses[]=acknowledged&limit=${params.limit || 10}`);
          break;
        case 'incident.get':
          data = await this.pd('GET', `/incidents/${params.incidentId}`);
          break;
        case 'incident.acknowledge':
          data = await this.pd('PUT', `/incidents/${params.incidentId}`, {
            incident: { type: 'incident', status: 'acknowledged' }
          });
          break;
        case 'incident.resolve':
          data = await this.pd('PUT', `/incidents/${params.incidentId}`, {
            incident: { type: 'incident', status: 'resolved' }
          });
          break;
        case 'incident.create':
          data = await this.pd('POST', '/incidents', {
            incident: {
              type: 'incident',
              title: params.title,
              service: { id: params.serviceId, type: 'service_reference' },
              urgency: params.urgency || 'high',
              body: { type: 'incident_body', details: params.details },
            }
          });
          break;
        case 'services.list':
          data = await this.pd('GET', '/services?limit=20');
          break;
        case 'oncall.list':
          data = await this.pd('GET', '/oncalls?limit=10');
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'PagerDuty error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
