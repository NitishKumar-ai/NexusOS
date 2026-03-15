// packages/connectors/types.ts
// Every connector implements this interface

export interface MCPConnector {
  name: string;
  version: string;
  connect(config: ConnectorConfig): Promise<void>;
  execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult>;
  disconnect(): Promise<void>;
}

export interface ConnectorConfig {
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  [key: string]: string | undefined;
}

export interface ConnectorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  action_id: string;
  timestamp: string;
}
