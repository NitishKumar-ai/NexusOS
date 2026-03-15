// packages/sdk-bridge/index.ts
// SDK Registry — Traffic Controller calls getAdapter() to route tasks

import { ClaudeCodeAdapter } from './adapters/claude-code';
import { LangChainAdapter }  from './adapters/langchain';
import { LangGraphAdapter }  from './adapters/langgraph';
import { PythonAdapter }     from './adapters/python-generic';
import type { AgentAdapter } from './adapters/types';

export type { AgentAdapter, AgentTask, AgentResult } from './adapters/types';

const registry: Record<string, AgentAdapter> = {
  'claude-code': new ClaudeCodeAdapter(),
  'langchain':   new LangChainAdapter(),
  'langgraph':   new LangGraphAdapter(),
  'python':      new PythonAdapter(),
};

export function getAdapter(type: string): AgentAdapter {
  return registry[type] ?? registry['claude-code'];
}

export function listAdapters(): string[] {
  return Object.keys(registry);
}

export async function healthCheckAll(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  for (const [name, adapter] of Object.entries(registry)) {
    results[name] = await adapter.healthCheck();
  }
  return results;
}
