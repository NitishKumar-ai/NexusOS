import { ClaudeCodeAdapter } from './adapters/claude-code';
import { LangChainAdapter } from './adapters/langchain';
import { LangGraphAdapter } from './adapters/langgraph';
import { PythonAdapter } from './adapters/python-generic';
import type { AgentAdapter } from './adapters/types';

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

export type { AgentAdapter, AgentTask, AgentResult } from './adapters/types';
