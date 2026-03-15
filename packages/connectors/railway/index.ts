import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class RailwayConnector implements MCPConnector {
  name = 'railway';
  version = '1.0.0';
  private token = '';

  async connect(config: ConnectorConfig) {
    this.token = config.apiKey ?? '';
  }

  private async gql(query: string, variables = {}) {
    const res = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json() as { data: unknown; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'project.list':
          data = await this.gql(`query { projects { edges { node { id name createdAt } } } }`);
          break;
        case 'deployment.list':
          data = await this.gql(`
            query($serviceId: String!) {
              deployments(input: { serviceId: $serviceId }) {
                edges { node { id status createdAt url } }
              }
            }
          `, { serviceId: params.serviceId });
          break;
        case 'deployment.trigger':
          data = await this.gql(`
            mutation($serviceId: String!, $environmentId: String!) {
              serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
            }
          `, { serviceId: params.serviceId, environmentId: params.environmentId });
          break;
        case 'logs.get':
          data = await this.gql(`
            query($deploymentId: String!) {
              deploymentLogs(deploymentId: $deploymentId) { message timestamp }
            }
          `, { deploymentId: params.deploymentId });
          break;
        case 'variable.set':
          data = await this.gql(`
            mutation($serviceId: String!, $environmentId: String!, $variables: ServiceVariables!) {
              variableCollectionUpsert(input: {
                serviceId: $serviceId,
                environmentId: $environmentId,
                variables: $variables
              })
            }
          `, params);
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Railway error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
