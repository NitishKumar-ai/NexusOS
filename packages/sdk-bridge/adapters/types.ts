// packages/sdk-bridge/adapters/types.ts
// Universal interface — every SDK adapter implements this

export interface AgentAdapter {
  name: string;
  sdk: 'claude-code' | 'langchain' | 'langgraph' | 'python';
  invoke(task: AgentTask): Promise<AgentResult>;
  healthCheck(): Promise<boolean>;
}

export interface AgentTask {
  instruction: string;
  repo_url?: string;
  context?: Record<string, unknown>;
  session_id: string;
  agent_name?: string;
  phase?: string;
}

export interface AgentResult {
  status: 'success' | 'refused' | 'error';
  result: string;
  trace_id: string;
  timestamp: string;
  tool_calls: unknown[];
  mcp_actions: unknown[];
  phase_completed?: string;
}
