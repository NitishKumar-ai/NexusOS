# 📋 NexusOS — Build Log & Decision Record

---

## Decision Log

Every major technical decision is recorded here so future-you doesn't redo the analysis.

---

### DEC-001 — Keep Rust for Traffic Controller
**Date:** March 2026  
**Decision:** Keep Rust/Axum as the gateway layer. Do NOT rewrite in Node/FastAPI.  
**Rationale:**
- Gateway does high-throughput WebSocket event routing across concurrent agent sessions
- Rust is already 80% complete — rewriting costs 2 weeks and produces a slower system
- Node.js would add 3-5x memory overhead at scale (10+ concurrent missions)
- Borrow checker discipline prevents entire class of runtime errors in the gateway

**Boundary set:** Rust owns ONLY the gateway layer. SDK Bridge, connectors, channels = TypeScript/Node.

---

### DEC-002 — OpenClaw = Channels Layer Only
**Date:** March 2026  
**Decision:** Take ONLY the Discord/Telegram/WhatsApp channel adapters from OpenClaw. Nothing else.  
**Rationale:**
- OpenClaw has its own AI/agent system — we don't want it, we have ECC
- OpenClaw has its own dashboard — we don't want it, we have Next.js
- OpenClaw has its own memory/skills — we don't want these, we have ECC's
- The ONLY gap OpenClaw fills is the channel adapter layer (Discord, Telegram, WhatsApp)

---

### DEC-003 — ECC = Agent Intelligence Layer
**Date:** March 2026  
**Decision:** Use everything-claude-code (ECC) for all agent intelligence — agents, skills, hooks, commands, rules, security.  
**Rationale:**
- 74.7k stars, 9.3k forks — most battle-tested open-source Claude Code harness
- 18 agents, 94+ skills, 40+ commands already cover NexusOS P0-P8 pipeline needs
- AgentShield (1282 tests, 102 rules) gives enterprise security out of the box
- 10+ months of production use, Anthropic hackathon winner

---

### DEC-004 — AgentShield as npm Package
**Date:** March 2026  
**Decision:** Install AgentShield via `pnpm add ecc-agentshield`, not copy source files.  
**Rationale:**
- AgentShield is a published npm package with its own release cycle
- Copying source would mean maintaining a fork — updating becomes a manual process
- npm package gets security updates automatically

---

### DEC-005 — Private Beta First, Then OSS
**Date:** March 2026  
**Decision:** Private beta with 15-20 developers, then public OSS release.  
**Rationale:**
- Avoid shipping broken OSS that damages reputation before the core works
- Beta users provide real-world feedback on onboarding friction
- 20-minute onboarding goal needs validation before publishing

---

### DEC-006 — dashboard/lib/gateway.ts is Sacred
**Date:** March 2026  
**Decision:** ALL Traffic Controller API calls must go through this single file.  
**Rationale:**
- Prevents API call logic scattered across 15 components
- Single point to add auth headers, error handling, retry logic
- Makes it trivially easy to switch gateway URL between dev/staging/prod

---

### DEC-007 — Firebase First for Connectors
**Date:** March 2026  
**Decision:** Build Firebase connector before Linear, GitHub, Figma.  
**Rationale:**
- NexusOS needs Firebase for its own state persistence and credential storage
- Firebase SDK is the simplest to implement (no complex auth flow)
- Getting Firebase working unblocks the entire persistence layer

---

## Build Log

### Week 1 (current — restructure)
- [ ] Clone ECC and OpenClaw
- [ ] Clean repo root (prd.md → docs/, test_ws.js → tests/, rm package-lock.json)
- [ ] Create packages/channels/, sdk-bridge/, connectors/ structure
- [ ] Copy ECC agents/, skills/, hooks/, scripts/, commands/, mcp-configs/, rules/, contexts/
- [ ] Copy OpenClaw channel adapters to packages/channels/
- [ ] Create SDK bridge type stubs
- [ ] Scaffold 4 connector templates
- [ ] Create dashboard/lib/gateway.ts
- [ ] Install ecc-agentshield in agent-harness
- [ ] Final commit + push

### Week 2 (upcoming — Telegram + HITL)
- [ ] Implement Telegram bot notifications in traffic-controller (Rust)
- [ ] Complete P2 HITL gate — awaits developer approval before P3
- [ ] Complete P8 HITL gate — awaits developer approval before commit
- [ ] BlockerEvent handling for ambiguous missions
- [ ] Test end-to-end: submit mission → get Telegram notification at P2

### Week 3 (upcoming — dashboard wiring)
- [ ] Wire CommandBar.tsx → gateway.ts.submitMission()
- [ ] Wire LiveFeed.tsx → gateway.ts.createWebSocket()
- [ ] Wire AuditLog.tsx → gateway.ts.listMissions()
- [ ] Add health indicator to dashboard (healthCheck())
- [ ] Test: open dashboard, submit mission, watch P0-P8 live

### Week 4 (upcoming — first connector)
- [ ] Firebase connector — connect(), firestore.read, firestore.write
- [ ] Discord bot basic slash commands: /run, /status, /list
- [ ] Route Discord commands → channels/ → traffic-controller → agent
- [ ] Test: type /run in Discord → get result in Discord

### Week 5–6 (connectors + WhatsApp)
- [ ] GitHub connector
- [ ] Linear connector
- [ ] WhatsApp bot (Twilio sandbox)
- [ ] Figma connector

### Week 7–8 (private beta)
- [ ] nexusos init CLI wizard
- [ ] One-command setup (< 5 min to first agent command)
- [ ] Private beta: invite 15-20 developers
- [ ] Collect feedback, fix top 10 bugs
- [ ] README and setup guide

---

## Known Technical Debt

| Item | Impact | When to fix |
|---|---|---|
| SQLite → PostgreSQL migration | Medium — SQLite fine for beta, not prod scale | Week 3-4 |
| No authentication on Traffic Controller REST API | High — anyone can submit missions in current state | Week 2 |
| Dashboard components not typed (TypeScript coverage ~3.9%) | Medium — runtime errors possible | Week 3 during wiring |
| .temp_clones not cleaned up after mission | Low — disk space over time | Week 2 |
| HITL approval gates not implemented yet | High — missions auto-advance through all phases | Week 2 |

---

## External Repos Reference

| Repo | URL | What we use | What we skip |
|---|---|---|---|
| everything-claude-code | https://github.com/affaan-m/everything-claude-code | agents/, skills/, hooks/, scripts/, commands/, mcp-configs/, rules/common/, rules/typescript/, contexts/, CLAUDE.md, AGENTS.md | .claude/, .codex/, .cursor/, .opencode/, docs/, tests/, package.json, marketplace files |
| openclaw | https://github.com/openclaw/openclaw.git | Channel adapters: discord/, telegram/, whatsapp/, routing/ | AI/agent logic, dashboard, CLI, memory, skills, personality configs |
| NexusOS (own) | https://github.com/Inmodel-Labs/NexusOS | Everything — this is the repo we're building | — |
