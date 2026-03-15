// packages/connectors/index.ts
import { FirebaseConnector } from './firebase';
import { GitHubConnector }   from './github';
import { LinearConnector }   from './linear';
import { FigmaConnector }    from './figma';
import type { MCPConnector } from './types';

export type { MCPConnector, ConnectorConfig, ConnectorResult } from './types';

const connectors: Record<string, MCPConnector> = {
  firebase: new FirebaseConnector(),
  github:   new GitHubConnector(),
  linear:   new LinearConnector(),
  figma:    new FigmaConnector(),
};

export function getConnector(name: string): MCPConnector {
  const c = connectors[name];
  if (!c) throw new Error(`Unknown connector: ${name}. Available: ${Object.keys(connectors).join(', ')}`);
  return c;
}

export function listConnectors(): string[] {
  return Object.keys(connectors);
}
