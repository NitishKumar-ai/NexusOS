# 🏗️ NexusOS — Architecture Deep Dive

---

## System Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │           TRIGGER LAYER              │
                    │  Discord · WhatsApp · Telegram       │
                    │  CLI curl · GitHub Webhook · PWA     │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │       ORCHESTRATION LAYER            │
                    │   🦀 Traffic Controller (Rust/Axum)  │
                    │        Port 3000                     │
                    │                                      │
                    │  ┌─────────────────────────────┐    │
                    │  │     P0–P8 Mission Pipeline   │    │
                    │  │  P0 Trigger                  │    │
                    │  │  P1 Context Pull (Git)        │    │
                    │  │  P2 Planning ⏸ HITL Gate     │    │
                    │  │  P3 Architecture              │    │
                    │  │  P4 Execution (TDD)           │    │
                    │  │  P5 Verification (Tests)      │    │
                    │  │  P6 Review (AgentShield)      │    │
                    │  │  P7 Delivery (Telegram/WS)    │    │
                    │  │  P8 Approval ✅ HITL Gate     │    │
                    │  └─────────────────────────────┘    │
                    │                                      │
                    │  REST API · WebSocket · SQLite Log   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │       AGENT EXECUTION LAYER          │
                    │   🤖 ECC Agent Harness               │
                    │                                      │
                    │   18 Specialized Agents              │
                    │   94+ Skills                         │
                    │   40+ Slash Commands                 │
                    │   AgentShield (102 rules)            │
                    │   Hook Automations                   │
                    │   14 MCP Configurations              │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         DELIVERY LAYER               │
                    │  WebSocket Stream · Telegram Bot     │
                    │  Next.js Dashboard (Port 3001)       │
                    │  Vercel Hosted                       │
                    └─────────────────────────────────────┘
```

---

## Layer 1 — Traffic Controller (Rust/Axum)

**Path:** `packages/traffic-controller/`  
**Tech:** Rust + Axum + Tokio + SQLite (rusqlite)  
**Status:** ✅ 80% complete — compilable and runnable

### What's Built

| Component | File | Status |
|---|---|---|
| HTTP Server (Axum) | src/main.rs | ✅ Working |
| WebSocket Live Stream | src/main.rs | ✅ Working |
| Mission Runner (P0–P8) | src/agent.rs | ✅ Working |
| SQLite Audit Log | src/db.rs | ✅ Working |
| Data Models | src/lib.rs | ✅ Working |

### REST API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | /health | Health check |
| GET | /ws | WebSocket live event stream |
| POST | /api/v1/agents/coder/run | Submit a new mission |
| GET | /api/v1/missions | List all past missions |

### Key Data Models

```rust
// Task — the unit of work
struct Task {
    id: UUID,
    instruction: String,
    repo_url: Option<String>,
    phase: Phase,
}

// Phase — the pipeline state machine
enum Phase {
    P0Trigger,
    P1ContextPull,
    P2Planning,      // HITL Gate
    P3Architecture,
    P4Execution,
    P5Verification,
    P6Review,
    P7Delivery,
    P8Approval,      // HITL Gate
}

// MissionEvent — broadcast over WebSocket
struct MissionEvent {
    task_id: UUID,
    phase: Phase,
    message: String,
    timestamp: DateTime,
}
```

### P0–P8 Pipeline Flow

```
POST /api/v1/agents/coder/run
    ↓
Tokio spawns background async task
    ↓
P0: Trigger received, task created
    ↓
P1: Git clone/pull repo_url (real Git operations)
    ↓
P2: Planning phase ⏸ HITL Gate — awaits developer approval
    ↓ (approved)
P3: Architecture — agent designs solution
    ↓
P4: Execution — TDD implementation
    ↓
P5: Verification — tests run
    ↓
P6: Review — AgentShield security scan
    ↓
P7: Delivery — Telegram + WebSocket notification
    ↓
P8: Approval ⏸ HITL Gate — awaits commit approval
    ↓ (approved)
Code committed/pushed
```

**HITL (Human-in-the-Loop) Gates:**
- P2: Must approve plan before any code is written
- P8: Must approve before code is committed/pushed
- BlockerEvent: Agent emits when ambiguous — pauses, sends Telegram notification

---

## Layer 2 — Agent Harness (ECC)

**Path:** `packages/agent-harness/`  
**Source:** everything-claude-code (affaan-m/everything-claude-code)  
**Status:** ✅ 95% complete

### The 18 Specialized Agents

| Agent | Role |
|---|---|
| planner | Breaks tasks into ordered sub-tasks |
| architect | Designs file-level structure |
| tdd-guide | TDD: RED → GREEN → IMPROVE |
| code-reviewer | Quality and maintainability |
| security-reviewer | Vulnerability detection |
| build-error-resolver | Fixes compile/type errors |
| e2e-runner | Playwright E2E tests |
| refactor-cleaner | Dead code cleanup |
| doc-updater | Documentation sync |
| database-reviewer | PostgreSQL/Supabase specialist |
| chief-of-staff | Multi-channel comms triage |
| loop-operator | Monitors autonomous loops |
| harness-optimizer | Cost/reliability tuning |
| go-reviewer | Go code review |
| kotlin-reviewer | Kotlin code review |
| python-reviewer | Python code review |
| go-build-resolver | Go build error resolution |
| e2e-runner | E2E testing |

### Folder Structure

```
packages/agent-harness/
├── agents/       ← 18 .md agent definitions
├── skills/       ← 94+ workflow skills
├── hooks/        ← hooks.json (PreToolUse, PostToolUse, Stop, SessionStart)
├── scripts/      ← Node.js hook implementations
├── commands/     ← 40+ slash commands
├── mcp/          ← 14 MCP server configurations
├── rules/
│   ├── common/   ← language-agnostic principles
│   └── typescript/ ← TS/JS patterns for dashboard
├── contexts/     ← dev.md, review.md, research.md
├── CLAUDE.md     ← ECC entry point
└── AGENTS.md     ← Universal cross-tool agent definitions
```

---

## Layer 3 — Channel Adapters (OpenClaw)

**Path:** `packages/channels/`  
**Source:** OpenClaw channel layer ONLY  
**Status:** 📋 Scaffolded, pending integration

```
packages/channels/
├── discord/    ← Discord bot + slash command handler
├── telegram/   ← Telegram notifications + commands
├── whatsapp/   ← WhatsApp Web channel
├── routing/    ← Unified message → agent routing
├── index.ts    ← Channel registry
└── types.ts    ← CommandMessage, ChannelResponse interfaces
```

### CommandMessage Interface

```typescript
interface CommandMessage {
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
```

---

## Layer 4 — Dashboard (Next.js 14)

**Path:** `dashboard/`  
**Tech:** Next.js 14 + Tailwind CSS  
**Host:** Vercel (cloud)  
**Status:** 🔄 40% — UI shell built, wiring pending

### Components

| Component | Purpose | Status |
|---|---|---|
| CommandBar | Perplexity-style command input | ✅ Built |
| LiveFeed | Real-time WebSocket P0→P8 stream | ✅ Built |
| AuditLog | Complete mission history | ✅ Built |
| gateway.ts | All Traffic Controller API calls | 📋 To create |

### gateway.ts Contract

```typescript
// dashboard/lib/gateway.ts
// ALL components import from here — never call fetch() directly

submitMission(payload)       → POST /api/v1/agents/coder/run
listMissions()               → GET /api/v1/missions
healthCheck()                → GET /health
createWebSocket(onEvent)     → WS /ws
```

---

## Security — AgentShield

**Install:** `pnpm add ecc-agentshield` (npm package, NOT a folder to copy)

### Three-Pillar Defense

1. **Command Gating** — Blocks rm -rf, sudo, curl exfiltration, credential harvesting
2. **Filesystem Isolation** — Agent sandboxed to project repo only
3. **Zero-Trust Secrets** — Never logged, masked in WS streams, injected at runtime via MCP, destroyed with session

### Usage

```bash
npx ecc-agentshield scan               # Quick scan
npx ecc-agentshield scan --fix         # Auto-fix safe issues
npx ecc-agentshield scan --opus        # Deep: 3 Opus 4.6 agents (red-team/blue-team/auditor)
npx ecc-agentshield init               # Generate secure config from scratch
```

---

## SDK Bridge — Multi-SDK Adapter

**Path:** `packages/sdk-bridge/`  
**Status:** 📋 Scaffolded

Supports: Claude Code · LangChain · LangGraph · Custom Python

```typescript
interface AgentAdapter {
  name: string;
  sdk: 'claude-code' | 'langchain' | 'langgraph' | 'python';
  invoke(task: AgentTask): Promise<AgentResult>;
  healthCheck(): Promise<boolean>;
}

// AgentResult — standard output schema
{
  status: 'success' | 'refused' | 'error',
  result: string,
  trace_id: string,
  timestamp: string,
  tool_calls: [],
  mcp_actions: []
}
```

---

## MCP Connectors

**Path:** `packages/connectors/`  
**Status:** 📋 Scaffolded — v1 targets: Linear, Firebase, Figma, GitHub

```typescript
interface MCPConnector {
  name: string;
  connect(config: ConnectorConfig): Promise<void>;
  execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult>;
  disconnect(): Promise<void>;
}
```

### Connector Priority (build in this order)
1. **Firebase** — easiest API, needed for state + logs
2. **GitHub** — needed for repo operations in P1
3. **Linear** — ticket management in mission results
4. **Figma** — design operations (most complex)

---

## Infrastructure

```yaml
# docker-compose.yml
Services:
  traffic-controller  → Port 3000  (Rust gateway)
  dashboard           → Port 3001  (Next.js UI)
  postgres:15         → Mission persistence (production)
  redis:7             → Caching layer

# Local dev: Rust uses SQLite (nexusos.db)
# Production: PostgreSQL via Docker
```

---

## Hard Architectural Rules

1. NEVER modify `packages/traffic-controller/src/` — Rust works, hands off
2. NEVER copy OpenClaw's AI/agent logic — ECC owns intelligence
3. NEVER copy ECC's channel logic — OpenClaw owns channels
4. NEVER commit .env, .db files, or .temp_clones/
5. NEVER use npm install — pnpm only
6. ALL Traffic Controller API calls → `dashboard/lib/gateway.ts` ONLY
7. AgentShield = npm package, not a copied folder
8. Rust owns ONLY the gateway layer. Everything else = TypeScript/Node
