import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class OpenAIConnector implements MCPConnector {
  name = 'openai';
  version = '1.0.0';
  private key = '';

  async connect(config: ConnectorConfig) { this.key = config.apiKey ?? ''; }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      const headers = { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' };

      switch (action) {
        case 'chat.complete':
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers,
            body: JSON.stringify({
              model: params.model || 'gpt-4o',
              messages: params.messages,
              max_tokens: params.maxTokens || 1000,
            }),
          });
          data = await res.json();
          break;
        case 'image.generate':
          const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST', headers,
            body: JSON.stringify({ model: 'dall-e-3', prompt: params.prompt, n: 1, size: params.size || '1024x1024' }),
          });
          data = await imgRes.json();
          break;
        case 'models.list':
          const mRes = await fetch('https://api.openai.com/v1/models', { headers });
          data = await mRes.json();
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'OpenAI error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
