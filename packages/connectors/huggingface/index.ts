import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class HuggingFaceConnector implements MCPConnector {
  name = 'huggingface';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
  }

  private async hf(model: string, body: unknown) {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HuggingFace ${res.status}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Text generation
        case 'text.generate':
          data = await this.hf(params.model as string || 'mistralai/Mistral-7B-Instruct-v0.2', {
            inputs: params.prompt,
            parameters: { max_new_tokens: params.maxTokens || 500, temperature: params.temperature || 0.7 },
          });
          break;

        // Text classification
        case 'text.classify':
          data = await this.hf(params.model as string || 'distilbert-base-uncased-finetuned-sst-2-english', {
            inputs: params.text,
          });
          break;

        // Embeddings
        case 'text.embed':
          data = await this.hf(params.model as string || 'sentence-transformers/all-MiniLM-L6-v2', {
            inputs: params.text,
          });
          break;

        // Code generation
        case 'code.generate':
          data = await this.hf(params.model as string || 'bigcode/starcoder2-15b', {
            inputs: params.prompt,
            parameters: { max_new_tokens: params.maxTokens || 200, temperature: 0.2 },
          });
          break;

        // Image generation
        case 'image.generate':
          const imgRes = await fetch(
            `https://api-inference.huggingface.co/models/${params.model || 'stabilityai/stable-diffusion-xl-base-1.0'}`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ inputs: params.prompt }),
            }
          );
          const buffer = await imgRes.arrayBuffer();
          data = { image: Buffer.from(buffer).toString('base64'), format: 'png' };
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'HuggingFace error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
