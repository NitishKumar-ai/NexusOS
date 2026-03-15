import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class NotionConnector implements MCPConnector {
  name = 'notion';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
  }

  private async notion(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Create a page in a database
        case 'page.create':
          data = await this.notion('POST', '/pages', {
            parent: { database_id: params.databaseId },
            properties: params.properties,
            children: params.blocks || [],
          });
          break;

        // Query a database
        case 'database.query':
          data = await this.notion('POST', `/databases/${params.databaseId}/query`, {
            filter: params.filter,
            sorts: params.sorts,
            page_size: params.limit || 20,
          });
          break;

        // Update a page
        case 'page.update':
          data = await this.notion('PATCH', `/pages/${params.pageId}`, {
            properties: params.properties,
          });
          break;

        // Search
        case 'search':
          data = await this.notion('POST', '/search', {
            query: params.query,
            page_size: params.limit || 10,
          });
          break;

        // Get a page
        case 'page.get':
          data = await this.notion('GET', `/pages/${params.pageId}`);
          break;

        // Append blocks to a page
        case 'blocks.append':
          data = await this.notion('PATCH', `/blocks/${params.blockId}/children`, {
            children: params.blocks,
          });
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Notion error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
