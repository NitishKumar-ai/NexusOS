# ⚡ NexusOS — Quick Reference Cheat Sheet

---

## Start Everything Locally

```bash
# 1. Infrastructure
docker-compose up -d

# 2. Traffic Controller (Rust gateway)
cd packages/traffic-controller
cargo run
# → http://localhost:3000

# 3. Dashboard
cd dashboard
pnpm dev
# → http://localhost:3001

# 4. Test WebSocket
node packages/traffic-controller/tests/test_ws.js

# 5. Submit a test mission
curl -X POST http://localhost:3000/api/v1/agents/coder/run \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Add a health endpoint", "repo_url": "https://github.com/Inmodel-Labs/NexusOS.git"}'
```

---

## Run AgentShield Security Scan

```bash
cd packages/agent-harness
npx ecc-agentshield scan           # Quick scan
npx ecc-agentshield scan --fix     # Auto-fix safe issues
npx ecc-agentshield scan --opus    # Deep scan (costs tokens)
```

---

## Key File Locations

| File | Purpose |
|---|---|
| packages/traffic-controller/src/main.rs | HTTP server, WebSocket, API routes |
| packages/traffic-controller/src/agent.rs | P0-P8 mission runner |
| packages/traffic-controller/src/db.rs | SQLite audit log |
| packages/traffic-controller/src/lib.rs | Data models (Task, Phase, MissionEvent) |
| packages/agent-harness/CLAUDE.md | ECC entry point — harness config root |
| packages/agent-harness/AGENTS.md | Universal agent definitions |
| packages/agent-harness/hooks/hooks.json | All hook automations |
| packages/channels/index.ts | Channel registry |
| packages/connectors/types.ts | MCPConnector interface |
| dashboard/lib/gateway.ts | ALL Traffic Controller API calls |
| docs/Architecture.md | Full architecture deep-dive |
| docs/prd.md | Product Requirements Document |

---

## Remote Commands (Discord / WhatsApp / Telegram)

```
/run [agent-name] [task]          Submit a mission to an agent
/status [task-id]                 Get current phase and status
/approve [task-id]                Approve HITL gate (P2 or P8)
/reject [task-id]                 Reject mission
/feedback [task-id] "message"     Add feedback and restart current phase
/list                             List all active missions
/logs [task-id]                   Get full mission event log
```

---

## Traffic Controller API

```bash
GET  /health                                    → {"status": "ok"}
GET  /ws                                        → WebSocket stream
POST /api/v1/agents/coder/run                   → Submit mission
GET  /api/v1/missions                           → List missions
```

---

## Hard Rules (never break these)

```
❌ NEVER modify packages/traffic-controller/src/
❌ NEVER copy OpenClaw's AI/agent logic
❌ NEVER copy ECC's channel adapters
❌ NEVER commit .env, .db, .temp_clones/
❌ NEVER use npm install (pnpm only)
❌ NEVER call fetch() in a component (use dashboard/lib/gateway.ts)
❌ NEVER store MCP credentials in NexusOS (Firebase only, developer-owned)
```

---

## Monorepo Commands

```bash
pnpm install                      # Install all workspace dependencies
pnpm -r build                     # Build all packages
pnpm -r test                      # Test all packages
pnpm --filter dashboard dev       # Dev dashboard only
pnpm --filter traffic-controller build  # Build Rust only (via cargo)
```

---

## Environment Variables

```env
# packages/traffic-controller/.env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
DATABASE_URL=./nexusos.db

# dashboard/.env.local
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000

# packages/connectors/.env
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
GITHUB_TOKEN=...
LINEAR_API_KEY=...
FIGMA_TOKEN=...
```

---

## Build Order for Connectors

1. 🔥 Firebase — state, logs, credential storage
2. 🐙 GitHub — P1 Git operations, PR creation
3. 📋 Linear — ticket management from missions
4. 🎨 Figma — design operations (most complex, last)
