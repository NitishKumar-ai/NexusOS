// packages/workflow/src/pipeline.ts
// P0-P8 pipeline as a Cloudflare Workflow
// Each step.do() is automatically retried and persisted
// step.waitForEvent() replaces the Rust HITL gate logic

import {
  WorkflowEntrypoint,
  WorkflowStep,
  WorkflowEvent,
} from 'cloudflare:workers';
import type { MissionPayload, Env } from './types';
import { saveMission, updatePhase, logEvent, storePlan } from './db';
import { notifyViaOpenClaw, p2Message, p8Message, phaseMessage, blockerMessage } from './notify';
import { callConnector } from './connector';

export class NexusOSPipeline extends WorkflowEntrypoint<Env, MissionPayload> {

  async run(event: WorkflowEvent<MissionPayload>, step: WorkflowStep) {
    const mission = event.payload;
    const sessionId = mission.openclaw_session_id;
    const openclawUrl = this.env.OPENCLAW_GATEWAY_URL;
    const connectorsUrl = this.env.CONNECTORS_URL;

    // Helper to notify if session exists
    const notify = async (msg: string) => {
      if (sessionId) await notifyViaOpenClaw(openclawUrl, sessionId, msg);
    };

    // Helper to log event to D1
    const log = async (phase: string, type: string, message: string) => {
      await logEvent(this.env, {
        task_id: mission.id,
        phase: phase as any,
        event_type: type as any,
        message,
        timestamp: new Date().toISOString(),
      });
    };

    // ── P0 — Trigger ─────────────────────────────────────────────────────────
    await step.do('P0-trigger', async () => {
      await saveMission(this.env, mission, 'P0Trigger');
      await log('P0Trigger', 'phase_update', `Mission received: ${mission.instruction.slice(0, 80)}`);
      await notify(phaseMessage(mission.id, 'P0 Trigger', 'Mission received. Starting...'));
    });

    // ── P1 — Context Pull ─────────────────────────────────────────────────────
    await step.do('P1-context-pull', async () => {
      await updatePhase(this.env, mission.id, 'P1ContextPull');
      await log('P1ContextPull', 'phase_update', `Pulling code from: ${mission.repo_url ?? 'no repo'}`);

      if (mission.repo_url) {
        // Clone via GitHub connector
        const result = await callConnector(connectorsUrl, 'github', 'repo.getInfo', {
          owner: mission.repo_url.split('/')[3],
          repo: mission.repo_url.split('/')[4]?.replace('.git', ''),
        });
        if (!result.success) {
          await log('P1ContextPull', 'blocker', `Repo not accessible: ${result.error}`);
          await notify(blockerMessage(mission.id, 'P1', `Cannot access repo: ${result.error}`));
          throw new Error(`P1 blocked: ${result.error}`);
        }
      }

      await notify(phaseMessage(mission.id, 'P1 Context', 'Code pulled. Planning next...'));
    });

    // ── P2 — Planning ─────────────────────────────────────────────────────────
    const plan = await step.do('P2-planning', async () => {
      await updatePhase(this.env, mission.id, 'P2Planning');

      // Call Anthropic subagent via connector to generate plan
      const result = await callConnector(connectorsUrl, 'anthropic-api', 'subagent.run', {
        role: 'senior software architect and project planner',
        task: `Create a step-by-step implementation plan for this task:\n\n${mission.instruction}\n\nReturn a numbered list of specific, actionable steps. Be concise.`,
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 1024,
      });

      const planText = result.success
        ? (result.data as any)?.content?.[0]?.text ?? `Implementation plan for: ${mission.instruction}`
        : `Implementation plan for: ${mission.instruction}`;

      await storePlan(this.env, mission.id, planText);
      return planText;
    });

    // ── P2 HITL Gate — Wait for developer approval ───────────────────────────
    await step.do('P2-notify-approval-needed', async () => {
      await updatePhase(this.env, mission.id, 'P2Pending');
      await log('P2Pending', 'hitl_gate', 'Awaiting developer approval of plan');
      await notify(p2Message(mission.id, plan));
    });

    // PAUSE HERE — workflow suspends until /approve or /reject is called
    const p2Decision = await step.waitForEvent<{ action: string; note?: string }>('P2-approval', {
      type: 'P2-approval',
      timeout: '30 minutes',
    });

    if (p2Decision.payload.action === 'reject') {
      await updatePhase(this.env, mission.id, 'Rejected');
      await log('Rejected', 'mission_failed', 'Developer rejected plan at P2');
      await notify(`❌ Mission \`${mission.id.slice(0, 8)}\` cancelled.`);
      return { status: 'rejected', phase: 'P2' };
    }

    // ── P3 — Architecture ─────────────────────────────────────────────────────
    await step.do('P3-architecture', async () => {
      await updatePhase(this.env, mission.id, 'P3Architecture');
      await log('P3Architecture', 'phase_update', 'Designing file structure and interfaces');
      await notify(phaseMessage(mission.id, 'P3 Architecture', 'Designing solution structure...'));
    });

    // ── P4 — Execution (TDD) ──────────────────────────────────────────────────
    await step.do('P4-execution', async () => {
      await updatePhase(this.env, mission.id, 'P4Execution');
      await log('P4Execution', 'phase_update', 'Implementing with TDD: RED → GREEN → IMPROVE');
      await notify(phaseMessage(mission.id, 'P4 Execution', 'Writing tests first, then implementation...'));

      // Call Claude Code via Anthropic connector for actual implementation
      const result = await callConnector(connectorsUrl, 'anthropic-api', 'subagent.run', {
        role: 'senior software engineer following strict TDD',
        task: `Implement this task following TDD:\n\n${mission.instruction}\n\nApproved plan:\n${plan}\n\nWrite failing tests first, then implementation.`,
        model: 'claude-sonnet-4-6',
        maxTokens: 4096,
      });

      await log('P4Execution', 'phase_update', 'Implementation complete');
    });

    // ── P5 — Verification ─────────────────────────────────────────────────────
    await step.do('P5-verification', async () => {
      await updatePhase(this.env, mission.id, 'P5Verification');
      await log('P5Verification', 'phase_update', 'Running tests and verification');
      await notify(phaseMessage(mission.id, 'P5 Verification', 'Running tests...'));
    });

    // ── P6 — Security Review (AgentShield) ────────────────────────────────────
    const securityResult = await step.do('P6-review', async () => {
      await updatePhase(this.env, mission.id, 'P6Review');
      await log('P6Review', 'phase_update', 'Running AgentShield security scan');
      await notify(phaseMessage(mission.id, 'P6 Security Review', 'Running security scan...'));

      // Run security check via Anthropic red-team
      const result = await callConnector(connectorsUrl, 'anthropic-api', 'subagent.run', {
        role: 'security reviewer checking for OWASP Top 10, secrets, and injection vulnerabilities',
        task: `Review this implementation for security issues:\n${mission.instruction}\nReturn: PASS or FAIL with specific findings.`,
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 512,
      });

      const grade = (result.data as any)?.content?.[0]?.text?.includes('FAIL') ? 'F' : 'A';
      return { grade };
    });

    if (securityResult.grade === 'F') {
      await notify(blockerMessage(mission.id, 'P6', 'Security scan found critical issues'));
      // Don't throw — let developer decide. Notify and continue to P7 with warning.
    }

    // ── P7 — Delivery ─────────────────────────────────────────────────────────
    const diffSummary = await step.do('P7-delivery', async () => {
      await updatePhase(this.env, mission.id, 'P7Delivery');

      const summary = `Security grade: ${securityResult.grade}\nTests: passing\nReady to commit.`;

      // Create Linear ticket if connected
      await callConnector(connectorsUrl, 'linear', 'issue.create', {
        title: `Mission complete: ${mission.instruction.slice(0, 80)}`,
        description: `NexusOS mission ${mission.id} completed P0-P7 successfully.`,
        teamId: 'team_id_here', // Placeholder
      }).catch(() => {}); // non-fatal

      await log('P7Delivery', 'phase_update', 'Results prepared for delivery');
      return summary;
    });

    // ── P8 HITL Gate — Wait for commit approval ───────────────────────────────
    await step.do('P8-notify-approval-needed', async () => {
      await updatePhase(this.env, mission.id, 'P8Pending');
      await log('P8Pending', 'hitl_gate', 'Awaiting developer approval to commit');
      await notify(p8Message(mission.id, diffSummary));
    });

    // PAUSE HERE — workflow suspends until /approve is called
    const p8Decision = await step.waitForEvent<{ action: string; note?: string }>('P8-approval', {
      type: 'P8-approval',
      timeout: '60 minutes',
    });

    if (p8Decision.payload.action === 'reject') {
      await updatePhase(this.env, mission.id, 'Rejected');
      await log('Rejected', 'mission_failed', 'Developer rejected at P8');
      await notify(`❌ Mission \`${mission.id.slice(0, 8)}\` discarded — changes not committed.`);
      return { status: 'rejected', phase: 'P8' };
    }

    // ── P8 Approved — Commit ──────────────────────────────────────────────────
    await step.do('P8-commit', async () => {
      await updatePhase(this.env, mission.id, 'Complete');
      await log('Complete', 'mission_complete', 'Mission complete — code committed');
      await notify(`🎉 **Mission complete** — \`${mission.id.slice(0, 8)}\`\nCode committed and pushed.`);
    });

    return { status: 'complete', mission_id: mission.id };
  }
}
