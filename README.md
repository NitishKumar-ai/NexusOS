# NexusOS Agent Pipeline
## Product Requirements Document — v2.0 — March 2026

> **Stack:** Rust · Next.js 14 · React PWA · Python MCP · Clawdbot · everything-claude-code  
> **Status:** READY FOR DEVELOPMENT  
> **Author:** Niti

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Pipeline Architecture](#3-pipeline-architecture)
4. [Trigger System](#4-trigger-system)
5. [Agent Execution Layer](#5-agent-execution-layer)
6. [Phone Delivery System](#6-phone-delivery-system)
7. [Human in the Loop](#7-human-in-the-loop-hitl)
8. [Security Model](#8-security-model)
9. [Project Integration](#9-project-integration)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [NexusOS Web Dashboard](#11-nexusos-web-dashboard)
12. [Perplexity Computer-Inspired Features](#12-perplexity-computer-inspired-features)
13. [Web Dashboard Tech Stack](#13-web-dashboard-tech-stack)
14. [Success Metrics](#14-success-metrics)
15. [Complete Tech Stack](#15-complete-tech-stack)

---

## 1. Overview

NexusOS Agent Pipeline is a systematic, event-driven system that lets an AI agent (Antigravity, Claude Code, or any MCP-compatible agent) autonomously pull code from GitHub, execute tasks, make decisions, and deliver the final output — feature, fix, report, or artifact — directly to your phone and web dashboard. You stay in the loop only when the agent genuinely needs you.

**Core philosophy:**
- Agent does the work. You approve, unblock, and receive results.
- No manual triggering. Everything is event-driven from a single command.
- Zero AI API costs for the notification and delivery layer.
- Full audit trail of every decision the agent made.

### 1.1 The Problem Today

When you leave an agent running on your laptop:
- It pulls code but gets stuck waiting for your input
- You have no visibility into what it is doing remotely
- Agent asks questions you cannot answer because you are not there
- Final output sits on your laptop with no way to receive it on phone
- No systematic order — agent jumps between tasks randomly

### 1.2 What NexusOS Pipeline Solves

A single command kicks off a fully automated, phone-observable pipeline:

```bash
# You type this once — on laptop or from phone
nexus run 'Add dark mode to EduAI frontend'

# What happens automatically:
  1. Agent pulls latest EduAI code from GitHub
  2. Planner agent breaks task into sub-tasks
  3. Architect agent designs the solution
  4. Code agent implements with TDD
  5. Security agent reviews
  6. Tests run automatically
  7. Output delivered to your phone + web dashboard
  8. You tap Approve → auto-commits to branch
```

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Systematic pipeline with defined phases — no random execution order
- Phone + web dashboard as primary interfaces — all outputs delivered there
- Human in the loop only when needed — not constantly
- Full observability — watch every agent decision live
- Works across all your projects — EduAI, Agent Bridge, NexusOS itself
- Zero API cost for delivery layer — Rust + Telegram + WebSocket only
- Agents get smarter over time — continuous learning from your patterns
- Perplexity Computer-level features — multi-model, sub-agents, long-running workflows

### 2.2 Non-Goals

- Not a general-purpose AI assistant — purpose-built for your dev workflow
- Not replacing your IDE — agent works inside your existing tools
- Not always-online — designed for laptop-based development
- Not multi-user — personal single-user system only

---

## 3. Pipeline Architecture

### 3.1 System Overview

```
TRIGGER LAYER
  You / Scheduled Event / GitHub Webhook
        |
        v
ORCHESTRATION LAYER  (NexusOS Rust Gateway)
  Task Queue → Phase Runner → Agent Dispatcher
        |
        v
AGENT EXECUTION LAYER  (everything-claude-code)
  planner → architect → coder → tdd → reviewer → security
        |
        v
DELIVERY LAYER  (Clawdbot + Rust WebSocket + React PWA + Next.js Dashboard)
  Phone Notifications → Live Stream → Web Dashboard → Output Delivery
```

### 3.2 Pipeline Phases

Every task goes through these phases in order. No skipping.

| Phase | Name | What happens | Output to phone/web |
|-------|------|-------------|---------------------|
| P0 | Trigger | Task received from phone, CLI, or webhook | Task accepted notification |
| P1 | Context Pull | Agent clones/pulls latest code from GitHub | Repo pulled successfully |
| P2 | Planning | Planner agent breaks task into ordered sub-tasks | Plan sent for review |
| P3 | Architecture | Architect agent designs solution and data models | Architecture summary |
| P4 | Execution | Code agent implements with TDD approach | Live progress stream |
| P5 | Verification | Tests run, coverage checked, build verified | Test results |
| P6 | Review | Code review + security scan agent runs | Review summary |
| P7 | Delivery | Output packaged and sent to phone/web | Final output |
| P8 | Approval | You tap Approve to commit/deploy | Commit pushed on approval |

---

## 4. Trigger System

### 4.1 Phone Trigger (Primary)

```json
POST /api/task
{
  "project": "EduAI",
  "instruction": "Add dark mode toggle to settings page",
  "priority": "high",
  "branch": "feature/dark-mode"
}
```

### 4.2 CLI Trigger (From Laptop)

```bash
nexus run 'Fix auth bug in FastAPI' --project EduAI
nexus run 'Add gamification module' --project EduAI --priority high
nexus run 'Write unit tests for OCR module' --tdd
```

### 4.3 GitHub Webhook Trigger (Automatic)

- New issue labeled `agent-task` → auto-starts pipeline
- PR comment `/nexus fix this` → agent fixes the code
- Build failure → agent automatically starts debugging pipeline
- New PR opened → code review agent auto-runs

### 4.4 Scheduled Trigger (Cron)

```toml
# config/config.toml
[schedules]
  daily_tests      = "0 9 * * *"    # Run tests every morning
  weekly_cleanup   = "0 10 * * MON" # Cleanup dead code weekly
  dependency_check = "0 8 * * *"    # Check outdated packages
  morning_briefing = "0 9 * * *"    # Daily summary to phone
```

---

## 5. Agent Execution Layer

Built on everything-claude-code agents. Each agent has one job.

### 5.1 Planner Agent

- Reads the task instruction and latest codebase
- Breaks into ordered sub-tasks with dependencies
- Estimates complexity and time per sub-task
- Sends plan to phone — you can edit before proceeding

```
PLAN: Add dark mode to EduAI
  1. Add theme context to React app (15 min)
  2. Create dark mode CSS variables (10 min)
  3. Add toggle button to settings (20 min)
  4. Persist preference in localStorage (10 min)
  5. Write tests (15 min)
Total: ~70 min  |  [Approve Plan]  [Edit Plan]  [Cancel]
```

### 5.2 Architect Agent

- Designs component structure and data models
- Identifies files to modify — sends diff preview to phone
- Checks for breaking changes — alerts you if found
- Outputs `ARCHITECTURE.md` for session context

### 5.3 Code Agent (TDD)

- Writes failing tests first (RED phase)
- Implements minimum code to pass tests (GREEN phase)
- Refactors for quality (IMPROVE phase)
- Streams every file change live to your phone and web dashboard
- Calls `ask_human` MCP tool if stuck — waits for your reply

### 5.4 Verification Agent

- Runs full test suite — streams results live
- Checks code coverage — alerts if below 80%
- Runs build — reports failures immediately
- Checks TypeScript / Rust compilation errors

### 5.5 Review Agent

- Code quality check — complexity, duplication, naming
- Security scan — hardcoded secrets, injection risks, unsafe code
- Performance check — N+1 queries, memory leaks
- Sends summary with severity levels

### 5.6 Continuous Learning

- After every session — extracts patterns from your decisions
- Builds instinct collection — agent learns your preferences
- Weekly evolution — clusters instincts into reusable skills
- Next session — agent already knows your style, zero repeated instructions

---

## 6. Phone Delivery System

### 6.1 Live Stream (WebSocket)

When PWA is open — full real-time stream of every agent action:
- Every file the agent reads or writes
- Every test that passes or fails
- Every decision the agent makes with its reasoning
- Every error with stack trace

### 6.2 Push Notifications (When PWA is closed)

When you close the PWA — Telegram delivers critical events:
- Phase completions — `Planning phase done, awaiting your approval`
- Blockers — `Agent needs DATABASE_URL to continue`
- Errors — `Build failed: TypeScript error in auth.ts`
- Final output — `Task complete. 4 files changed. Ready for review.`

### 6.3 Output Delivery Formats

| Task Type | Output Format | Phone Action |
|-----------|--------------|--------------|
| Feature implementation | Diff preview + test results | Approve to commit |
| Bug fix | Before/after code + tests | Approve to commit |
| Research task | Summary document | View / Save |
| College assignment | Draft document | Review / Edit |
| Test suite | Coverage report + failures | View results |
| Security scan | Vulnerability report | Review findings |
| Dependency update | Changelog + breaking changes | Approve to update |

---

## 7. Human in the Loop (HITL)

### 7.1 Mandatory Approval Gates

These phases always pause and wait for your explicit approval:
- **After Planning** — You must approve the plan before execution starts
- **Before any git commit or push** — Never auto-commits without approval
- **Before any deployment** — Production deployments always require approval
- **Before deleting any file** — Destructive operations always ask first

### 7.2 Optional Check-ins

Configurable — agent can auto-proceed or pause:
- After architecture phase — default: auto-proceed
- After each sub-task — default: auto-proceed
- After test failures — default: pause and ask
- After security issues found — default: always pause

### 7.3 Blocker Resolution

```
BLOCKER: Agent needs input
Project: EduAI
Phase: P4 - Execution
Question: What should the default theme be on first load?
Options:  [Light]  [Dark]  [System preference]

# Or for .env variables:
BLOCKER: Missing environment variable
Variable: HUGGINGFACE_API_KEY
Purpose: OCR model inference
[Type value]  [Skip this step]  [Cancel task]
```

---

## 8. Security Model

### 8.1 Authentication

- All API requests signed with HMAC-SHA256
- JWT tokens with 15-minute expiry + refresh rotation
- Rate limiting: 100 requests/minute per token
- Nonce-based replay attack prevention
- Cloudflare Tunnel — no open ports on your machine

### 8.2 Agent Sandboxing

- Agent runs with restricted filesystem access — only project directory
- No network access from agent except GitHub and defined APIs
- All shell commands logged and auditable
- Dangerous operations (`rm -rf`, `sudo`) require explicit phone approval
- Agent cannot access `.env` files directly — values injected via MCP only

### 8.3 Secret Management

- `.env` values never stored in memory longer than needed
- Secrets never logged or sent in notifications
- GitHub tokens scoped to minimum permissions required
- All secrets encrypted at rest in SQLite with AES-256

---

## 9. Project Integration

### 9.1 EduAI Integration

- GitHub webhook on `eduai` repo — auto-detects new issues labeled `agent`
- Agent knows EduAI stack: React + FastAPI + PostgreSQL + Supabase
- Test command: `pytest` for backend, `vitest` for frontend
- Deploy command: `vercel deploy` for frontend, `railway up` for backend

### 9.2 Agent Bridge / NexusOS Integration

- Rust projects use `cargo test` and `cargo clippy` for verification
- Agent knows Rust idioms from everything-claude-code rust patterns
- Build failures auto-trigger debug pipeline

### 9.3 College Assignments

- Assignment pipeline: research → outline → draft → review → final
- Output: formatted document delivered to phone for review
- Deadline-aware: urgent assignments get higher agent priority

---

## 10. Implementation Roadmap

### Week 1 — Foundation

1. Fork Clawdbot + clone everything-claude-code configs
2. Set up NexusOS Rust gateway with basic event routing
3. Connect Telegram via direct HTTP API (no library)
4. Build React PWA with agent stream tab
5. Test end-to-end: phone command → agent runs → phone result

### Week 2 — Pipeline Phases

1. Implement phase runner in Rust — P0 through P8
2. Wire up planner + code agents from everything-claude-code
3. Build HITL system — approval gates with phone buttons
4. Add GitHub webhook receiver for auto-triggering
5. Test full pipeline on EduAI repo

### Week 3 — Delivery & Observability

1. Build live stream tab in PWA — real-time agent decisions
2. Add output packaging — diff previews, test reports, summaries
3. Add Cloudflare tunnel for global phone access
4. Implement blocker resolution — structured questions on phone
5. Add audit log — full history of every agent decision

### Week 4 — Web Dashboard

1. Build NexusOS web dashboard with Next.js 14 + Tailwind
2. Implement Agent Command Center page with live task feed
3. Build multi-model router UI — select model per sub-task
4. Add Research Canvas page — Perplexity-style output renderer
5. Add Kill Switch, Audit Log, and Session History pages

### Week 5 — Intelligence & Perplexity Features

1. Wire continuous learning hooks from everything-claude-code
2. Add sub-agent spawning engine — agent creates child agents
3. Add web browsing agent — real-time internet research
4. Build rich output renderer — dashboards, code, charts, reports
5. Add college and learning modules

### Week 6 — Polish & Deploy

1. Set up PM2/Systemd for 24/7 auto-run
2. Deploy web dashboard to Vercel — access from any device
3. Write final documentation and push to GitHub
4. End-to-end test all 9 pipeline phases + web UI

---

## 11. NexusOS Web Dashboard

Inspired by Perplexity Computer — a full web interface where you can command agents, watch them work live, and receive rich outputs from any device, not just your phone.

### 11.1 Why a Web Dashboard

- Phone PWA is great for quick approvals and notifications
- Web dashboard is for deep work — watching multi-hour agent runs
- Rich output rendering — code diffs, charts, dashboards, research reports
- Desktop-class UI — multiple panes, resizable panels, keyboard shortcuts
- Accessible from any device — laptop, phone, tablet, friend's computer

### 11.2 Dashboard Pages

| Page | What you see | Key actions |
|------|-------------|-------------|
| `/` | Command center — active tasks, quick input bar | Type task, pick project, start pipeline |
| `/tasks` | All tasks — queue, running, completed, failed | Filter, retry, cancel, view history |
| `/live` | Live agent stream — real-time decisions log | Watch agent think, approve/deny actions |
| `/research` | Research canvas — Perplexity-style output | View web-sourced reports with citations |
| `/output` | Rich output viewer — code, charts, dashboards | Review, edit, approve, export |
| `/models` | Model router — which AI handles which task | Configure model per task type |
| `/audit` | Full audit log — every agent action ever taken | Search, filter, replay sessions |
| `/projects` | All projects — EduAI, NexusOS, assignments | Configure webhooks, set rules per project |
| `/settings` | System settings — secrets, tokens, kill switch | Kill switch, rate limits, MCP config |

### 11.3 Command Bar (Core UX)

The homepage has one input bar — inspired by Perplexity's search bar but for agent commands:

```
> [  Ask NexusOS anything or give it a task...     ]  [Run]

  Project: [EduAI ▾]   Model: [Auto ▾]   Priority: [Normal ▾]

  Recent:  Add dark mode  |  Fix auth bug  |  Write OS assignment

# After submitting:
> Planning phase started...
> Architect agent analyzing EduAI codebase...
> [Live output streams below in real time]
```

---

## 12. Perplexity Computer-Inspired Features

Perplexity Computer introduced a new paradigm: a general-purpose digital worker that orchestrates multiple AI models, spawns sub-agents, runs for hours, and delivers finished work. NexusOS builds the same concept but for your personal dev workflow — and runs locally on your laptop, not in someone else's cloud.

### 12.1 Multi-Model Orchestration

Instead of always using one model, NexusOS routes each sub-task to the best model:

```toml
# config/models.toml
[routing]
  planning      = "claude-opus-4-6"     # Best reasoning
  coding        = "claude-sonnet-4-6"   # Fast + accurate
  research      = "claude-sonnet-4-6"   # Web search
  security      = "claude-opus-4-6"     # Deep analysis
  summarization = "claude-haiku-4-5"    # Cheap + fast
  images        = "claude-sonnet-4-6"   # Vision tasks

# Agent auto-selects. You can override in dashboard.
```

- Model routing shown live in web dashboard
- Override any model per task from the Models page
- Cost tracking — shows token usage per model per task
- Auto-fallback — if one model fails, routes to backup

### 12.2 Sub-Agent Spawning

Agent forks child agents for parallel work on large tasks:

```
Parent agent receives task: "Add full auth system to EduAI"
  |
  ├── Sub-agent A: Design JWT schema + endpoints
  ├── Sub-agent B: Write React auth components
  ├── Sub-agent C: Write backend FastAPI routes
  └── Sub-agent D: Write tests for all of the above
  |
Parent agent merges + verifies all sub-agent outputs
  |
Single unified output delivered to phone + web dashboard
```

- Sub-agents run in parallel — dramatically faster on big tasks
- Web dashboard shows sub-agent tree — see all parallel work
- Each sub-agent has its own audit trail
- Parent agent resolves conflicts between sub-agent outputs

### 12.3 Long-Running Workflows

```bash
# Kick off before bed, done by morning
nexus run "Refactor entire EduAI backend to async FastAPI" --overnight

# NexusOS will:
#   - Pull latest code
#   - Spawn 4 parallel sub-agents per module
#   - Run all through test suite
#   - Send progress updates every 30 minutes to phone
#   - Deliver complete PR diff at 7 AM
```

- 24/7 operation — Systemd keeps NexusOS running even with laptop lid closed
- Task persistence — tasks survive system reboots, stored in SQLite
- Progress snapshots — agent saves state every 5 minutes
- Resumable tasks — if interrupted, agent picks up where it left off
- Morning briefing — daily 9 AM summary of all work done overnight

### 12.4 Web Research Agent

Agent browses the internet to gather information needed for your task:

```
# Agent sees it needs HuggingFace Transformers API info
  → Automatically searches docs.huggingface.co
  → Reads the relevant API page
  → Implements code using correct syntax
  → Cites source in output: [huggingface.co/docs/...]

# Explicit research request:
nexus research "Best OCR approaches for handwritten math 2026"
  → Delivers cited research report to web dashboard
```

- Searches documentation, Stack Overflow, GitHub issues in real time
- Reads full pages — not just snippets
- Cites every source it used in the output
- Research Canvas page shows full output with source cards

### 12.5 Rich Output Renderer

| Output Type | Rendered as in web dashboard |
|-------------|------------------------------|
| Code changes | Split diff view — old vs new, syntax highlighted |
| Test results | Visual pass/fail tree, coverage bar chart |
| Research report | Formatted document with citations, expandable source cards |
| Architecture plan | Interactive diagram — components, dependencies, data flow |
| College assignment | Document preview — ready to export as PDF |
| Bug analysis | Stack trace viewer, affected files highlighted, fix suggestion |
| Performance report | Charts — response time, memory usage, before/after |
| Security scan | Severity-colored vulnerability list, fix instructions |

### 12.6 Kill Switch + Audit Trail

- **Global kill switch** — one button in web dashboard or phone stops everything immediately
- **Per-task pause** — pause a specific task without affecting others
- **Full audit log** — every file read, every command run, every API call made
- **Replay mode** — re-watch any past agent session in the web dashboard
- **Revert action** — undo the last agent file change with one click
- **Agent reasoning log** — see why the agent made each decision

```json
// Audit log entry example
{
  "timestamp": "2026-03-13T22:14:05Z",
  "task_id": "task_abc123",
  "phase": "P4_EXECUTION",
  "agent": "code_agent",
  "action": "WRITE_FILE",
  "file": "src/components/DarkModeToggle.tsx",
  "reason": "Creating toggle component per architect plan step 3",
  "model": "claude-sonnet-4-6",
  "tokens_used": 1240
}
```

---

## 13. Web Dashboard Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) — SSR + React Server Components |
| Styling | Tailwind CSS — dark mode first, terminal-inspired aesthetic |
| Animations | Framer Motion — smooth transitions, live stream animations |
| Real-time | WebSocket client — same Rust server as phone PWA |
| Code renderer | Shiki — syntax highlighted code diffs, dark theme |
| Charts | Recharts — test coverage, performance, token usage |
| Diagrams | Mermaid.js — architecture diagrams, agent flow trees |
| Auth | JWT + HMAC — same security layer as phone PWA |
| Deployment | Vercel — web dashboard accessible from any device globally |
| State | Zustand — lightweight global state, no Redux overhead |

---

## 14. Success Metrics

| Metric | Target |
|--------|--------|
| Pipeline completion rate | > 80% of tasks complete without manual intervention |
| Blocker frequency | < 3 blockers per task on average |
| Phone notification latency | < 2 seconds from event to notification |
| Agent learning velocity | 50% fewer repeated instructions after 2 weeks |
| Time saved per task | > 60% reduction in active coding time per feature |
| Web dashboard load time | < 1 second initial load, < 100ms route transitions |
| Sub-agent speedup | > 2x faster on large tasks vs single agent |
| Daily active use | System used every day for at least one task |

---

## 15. Complete Tech Stack

| Layer | Technology |
|-------|-----------|
| Gateway Server | Rust + Axum + Tokio — async WebSocket + REST |
| **Web Dashboard** | **Next.js 14 + Tailwind + Framer Motion — Vercel deploy** |
| Phone PWA | React PWA + Vite — installable, works in browser |
| Notifications | Telegram HTTP API — direct calls, no library |
| Messaging Base | Clawdbot fork — WhatsApp, Discord channel support |
| Agent Configs | everything-claude-code — agents, hooks, skills, rules |
| **Multi-Model Router** | **Rust config layer — routes tasks to best Claude model** |
| **Sub-Agent Engine** | **Rust task spawner — parallel child agents per big task** |
| **Web Research** | **Claude web search MCP — agent browses internet live** |
| **Rich Output** | **Shiki + Recharts + Mermaid — code, charts, diagrams** |
| MCP Bridge | Python + MCP SDK — connects Antigravity to gateway |
| Database | SQLite — task queue, audit log, secret + session storage |
| Global Access | Cloudflare Tunnel — free, no open ports |
| Process Manager | PM2 or Systemd — auto-start, crash recovery, 24/7 |
| Version Control | GitHub + Webhooks — auto-trigger on events |
| Continuous Learning | everything-claude-code hooks — session memory, instincts |

---

> **NexusOS Agent Pipeline PRD — v2.0 — March 2026**  
> Perplexity Computer features + Web Dashboard + Rust + React + Clawdbot + everything-claude-code  
> Built by Niti. Runs on your laptop. Costs zero. You own it all.
