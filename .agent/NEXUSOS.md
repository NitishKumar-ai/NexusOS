# 🚀 NexusOS — Agent Mission Control
**Version:** v2.0-beta  
**Owner:** Niti / Inmodel-Labs  
**Repo:** https://github.com/Inmodel-Labs/NexusOS  
**Stack:** Rust/Axum · Next.js 14 · ECC · OpenClaw · PostgreSQL · Redis · Vercel  
**License:** Apache-2.0 (planned MIT for OSS release)

---

## What Is NexusOS?

NexusOS is an enterprise-grade, event-driven **Agent Mission Control** platform — an operating system for AI agents. It gives a developer a centralized control plane to remotely command, monitor, and orchestrate autonomous AI agents from a phone or web browser, without touching a terminal.

**Core philosophy:** "Agent does the work. You approve, unblock, and receive results."

---

## The 4 Layers

```
📱 TRIGGER LAYER       Discord · WhatsApp · Telegram · CLI · GitHub Webhook
        ↓
🦀 ORCHESTRATION       Rust/Axum Traffic Controller (Port 3000)
        ↓
🤖 AGENT EXECUTION     ECC Harness — 18 agents, 94+ skills, AgentShield
        ↓
📡 DELIVERY LAYER      WebSocket · Telegram · Next.js Dashboard (Port 3001)
```

---

## Monorepo Structure

```
NexusOS/
├── packages/
│   ├── traffic-controller/   🦀 Rust/Axum gateway — THE BRAIN (DO NOT TOUCH)
│   ├── agent-harness/        🤖 ECC agents, skills, hooks, commands
│   ├── channels/             📱 OpenClaw adapters — Discord, Telegram, WhatsApp
│   ├── sdk-bridge/           🔌 Multi-SDK adapters (Claude Code, LangChain, etc.)
│   └── connectors/           🔗 MCP connectors — Linear, Firebase, Figma, GitHub
├── dashboard/                ⚛️  Next.js 14 — Mission Control UI (Vercel)
├── docs/                     📚 Architecture, PRD, Security docs
├── scripts/                  🛠️  nexusos init and utility scripts
├── docker-compose.yml        🐳 PostgreSQL + Redis
└── pnpm-workspace.yaml       📦 Monorepo config
```

---

## Current Build Status (March 2026)

| Component | Status | Completeness |
|---|---|---|
| Traffic Controller (Rust/Axum) | ✅ Running | 80% |
| Agent Harness (ECC) | ✅ Full plugin | 95% |
| AgentShield Security | ✅ 102 rules, 912 tests | 90% |
| WebSocket Live Stream | ✅ Working | 85% |
| Dashboard (Next.js) | 🔄 UI shell | 40% |
| P0–P8 Pipeline | ✅ Running | 75% |
| HITL Gates (P2, P8) | 🔄 Designed | 60% |
| Telegram Notifications | 📋 Designed | 0% |
| Discord Bot | 📋 Planned | 0% |
| WhatsApp Bot | 📋 Planned | 0% |
| MCP Connectors | 📋 Scaffolded | 5% |
| SDK Bridge | 📋 Scaffolded | 5% |
| Dashboard Wiring | 📋 Pending | 0% |

---

## Key Technical Decisions

- **Rust stays as gateway** — high-throughput, low-latency event routing. Not replaced with Node.
- **Rust boundary is hard** — Rust owns ONLY the gateway layer. Everything else is TypeScript/Node.
- **ECC = agent intelligence** — agents, skills, hooks, commands, rules, security all from ECC.
- **OpenClaw = channel layer only** — Discord, Telegram, WhatsApp adapters. Nothing else from OpenClaw.
- **AgentShield = npm package** — `pnpm add ecc-agentshield`, not a copied folder.
- **pnpm only** — no npm, no yarn. Delete package-lock.json if it appears.
- **dashboard/lib/gateway.ts** — single file for ALL Traffic Controller API calls. Components never call fetch() directly.

---

## 4-Week Execution Plan (from current state)

| Week | Goal |
|---|---|
| 1 | Repo restructure — integrate ECC + OpenClaw, scaffold connectors + SDK bridge |
| 2 | Telegram notifications in Rust + HITL P2/P8 gates |
| 3 | Wire dashboard to Traffic Controller via gateway.ts |
| 4 | Firebase connector + Discord bot → channels → traffic-controller |
| 5–6 | Linear + GitHub connectors + WhatsApp bot |
| 7–8 | Private beta prep, polish, one-command setup |

**North star:** Developer runs `pnpm dev` and controls an agent from Discord in under 20 minutes.
