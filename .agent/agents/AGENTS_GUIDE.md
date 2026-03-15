# 🤖 NexusOS — Agent Definitions & Delegation Guide

---

## The 18 ECC Agents — When NexusOS Uses Each

### Core Pipeline Agents (used in every mission)

#### planner
- **Triggered at:** P2 Planning phase
- **Job:** Breaks the developer's instruction into ordered sub-tasks
- **Output:** Step-by-step implementation plan, sent to developer for HITL approval
- **Model:** Opus (deep reasoning needed)

#### architect
- **Triggered at:** P3 Architecture phase
- **Job:** Designs file-level structure, interfaces, module boundaries
- **Output:** Architecture spec — files to create/modify, class interfaces, dependencies
- **Model:** Opus

#### tdd-guide
- **Triggered at:** P4 Execution phase
- **Job:** Enforces TDD: write failing test → implement → refactor
- **Rule:** NEVER writes implementation before writing a failing test
- **Coverage requirement:** 80%+ minimum
- **Model:** Sonnet

#### code-reviewer
- **Triggered at:** P4 (post-implementation) and P6 Review
- **Job:** Reviews for quality, maintainability, patterns
- **Output:** Inline review comments, pass/fail verdict
- **Model:** Sonnet

#### security-reviewer
- **Triggered at:** P6 Review phase alongside AgentShield
- **Job:** OWASP Top 10 audit, vulnerability detection, secret exposure
- **Output:** Security report with severity grades
- **Model:** Opus (security is critical)

#### build-error-resolver
- **Triggered at:** P5 Verification failure → P4 retry
- **Job:** Fixes compile/type errors automatically
- **Model:** Sonnet

#### e2e-runner
- **Triggered at:** P5 Verification phase
- **Job:** Playwright E2E test generation and execution
- **Output:** E2E test report, screenshots on failure
- **Model:** Sonnet

---

### Specialized Support Agents

#### refactor-cleaner
- **Triggered when:** Developer sends /refactor-clean command
- **Job:** Dead code removal, import cleanup, naming improvements
- **Model:** Sonnet

#### doc-updater
- **Triggered when:** Code changes in P4, or /update-docs command
- **Job:** Keeps docs/ and README in sync with code changes
- **Model:** Haiku (lightweight)

#### database-reviewer
- **Triggered when:** Database-related files changed in P4
- **Job:** PostgreSQL/Supabase query optimization, index review, migration safety
- **Model:** Sonnet

#### chief-of-staff
- **Triggered when:** Multiple concurrent missions active
- **Job:** Multi-channel comms triage — routes notifications to right channel
- **Model:** Haiku

#### loop-operator
- **Triggered when:** Autonomous loop is running (P4 execution loop)
- **Job:** Monitors loop health, detects infinite loops, triggers checkpoints
- **Model:** Haiku

#### harness-optimizer
- **Triggered when:** /harness-audit command or session cost exceeds threshold
- **Job:** Token optimization, model routing, context compaction suggestions
- **Model:** Sonnet

---

### Language-Specific Reviewers (P6 Review)

#### go-reviewer
- Reviews Go code quality and idioms
- Only triggered when .go files are in scope

#### go-build-resolver
- Fixes Go build and compile errors

#### python-reviewer
- Reviews Python code (PEP 8, type hints, security patterns)
- Triggered when .py files are in scope

#### kotlin-reviewer
- Reviews Kotlin code
- Triggered when .kt files are in scope

---

## Agent Delegation Rules

From `rules/common/agents.md` (ECC):

```
When to delegate to a subagent:
- Task requires specialized knowledge (security, database, language-specific)
- Task is parallelizable (multiple file reviews)
- Task has clear scope and bounded output
- Current context window would overflow

When NOT to delegate:
- Simple, 1-3 step tasks
- Tasks requiring shared context from current session
- Real-time user interaction needed
```

---

## Multi-Agent Patterns for NexusOS

### Pattern 1 — Sequential Pipeline (default)
```
planner → architect → tdd-guide → code-reviewer → security-reviewer
```
Used for: Standard feature implementation missions

### Pattern 2 — Parallel Review
```
code-reviewer ─┐
               ├→ chief-of-staff → merged report
security-reviewer ─┘
```
Used for: P6 Review phase — run quality and security in parallel

### Pattern 3 — Retry Loop
```
tdd-guide → build-error-resolver → tdd-guide (until tests pass)
```
Used for: P4/P5 loop when tests fail

### Pattern 4 — Human-in-the-Loop Gate
```
planner → [HITL P2 gate] → architect
                         ↑ developer approves
```
Used for: P2 Planning and P8 Approval

---

## Agent Model Routing

From ECC's cost-aware-llm-pipeline skill:

| Complexity | Model | Examples |
|---|---|---|
| High — architecture, security, deep reasoning | Opus | planner, architect, security-reviewer |
| Medium — implementation, review | Sonnet | tdd-guide, code-reviewer, e2e-runner |
| Low — docs, logging, simple fixes | Haiku | doc-updater, chief-of-staff, loop-operator |

NexusOS /model-route command handles this automatically.

---

## AGENTS.md (root of agent-harness)

This is the universal cross-tool file that defines all agents.
Format used by Claude Code, Cursor, Codex, and OpenCode.

```markdown
# NexusOS Agent Harness

## Agents

### planner
Breaks developer instructions into ordered implementation sub-tasks.
Use when: Starting any new feature or fix mission.
Model: opus

### architect
[... etc for each agent]
```

Agents reference the skill files in skills/ for domain knowledge.
