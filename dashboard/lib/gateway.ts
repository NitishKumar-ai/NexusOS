// dashboard/lib/gateway.ts
// ─────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all Traffic Controller API calls.
// Import from here. Never call fetch() directly in a component.
// ─────────────────────────────────────────────────────────────────

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3000';
const WS_URL = GATEWAY_URL.replace(/^http/, 'ws');

// ── Types ──────────────────────────────────────────────────────────

export interface MissionPayload {
  instruction: string;
  repo_url?: string;
  metadata?: Record<string, unknown>;
}

export interface Mission {
  id: string;
  instruction: string;
  repo_url?: string;
  phase: string;
  status: 'ACTIVE' | 'BLOCKED' | 'AWAITING_APPROVAL' | 'COMPLETE' | 'REJECTED' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface MissionEvent {
  task_id: string;
  phase: string;
  event_type: 'phase_update' | 'agent_thought' | 'blocker' | 'hitl_gate' | 'mission_complete' | 'mission_failed';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayHealth {
  status: 'ok' | 'degraded' | 'down';
  version?: string;
  uptime_seconds?: number;
}

// ── REST API calls ─────────────────────────────────────────────────

export async function submitMission(payload: MissionPayload): Promise<Mission> {
  const res = await fetch(`${GATEWAY_URL}/api/v1/agents/coder/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Gateway error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function listMissions(): Promise<Mission[]> {
  const res = await fetch(`${GATEWAY_URL}/api/v1/missions`);
  if (!res.ok) throw new Error(`Gateway error ${res.status}`);
  return res.json();
}

export async function getMission(id: string): Promise<Mission> {
  const res = await fetch(`${GATEWAY_URL}/api/v1/missions/${id}`);
  if (!res.ok) throw new Error(`Mission ${id} not found`);
  return res.json();
}

export async function approveMission(id: string, note?: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/api/v1/missions/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
}

export async function rejectMission(id: string, note?: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/api/v1/missions/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
}

export async function healthCheck(): Promise<GatewayHealth> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`);
    return res.json();
  } catch {
    return { status: 'down' };
  }
}

// ── WebSocket connection ───────────────────────────────────────────

export function createWebSocket(onEvent: (event: MissionEvent) => void): WebSocket {
  const ws = new WebSocket(`${WS_URL}/ws`);

  ws.onopen    = () => console.log('[NexusOS] Gateway WS connected');
  ws.onclose   = () => console.log('[NexusOS] Gateway WS closed');
  ws.onerror   = (e) => console.error('[NexusOS] Gateway WS error:', e);
  ws.onmessage = (msg) => {
    try {
      const event: MissionEvent = JSON.parse(msg.data);
      onEvent(event);
    } catch (e) {
      console.error('[NexusOS] Failed to parse WS event:', e);
    }
  };

  return ws;
}

// ── OpenClaw gateway health (separate from Traffic Controller) ─────

export async function openClawHealth(): Promise<{ connected: boolean }> {
  try {
    const res = await fetch('http://localhost:18789/health');
    return { connected: res.ok };
  } catch {
    return { connected: false };
  }
}
