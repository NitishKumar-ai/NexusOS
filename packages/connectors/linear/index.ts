// packages/connectors/linear/index.ts
// Linear connector — ticket management from mission results
import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class LinearConnector implements MCPConnector {
  name = 'linear';
  version = '1.0.0';
  private apiKey = '';

  async connect(config: ConnectorConfig): Promise<void> {
    this.apiKey = config.apiKey ?? '';
    console.log('[Linear] Connected');
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    console.log(`[Linear] ${action}`, params);
    // TODO: implement using @linear/sdk
    // const client = new LinearClient({ apiKey: this.apiKey })
    switch (action) {
      case 'issue.create':   break; // client.createIssue
      case 'issue.update':   break; // client.updateIssue
      case 'issue.list':     break; // client.issues
      case 'project.status': break; // client.project
      case 'comment.add':    break; // client.createComment
    }
    return { success: true, action_id: randomUUID(), timestamp: new Date().toISOString() };
  }

  async disconnect(): Promise<void> {}
}
