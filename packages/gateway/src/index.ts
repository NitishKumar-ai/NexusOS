// packages/gateway/src/index.ts
import type { Workflow, D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
// Cloudflare Worker — REST API for NexusOS
// Replaces the Rust Axum server endpoints

import type { Env } from '../../workflow/src/types';
import { getMission, listMissions, logEvent } from '../../workflow/src/db';

export interface GatewayEnv extends Env {
  NEXUSOS_PIPELINE: Workflow;
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const json = (data: unknown, status = 200) =>
      Response.json(data, { status, headers: cors });

    // GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ status: 'ok', service: 'nexusos-gateway', env: 'cloudflare-workers' });
    }

    // POST /api/v1/agents/coder/run — submit a new mission
    if (url.pathname === '/api/v1/agents/coder/run' && request.method === 'POST') {
      const body = await request.json() as {
        instruction: string;
        repo_url?: string;
        metadata?: { openclaw_session?: string; source_channel?: string; user_id?: string };
      };

      const missionId = crypto.randomUUID();
      const payload = {
        id: missionId,
        instruction: body.instruction,
        repo_url: body.repo_url,
        openclaw_session_id: body.metadata?.openclaw_session,
        openclaw_channel: body.metadata?.source_channel,
        source_user_id: body.metadata?.user_id,
      };

      // Start Cloudflare Workflow
      const instance = await env.NEXUSOS_PIPELINE.create({
        id: missionId,
        params: payload,
      });

      return json({
        id: missionId,
        workflow_instance_id: instance.id,
        status: 'started',
        phase: 'P0Trigger',
      });
    }

    // GET /api/v1/missions — list all missions
    if (url.pathname === '/api/v1/missions' && request.method === 'GET') {
      const missions = await listMissions(env);
      return json(missions);
    }

    // GET /api/v1/missions/:id — get mission status
    const missionMatch = url.pathname.match(/^\/api\/v1\/missions\/([^/]+)$/);
    if (missionMatch && request.method === 'GET') {
      const mission = await getMission(env, missionMatch[1]);
      if (!mission) return json({ error: 'Mission not found' }, 404);
      return json(mission);
    }

    // POST /api/v1/missions/:id/approve
    const approveMatch = url.pathname.match(/^\/api\/v1\/missions\/([^/]+)\/(approve|reject|feedback)$/);
    if (approveMatch && request.method === 'POST') {
      const [, missionId, action] = approveMatch;
      const body = await request.json() as { note?: string } | null ?? {};

      // Get workflow instance and send event
      const instance = await env.NEXUSOS_PIPELINE.get(missionId);
      const mission = await getMission(env, missionId);

      if (!mission) return json({ error: 'Mission not found' }, 404);

      // Determine which gate to send event to
      const currentPhase = mission.phase as string;
      const eventName = currentPhase === 'P2Pending' ? 'P2-approval' : 'P8-approval';

      await instance.sendEvent({
        type: eventName,
        payload: { action, note: (body as any).note },
      });

      return json({
        status: action,
        mission_id: missionId,
        phase: currentPhase,
      });
    }

    // GET /api/v1/missions/:id/events — get mission event log
    const eventsMatch = url.pathname.match(/^\/api\/v1\/missions\/([^/]+)\/events$/);
    if (eventsMatch && request.method === 'GET') {
      const events = await env.DB.prepare(
        'SELECT * FROM mission_events WHERE task_id = ? ORDER BY timestamp ASC'
      ).bind(eventsMatch[1]).all();
      return json(events.results);
    }

    return json({ error: 'Not found' }, 404);
  }
};
