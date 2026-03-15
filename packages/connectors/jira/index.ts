import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class JiraConnector implements MCPConnector {
  name = 'jira';
  version = '1.0.0';
  private token = '';
  private email = '';
  private domain = '';  // e.g. "mycompany.atlassian.net"

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
    this.email = config.email ?? '';
    this.domain = config.domain ?? '';
  }

  private async jira(method: string, path: string, body?: unknown) {
    const auth = Buffer.from(`${this.email}:${this.token}`).toString('base64');
    const res = await fetch(`https://${this.domain}/rest/api/3${path}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Jira ${res.status}: ${await res.text()}`);
    return res.status === 204 ? {} : res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'issue.create':
          data = await this.jira('POST', '/issue', {
            fields: {
              project: { key: params.projectKey },
              summary: params.title,
              description: {
                type: 'doc', version: 1,
                content: [{ type: 'paragraph', content: [{ type: 'text', text: params.description as string }] }]
              },
              issuetype: { name: params.issueType || 'Task' },
              priority: params.priority ? { name: params.priority } : undefined,
            }
          });
          break;

        case 'issue.get':
          data = await this.jira('GET', `/issue/${params.issueKey}`);
          break;

        case 'issue.update':
          data = await this.jira('PUT', `/issue/${params.issueKey}`, {
            fields: params.fields,
          });
          break;

        case 'issue.search':
          data = await this.jira('POST', '/issue/picker', {
            query: params.query,
            currentProjectId: params.projectKey,
          });
          break;

        case 'sprint.list':
          data = await this.jira('GET', `/board/${params.boardId}/sprint?state=active`);
          break;

        case 'comment.add':
          data = await this.jira('POST', `/issue/${params.issueKey}/comment`, {
            body: {
              type: 'doc', version: 1,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: params.body as string }] }]
            }
          });
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Jira error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
