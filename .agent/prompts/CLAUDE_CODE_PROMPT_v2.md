# 🤖 NEXUSOS — MASTER AGENT PROMPT v2 (CORRECTED)
# Updated with actual ECC repo structure from live GitHub inspection.
# Previous prompt had wrong folder paths — this is the accurate version.
# Paste this into Claude Code at the root of your NexusOS repo.

---

You are working inside the NexusOS monorepo.
Your job: restructure the repo, cherry-pick the right files from two external repos,
and leave behind a clean, production-ready codebase.

Do NOT rewrite any existing working logic. Move, copy, wire — do not rebuild.

---

## 🧠 PROJECT CONTEXT

NexusOS is an Agent Mission Control platform with 4 layers:

1. TRIGGER LAYER     — Discord, WhatsApp, Telegram, CLI, GitHub Webhook
2. ORCHESTRATION     — Rust/Axum Traffic Controller (packages/traffic-controller) ← DO NOT TOUCH
3. AGENT EXECUTION   — ECC harness with 18 agents, 94+ skills
4. DELIVERY LAYER    — WebSocket + Next.js Dashboard

Two external repos to pull from (clone fresh):
- ECC:      https://github.com/affaan-m/everything-claude-code  → /tmp/ecc
- OpenClaw: https://github.com/openclaw/openclaw.git             → /tmp/openclaw

---

## PHASE 0 — CLONE EXTERNAL REPOS

```bash
git clone https://github.com/affaan-m/everything-claude-code /tmp/ecc
git clone https://github.com/openclaw/openclaw.git /tmp/openclaw

# Verify ECC structure — confirms actual folder names before copying
ls /tmp/ecc
# Expected: agents/ skills/ hooks/ commands/ mcp-configs/ rules/ scripts/ contexts/ examples/ CLAUDE.md AGENTS.md install.sh
```

---

## PHASE 1 — CLEAN THE NEXUSOS REPO

### Step 1.1 — Fix .gitignore
```
.temp_clones/
nexusos.db
*.db
.env
.env.local
node_modules/
target/
dist/
.next/
```

### Step 1.2 — Remove committed runtime artifacts
```bash
git rm -r --cached .temp_clones 2>/dev/null || true
rm -rf .temp_clones
```

### Step 1.3 — Move misplaced root files
```bash
mv prd.md docs/prd.md
mkdir -p packages/traffic-controller/tests
mv test_ws.js packages/traffic-controller/tests/test_ws.js
rm -f package-lock.json   # pnpm only — delete npm lockfile
```

### Step 1.4 — Commit cleanup
```bash
git add -A
git commit -m "chore: clean repo structure, fix gitignore, remove artifacts"
```

---

## PHASE 2 — CREATE TARGET FOLDER STRUCTURE

```bash
mkdir -p packages/agent-harness/agents
mkdir -p packages/agent-harness/skills
mkdir -p packages/agent-harness/hooks
mkdir -p packages/agent-harness/commands
mkdir -p packages/agent-harness/mcp
mkdir -p packages/agent-harness/rules/common
mkdir -p packages/agent-harness/rules/typescript
mkdir -p packages/agent-harness/contexts
mkdir -p packages/channels/discord
mkdir -p packages/channels/telegram
mkdir -p packages/channels/whatsapp
mkdir -p packages/channels/routing
mkdir -p packages/sdk-bridge/adapters
mkdir -p packages/connectors/_template
mkdir -p packages/connectors/linear
mkdir -p packages/connectors/firebase
mkdir -p packages/connectors/figma
mkdir -p packages/connectors/github
mkdir -p dashboard/lib
mkdir -p scripts
```

---

## PHASE 3 — CHERRY-PICK FROM ECC (everything-claude-code)

⚠️ NOTE: The actual ECC folder names are different from what you might assume.
         Use EXACTLY these paths after verifying with `ls /tmp/ecc`.

### ✅ TAKE THESE — copy to packages/agent-harness/

| What | Exact Source Path | Destination | Why |
|---|---|---|---|
| Specialized agents | /tmp/ecc/agents/ | packages/agent-harness/agents/ | 18 agents: planner, architect, security-reviewer, tdd-guide, etc. |
| Skills | /tmp/ecc/skills/ | packages/agent-harness/skills/ | 94+ skills covering every dev domain |
| Hook config | /tmp/ecc/hooks/hooks.json | packages/agent-harness/hooks/hooks.json | All PreToolUse/PostToolUse/Stop/SessionStart automations |
| Hook scripts | /tmp/ecc/scripts/ | packages/agent-harness/scripts/ | Node.js implementations of all hooks (cross-platform) |
| Slash commands | /tmp/ecc/commands/ | packages/agent-harness/commands/ | 40+ slash commands: /plan, /tdd, /code-review, /security-scan etc. |
| MCP server configs | /tmp/ecc/mcp-configs/ | packages/agent-harness/mcp/ | 14 MCP configs: GitHub, Supabase, Vercel, Railway etc. |
| CLAUDE.md | /tmp/ecc/CLAUDE.md | packages/agent-harness/CLAUDE.md | ECC entry point — the harness root config |
| AGENTS.md | /tmp/ecc/AGENTS.md | packages/agent-harness/AGENTS.md | Universal cross-tool agent definitions |
| Common rules | /tmp/ecc/rules/common/ | packages/agent-harness/rules/common/ | Language-agnostic principles: git, testing, security, hooks, performance |
| TypeScript rules | /tmp/ecc/rules/typescript/ | packages/agent-harness/rules/typescript/ | TS/JS patterns — needed since dashboard is Next.js TypeScript |
| Context prompts | /tmp/ecc/contexts/ | packages/agent-harness/contexts/ | dev.md, review.md, research.md — dynamic system prompt injection |
| Rust Axum example | /tmp/ecc/examples/rust-api-CLAUDE.md | docs/rust-api-reference.md | ⭐ CRITICAL: real-world Rust Axum + SQLx + PostgreSQL config — directly relevant to your Traffic Controller |

```bash
cp -r /tmp/ecc/agents/ packages/agent-harness/agents/
cp -r /tmp/ecc/skills/ packages/agent-harness/skills/
cp /tmp/ecc/hooks/hooks.json packages/agent-harness/hooks/hooks.json
cp -r /tmp/ecc/scripts/ packages/agent-harness/scripts/
cp -r /tmp/ecc/commands/ packages/agent-harness/commands/
cp -r /tmp/ecc/mcp-configs/ packages/agent-harness/mcp/
cp /tmp/ecc/CLAUDE.md packages/agent-harness/CLAUDE.md
cp /tmp/ecc/AGENTS.md packages/agent-harness/AGENTS.md
cp -r /tmp/ecc/rules/common/ packages/agent-harness/rules/common/
cp -r /tmp/ecc/rules/typescript/ packages/agent-harness/rules/typescript/
cp -r /tmp/ecc/contexts/ packages/agent-harness/contexts/
cp /tmp/ecc/examples/rust-api-CLAUDE.md docs/rust-api-reference.md
```

### ❌ DO NOT TAKE FROM ECC:

| Path | Why to skip |
|---|---|
| .claude-plugin/ | Plugin marketplace manifest — NexusOS isn't a Claude Code plugin |
| .claude/ | User-level Claude Code config — not portable to NexusOS |
| .codex/ | Codex-specific format — NexusOS doesn't target Codex |
| .cursor/ | Cursor IDE config — not relevant |
| .opencode/ | OpenCode specific — not relevant |
| .agents/skills/ | Codex-specific skill format — use skills/ instead |
| .github/ | ECC's own CI/CD — NexusOS has its own |
| assets/ | Images for ECC's README |
| docs/ | ECC documentation — not NexusOS docs |
| plugins/ | Plugin registry — NexusOS doesn't use this |
| schemas/ | ECC-internal schemas |
| tests/ | ECC's own test suite for their npm package |
| examples/ (everything except rust-api-CLAUDE.md) | Other framework examples irrelevant to NexusOS stack |
| package.json / package-lock.json | ECC npm package config — conflicts with NexusOS workspace |
| marketplace.json | ECC marketplace — not relevant |
| commitlint.config.js / eslint.config.js | ECC linting config — NexusOS has its own |
| README*, CHANGELOG*, CONTRIBUTING*, SPONSORS* | ECC project docs |
| rules/python/ rules/golang/ rules/swift/ rules/php/ | Other languages — NexusOS uses Rust + TypeScript only |
| install.sh | ECC's own installer — reference it for nexusos init but don't copy |
| the-*.md guide files | ECC learning guides — not NexusOS docs |

### ⭐ BONUS — AgentShield (install as npm package, don't copy code)

AgentShield is a SEPARATE published npm package — not a folder inside ECC.
Install it properly:

```bash
# Install AgentShield as a dependency in agent-harness package
cd packages/agent-harness
pnpm init  # if no package.json yet
pnpm add ecc-agentshield

# Now it's available as: npx ecc-agentshield scan
```

Add a scan script to packages/agent-harness/package.json:
```json
{
  "scripts": {
    "security:scan": "ecc-agentshield scan",
    "security:scan:fix": "ecc-agentshield scan --fix",
    "security:scan:deep": "ecc-agentshield scan --opus --stream"
  }
}
```

---

## PHASE 4 — CHERRY-PICK FROM OPENCLAW

Source: /tmp/openclaw

### Before copying — inspect actual OpenClaw structure:
```bash
ls /tmp/openclaw
ls /tmp/openclaw/src 2>/dev/null || echo "no src/ folder, check root"
```

### ✅ TAKE THESE — copy to packages/channels/

NexusOS only needs OpenClaw's channel adapters. Everything else stays in OpenClaw.

| What | Look for in /tmp/openclaw | Destination | Why |
|---|---|---|---|
| Discord adapter | src/discord/ or discord/ | packages/channels/discord/ | Discord bot + slash command handler |
| Telegram adapter | src/telegram/ or telegram/ | packages/channels/telegram/ | Telegram notifications (already designed in NexusOS) |
| WhatsApp adapter | src/whatsapp/ or src/web/ | packages/channels/whatsapp/ | WhatsApp command interface |
| Routing logic | src/routing/ or routing/ | packages/channels/routing/ | Unified message → agent routing |

If folder names differ from above, adapt accordingly after running ls.

### Create packages/channels/index.ts:
```typescript
// NexusOS Channel Registry
// All channels implement CommandMessage interface + listen() function

export { DiscordChannel } from './discord';
export { TelegramChannel } from './telegram';
export { WhatsAppChannel } from './whatsapp';
export type { CommandMessage, ChannelResponse } from './types';
```

### Create packages/channels/types.ts:
```typescript
export interface CommandMessage {
  channel: 'discord' | 'telegram' | 'whatsapp';
  from: string;           // user identifier
  text: string;           // raw command text
  parsed?: {
    agent: string;        // e.g. "research-agent"
    task: string;         // e.g. "summarise last 10 Linear tickets"
    params: Record<string, string>;
  };
  timestamp: string;
  session_id?: string;
}

export interface ChannelResponse {
  to: string;
  text: string;
  trace_id: string;
  status: 'success' | 'refused' | 'error' | 'pending';
}
```

### ❌ DO NOT TAKE FROM OPENCLAW:

| What | Why to skip |
|---|---|
| AI/agent logic (src/agent/, agents/) | NexusOS uses ECC harness — not OpenClaw's AI |
| Skills system | NexusOS uses ECC skills |
| OpenClaw dashboard | NexusOS has its own Next.js dashboard |
| OpenClaw CLI | NexusOS will have its own nexusos init |
| Memory system | v2 feature, not needed now |
| SOUL.md / personality config | NexusOS uses CLAUDE.md from ECC |
| MEMORY.md | v2 feature |
| openclaw.json | OpenClaw's master config — NexusOS has its own |
| Extensions/ | Too complex for v1 |
| package.json / node_modules | Conflicts with NexusOS workspace |
| Any README or docs | OpenClaw documentation |

---

## PHASE 5 — BUILD SDK BRIDGE ADAPTERS

Create packages/sdk-bridge/adapters/types.ts:
```typescript
export interface AgentAdapter {
  name: string;
  sdk: 'claude-code' | 'langchain' | 'langgraph' | 'python';
  invoke(task: AgentTask): Promise<AgentResult>;
  healthCheck(): Promise<boolean>;
}

export interface AgentTask {
  instruction: string;
  repo_url?: string;
  context?: Record<string, unknown>;
  session_id: string;
  agent_name?: string;
}

export interface AgentResult {
  status: 'success' | 'refused' | 'error';
  result: string;
  trace_id: string;
  timestamp: string;
  tool_calls: unknown[];
  mcp_actions: unknown[];
}
```

Create stub adapters for each SDK (implement healthCheck + invoke with console.log):
- packages/sdk-bridge/adapters/claude-code.ts
- packages/sdk-bridge/adapters/langchain.ts
- packages/sdk-bridge/adapters/langgraph.ts
- packages/sdk-bridge/adapters/python-generic.ts

Create packages/sdk-bridge/index.ts (registry):
```typescript
import { ClaudeCodeAdapter } from './adapters/claude-code';
import { LangChainAdapter } from './adapters/langchain';
import { LangGraphAdapter } from './adapters/langgraph';
import { PythonAdapter } from './adapters/python-generic';
import type { AgentAdapter } from './adapters/types';

const registry: Record<string, AgentAdapter> = {
  'claude-code': new ClaudeCodeAdapter(),
  'langchain':   new LangChainAdapter(),
  'langgraph':   new LangGraphAdapter(),
  'python':      new PythonAdapter(),
};

export function getAdapter(type: string): AgentAdapter {
  return registry[type] ?? registry['claude-code'];
}

export function listAdapters(): string[] {
  return Object.keys(registry);
}
```

---

## PHASE 6 — SCAFFOLD MCP CONNECTORS

Create packages/connectors/types.ts:
```typescript
export interface MCPConnector {
  name: string;
  version: string;
  connect(config: ConnectorConfig): Promise<void>;
  execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult>;
  disconnect(): Promise<void>;
}

export interface ConnectorConfig {
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  [key: string]: string | undefined;
}

export interface ConnectorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  action_id: string;
  timestamp: string;
}
```

Create packages/connectors/_template/index.ts:
```typescript
import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class TemplateConnector implements MCPConnector {
  name = 'template';
  version = '1.0.0';
  private config: ConnectorConfig = {};

  async connect(config: ConnectorConfig): Promise<void> {
    this.config = config;
    console.log(`[${this.name}] Connected`);
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    console.log(`[${this.name}] Executing: ${action}`, params);
    // TODO: Implement action logic
    return {
      success: true,
      data: null,
      action_id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }

  async disconnect(): Promise<void> {
    console.log(`[${this.name}] Disconnected`);
  }
}
```

Copy _template into each connector and rename the class:
```bash
for connector in linear firebase figma github; do
  cp packages/connectors/_template/index.ts packages/connectors/$connector/index.ts
  # Then rename class from TemplateConnector to LinearConnector etc.
done
```

---

## PHASE 7 — WIRE DASHBOARD TO TRAFFIC CONTROLLER

Create dashboard/lib/gateway.ts:
```typescript
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
```

Update dashboard components:
- CommandBar.tsx  → import { submitMission } from '../lib/gateway'
- LiveFeed.tsx    → import { createWebSocket } from '../lib/gateway'
- AuditLog.tsx   → import { listMissions } from '../lib/gateway'

---

## PHASE 8 — UPDATE pnpm-workspace.yaml

Ensure all packages are declared:
```yaml
packages:
  - 'packages/*'
  - 'dashboard'
```

---

## PHASE 9 — FINAL COMMIT

```bash
git add -A
git commit -m "feat: restructure monorepo — integrate ECC harness + OpenClaw channels, scaffold SDK bridge + connectors, wire dashboard gateway"
git push origin main
```

---

## ✅ FINAL STATE — WHAT NEXUSOS OWNS vs WHAT IT BORROWS

| Package | Source | Notes |
|---|---|---|
| packages/traffic-controller/ | 100% NexusOS original | Rust/Axum — never touched |
| packages/agent-harness/agents/ | From ECC /agents/ | 18 specialized agents |
| packages/agent-harness/skills/ | From ECC /skills/ | 94+ skills |
| packages/agent-harness/hooks/ | From ECC /hooks/hooks.json | Hook automations |
| packages/agent-harness/scripts/ | From ECC /scripts/ | Hook Node.js implementations |
| packages/agent-harness/commands/ | From ECC /commands/ | 40+ slash commands |
| packages/agent-harness/mcp/ | From ECC /mcp-configs/ | 14 MCP server configs |
| packages/agent-harness/rules/ | From ECC /rules/common/ + /typescript/ | Agent behavior rules |
| packages/agent-harness/contexts/ | From ECC /contexts/ | Dynamic prompt injection |
| packages/channels/ | From OpenClaw (channel layer only) | Discord, Telegram, WhatsApp |
| packages/sdk-bridge/ | 100% NexusOS original | Multi-SDK adapter layer |
| packages/connectors/ | 100% NexusOS original | Linear, Firebase, Figma, GitHub |
| dashboard/ | 100% NexusOS original | Next.js 14, Vercel |

---

## 🚫 HARD RULES — DO NOT VIOLATE

1. NEVER modify packages/traffic-controller/src/ — Rust works, hands off
2. NEVER copy OpenClaw's AI/agent logic — ECC is the intelligence layer
3. NEVER copy ECC's channel adapters — OpenClaw owns channels
4. NEVER commit .env, .db, or .temp_clones/
5. NEVER use npm install — pnpm only
6. ALL Traffic Controller API calls go through dashboard/lib/gateway.ts ONLY
7. AgentShield is an npm package (ecc-agentshield), not a folder to copy
8. Adapt paths if actual OpenClaw/ECC folder names differ — run ls first

---

## 🗺️ BUILD ORDER AFTER THIS TASK

WEEK 1  → This restructure (current task)
WEEK 2  → Implement Telegram notifications in Rust traffic-controller
WEEK 3  → Complete HITL P2 + P8 approval gates in traffic-controller
WEEK 4  → Wire dashboard components using gateway.ts, complete LiveFeed WebSocket
WEEK 5  → Implement Firebase MCP connector (easiest API — start here)
WEEK 6  → Discord bot commands → channels/ → traffic-controller pipeline
WEEK 7  → Linear + GitHub connectors + WhatsApp bot
WEEK 8  → Private beta prep, polish, README, one-command setup

North star: developer runs pnpm dev and controls an agent from Discord in under 20 minutes.

---

Start at PHASE 0. Run ls /tmp/ecc and ls /tmp/openclaw before any copying.
Report after each phase: what was done, any missing folders, any decisions made.
