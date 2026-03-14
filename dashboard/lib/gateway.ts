// Single source of truth for all Traffic Controller API communication.
// Components NEVER call fetch() directly — always import from here.
//
// Two gateway systems:
//   - NexusOS Traffic Controller (GATEWAY_URL, default :3000) — P0-P8 pipeline
//   - OpenClaw Gateway (OPENCLAW_URL, default :18789) — channels, sessions, memory

const GATEWAY_URL   = process.env.NEXT_PUBLIC_GATEWAY_URL    ?? 'http://localhost:3000';
const OPENCLAW_URL  = process.env.NEXT_PUBLIC_OPENCLAW_URL   ?? 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN ?? '';

export interface MissionPayload {
  instruction: string;
  repo_url?: string;
}

export interface MissionEvent {
  task_id: string;
  phase: string;
  message: string;
  timestamp: string;
}

export async function submitMission(payload: MissionPayload) {
  const res = await fetch(`${GATEWAY_URL}/api/v1/agents/coder/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json();
}

export async function listMissions() {
  const res = await fetch(`${GATEWAY_URL}/api/v1/missions`);
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${GATEWAY_URL}/health`);
  return res.json();
}

export function createWebSocket(onEvent: (event: MissionEvent) => void): WebSocket {
  const wsUrl = GATEWAY_URL.replace(/^http/, 'ws') + '/ws';
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data));
    } catch (e) {
      console.error('[NexusOS WS] Parse error:', e);
    }
  };
  ws.onerror = (err) => console.error('[NexusOS WS] Error:', err);
  ws.onclose = () => console.log('[NexusOS WS] Connection closed');
  return ws;
}

// ─── OpenClaw Gateway Helpers ─────────────────────────────────────────────────

export interface OpenClawStatus {
  connected: boolean;
  version?: string;
  agents?: number;
  channels?: string[];
}

export interface OpenClawSession {
  id: string;
  agentId: string;
  channel: string;
  active: boolean;
  lastActivity: string;
}

/** Check if the OpenClaw gateway is running and reachable */
export async function getOpenClawStatus(): Promise<OpenClawStatus> {
  try {
    const res = await fetch(`${OPENCLAW_URL}/api/status`, {
      headers: OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {},
    });
    if (!res.ok) return { connected: false };
    const data = await res.json();
    return { connected: true, ...data };
  } catch {
    return { connected: false };
  }
}

/** List active OpenClaw agent sessions (e.g. for the dashboard session panel) */
export async function getOpenClawSessions(): Promise<OpenClawSession[]> {
  try {
    const res = await fetch(`${OPENCLAW_URL}/api/agents/nexusos-coder/sessions`, {
      headers: OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {},
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
