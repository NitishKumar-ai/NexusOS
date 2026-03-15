# 🚀 Agent Mission Control (AMC) — Final PRD v1.0

> **Codename:** AMC — Agent Mission Control
> **Version:** v1.0 Final
> **Launch Strategy:** Private Beta → Public OSS
> **Timeline:** 6–8 weeks to polished v1
> **Date:** March 2026

---

## 📝 Abstract

Agent Mission Control (AMC) is a **unified, open-source command center for AI agents**. It merges OpenClaw (multi-channel gateway, agent routing, remote control) and everything-claude-code (agent harness, security, memory) into a single production-grade codebase — then extends it with a universal SDK adapter, a growing MCP connector registry (Linear, Firebase, Figma, GitHub, and more), and remote commanding via Discord and WhatsApp.

Developers control their agents from anywhere, through any chat interface, with enterprise-grade security baked in. AMC is built for the **multi-agent, multi-SDK world** — it doesn't care if your agents run on Claude Code, LangChain, LangGraph, or a custom Python SDK. If it's an agent, AMC can manage it.

**Private beta first. Public OSS after.**

---

## 🎯 Business Objectives

- Provide a single control plane for all agents across all SDKs — no more terminal juggling
- Enable real-time remote agent commanding from Discord and WhatsApp, from any device, anywhere
- Ship an extensible MCP connector registry so any external tool can be wired in — starting with Linear, Firebase, Figma, and GitHub
- Build a security-first architecture (AgentShield) so agents can't go rogue or access unauthorized tools
- Launch as a polished private beta to collect real developer feedback before OSS release
- Establish AMC as the default open-source agent orchestration layer for Claude Code and multi-SDK setups

---

## 📊 KPI

| GOAL | METRIC | QUESTION |
|---|---|---|
| Beta Adoption | # Private Beta Sign-ups (target: 20 devs in Week 1) | Are developers interested enough to join the waitlist? |
| Remote Control Usage | # Agent commands sent via Discord/WhatsApp per week | Is remote control actually being used, not just installed? |
| MCP Connector Reliability | % Successful MCP actions across all connectors (target: >97%) | Are Linear, Firebase, Figma, GitHub integrations stable? |
| Agent Security | % Tasks passing AgentShield scan without false positives (target: >98%) | Is the security layer trustworthy in real workflows? |
| OSS Readiness | GitHub Stars + Forks in first 2 weeks post-OSS launch | Is the community picking it up organically? |

---

## 🏆 Success Criteria

- A developer with an existing agent can connect it to AMC and issue a remote command via Discord in **under 20 minutes from zero**
- All 4 core MCP connectors (Linear, Firebase, Figma, GitHub) work end-to-end in beta
- AgentShield blocks 100% of test attack vectors from the ECC 912-test suite
- Zero critical security incidents during private beta
- Dashboard is live on Vercel, loads in under 2 seconds, and works on mobile
- README and setup guide complete enough for a stranger to self-onboard without asking questions
- Positive qualitative feedback from at least 10 of 20 beta users

---

## 🚶 User Journeys

### Journey 1 — The Remote Commander
Niti is in a cafe. An agent running a background job needs to be retasked. Niti opens WhatsApp, types `/run research-agent summarise last 10 Linear tickets`, and 8 seconds later gets a clean summary back — no laptop needed.

### Journey 2 — The Connector Builder
A beta user wants to add a Notion MCP connector. They clone AMC, copy the `connectors/linear` template, fill in the Notion API methods, run the test suite, and open a PR. AMC merges it and it's available to all users.

### Journey 3 — The Security Auditor
An agent attempts to write to Firebase with credentials it shouldn't have. AgentShield intercepts, blocks the write, logs the incident with full trace, and pings the developer on Discord. Developer reviews the incident in the dashboard and adds a whitelist rule.

### Journey 4 — The OSS Contributor
Post-OSS launch, a developer forks AMC, adds a LangGraph adapter to the SDK bridge, and submits a PR. AMC's adapter interface is clean enough that the PR is 80 lines of code.

---

## 📖 Scenarios

| # | Scenario | Channel | Expected Outcome |
|---|---|---|---|
| S1 | Check all agent statuses | Discord | Health table: agent name, SDK, status, last action, uptime |
| S2 | Trigger agent task remotely | WhatsApp | Agent runs task, result returned to chat with trace ID |
| S3 | Create Linear ticket via agent | Discord | Ticket created via MCP, ticket URL returned |
| S4 | Write to Firebase via agent | WhatsApp | Firebase write confirmed, doc path returned |
| S5 | Push Figma comment via agent | Discord | Comment posted, Figma link returned |
| S6 | Open GitHub PR summary via agent | Discord | PR details and status returned in structured format |
| S7 | Unauthorized tool access attempt | Internal | AgentShield blocks, logs, notifies developer |
| S8 | Agent crashes mid-task | Internal | State captured, incident logged, dev alerted with trace |
| S9 | Developer reviews agent replay | Dashboard | Full visual decision flow with tool calls and timestamps |
| S10 | Developer adds new MCP connector | CLI | Scaffolded template generated, test suite wired automatically |

---

## 🕹️ User Flow

### Happy Path — Remote Agent Command (Discord / WhatsApp)

```
Developer types /run [agent-name] [task] in Discord or WhatsApp
        ↓
AMC Channel Adapter receives message (OpenClaw layer)
        ↓
Auth check — is this developer's token valid?
        ↓
Command parsed → agent name + task + params extracted
        ↓
AgentShield pre-flight scan — does this task violate any rules?
        ↓ (if blocked → notify developer + log incident)
Task routed to correct agent via AMC Gateway router
        ↓
Agent executes task using its SDK (Claude Code / LangChain / custom Python / etc.)
        ↓
If MCP connector needed → AMC Connector Registry called (Linear / Firebase / Figma / GitHub)
        ↓
MCP action performed on external service
        ↓
Result + trace returned to AMC Gateway
        ↓
Channel Adapter sends formatted response back to Discord / WhatsApp
        ↓
Trace logged to Dashboard (Vercel) for replay
```

### Alternative Paths

- **Agent not found:** Returns list of available agents with suggested matches
- **MCP connector auth expired:** AMC prompts developer to refresh token via dashboard link
- **AgentShield block:** Task halted, full incident report sent to developer, task queued for manual review
- **Agent SDK timeout:** AMC retries once, then returns timeout error with last known state
- **WhatsApp rate limit:** Commands queued with "in progress" status; result delivered when available

---

## 🧰 Functional Requirements

### Authentication & Access

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---|---|---|---|
| Auth | GitHub OAuth | Developer logs into AMC dashboard via GitHub; session persists 30 days | Login Page |
| Auth | Agent API Keys | Each agent gets a unique API key generated by AMC on registration; rotatable | Settings > Agents |
| Auth | Remote Command Auth | All Discord/WhatsApp commands require a developer token in the command or pre-configured per channel | Bot Setup |
| Auth | MCP Credential Vault | Connector credentials stored encrypted in developer's own Firebase; AMC never stores keys | Connector Settings |

### Core Platform

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---|---|---|---|
| Gateway | Agent Routing | Route commands to agents by name, tag, or capability; supports sequential and parallel routing | Dashboard |
| Gateway | Multi-SDK Adapter | Universal bridge accepting Claude Code, LangChain, LangGraph, custom Python; standardized JSON interface | SDK Docs |
| Gateway | Session Management | Each command creates a session with ID, timestamps, agent state snapshot, and result | Dashboard |
| Remote Control | Discord Bot | Slash commands: /run, /status, /stop, /list, /logs; results in threaded replies | Bot Config |
| Remote Control | WhatsApp Bot | Same command set as Discord via Twilio WhatsApp sandbox or Business API | Bot Config |
| MCP Connectors | Linear | Create/update/query tickets; assign issues; list project status | Connector Settings |
| MCP Connectors | Firebase | Read/write Firestore; trigger Cloud Functions; query Auth users | Connector Settings |
| MCP Connectors | Figma | Post comments; export frames; read file/component structure | Connector Settings |
| MCP Connectors | GitHub | Open/close issues; read PR status; push file via API; query repo metadata | Connector Settings |
| MCP Connectors | Registry | Plugin interface for adding new connectors; scaffold CLI command: `amc connector new [name]` | CLI + Docs |
| Security | AgentShield | 102-rule scan on every agent action; 912 test coverage; block + log unauthorized calls | Security Dashboard |
| Security | Incident Log | Every blocked action stored with: timestamp, agent ID, rule triggered, attempted action, trace | Security Dashboard |
| Orchestration | Open Flow Editor | Visual drag-and-drop flow builder for multi-agent sequences; conditional branching; export as JSON | Flow Editor |
| Orchestration | Flow Templates | 5 pre-built templates: sequential pipeline, parallel fan-out, conditional branch, retry loop, human-in-loop | Flow Editor |
| Dashboard | Mission Control | Real-time view: all agents, SDK type, status, last command, error rate, uptime | Main Dashboard |
| Dashboard | Trace Replay | Click any session → full visual replay of agent decisions, tool calls, MCP actions, and outputs | Session Detail |
| Dashboard | Hosted on Vercel | SSR dashboard via Next.js; auto-deploy from main branch; custom domain support | — |

---

## 📐 Model Requirements

| SPECIFICATION | REQUIREMENT | RATIONALE |
|---|---|---|
| Open vs Proprietary | Pluggable — any model | Multi-SDK means multi-model; AMC is model-agnostic |
| Context Window | 32k+ preferred for replay | Full session traces may be long; short context breaks replay |
| Modalities | Text primary; Vision optional | Figma connector may need frame analysis in v2 |
| Fine Tuning | Not needed for v1 | Standard prompting + AgentShield rules sufficient |
| Latency | P50 < 1.5s, P95 < 3s for remote commands | Remote control must feel near real-time |
| Guardrails | AgentShield (102 rules, 912 tests from ECC) | Pre-built from ECC repo; integrated at merge |
| Model Routing | Per-agent config in AMC registry | Claude Code agent uses Anthropic; LangGraph agent uses OpenAI; AMC doesn't care |

---

## 🧮 Data Requirements

- **Agent state:** In-memory during session; persisted to Firestore after task completes
- **Session traces:** Full trace stored per session (agent ID, task, tool calls, MCP actions, result, timestamps)
- **MCP credentials:** AES-256 encrypted; stored only in developer's own Firebase project — AMC core never touches them
- **Security incidents:** Permanent log in Firestore; indexed by agent ID and rule triggered; never deleted
- **Orchestration flows:** JSON stored in developer's GitHub repo (via GitHub MCP connector) or Firestore
- **GitHub sync:** OpenClaw and ECC merged at stable commit SHA; tracked in `amc.config.json`; dev can pull updates via `amc update`
- **PII policy:** AMC core collects zero PII; developers are fully responsible for data their agents process
- **Retention:** Session traces retained 90 days by default; configurable per developer in dashboard settings

---

## 💬 Prompt Requirements

- **System prompt injection:** ECC harness injects per-agent system prompt before every task; includes: tool permissions, persona, task context, and AgentShield policy rules
- **Policy enforcement:** AgentShield rules added as a locked system block — agents cannot override or ignore them
- **Output schema:** All agent responses to AMC return structured JSON:
  ```json
  {
    "status": "success | refused | error",
    "result": "...",
    "trace_id": "uuid",
    "timestamp": "ISO8601",
    "tool_calls": [],
    "mcp_actions": []
  }
  ```
- **Refusal format:** `{ "status": "refused", "reason": "AgentShield rule 47 triggered", "alternatives": [] }`
- **Tone config:** Developer sets per-agent tone (technical / friendly / concise) in AMC agent registry; injected into system prompt
- **Hallucination guard:** For MCP actions, agent must return the exact API response as confirmation — no paraphrasing allowed

---

## 🧪 Testing & Measurement

### Offline Testing
- Golden test set: 75 remote commands covering all 4 MCP connectors + edge cases
- Pass threshold: >95% correct tool call + correct output schema
- AgentShield: full 912-test suite runs on every PR via GitHub Actions
- SDK adapter tests: 10 test agents per SDK type (Claude Code, LangChain, LangGraph, custom Python)

### Online / Beta Testing
- Canary: deploy to 5 beta users first; monitor for 48 hours before full beta rollout
- Rollback trigger: P95 latency > 5s OR error rate > 3% for 10 consecutive minutes
- Incident playbook: auto-create Linear ticket for any P1 incident via AMC itself

### Live Monitoring
- Vercel Analytics for dashboard performance
- Custom event tracking: command latency, MCP success/fail rate, AgentShield block rate
- Weekly beta report to private beta group: top bugs, top used connectors, top blocked rules

---

## ⚠️ Risks & Mitigations

| RISK | MITIGATION |
|---|---|
| OpenClaw + ECC full merge causes conflicts or instability | Merge incrementally by module; write integration tests before each merge step; keep Git history clean |
| MCP connector auth tokens expire mid-task | Token refresh layer in every connector adapter; graceful retry with user notification |
| Discord/WhatsApp rate limits during heavy use | Command queue with status updates; backpressure handling in gateway |
| AgentShield false positives block legitimate actions | Developer dashboard to review, approve, and whitelist safe actions per-agent; rule tuning UI in v2 |
| Multi-SDK adapter breaks for edge-case SDKs | Ship with 4 tested adapters; document adapter interface clearly for community to extend |
| Vercel cold starts add latency to dashboard | Use Vercel Edge Functions for hot paths; SSR for dashboard shell |
| Private beta users find setup too complex | Build `npx amc init` CLI wizard; one-command setup targeting under 5 minutes |
| Security of remote command channel | All commands require signed developer token; no anonymous control ever |
| OSS competition (existing agent orchestration tools) | AMC's differentiator is the Discord/WhatsApp interface + multi-SDK support + AgentShield — lean into this in all comms |

---

## 💰 Costs

### Development (6–8 weeks, solo or small team)

| Task | Est. Days |
|---|---|
| OpenClaw + ECC unified merge + CI setup | 5 days |
| Universal multi-SDK adapter (Claude Code, LangChain, LangGraph, Python) | 5 days |
| MCP connector registry + 4 connectors (Linear, Firebase, Figma, GitHub) | 7 days |
| Discord + WhatsApp bot wiring | 3 days |
| AgentShield integration + full test suite | 4 days |
| Next.js dashboard (Vercel) — Mission Control + Trace Replay + Flow Editor | 8 days |
| Open Flow editor (visual orchestration) | 4 days |
| `amc` CLI tool (init, connector new, update) | 3 days |
| QA, bug fixes, private beta prep | 5 days |
| README, docs, setup guide | 3 days |
| **Total** | **~47 dev-days (~8 weeks solo)** |

### Operational (Monthly, during beta)

| Item | Est. Cost |
|---|---|
| Vercel (Hobby → Pro when needed) | $0–20/month |
| Firebase (Firestore + Auth) | $0–10/month at beta scale |
| Twilio WhatsApp sandbox | $0 (sandbox) → ~$15/month (production) |
| LLM API calls | ~$0.002–0.015 per agent task |
| Railway / VPS for OpenClaw gateway | $5–10/month |
| **Total** | **~$20–55/month in beta** |

---

## 🔗 Assumptions & Dependencies

- **[Assumption]** OpenClaw's Discord and WhatsApp adapters are stable enough to merge without rewrite
- **[Assumption]** ECC's AgentShield can be extracted as a clean module during the merge
- **[Assumption]** Firebase MCP connector can be built without needing a custom Firebase Admin SDK fork
- **[Assumption]** Twilio WhatsApp sandbox is acceptable for private beta; Business API for OSS launch
- **[Assumption]** 6–8 weeks is achievable with 1 focused developer; expands to 4 weeks with 2 developers
- **[Assumption]** Beta users are developers comfortable with CLI and basic Firebase setup
- **[Dependency]** Claude Code CLI for Anthropic-based agents
- **[Dependency]** Firebase project (developer-owned) for state and credential storage
- **[Dependency]** Discord Developer Portal — bot token + slash command registration
- **[Dependency]** Twilio account for WhatsApp integration
- **[Dependency]** Vercel account for dashboard hosting
- **[Dependency]** GitHub — for OSS release, connector PR workflow, and GitHub MCP connector

---

## 🔒 Compliance / Privacy / Legal

- **License:** MIT for OSS release — maximizes community adoption and contribution
- **MCP credentials:** Developer-owned Firebase only — AMC never stores, logs, or transmits API keys
- **Agent data:** AMC logs traces for debugging; no agent output is shared with third parties
- **PII:** AMC core collects zero PII; developers are solely responsible for GDPR/CCPA compliance in their agents
- **AgentShield:** Covers prompt injection, unauthorized tool access, data exfiltration patterns, and credential theft — documented in security policy file
- **OSS security policy:** SECURITY.md with responsible disclosure process included at launch
- **Data retention:** Session traces default to 90 days; developer can reduce or disable in dashboard

---

## 📣 GTM / Rollout Plan

### Phase 1 — Build (Weeks 1–6)

| Week | Milestone |
|---|---|
| 1 | Unified repo: OpenClaw + ECC merged, CI green, basic agent routing working |
| 2 | Multi-SDK adapter live; Claude Code + LangChain agents connecting successfully |
| 3 | All 4 MCP connectors working end-to-end; AgentShield integrated |
| 4 | Discord + WhatsApp bots live; `amc init` CLI working |
| 5 | Next.js dashboard live on Vercel; Mission Control + Trace Replay working |
| 6 | Open Flow editor v1; full QA pass; private beta package ready |

### Phase 2 — Private Beta (Weeks 7–8)

- Invite 15–20 developers from personal network and Indian dev communities
- Goal: each beta user completes the 20-minute onboarding and sends at least 1 remote command
- Feedback collection: weekly async check-in + structured feedback form
- Fix top 10 reported bugs before OSS launch

### Phase 3 — OSS Launch (Week 9+)

- GitHub public release with MIT license
- Launch content:
  - Demo video: *"Control your Claude Code agent from WhatsApp in 5 minutes"*
  - HackerNews Show HN post
  - Post in Claude Code Discord, r/LocalLLaMA, r/MachineLearning, X/Twitter
  - Dev.to article: *"I merged OpenClaw + everything-claude-code and built an agent mission control"*
- One-click Railway deploy template for instant setup
- Contributor guide + `amc connector new` template for community connectors

### v2 Roadmap (Post-OSS)

- Multi-tenant team workspaces
- Voice command via WhatsApp audio messages
- More community MCP connectors (Notion, Slack, Jira, Stripe)
- Fine-tuned orchestration model based on real usage patterns
- Visual agent time-travel debugger
- AgentShield rule builder UI (no-code security policy editor)

---

## ✅ Locked Decisions Summary

| Decision | Choice |
|---|---|
| Target User (v1) | Private beta → Public OSS |
| OpenClaw + ECC Integration | Full merge into one unified codebase |
| MCP Connectors (v1) | Linear, Firebase, Figma, GitHub + extensible registry |
| Agent SDKs Supported | Multiple / mixed (Claude Code, LangChain, LangGraph, custom Python) |
| Timeline | 6–8 weeks to polished v1 |
| Dashboard Hosting | Vercel (Next.js) |
| Remote Control Channels | Discord + WhatsApp |
| License | MIT (OSS) |

---

*All items marked [Assumption] can be revised. This PRD is the source of truth for AMC v1.*
