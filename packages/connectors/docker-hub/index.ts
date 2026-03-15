import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class DockerHubConnector implements MCPConnector {
  name = 'docker-hub';
  version = '1.0.0';
  private token = '';
  private username = '';

  async connect(config: ConnectorConfig) {
    this.username = config.username ?? '';
    const res = await fetch('https://hub.docker.com/v2/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: config.username, password: config.apiKey }),
    });
    const data = await res.json() as { token: string };
    this.token = data.token;
    console.log('[DockerHub] Connected');
  }

  private async dh(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://hub.docker.com/v2${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`DockerHub ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'repos.list':
          data = await this.dh('GET', `/repositories/${params.username || this.username}/?page_size=${params.limit || 20}`);
          break;
        case 'repo.get':
          data = await this.dh('GET', `/repositories/${params.namespace}/${params.name}`);
          break;
        case 'tags.list':
          data = await this.dh('GET', `/repositories/${params.namespace}/${params.name}/tags?page_size=${params.limit || 10}`);
          break;
        case 'builds.list':
          data = await this.dh('GET', `/repositories/${params.namespace}/${params.name}/builds?limit=${params.limit || 5}`);
          break;
        case 'build.trigger':
          data = await this.dh('POST', `/repositories/${params.namespace}/${params.name}/autobuild/trigger-build`, {
            source_type: 'Branch',
            source_name: params.branch || 'main',
          });
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'DockerHub error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
