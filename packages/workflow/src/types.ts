// packages/workflow/src/types.ts
import type { Workflow, D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

export interface MissionPayload {
  id: string;
  instruction: string;
  repo_url?: string;
  openclaw_session_id?: string;
  openclaw_channel?: string;
  source_user_id?: string;
  metadata?: Record<string, unknown>;
}

export type MissionPhase =
  | 'P0Trigger'
  | 'P1ContextPull'
  | 'P2Planning'
  | 'P2Pending'
  | 'P3Architecture'
  | 'P4Execution'
  | 'P5Verification'
  | 'P6Review'
  | 'P7Delivery'
  | 'P8Approval'
  | 'P8Pending'
  | 'Complete'
  | 'Rejected'
  | 'Failed';

export type MissionStatus =
  | 'ACTIVE'
  | 'AWAITING_APPROVAL'
  | 'BLOCKED'
  | 'COMPLETE'
  | 'REJECTED'
  | 'FAILED';

export interface MissionEvent {
  task_id: string;
  phase: MissionPhase;
  event_type: 'phase_update' | 'hitl_gate' | 'blocker' | 'mission_complete' | 'mission_failed';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalEvent {
  action: 'approve' | 'reject' | 'feedback';
  mission_id: string;
  note?: string;
  user_id?: string;
}

export interface ConnectorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  action_id: string;
  timestamp: string;
}

export interface Env {
  NEXUSOS_PIPELINE: Workflow;
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  CONNECTORS_URL: string;
  OPENCLAW_GATEWAY_URL: string;
  ENVIRONMENT: string;
}
