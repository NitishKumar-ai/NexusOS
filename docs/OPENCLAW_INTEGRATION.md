# OpenClaw + NexusOS Integration Architecture

## Overview

OpenClaw is the **gateway layer**. NexusOS is a **skill + pipeline layer** that runs inside OpenClaw.

NexusOS does NOT run its own Discord/WhatsApp bots.  
It runs ONE OpenClaw instance. OpenClaw handles all channels.  
The Rust Traffic Controller becomes the backend that OpenClaw calls.

---

## Architecture Diagram

```
Developer (phone / Discord / WhatsApp / Telegram)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           OpenClaw Gateway  :18789                  │
│  • Handles 15+ messaging channels                   │
│  • Session management + memory (SOUL.md / MEMORY.md)│
│  • Multi-agent routing with isolated sessions       │
│  • Exec approval system (HITL consent gating)       │
│  • Cron, webhooks, browser control, tool system     │
└─────────────────────┬───────────────────────────────┘
                      │  ACP (Agent Client Protocol)
                      │  POST /api/chat/inject
                      ▼
┌─────────────────────────────────────────────────────┐
│           NexusOS Agent  (OpenClaw skill)           │
│  soul/SOUL.md  ←  agent identity / personality      │
│  soul/SKILL.md ←  skill descriptor (auto-loaded)    │
│                                                     │
│  Receives task → calls Rust Traffic Controller      │
└─────────────────────┬───────────────────────────────┘
                      │  HTTP  POST /api/v1/agents/coder/run
                      ▼
┌─────────────────────────────────────────────────────┐
│       NexusOS Rust Traffic Controller  :3000        │
│                                                     │
│  P0 → Trigger          P5 → Validation              │
│  P1 → Context Pull     P6 → Security (AgentShield)  │
│  P2 → Planning [HITL]  P7 → Documentation           │
│  P3 → TDD              P8 → Approval [HITL]         │
│  P4 → Implementation                                │
│                                                     │
│  Orchestrates 18 ECC specialized agents             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│             ECC Agent Harness                       │
│  planner  architect  tdd-guide  security-reviewer   │
│  code-reviewer  doc-updater  e2e-runner  +11 more   │
│                                                     │
│  MCP Connectors: Linear · Firebase · Figma · GitHub │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│   Result → OpenClaw → Developer's phone/Discord     │
└─────────────────────────────────────────────────────┘
```

---

## System Ownership

| Layer | System | Notes |
|---|---|---|
| Channel management | OpenClaw | Discord, WhatsApp, Telegram, Slack, iMessage, Signal, 15+ more |
| Session + memory | OpenClaw | SOUL.md identity, MEMORY.md persistence across sessions |
| Task routing | OpenClaw | Routes developer messages to the NexusOS agent session |
| Exec approval / HITL | OpenClaw | `exec-approvals` system for consent gating dangerous actions |
| Agent skill loading | OpenClaw | Reads `soul/SKILL.md` automatically from workspace |
| P0–P8 pipeline | NexusOS | Rust Traffic Controller orchestrates all phases |
| Agent intelligence | ECC Harness | 18 agents, 94 skills, hooks, slash commands |
| MCP connectors | NexusOS | Linear, Firebase, Figma, GitHub |
| Security scanning | AgentShield | `ecc-agentshield` runs at P6 |
| HITL gates | NexusOS | P2 planning + P8 approval (pause pipeline, await human reply) |
| Dashboard | NexusOS | Next.js mission control (mirrors Traffic Controller state) |

---

## How NexusOS Appears Inside OpenClaw

OpenClaw auto-loads skills from the workspace directory. When NexusOS's workspace path is added to OpenClaw's config, it finds:

```
packages/agent-harness/soul/
  SKILL.md    ← Auto-loaded by OpenClaw's skill system
  SOUL.md     ← Agent identity (loaded via soulPath in agent config)
```

The `SKILL.md` tells OpenClaw:
- **When to use NexusOS**: "coding tasks, refactors, feature builds, PR reviews"
- **How to use it**: Call the Rust Traffic Controller via `curl`
- **What it requires**: `curl` binary (for calling localhost:3000)

---

## Gateway API Reference

OpenClaw runs on port **18789** with Bearer token authentication.

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/status` | Health check |
| `GET` | `/api/agents` | List registered agents |
| `POST` | `/api/agents` | Create/register a new agent |
| `POST` | `/api/chat/inject` | Submit a message to an agent session |
| `POST` | `/api/tools/invoke` | Directly invoke a tool (memory_search, web_search, etc.) |
| `GET` | `/api/ws` | WebSocket for real-time agent events |

### Event Format (NDJSON stream)

```json
{"type": "token", "content": "Analyzing repository..."}
{"type": "tool_call", "tool": "bash", "args": {"command": "curl ..."}}
{"type": "tool_result", "result": {"task_id": "abc-123"}}
{"type": "done"}
```

### Relevant NexusOS Files

| File | Purpose |
|------|---------|
| `packages/channels/openclaw-gateway.ts` | TypeScript client for all gateway calls |
| `packages/agent-harness/soul/SOUL.md` | NexusOS agent identity |
| `packages/agent-harness/soul/SKILL.md` | OpenClaw skill descriptor |
| `packages/traffic-controller/.env.example` | Required env vars |

---

## Running the Integration

### 1. Install & start OpenClaw
```bash
# Install OpenClaw globally
npm install -g openclaw

# Start the gateway (port 18789)
openclaw start

# Or run with config
openclaw start --config ./openclaw.json
```

### 2. Configure environment
```bash
# Copy and fill in the env file
cp packages/traffic-controller/.env.example packages/traffic-controller/.env
# Set OPENCLAW_GATEWAY_URL and OPENCLAW_TOKEN
```

### 3. Register NexusOS as an agent
```typescript
import { ensureNexusOSAgent } from './packages/channels/openclaw-gateway';
await ensureNexusOSAgent(); // Registers nexusos-coder agent in OpenClaw
```

### 4. Add skills path to OpenClaw config

In your workspace's `openclaw.json`:
```json
{
  "skills": {
    "load": {
      "extraDirs": ["./packages/agent-harness/soul"]
    }
  }
}
```

OpenClaw will find `SKILL.md` and make NexusOS available as a skill.

---

## HITL Gates

OpenClaw has its own exec-approvals system. NexusOS adds two application-level gates:

| Gate | Phase | Trigger | Required Input |
|------|-------|---------|---------------|
| Planning approval | P2 | Plan generated by architect agent | Developer replies 'approve' or 'revise: <feedback>' |
| Final approval | P8 | Full diff + test results ready | Developer reviews and approves PR |

During HITL gates, the Traffic Controller pauses and OpenClaw delivers the gate message to the developer's phone/Discord. When the developer responds, their reply is injected back via `POST /api/chat/inject` which resumes the pipeline.
