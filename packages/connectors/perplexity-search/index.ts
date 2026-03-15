import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class PerplexityConnector implements MCPConnector {
  name = 'perplexity-search';
  version = '1.0.0';
  private key = '';

  async connect(config: ConnectorConfig) { this.key = config.apiKey ?? ''; }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Grounded web search with citations — powers agent research step
        case 'search':
          const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [{ role: 'user', content: params.query }],
              search_recency_filter: params.recency || 'month',
            }),
          });
          data = await res.json();
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Perplexity error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
