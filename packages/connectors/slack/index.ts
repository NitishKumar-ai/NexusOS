import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class SlackConnector implements MCPConnector {
  name = 'slack';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
    console.log('[Slack] Connected');
  }

  private async slack(method: string, body: Record<string, unknown>) {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; error?: string };
    if (!data.ok) throw new Error(`Slack error: ${data.error}`);
    return data;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        // Post a message to a channel
        case 'message.post':
          data = await this.slack('chat.postMessage', {
            channel: params.channel,   // "#nexusos-missions"
            text: params.text,
            blocks: params.blocks,     // optional rich blocks
          });
          break;

        // Post a threaded reply
        case 'message.reply':
          data = await this.slack('chat.postMessage', {
            channel: params.channel,
            text: params.text,
            thread_ts: params.thread_ts,
          });
          break;

        // Upload a file (e.g. mission diff, test report)
        case 'file.upload':
          data = await this.slack('files.upload', {
            channels: params.channel,
            content: params.content,
            filename: params.filename,
            title: params.title,
          });
          break;

        // List channels
        case 'channel.list':
          data = await this.slack('conversations.list', { limit: 100 });
          break;

        // Get channel history
        case 'channel.history':
          data = await this.slack('conversations.history', {
            channel: params.channel,
            limit: params.limit || 20,
          });
          break;

        // React to a message
        case 'reaction.add':
          data = await this.slack('reactions.add', {
            channel: params.channel,
            timestamp: params.ts,
            name: params.emoji,   // "white_check_mark"
          });
          break;

        default:
          return { success: false, error: `Unknown action: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Slack error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() { console.log('[Slack] Disconnected'); }
}
