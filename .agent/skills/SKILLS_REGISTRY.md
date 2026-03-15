# 🧠 NexusOS — Skills Registry (from ECC)

Source: https://github.com/affaan-m/everything-claude-code/tree/main/skills
Install location: packages/agent-harness/skills/

---

## ✅ TIER 1 — Copy These First (Critical for NexusOS)

These skills directly power the P0–P8 pipeline and core workflows.

| Skill | Why NexusOS needs it |
|---|---|
| tdd-workflow/ | Powers P4 Execution phase — RED → GREEN → IMPROVE |
| security-review/ | Powers P6 Review phase alongside AgentShield |
| verification-loop/ | Powers P5 Verification — continuous test verification |
| eval-harness/ | Eval-driven development for agent quality gates |
| deployment-patterns/ | CI/CD, Docker, health checks — needed for Railway/Vercel deploy |
| docker-patterns/ | Docker Compose, networking, volumes — needed for infra |
| backend-patterns/ | API design, database, caching — Rust + Node patterns |
| api-design/ | REST API patterns — Traffic Controller API design |
| database-migrations/ | PostgreSQL migration patterns — switching from SQLite |
| postgres-patterns/ | PostgreSQL optimization — for production Traffic Controller |
| search-first/ | Research-before-coding — agents verify before acting |
| autonomous-loops/ | Sequential pipelines, PR loops, DAG orchestration — core to P0-P8 |
| continuous-learning/ | Auto-extract patterns from sessions |
| strategic-compact/ | Context management for long agent sessions |

---

## ✅ TIER 2 — Copy These Next (High Value)

| Skill | Why NexusOS needs it |
|---|---|
| frontend-patterns/ | React/Next.js — dashboard development |
| e2e-testing/ | Playwright E2E — P5 verification |
| coding-standards/ | Language best practices across stack |
| iterative-retrieval/ | Progressive context refinement for sub-agents |
| cost-aware-llm-pipeline/ | LLM cost optimization — critical for multi-agent setups |
| agentic-engineering/ | (if exists) Core agentic patterns |
| security-scan/ | AgentShield /security-scan slash command integration |
| configure-ecc/ | Interactive installation wizard — reference for nexusos init |

---

## ✅ TIER 3 — Copy for Future Use

| Skill | Future Use |
|---|---|
| continuous-learning-v2/ | Instinct-based learning for agents |
| content-hash-cache-pattern/ | SHA-256 content hash caching |
| regex-vs-llm-structured-text/ | Decision framework for text parsing |
| skill-stocktake/ | Audit skills and commands quality |

---

## ❌ SKIP THESE — Not relevant to NexusOS

| Skill | Why to skip |
|---|---|
| django-patterns/ | Python/Django — NexusOS doesn't use Django |
| django-security/ | Same |
| django-tdd/ | Same |
| django-verification/ | Same |
| springboot-patterns/ | Java Spring Boot — not in NexusOS stack |
| springboot-security/ | Same |
| springboot-tdd/ | Same |
| springboot-verification/ | Same |
| swift-actor-persistence/ | iOS/macOS Swift — not relevant |
| swift-protocol-di-testing/ | Same |
| swift-concurrency-6-2/ | Same |
| liquid-glass-design/ | iOS 26 design — not relevant |
| foundation-models-on-device/ | Apple on-device LLM — not relevant |
| perl-patterns/ | Perl — not in NexusOS stack |
| perl-security/ | Same |
| perl-testing/ | Same |
| golang-patterns/ | Go — NexusOS uses Rust, not Go |
| golang-testing/ | Same |
| cpp-coding-standards/ | C++ — not in NexusOS stack |
| cpp-testing/ | Same |
| jpa-patterns/ | Java JPA — not relevant |
| java-coding-standards/ | Java — not relevant |
| nutrient-document-processing/ | Document processing API — not relevant |
| videodb/ | Video/audio processing — not relevant |
| frontend-slides/ | HTML presentations — not needed |
| article-writing/ | Content writing — not relevant |
| content-engine/ | Social content — not relevant |
| market-research/ | Market research — not relevant |
| investor-materials/ | Pitch decks — not needed yet |
| investor-outreach/ | Fundraising — not needed yet |

---

## Slash Commands to Keep (from /tmp/ecc/commands/)

| Command | Maps to NexusOS workflow |
|---|---|
| /plan | P2 Planning phase trigger |
| /tdd | P4 Execution phase |
| /code-review | P6 Review phase |
| /build-fix | P5 Verification failure recovery |
| /e2e | P5 E2E testing |
| /security-scan | P6 AgentShield integration |
| /verify | P5 Verification loop |
| /checkpoint | Save P-phase state |
| /learn | Extract patterns from mission session |
| /multi-plan | Multi-agent task decomposition |
| /multi-execute | Parallel agent execution |
| /orchestrate | Multi-agent coordination |
| /harness-audit | Audit harness reliability |
| /loop-start | Start controlled agentic loop |
| /loop-status | Check loop status |
| /quality-gate | Run quality checks |
| /refactor-clean | Code cleanup |
| /update-docs | Documentation sync |
| /sessions | Session history management |

---

## MCP Configs to Adapt (from /tmp/ecc/mcp-configs/)

The `mcp-servers.json` includes configs for:

| MCP Server | Keep for NexusOS? | Notes |
|---|---|---|
| GitHub | ✅ YES | Core connector — P1 Git operations |
| Supabase | ⚠️ MAYBE | Replace with Firebase for NexusOS |
| Vercel | ✅ YES | Dashboard deployment |
| Railway | ✅ YES | Backend hosting option |
| Sequential Thinking | ✅ YES | Agent reasoning enhancement |
| Memory | ✅ YES | Session memory persistence |
| Context7 | ✅ YES | Docs/context lookup |
| Others | 🔍 Review | Evaluate per connector |

Adapt: Replace API keys with NexusOS Firebase credentials in copied configs.

---

## Hooks to Keep (from /tmp/ecc/hooks/hooks.json)

| Hook | Trigger | NexusOS Use |
|---|---|---|
| SessionStart | Session begins | Load mission context |
| SessionEnd / Stop | Session ends | Save mission state to Firebase |
| PreToolUse (bash) | Before bash command | AgentShield command gating |
| PostToolUse (edit) | After file edit | TypeScript check + format |
| PreToolUse (write) | Before file write | Secret detection scan |
| strategic-compact | Context high | Suggest compaction before overflow |

---

## Contexts to Use (from /tmp/ecc/contexts/)

| Context File | When to inject |
|---|---|
| dev.md | Default — agent doing development work (P3, P4) |
| review.md | P6 Review phase — agent reviewing code |
| research.md | P1 Context Pull and P2 Planning — agent researching |
