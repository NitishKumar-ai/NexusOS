# PRD: NexusOS Agent Pipeline (NexusOS v2.0)

**Owner:** Niti (Product Lead)
**Authors:** AI Product Manager (assistant)
**Date:** 2026-03-14
**Version:** 2.0 (Comprehensive)

---

## 1. Executive Summary

NexusOS Agent Pipeline is a systematic, event-driven **Agent Mission Control** system that lets a developer (or small team) remotely command, monitor, and orchestrate AI agents (Antigravity, Claude Code, or any MCP-compatible agent). The system autonomously pulls code from GitHub, executes tasks, and delivers final outputs — features, fixes, or reports — directly to your **phone (Telegram/PWA)** and **web dashboard**.

It leverages two mature OSS foundations:
* **NexusOS Traffic Controller**: Control gateway, multi-channel inbox (Discord/WhatsApp), agent routing, and tools platform.
* **NexusOS Agent Harness**: Agent harness, memory/skills, AgentShield security rules, and lifecycle hooks.

The core philosophy: **Agent does the work. You approve, unblock, and receive results.**

---

## 2. Problems We Solve (Pain & Value)

### 2.1 Current Pain
* **Manual & Fragmented Workflows:** Developers manually run agents via scripts or terminal commands.
* **Lack of Remote Visibility:** If you leave an agent running on your laptop, it often gets stuck waiting for input without notifying you.
* **Security & Risk:** Prompt-injection, dangerous shell commands, or accidental destructive actions are unmonitored.
* **Fragmented Integrations:** Linear, Firebase, and Figma integrations require custom glue-code for each agent.

### 2.2 Value When Shipped
* **Remote Command & Control:** Start, stop, and inspect agents from Discord, WhatsApp, or the web.
* **Systematic Pipeline:** A defined P0-P8 phase runner ensures a predictable, reliable workflow.
* **Zero-Cost Delivery Layer:** Rust + Telegram + WebSocket ensures you get results on your phone without extra API fees.
* **Safer Operations:** AgentShield rules and runtime gating reduce the risk of destructive actions.

---

## 3. Target User & Personas

**Primary User:** Solo developer (Niti) building and operating agents on a project-specific SDK.
**Secondary User (v1.1+):** Small dev team (2–3 devs) sharing one mission-control instance.

### Persona: Niti — Solo Dev
* **Needs:** Fast deployment, secure automation, phone-observable pipeline.
* **Goal:** Zero manual triggering. Once a command is sent, the agent handles the rest, only checking in for approvals.

---

## 4. Goals & Success Metrics

### Product Goals (v2.0)
1. **Systematic Execution:** P0-P8 pipeline phases with mandatory approval gates.
2. **Phone + Web Interfaces:** Primary control via Telegram/PWA and a Perplexity-style Web Dashboard.
3. **Multi-Model Orchestration:** Routing sub-tasks to the best available models (Opus, Sonnet, Haiku).
4. **Sub-Agent Spawning:** Parallel execution of large tasks via child agents.
5. **Continuous Learning:** Agents evolve based on session memory and user instincts.

### KPIs
* **Pipeline Completion Rate:** > 80% of tasks completed without manual intervention.
* **Command Latency:** Median < 500ms from chat command to agent enqueue.
* **Security Incidents:** Zero major incidents involving destructive commands or data exfiltration.

---

## 5. Pipeline Architecture

### 5.1 System Overview
```text
TRIGGER LAYER (Phone PWA / CLI / GitHub Webhook)
        |
        v
ORCHESTRATION LAYER (NexusOS Traffic Controller)
  Task Queue → Phase Runner (P0-P8) → Agent Dispatcher
        |
        v
AGENT EXECUTION LAYER (NexusOS Agent Harness)
  Planner → Architect → Coder → TDD → Reviewer → Security
        |
        v
DELIVERY LAYER (NexusOS Bot + WebSocket + React PWA + Telegram)
  Phone Notifications → Live Stream → Web Dashboard
```

### 5.2 Pipeline Phases (The P0-P8 Runner)

| Phase | Name | What Happens | Output to Phone/Web |
|-------|------|--------------|---------------------|
| P0 | Trigger | Task received from phone, CLI, or webhook | Task accepted notification |
| P1 | Context Pull | Agent pulls latest code from GitHub | Repo pulled successfully |
| P2 | Planning | **Planner Agent** breaks task into sub-tasks | Plan sent for [Approve] |
| P3 | Architecture | **Architect Agent** designs solution | Architecture summary |
| P4 | Execution | **Code Agent** implements (TDD approach) | Live progress stream |
| P5 | Verification | Tests run, coverage checked, build verified | Pass/Fail report |
| P6 | Review | Code quality + security scan runs | Review summary |
| P7 | Delivery | Output packaged and sent to phone/web | Final output |
| P8 | Approval | Final tap to [Approve] | Commit/Deploy pushed |

---

## 6. Agent execution Layer

Built on **NexusOS Agent Harness** agents, each with a specialized role:

* **Planner Agent:** Reads tasks/codebase, breaks into ordered sub-tasks, estimates time.
* **Architect Agent:** Designs component structure, identifies files to modify, identifies breaking changes.
* **Code Agent (TDD):** Writes failing tests (RED), implements code (GREEN), refactors (IMPROVE).
* **Verification Agent:** Runs test suite, checks coverage, reports compilation errors.
* **Review Agent:** Scans for hardcoded secrets, injection risks, and performance issues (N+1 queries).
* **Continuous Learning:** Extracts patterns from user decisions to build "instinct collections" for future sessions.

---

## 7. Phone & Web Delivery System

### 7.1 Live Stream (WebSocket)
When the PWA or Dashboard is open, you see a real-time stream of:
* Every file the agent reads/writes.
* Every test that passes/fails.
* The agent's reasoning for every decision.

### 7.2 Push Notifications (Telegram)
When the PWA is closed, critical events are sent via Telegram:
* "Planning phase done, awaiting your approval."
* "Agent needs DATABASE_URL to continue."
* "Build failed: TypeScript error in auth.ts."

### 7.3 Web Dashboard (Perplexity-Inspired)
* **Command Center:** Perplexity-style input bar for tasks.
* **Live Feed:** Real-time decision logs.
* **Research Canvas:** Multi-model web research with cited sources.
* **Audit Log:** Full history of every agent action (Replay Mode).

---

## 8. Advanced Features (Perplexity Computer Inspired)

### 8.1 Multi-Model Orchestration
Routes sub-tasks to the best model:
* **Planning/Security:** Claude Opus 4-6 (Best reasoning).
* **Coding/Research:** Claude Sonnet 4-6 (Fast + Accurate).
* **Summarization:** Claude Haiku 4-5 (Cheap + Fast).

### 8.2 Sub-Agent Spawning
For large tasks (e.g., "Add full auth system"), the parent agent forks child agents to work in parallel on the schema, React components, and backend routes.

### 8.3 Web Research Agent
Browses documentation, Stack Overflow, and GitHub issues in real-time, citing sources in the final output.

---

## 9. Security & Governance (AgentShield)

* **Restricted Filesystem:** Agents only access the project directory.
* **Human-in-the-Loop (HITL):** Mandatory approval for Planning, Git Commits, Deploys, and Destructive File Operations.
* **Secret Management:** `.env` values injected via MCP; never stored in memory or logged.
* **Command Gating:** AgentShield prevents shell execution of `rm -rf`, `sudo`, or credential exfiltration.

---

## 10. Implementation Roadmap

### Week 1 — Foundation
* Initialize Monorepo: `packages/traffic-controller`, `packages/agent-harness`, `dashboard`.
* Set up NexusOS Rust gateway with basic event routing.
* Connect Telegram direct HTTP API.

### Week 2 — Pipeline Phases
* Implement P0-P8 Phase Runner in Rust.
* Wire up Planner + Code agents from NexusOS Agent Harness.
* Build HITL approval gates with phone buttons.

### Week 3 — Delivery & Observability
* Build Live Stream WebSocket logic.
* Implement Blocker Resolution (structured questions on phone).
* Add Audit Log (SQLite).

### Week 4-5 — Web Dashboard & Intelligence
* Build Next.js 14 Dashboard (Command Center, Research Canvas).
* Implement Sub-Agent spawning and Multi-Model Router.
* Wire Continuous Learning hooks.

### Week 6 — Polish & Deploy
* Set up 24/7 PM2/Systemd runners.
* Deploy Dashboard to Vercel.
* End-to-end testing of all 9 phases.

---

## 11. Appendix A — Monorepo Structure

```text
root/NexusOS
  /packages
    /traffic-controller  (orchestration gateway)
    /agent-harness       (agent CLI)
    /sdk-bridge          (adapters)
    /connectors          (linear, firebase, figma)
  /dashboard             (Next.js 14 + Tailwind)
```

---

## 12. Community & Support Resources
* **Code of Conduct:** [`CODE_OF_CONDUCT.md`](../packages/agent-harness/CODE_OF_CONDUCT.md)
* **Sponsors:** [`SPONSORS.md`](../packages/agent-harness/SPONSORS.md)
* **Troubleshooting:** [`TROUBLESHOOTING.md`](../packages/agent-harness/TROUBLESHOOTING.md)

---

*End of Document.*
