// packages/channels/openclaw-gateway.ts
//
// NexusOS connects TO OpenClaw's gateway — it does NOT run its own channel server.
// OpenClaw (port 18789) handles all channels: Discord, WhatsApp, Telegram, Slack,
// iMessage, Signal, and 15+ more. NexusOS sends tasks TO OpenClaw and receives
// structured results FROM OpenClaw via the ACP (Agent Client Protocol).
//
// Architecture:
//   [Developer phone] → [OpenClaw :18789] → [NexusOS Agent session]
//                                                     ↓
//                                         [Rust Traffic Controller :3000]
//                                         [P0-P8 pipeline execution]
//                                                     ↓
//                                         [Result → OpenClaw → Developer]
//
// OpenClaw API reference:
//   Port:      18789 (default, configurable via --port flag)
//   Auth:      Bearer token in Authorization header
//   Protocol:  ACP (Agent Client Protocol) — NDJSON over HTTP
//   Agents:    Managed via POST /api/agents (create/list/update/delete)
//   Tasks:     Submitted as chat messages via POST /api/chat/inject
//   Events:    Streamed as NDJSON — type: "token" | "tool_call" | "done" | "error"
//   Tools:     Invoked via POST /api/tools/invoke (with sessionKey)

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL ?? 'http://localhost:18789';
const OPENCLAW_TOKEN   = process.env.OPENCLAW_TOKEN ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenClawAgent {
  id: string;          // e.g. "nexusos-coder"
  name?: string;
  emoji?: string;
  model?: string;
  soulPath?: string;   // path to SOUL.md relative to workspace
}

export interface ChatMessage {
  agentId: string;     // which agent session receives this message
  message: string;     // the task instruction
  sessionKey?: string; // optional — defaults to agentId main session
}

export interface OpenClawEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

// ─── Agent Management ─────────────────────────────────────────────────────────

/**
 * List all agents registered in the OpenClaw gateway.
 */
export async function listAgents(): Promise<OpenClawAgent[]> {
  const res = await fetch(`${OPENCLAW_GATEWAY}/api/agents`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`OpenClaw list agents error: ${res.status}`);
  return res.json();
}

/**
 * Create or register the NexusOS agent in the OpenClaw gateway.
 * Call this once during NexusOS startup / init.
 */
export async function ensureNexusOSAgent(): Promise<OpenClawAgent> {
  const body = {
    id: process.env.NEXUSOS_AGENT_ID ?? 'nexusos-coder',
    name: 'NexusOS',
    emoji: '🚀',
    // Points OpenClaw to NexusOS's SOUL.md for identity/personality
    soulPath: process.env.NEXUSOS_SOUL_PATH ?? './packages/agent-harness/soul/SOUL.md',
  };
  const res = await fetch(`${OPENCLAW_GATEWAY}/api/agents`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    // 409 = already exists, that's fine
    throw new Error(`OpenClaw create agent error: ${res.status}`);
  }
  return body;
}

// ─── Task Submission ──────────────────────────────────────────────────────────

/**
 * Submit a task to the NexusOS agent in OpenClaw.
 * OpenClaw routes this to the NexusOS session, which calls the Rust Traffic Controller.
 *
 * Returns a ReadableStream of OpenClawEvent — consume with streamAgentEvents().
 */
export async function injectTask(msg: ChatMessage): Promise<Response> {
  const res = await fetch(`${OPENCLAW_GATEWAY}/api/chat/inject`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId:    msg.agentId,
      sessionKey: msg.sessionKey ?? msg.agentId,
      message:    msg.message,
    }),
  });
  if (!res.ok) throw new Error(`OpenClaw inject task error: ${res.status}`);
  return res; // Caller should stream NDJSON with streamAgentEvents()
}

/**
 * Stream NDJSON events from an OpenClaw response (from injectTask).
 */
export async function* streamAgentEvents(res: Response): AsyncGenerator<OpenClawEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as OpenClawEvent;
      } catch {
        // skip malformed line
      }
    }
  }
}

// ─── Tool Invocation ──────────────────────────────────────────────────────────

/**
 * Directly invoke an OpenClaw tool (e.g. memory_search, web_search).
 * Requires the agent's sessionKey.
 */
export async function invokeTool(
  tool: string,
  args: Record<string, unknown>,
  sessionKey?: string,
): Promise<unknown> {
  const res = await fetch(`${OPENCLAW_GATEWAY}/api/tools/invoke`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args, sessionKey }),
  });
  if (!res.ok) throw new Error(`OpenClaw tool invoke error: ${res.status} [${tool}]`);
  return res.json();
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

/**
 * Connect to OpenClaw's event WebSocket for real-time agent events.
 * Events are NDJSON — same OpenClawEvent shape as the HTTP stream.
 */
export function connectToGatewayWebSocket(
  onEvent: (event: OpenClawEvent) => void,
  onClose?: () => void,
): WebSocket {
  const wsUrl = OPENCLAW_GATEWAY.replace(/^http/, 'ws') + '/api/ws';
  const ws = new WebSocket(wsUrl, ['Bearer', OPENCLAW_TOKEN]);
  ws.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data) as OpenClawEvent);
    } catch {
      // skip malformed
    }
  };
  ws.onerror = (err) => console.error('[NexusOS → OpenClaw WS] Error:', err);
  ws.onclose = () => {
    console.log('[NexusOS → OpenClaw WS] Connection closed');
    onClose?.();
  };
  return ws;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function gatewayHealthCheck(): Promise<{ ok: boolean; status?: string }> {
  try {
    const res = await fetch(`${OPENCLAW_GATEWAY}/api/status`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, status: data?.status ?? 'running' };
  } catch {
    return { ok: false };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return OPENCLAW_TOKEN
    ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` }
    : {};
}
