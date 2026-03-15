// packages/workflow/src/db.ts
// D1 database operations — replaces the Rust db.rs layer

import type { Env, MissionPayload, MissionPhase, MissionStatus, MissionEvent } from './types';

export async function saveMission(env: Env, mission: MissionPayload, phase: MissionPhase): Promise<void> {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO missions
    (id, instruction, repo_url, phase, status, openclaw_session_id, openclaw_channel, source_user_id, updated_at)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, datetime('now'))
  `).bind(
    mission.id,
    mission.instruction,
    mission.repo_url ?? null,
    phase,
    mission.openclaw_session_id ?? null,
    mission.openclaw_channel ?? null,
    mission.source_user_id ?? null,
  ).run();
}

export async function updatePhase(env: Env, id: string, phase: MissionPhase, status?: MissionStatus): Promise<void> {
  const s = status ?? phaseToStatus(phase);
  await env.DB.prepare(`
    UPDATE missions SET phase = ?, status = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(phase, s, id).run();
}

export async function getMission(env: Env, id: string) {
  return env.DB.prepare('SELECT * FROM missions WHERE id = ?').bind(id).first();
}

export async function listMissions(env: Env, limit = 20) {
  const result = await env.DB.prepare(
    'SELECT * FROM missions ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all();
  return result.results;
}

export async function logEvent(env: Env, event: MissionEvent): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO mission_events (id, task_id, phase, event_type, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    event.task_id,
    event.phase,
    event.event_type,
    event.message,
    event.timestamp,
  ).run();
}

export async function storePlan(env: Env, taskId: string, plan: string): Promise<void> {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO mission_plans (id, task_id, plan_text, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).bind(crypto.randomUUID(), taskId, plan).run();
}

export async function getPlan(env: Env, taskId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT plan_text FROM mission_plans WHERE task_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(taskId).first<{ plan_text: string }>();
  return row?.plan_text ?? null;
}

function phaseToStatus(phase: MissionPhase): MissionStatus {
  if (phase === 'P2Pending' || phase === 'P8Pending') return 'AWAITING_APPROVAL';
  if (phase === 'Complete') return 'COMPLETE';
  if (phase === 'Rejected') return 'REJECTED';
  if (phase === 'Failed') return 'FAILED';
  return 'ACTIVE';
}
