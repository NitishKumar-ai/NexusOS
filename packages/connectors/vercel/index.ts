import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class VercelConnector implements MCPConnector {
  name = 'vercel';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) { this.token = config.apiKey ?? ''; }

  private async vercel(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.vercel.com${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Vercel ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'deployment.list':
          data = await this.vercel('GET', `/v6/deployments?projectId=${params.projectId}&limit=${params.limit || 5}`);
          break;
        case 'deployment.get':
          data = await this.vercel('GET', `/v13/deployments/${params.deploymentId}`);
          break;
        case 'deployment.logs':
          data = await this.vercel('GET', `/v2/deployments/${params.deploymentId}/events`);
          break;
        case 'project.list':
          data = await this.vercel('GET', '/v9/projects');
          break;
        case 'domain.list':
          data = await this.vercel('GET', `/v9/projects/${params.projectId}/domains`);
          break;
        case 'env.list':
          data = await this.vercel('GET', `/v9/projects/${params.projectId}/env`);
          break;
        case 'env.create':
          data = await this.vercel('POST', `/v10/projects/${params.projectId}/env`, [{
            key: params.key, value: params.value, target: params.target || ['production'],
          }]);
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Vercel error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
