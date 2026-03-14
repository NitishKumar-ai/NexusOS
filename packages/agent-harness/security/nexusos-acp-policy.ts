// packages/agent-harness/security/nexusos-acp-policy.ts
//
// NexusOS Access Control Policy — runs ON TOP of OpenClaw's built-in security.
//
// OpenClaw provides:
//   - exec-approvals system (off | on-miss | always) per command
//   - dangerous-tools baseline blocking in HTTP gateway
//   - audit chain (src/security/audit*.ts) for all tool calls
//   - dm-policy-shared.ts for channel-level access control
//
// NexusOS adds:
//   - Application-level HITL gates (P2 and P8)
//   - Filesystem boundary enforcement per mission workspace
//   - Credential leak detection patterns
//   - ACP provenance tagging for all mission sessions
//
// Two-layer defense: OpenClaw sandbox → NexusOS ACP policy → AgentShield (P6)

export const NEXUSOS_ACP_POLICY = {

  // ── MISSION HITL GATES ───────────────────────────────────────────────────
  // These pause the P0-P8 pipeline and require developer reply via OpenClaw
  hitl_gates: {
    P2_planning: {
      trigger: 'Before any code is written',
      what_developer_sees: 'Complete implementation plan with estimated file changes',
      valid_responses: ['approve', 'reject', 'feedback'],
      approval_command: '/approve <task-id>',
      rejection_command: '/reject <task-id> "notes"',
      timeout_minutes: 30,
      on_timeout: 'remind_and_wait',  // re-notify, never auto-approve
    },
    P8_commit: {
      trigger: 'Before git commit or push to any branch',
      what_developer_sees: 'Full diff, test results, security scan summary',
      valid_responses: ['approve', 'reject'],
      approval_command: '/approve <task-id>',
      rejection_command: '/reject <task-id> "notes"',
      timeout_minutes: 60,
      on_timeout: 'remind_and_wait',
    },
  },

  // ── BLOCKED COMMAND PATTERNS ─────────────────────────────────────────────
  // Blocked in addition to OpenClaw's dangerous-tools baseline
  // Source pattern: inspected from src/security/dangerous-tools.ts
  blocked_patterns: [
    'rm -rf /',
    'rm -rf ~',
    'rm -rf $HOME',
    'sudo rm',
    'chmod 777',
    'curl * | bash',
    'curl * | sh',
    'wget * | sh',
    'wget * | bash',
    '>& /dev/tcp/',           // reverse shell
    'base64 -d | bash',       // encoded payload execution
    'python -c "import socket', // reverse shell via python
    'git push --force',        // force push forbidden
    'git push origin main',    // direct main push forbidden
    'git push origin master',  // direct master push forbidden
  ],

  // ── FILESYSTEM BOUNDARIES ────────────────────────────────────────────────
  // Enforced per-mission — agents can only touch these paths
  allowed_paths: [
    '${MISSION_WORKSPACE}',   // .temp_clones/{task_id}/ — cloned repo
    '${AGENT_WORKSPACE}',     // packages/agent-harness/
    '/tmp/nexusos-*',         // temp files tagged to NexusOS
  ],
  denied_paths: [
    '~/.ssh',
    '~/.aws',
    '~/.config/openclaw',     // never let agents read OpenClaw gateway secrets
    '~/.config/anthropic',    // never let agents read AI provider keys
    '/etc',
    '/var',
    '/sys',
    '/private/var',           // macOS system
    '${HOME}/.env',
  ],

  // ── CREDENTIAL PATTERNS (agent output screening) ─────────────────────────
  // If an agent output or log contains these patterns, block it and alert
  secret_patterns: [
    /sk-ant-[a-zA-Z0-9]{20,}/,     // Anthropic API keys
    /ghp_[a-zA-Z0-9]{36}/,         // GitHub personal access tokens
    /AKIA[A-Z0-9]{16}/,            // AWS access key IDs
    /lin_api_[a-zA-Z0-9]+/,        // Linear API keys
    /figd_[a-zA-Z0-9_-]+/,         // Figma tokens
    /"private_key":\s*"-----BEGIN/, // Firebase service account
    /sk-[a-zA-Z0-9]{20,}/,         // OpenAI keys
  ],
  on_secret_detected: 'block_output_and_alert',

  // ── ACP PROVENANCE ───────────────────────────────────────────────────────
  // Tag all NexusOS missions with ACP provenance for audit trail
  // Aligns with OpenClaw's src/acp/ provenance system
  acp_provenance: {
    enabled: true,
    mode: 'meta+receipt',            // attach metadata + generate receipts
    inject_session_trace_id: true,   // every mission gets a trace ID
    trace_id_format: 'nexusos-{uuid}',
    audit_destinations: ['sqlite://nexusos.db', 'openclaw_audit_log'],
  },

  // ── AGENTSHIELD INTEGRATION (P6) ────────────────────────────────────────
  agentshield: {
    run_at_phase: 'P6',
    package: 'ecc-agentshield@1.3.0',
    scan_modes: {
      standard: { block_on: ['CRITICAL'], flag_on: ['HIGH', 'MEDIUM'] },
      deep:     { block_on: ['CRITICAL', 'HIGH'], flag_on: ['MEDIUM', 'LOW'] },
      opus:     { block_on: ['CRITICAL', 'HIGH', 'MEDIUM'], flag_on: ['LOW'] },
    },
    default_mode: process.env.AGENTSHIELD_SCAN_LEVEL ?? 'standard',
  },

} as const;

export type HitlGate = keyof typeof NEXUSOS_ACP_POLICY.hitl_gates;
