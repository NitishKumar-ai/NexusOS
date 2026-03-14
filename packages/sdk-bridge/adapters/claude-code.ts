import type { AgentAdapter, AgentTask, AgentResult } from './types';
import { randomUUID } from 'crypto';

export class ClaudeCodeAdapter implements AgentAdapter {
  name = 'claude-code';
  sdk = 'claude-code' as const;

  async invoke(task: AgentTask): Promise<AgentResult> {
    console.log(`[ClaudeCodeAdapter] Invoking: ${task.instruction}`);
    // TODO: Shell out to `claude` CLI with the task instruction
    return {
      status: 'success',
      result: `[stub] claude-code invoked for session ${task.session_id}`,
      trace_id: randomUUID(),
      timestamp: new Date().toISOString(),
      tool_calls: [],
      mcp_actions: [],
    };
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Check if `claude` CLI is available
    console.log('[ClaudeCodeAdapter] Health check');
    return true;
  }
}
