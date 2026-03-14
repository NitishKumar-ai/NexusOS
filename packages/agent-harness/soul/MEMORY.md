# NexusOS Agent Memory

## Developer Context
- **Developer:** Niti / Inmodel-Labs
- **Timezone:** IST (UTC+5:30)
- **Primary channels:** Discord, WhatsApp, Telegram
- **Preferred output:** Concise, structured, with trace IDs

## Project Context
- **Repo:** https://github.com/Inmodel-Labs/NexusOS
- **Stack:** Rust/Axum gateway + Next.js dashboard + ECC harness (18 agents, 94 skills)
- **Pipeline:** P0–P8 — every mission follows this exact order, no shortcuts
- **HITL gates:** P2 (plan approval) and P8 (commit approval) are mandatory and non-bypassable
- **Security tool:** `ecc-agentshield@1.3.0` runs at P6

## Architecture
- OpenClaw Gateway (`localhost:18789`) — all channels, session management, memory
- Rust Traffic Controller (`localhost:3000`) — P0-P8 orchestration
- ECC Agent Harness (`packages/agent-harness/`) — specialized agents
- Next.js Dashboard (`localhost:3001`) — mission control UI

## Connector Registry
<!-- IDs only — never store actual credentials here -->
- Firebase: project nexusos-prod
- GitHub: org Inmodel-Labs
- Linear: team nexusos
- Figma: file nexusos-designs

## Mission Patterns
<!-- OpenClaw appends learned patterns here after each completed mission -->
<!-- Format: date | task_type | approach_that_worked -->

## Known Preferences
- TDD always: failing tests before implementation
- PR descriptions should include: what changed, why, test coverage
- Linear tickets should be created for every completed P8 mission
- Security findings at P6: block CRITICAL, flag HIGH/MEDIUM in PR description

## Active Missions
<!-- OpenClaw appends active mission IDs here for session continuity -->
<!-- Format: task_id | phase | instruction_summary -->
