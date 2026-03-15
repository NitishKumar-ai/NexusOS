import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class CloudflareConnector implements MCPConnector {
  name = 'cloudflare';
  version = '1.0.0';
  private token = '';
  private accountId = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
    this.accountId = config.accountId ?? '';
  }

  private async cf(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as { success: boolean; result: unknown; errors: { message: string }[] };
    if (!json.success) throw new Error(json.errors[0]?.message || 'Cloudflare error');
    return json.result;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Workers KV
        case 'kv.get':
          data = await this.cf('GET', `/accounts/${this.accountId}/storage/kv/namespaces/${params.namespaceId}/values/${params.key}`);
          break;
        case 'kv.put':
          data = await this.cf('PUT', `/accounts/${this.accountId}/storage/kv/namespaces/${params.namespaceId}/values/${params.key}`, params.value);
          break;
        case 'kv.list':
          data = await this.cf('GET', `/accounts/${this.accountId}/storage/kv/namespaces/${params.namespaceId}/keys?limit=${params.limit || 20}`);
          break;

        // DNS records
        case 'dns.list':
          data = await this.cf('GET', `/zones/${params.zoneId}/dns_records`);
          break;
        case 'dns.create':
          data = await this.cf('POST', `/zones/${params.zoneId}/dns_records`, {
            type: params.type, name: params.name, content: params.content,
            ttl: params.ttl || 1, proxied: params.proxied || false,
          });
          break;

        // Workers
        case 'worker.deploy':
          data = await this.cf('PUT',
            `/accounts/${this.accountId}/workers/scripts/${params.scriptName}`,
            params.script
          );
          break;

        // Zone analytics
        case 'analytics.get':
          data = await this.cf('GET',
            `/zones/${params.zoneId}/analytics/dashboard?since=${params.since || '-1440'}&until=0`
          );
          break;

        // Purge cache
        case 'cache.purge':
          data = await this.cf('POST', `/zones/${params.zoneId}/purge_cache`, {
            purge_everything: params.everything || false,
            files: params.files || [],
          });
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Cloudflare error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
