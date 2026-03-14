// packages/agent-harness/tools/openclaw-tools.ts
//
// Registry of every OpenClaw built-in tool available to NexusOS agents.
// Agents reference these by name — OpenClaw executes them inside its sandbox.
// NexusOS does NOT re-implement these tools; it configures which ones agents can use.
//
// Source: inspected from /tmp/openclaw/src/agents/tools/ and tool catalog

export const OPENCLAW_TOOLS = {

  // ── EXEC TOOL ──────────────────────────────────────────────────────────────
  // Run shell commands in the agent sandbox.
  // OpenClaw + exec-approvals + AgentShield all gate this at P6.
  exec: {
    name: 'exec',
    description: 'Execute shell commands in the sandboxed agent environment. Requires human approval for sensitive operations.',
    actions: ['run', 'background', 'kill', 'list', 'poll', 'log', 'write', 'submit'],
    security: 'sandboxed + exec-approvals + agentshield-gated (P6)',
    pty_modes: {
      claude_cli: false,      // use --print --permission-mode bypassPermissions
      codex: true,            // PTY required for interactive CLI
      generic_shell: false,   // non-interactive, no PTY needed
    },
    // NexusOS usage pattern (from coding-agent skill inspiration):
    usage_example: `
      # Submit task to Rust Traffic Controller (no PTY needed for curl)
      bash command:"curl -s -X POST http://localhost:3000/api/v1/agents/coder/run \\
        -H 'Content-Type: application/json' \\
        -d '{\\"instruction\\": \\"<task>\\"}' | jq ."

      # Poll pipeline status
      bash command:"curl -s http://localhost:3000/api/v1/missions/TASK_ID | jq '.phase,.status'"
    `,
  },

  // ── FILE TOOL ──────────────────────────────────────────────────────────────
  file: {
    name: 'file',
    description: 'Read, write, list, and manage files within the agent workspace.',
    actions: ['read', 'write', 'list', 'delete', 'move', 'copy', 'search'],
    boundaries: 'Restricted to MISSION_WORKSPACE and AGENT_WORKSPACE by ACP policy',
  },

  // ── BROWSER TOOL ──────────────────────────────────────────────────────────
  // Full headless browser via OpenClaw's browser bridge (Playwright/Chrome)
  browser: {
    name: 'browser',
    description: 'Navigate URLs, take screenshots, extract content, fill forms, click elements.',
    actions: ['open', 'screenshot', 'extract', 'click', 'fill', 'scroll', 'pdf', 'navigate'],
    // NexusOS use cases: read GitHub PRs, Figma files, Linear tickets
    nexusos_uses: ['github_pr_diff', 'figma_design_read', 'linear_ticket_read'],
  },

  // ── MEMORY TOOL ───────────────────────────────────────────────────────────
  // OpenClaw's vector memory — search across all past sessions
  memory: {
    name: 'memory',
    description: 'Search and store information in persistent vector memory across sessions.',
    actions: ['search', 'store', 'forget', 'list'],
    backend: 'Vector embeddings, managed by OpenClaw',
    files: {
      SOUL_md: 'Agent identity and behavior rules',
      MEMORY_md: 'Structured persistent context (this file is the seed)',
    },
  },

  // ── SESSIONS_SEND ──────────────────────────────────────────────────────────
  // Inter-agent messaging — send from one OpenClaw agent session to another
  sessions_send: {
    name: 'sessions_send',
    description: 'Send a message to another agent session (inter-agent communication).',
    // OpenClaw source: src/agents/tools/sessions-send-helpers.ts
    // Used for: passing P2 approval result from notification agent to mission agent
    nexusos_use: 'Relay P2/P8 HITL approval from developer back to pipeline session',
  },

  // ── WEB SEARCH ────────────────────────────────────────────────────────────
  web_search: {
    name: 'web_search',
    description: 'Search the web via configured providers (Brave, Kagi, Tavily, etc.)',
    actions: ['search'],
    nexusos_uses: ['research_library', 'check_latest_api_docs', 'find_error_solutions'],
  },

  // ── CANVAS TOOL ───────────────────────────────────────────────────────────
  canvas: {
    name: 'canvas',
    description: 'Create visual artifacts — diagrams, charts, HTML previews. Renders in OpenClaw UI.',
    actions: ['create', 'render', 'export'],
    nexusos_uses: ['architecture_diagrams', 'pipeline_status_charts', 'mission_reports'],
  },

} as const;

export type OpenClawToolName = keyof typeof OPENCLAW_TOOLS;

// ── Tool profile for NexusOS agent ─────────────────────────────────────────
// Referenced in .openclaw/openclaw.json under agents[].tools
export const NEXUSOS_AGENT_TOOLS: OpenClawToolName[] = [
  'exec',
  'file',
  'browser',
  'memory',
  'sessions_send',
  'web_search',
];

// ── Dangerous tool baseline (from OpenClaw src/security/dangerous-tools.ts) ─
// These are blocked by default in the HTTP gateway; require explicit allow
export const DANGEROUS_TOOL_BASELINE = [
  'exec',         // shell execution — sandboxed + AgentShield-gated
  'file.delete',  // destructive file op
  'file.write',   // file mutation
] as const;
