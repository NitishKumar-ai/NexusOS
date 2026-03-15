# 🧠 NexusOS — Skills Registry

This registry maps available agent skills to the NexusOS **P0–P8 Orchestration Pipeline**. These skills are installed in `packages/agent-harness/skills/` and are utilized by agents under the direction of the **Rust Traffic Controller**.

---

## 🚀 TIER 1 — Pipeline Core (P0–P8)

These skills are critical for the autonomous operation of NexusOS agents and security enforcement.

| Skill | Pipeline Phase | NexusOS Use Case |
|---|---|---|
| **search-first/** | P1 Context Pull | Research-before-coding; agents verify context before acting. |
| **autonomous-loops/** | P2 Planning | Core P0-P8 coordination; parallel agent execution (DAG). |
| **tdd-workflow/** | P4 Execution | Powers the RED → GREEN → IMPROVE coding cycle. |
| **verification-loop/** | P5 Verification | Continuous test execution and failure recovery. |
| **security-review/** | P6 Review | Multi-stage review using **AgentShield** 102-rule scan. |
| **deployment-patterns/** | P7 Commit/Deploy | CI/CD, Docker, and health checks for Railway/Vercel. |
| **continuous-learning/** | P8 Learn | Post-mission pattern extraction and instinct refinement. |
| **strategic-compact/** | Cross-phase | Context management for long-running agent sessions. |

---

## 🛠️ TIER 2 — Connectors & Infrastructure

| Skill | Category | NexusOS Use Case |
|---|---|---|
| **api-design/** | Backend | Traffic Controller REST API design (Rust + Axum). |
| **database-migrations/** | Backend | PostgreSQL/PostGIS migration patterns and optimization. |
| **frontend-patterns/** | Dashboard | Next.js 14 / Tailwind UI patterns for Mission Control. |
| **e2e-testing/** | Verification | Playwright E2E for P5 verification of UI changes. |
| **sdk-bridge-adapters/** | Integration | Adapters for Claude Code, LangChain, and LangGraph. |
| **cost-aware-pipeline/** | Optimization | LLM cost management for multi-agent loops. |
| **security-scan/** | Security | Integration for `/security-scan` slash command via AgentShield. |

---

## 🕹️ NexusOS Slash Commands

Slash commands are the primary trigger for remote commanding via **Discord**, **WhatsApp**, and **Telegram**.

| Command | Pipeline Trigger | Action |
|---|---|---|
| `/run [task]` | **P0 Start** | Initialize a new mission and enter P1/P2. |
| `/plan` | **P2 Planning** | Force re-plan or decompose complex tasks. |
| `/gate-approve` | **P2/P8 HITL** | Human-in-the-loop approval to proceed (Planning or Commit). |
| `/gate-reject` | **P2/P8 HITL** | Stop pipeline and return to previous phase with feedback. |
| `/status` | **Monitor** | Get real-time health and progress of all active agents. |
| `/verify` | **P5 Verify** | Manually trigger the verification loop. |
| `/incident-report` | **Security** | Pull AgentShield violation logs for a specific session. |
| `/learn` | **P8 Learn** | Manually trigger pattern extraction from the last session. |

---

## 🔌 MCP Connector Registry

NexusOS provides a unified registry for MCP connectors, managed by the `sdk-bridge`.

| Connector | Status | NexusOS Mission |
|---|---|---|
| **Linear** | ✅ Live | Query/Update tickets; P1 context pull from issues. |
| **Firebase** | ✅ Live | Auth management; P8 state persistence to Firestore. |
| **GitHub** | ✅ Live | PR management; P7 commit operations via API. |
| **Figma** | 🔄 Beta | Design-to-code; frame analysis for UI updates. |
| **PostgreSQL** | 📋 Planned | Direct vector search and long-term memory access. |

---

## 🛡️ Security Hooks (AgentShield)

Registered in `packages/agent-harness/hooks/hooks.json`.

| Hook | Type | Protection |
|---|---|---|
| **PreToolUse (bash)** | Gating | Prevents unauthorized system commands. |
| **PreToolUse (write)** | Scan | Secret detection and unauthorized file access block. |
| **PostToolUse (edit)** | Verify | Auto-runs lints and formatting after edits. |
| **SessionEnd** | Persistence | Securely flushes trace logs to Firebase. |
