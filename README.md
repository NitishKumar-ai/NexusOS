# 🚀 NexusOS — Agent Mission Control

> Control your AI agents from Discord, WhatsApp, and Telegram.
> Built on Rust + ECC + OpenClaw.

```
/mission Add user authentication to the API
```
*Sent from Discord → agent plans, codes with TDD, passes AgentShield security scan,
asks your approval before committing. All from your phone.*

---

## What It Does

NexusOS gives you a **mission control center** for AI coding agents. Every task follows
a structured P0-P8 pipeline with two mandatory human approval gates — you see the plan
before any code is written, and you approve before anything is committed.

```
You (Discord/WhatsApp/Telegram)
    → OpenClaw Gateway (all channels)
        → NexusOS Rust Traffic Controller
            → ECC Agent Harness (18 agents, 94 skills)
                → Your codebase
```

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Channels | OpenClaw | Discord, WhatsApp, Telegram, Slack |
| Gateway | Rust/Axum | P0-P8 pipeline orchestration |
| Agents | ECC Harness | 18 specialized coding agents |
| Security | AgentShield | 102 rules, block rogue actions |
| Connectors | TypeScript | Linear, Firebase, Figma, GitHub |
| Dashboard | Next.js 14 | Mission control UI (Vercel) |

## The P0-P8 Pipeline

```
P0 Receive mission
P1 Pull code from GitHub
P2 ⏸ PLAN — you approve before any code is written
P3 Architecture design
P4 TDD implementation (tests first, always)
P5 Verification (tests must pass)
P6 AgentShield security scan
P7 Deliver results
P8 ⏸ COMMIT — you approve before anything is committed
```

## Quick Start

```bash
# Clone
git clone https://github.com/Inmodel-Labs/NexusOS.git
cd NexusOS

# One-command setup
bash scripts/init.sh

# Start all services
Terminal 1: cd packages/traffic-controller && cargo run
Terminal 2: cd packages/connectors && pnpm dev
Terminal 3: cd dashboard && pnpm dev

# Open dashboard
http://localhost:3001
```

## Commands (Discord / WhatsApp / Telegram)

```
/mission <task>         Start a coding mission
/status                 List active missions
/status <id>            Get mission details
/approve <id>           Approve plan (P2) or commit (P8)
/reject <id>            Stop a mission
/help                   Show commands
```

## MCP Connectors

| Connector | Actions |
|---|---|
| Firebase | Read/write Firestore, mission state persistence |
| GitHub | Create issues/PRs, read/write files |
| Linear | Create/update tickets from mission results |
| Figma | Post comments, read component structure |

## Stack

- **Rust/Axum** — Traffic Controller gateway (port 3000)
- **Next.js 14** — Dashboard (Vercel, port 3001)
- **TypeScript** — Connectors + SDK bridge (port 3002)
- **OpenClaw** — Multi-channel gateway (port 18789)
- **ECC** — Agent harness (18 agents, 94 skills)
- **AgentShield** — Security layer (102 rules)
- **PostgreSQL + Redis** — Production data layer (Docker)

## License

Apache-2.0

---

*Built by [Inmodel-Labs](https://github.com/Inmodel-Labs)*
