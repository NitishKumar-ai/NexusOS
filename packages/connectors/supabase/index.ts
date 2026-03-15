import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class SupabaseConnector implements MCPConnector {
  name = 'supabase';
  version = '1.0.0';
  private url = '';
  private key = '';

  async connect(config: ConnectorConfig) {
    this.url = config.baseUrl ?? '';    // https://xxx.supabase.co
    this.key = config.apiKey ?? '';    // service_role key
  }

  private async sb(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.url}/rest/v1${path}`, {
      method,
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return res.status === 204 ? {} : res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'table.select':
          data = await this.sb('GET', `/${params.table}?${params.filter || ''}&limit=${params.limit || 20}`);
          break;
        case 'table.insert':
          data = await this.sb('POST', `/${params.table}`, params.data);
          break;
        case 'table.update':
          data = await this.sb('PATCH', `/${params.table}?${params.filter}`, params.data);
          break;
        case 'table.delete':
          data = await this.sb('DELETE', `/${params.table}?${params.filter}`);
          break;
        case 'rpc.call':
          data = await this.sb('POST', `/rpc/${params.function}`, params.args);
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Supabase error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
