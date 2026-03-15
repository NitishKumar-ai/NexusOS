import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class FigmaConnector implements MCPConnector {
  name = 'figma';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig): Promise<void> {
    this.token = config.apiKey ?? '';
    console.log('[Figma] Connected');
  }

  private async figma(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.figma.com/v1${path}`, {
      method,
      headers: {
        'X-Figma-Token': this.token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;

      switch (action) {
        case 'file.getStructure':
          // Get full file component tree
          data = await this.figma('GET', `/files/${params.fileKey}`);
          break;

        case 'comment.add':
          // Post a comment on a specific frame/node
          data = await this.figma('POST', `/files/${params.fileKey}/comments`, {
            message:   params.message,
            client_meta: params.nodeId
              ? { node_id: params.nodeId, node_offset: { x: 0, y: 0 } }
              : { x: 0, y: 0 },
          });
          break;

        case 'comment.list':
          data = await this.figma('GET', `/files/${params.fileKey}/comments`);
          break;

        case 'frame.export':
          // Export a frame as PNG/SVG/PDF
          data = await this.figma('GET',
            `/images/${params.fileKey}?ids=${params.nodeId}&format=${params.format || 'png'}&scale=${params.scale || 2}`
          );
          break;

        case 'component.list':
          data = await this.figma('GET', `/files/${params.fileKey}/components`);
          break;

        case 'variable.list':
          // List design tokens / variables
          data = await this.figma('GET', `/files/${params.fileKey}/variables/local`);
          break;

        default:
          return { success: false, error: `Unknown action: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }

      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Figma error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect(): Promise<void> {}
}
