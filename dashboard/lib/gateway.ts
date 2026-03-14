// Single source of truth for all Traffic Controller API communication.
// Components NEVER call fetch() directly — always import from here.

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3000';

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
