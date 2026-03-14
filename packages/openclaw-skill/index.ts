// packages/openclaw-skill/index.ts
//
// NexusOS OpenClaw Skill — entry point
//
// OpenClaw loads this skill when it finds SKILL.md in this directory.
// When a developer sends /mission or /run in Discord/WhatsApp/Telegram,
// OpenClaw routes the message here. We forward it to the Rust Traffic Controller,
// which runs the P0-P8 pipeline and delivers results back through OpenClaw.

const NEXUSOS_GATEWAY = process.env.NEXUSOS_GATEWAY_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenClawSkillContext {
  /** Raw message from the developer */
  message: string;
  /** OpenClaw agent ID (e.g. "nexusos-coder") */
  agentId: string;
  /** OpenClaw session ID for this conversation */
  sessionId: string;
  /** Channel the message came from */
  channel: 'discord' | 'telegram' | 'whatsapp' | 'slack' | 'api';
  /** Developer's user/sender ID in the channel */
  userId: string;
  /** Any extra metadata from OpenClaw */
  metadata?: Record<string, unknown>;
}

export interface SkillResult {
  response: string;
  metadata?: Record<string, unknown>;
}

interface MissionRecord {
  id: string;
  phase: string;
  status: string;
  instruction: string;
}

// ─── Main command router ──────────────────────────────────────────────────────

export async function route(ctx: OpenClawSkillContext): Promise<SkillResult> {
  const msg = ctx.message.trim();

  if (/^\/(approve|reject)\s+/i.test(msg))      return handleApproval(ctx);
  if (/^\/status(\s+|$)/i.test(msg))            return handleStatus(ctx);
  if (/^\/(mission|run|code)\s*/i.test(msg))    return handleMission(ctx);
  if (/^(build|implement|fix|add|create)\s+/i.test(msg)) return handleMission(ctx);

  return {
    response: [
      '👋 **NexusOS** — AI Engineering Agent',
      '',
      '**Commands:**',
      '`/mission <task>` — start a new mission',
      '`/run <task>` — alias for /mission',
      '`/status` — list active missions',
      '`/status <id>` — check a specific mission',
      '`/approve <id>` — approve P2 plan or P8 diff',
      '`/reject <id> "feedback"` — reject with notes',
      '',
      'Or just describe what you want built:',
      '`Add auth to the API`',
      '`Fix the null pointer in agent.rs`',
    ].join('\n'),
  };
}

// ─── Mission submission ───────────────────────────────────────────────────────

export async function handleMission(ctx: OpenClawSkillContext): Promise<SkillResult> {
  // Strip command prefix if present
  const instruction = ctx.message
    .replace(/^\/(mission|run|code)\s*/i, '')
    .trim();

  if (!instruction) {
    return { response: '🤔 What should I build? Try: `/mission Add auth to the API`' };
  }

  try {
    const res = await fetch(`${NEXUSOS_GATEWAY}/api/v1/agents/coder/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        repo_url: extractRepoUrl(ctx.message) ?? undefined,
        metadata: {
          openclaw_session: ctx.sessionId,
          openclaw_channel: ctx.channel,
          openclaw_user: ctx.userId,
          openclaw_agent: ctx.agentId,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Traffic Controller ${res.status}: ${body}`);
    }

    const mission: MissionRecord = await res.json();

    return {
      response: [
        `🚀 **Mission started** — \`${mission.id}\``,
        `📋 **Task:** ${instruction}`,
        `⏳ **Phase:** P1 — pulling code...`,
        ``,
        `I'll pause at **P2** (plan approval) and **P8** (commit approval).`,
        `Track: http://localhost:3001/missions/${mission.id}`,
      ].join('\n'),
      metadata: { mission_id: mission.id },
    };
  } catch (err) {
    return {
      response: `❌ Failed to start mission: ${err instanceof Error ? err.message : 'Unknown error'}\nIs the NexusOS Traffic Controller running? (\`cd packages/traffic-controller && cargo run\`)`,
    };
  }
}

// ─── HITL approval handler ────────────────────────────────────────────────────

export async function handleApproval(ctx: OpenClawSkillContext): Promise<SkillResult> {
  const match = ctx.message.match(/^\/(approve|reject)\s+([a-f0-9-]+)(.*)/i);
  if (!match) {
    return { response: 'Usage: `/approve <mission-id>` or `/reject <mission-id> "notes"`' };
  }

  const [, action, missionId, rest] = match;
  const note = rest?.trim().replace(/^["']|["']$/g, '') ?? '';

  try {
    const res = await fetch(
      `${NEXUSOS_GATEWAY}/api/v1/missions/${missionId}/${action.toLowerCase()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, openclaw_session: ctx.sessionId }),
      },
    );

    if (!res.ok) throw new Error(`${res.status}`);

    const result: { phase?: string } = await res.json();
    const isApprove = action.toLowerCase() === 'approve';

    return {
      response: isApprove
        ? `✅ Approved — mission \`${missionId.slice(0, 8)}\` continues to ${result.phase ?? 'next phase'}`
        : `❌ Rejected — mission \`${missionId.slice(0, 8)}\` stopped${note ? ` — "${note}"` : ''}`,
      metadata: { mission_id: missionId, action },
    };
  } catch (err) {
    return {
      response: `❌ Could not submit ${action}: ${err instanceof Error ? err.message : 'error'}\nCheck mission ID and try again.`,
    };
  }
}

// ─── Mission status ───────────────────────────────────────────────────────────

export async function handleStatus(ctx: OpenClawSkillContext): Promise<SkillResult> {
  const missionId = ctx.message.match(/\/status\s+([a-f0-9-]+)/i)?.[1];

  try {
    if (missionId) {
      // Single mission status
      const res = await fetch(`${NEXUSOS_GATEWAY}/api/v1/missions/${missionId}`);
      if (!res.ok) throw new Error(`Mission not found: ${missionId}`);
      const m: MissionRecord = await res.json();

      return {
        response: [
          `📊 Mission \`${missionId.slice(0, 8)}\``,
          `**Phase:** ${m.phase}`,
          `**Status:** ${m.status}`,
          `**Task:** ${m.instruction}`,
          m.status === 'AWAITING_APPROVAL'
            ? `\n🛑 **Awaiting your approval** — reply \`/approve ${m.id}\` or \`/reject ${m.id} "notes"\`` : '',
        ].filter(Boolean).join('\n'),
      };
    }

    // List all active missions
    const res = await fetch(`${NEXUSOS_GATEWAY}/api/v1/missions`);
    const missions: MissionRecord[] = await res.json();
    const active = missions.filter(m => !['COMPLETE', 'FAILED', 'REJECTED'].includes(m.status));

    if (active.length === 0) return { response: '✅ No active missions' };

    return {
      response: [
        `**${active.length} active mission(s):**`,
        ...active.map(m =>
          `• \`${m.id.slice(0, 8)}\` — **${m.phase}** — ${m.instruction.slice(0, 60)}...`
        ),
      ].join('\n'),
    };
  } catch (err) {
    return { response: `❌ Error: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractRepoUrl(message: string): string | null {
  return message.match(/https?:\/\/github\.com\/[^\s]+/)?.[0] ?? null;
}
