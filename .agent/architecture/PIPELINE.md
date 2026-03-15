# ⚙️ NexusOS — P0–P8 Execution Pipeline

---

## Overview

Every task in NexusOS is a "Mission" that progresses through 9 strictly ordered phases.
No phase can be skipped. Two mandatory HITL gates enforce human approval.

```
P0 Trigger → P1 Context Pull → P2 Planning ⏸ → P3 Architecture
           → P4 Execution → P5 Verification → P6 Review
           → P7 Delivery → P8 Approval ⏸ → DONE
```

---

## Phase Definitions

### P0 — Trigger
- **What:** Mission received via Discord, WhatsApp, Telegram, CLI, or GitHub Webhook
- **Who acts:** Traffic Controller (Rust)
- **Output:** Task UUID created, status = ACTIVE, MissionEvent broadcast to WebSocket
- **Next:** Auto-advance to P1

### P1 — Context Pull
- **What:** Clone or pull the repo_url specified in the task
- **Who acts:** Traffic Controller (Rust) — real Git operations
- **Output:** Repo available at .temp_clones/{task_id}/
- **Failure:** Emit BlockerEvent if repo not accessible, notify developer
- **Next:** Auto-advance to P2

### P2 — Planning ⏸ HITL Gate
- **What:** Agent generates step-by-step implementation plan
- **Who acts:** ECC planner agent
- **Output:** Plan document sent to developer via Telegram + WebSocket
- **GATE:** Developer must explicitly APPROVE plan before P3 begins
- **Rejection:** Developer can reject + provide feedback → P2 restarts with feedback
- **Timeout:** 30 minutes → emit reminder notification
- **Next:** Advance only on explicit APPROVE

### P3 — Architecture
- **What:** Agent designs file-level structure, interfaces, and module boundaries
- **Who acts:** ECC architect agent
- **Output:** Architecture spec (files to create/modify, interfaces, dependencies)
- **Next:** Auto-advance to P4

### P4 — Execution (TDD)
- **What:** Agent writes code following TDD: RED → GREEN → IMPROVE
- **Who acts:** ECC tdd-guide agent + code-reviewer agent
- **Rules:** Write failing test first, then minimal implementation, then refactor
- **Coverage requirement:** 80%+ test coverage
- **Output:** Code written, tests passing
- **Next:** Auto-advance to P5

### P5 — Verification
- **What:** Run all tests — unit, integration, E2E
- **Who acts:** ECC e2e-runner agent + build-error-resolver
- **Output:** Test report — pass/fail counts, coverage %, any failures
- **Failure:** Emit BlockerEvent, notify developer, loop back to P4
- **Next:** Auto-advance to P6 on all-pass

### P6 — Review (AgentShield)
- **What:** Security scan + code quality review
- **Who acts:** ECC security-reviewer agent + AgentShield (102 rules)
- **Scans:** OWASP Top 10, secrets detection, permission audit, hook injection, MCP risk
- **Output:** Security report — grade A-F, findings list, auto-fixable items
- **Failure:** Critical findings block advance, non-critical flagged for P8 review
- **Next:** Auto-advance to P7

### P7 — Delivery
- **What:** Results delivered to developer
- **Who acts:** Traffic Controller (Rust) — Telegram + WebSocket
- **Output:** Full mission summary sent to phone (Telegram) and dashboard (WebSocket)
- **Includes:** Code diff, test results, security grade, architecture summary
- **Next:** Auto-advance to P8

### P8 — Approval ⏸ HITL Gate
- **What:** Final human approval before code is committed/pushed
- **Who acts:** Developer
- **GATE:** Developer must explicitly APPROVE before commit
- **Options:** APPROVE (commit), REJECT (discard), REQUEST CHANGES (back to P4 with notes)
- **Timeout:** 60 minutes → emit reminder notification
- **On approve:** Git commit + push to branch, mission marked COMPLETE
- **Next:** Mission closed

---

## BlockerEvent Spec

```rust
struct BlockerEvent {
    task_id: UUID,
    phase: Phase,
    blocker_type: BlockerType,
    message: String,
    resolution_options: Vec<String>,
    timestamp: DateTime,
}

enum BlockerType {
    MissingApiKey,
    VagueSpec,
    RepoNotAccessible,
    TestFailure,
    SecurityCritical,
    AmbiguousRequirement,
}
```

When a BlockerEvent fires:
1. Mission pauses at current phase
2. Telegram notification sent to developer
3. Dashboard shows BLOCKED status with resolution options
4. Mission resumes when developer resolves the blocker

---

## WebSocket Event Stream Format

Every phase transition broadcasts a MissionEvent:

```json
{
  "task_id": "uuid-here",
  "phase": "P4Execution",
  "message": "Writing failing test for auth module...",
  "timestamp": "2026-03-14T10:30:00Z",
  "event_type": "phase_update",
  "metadata": {
    "files_changed": 3,
    "tests_written": 2
  }
}
```

Event types:
- `phase_update` — phase progressed
- `agent_thought` — agent reasoning broadcast
- `blocker` — mission paused, needs human input
- `hitl_gate` — waiting for approval
- `mission_complete` — all phases done
- `mission_failed` — unrecoverable error

---

## HITL Approval Protocol

Developer sends approval via any channel (Discord, WhatsApp, Telegram, Dashboard):

```
/approve {task_id}              → Advance past HITL gate
/reject {task_id}               → Discard mission
/feedback {task_id} "message"   → Restart current phase with feedback
/status {task_id}               → Get current phase and status
```

Traffic Controller listens for these commands via the channels/ layer and advances the pipeline state machine accordingly.

---

## Mission Lifecycle States

```
PENDING → ACTIVE → BLOCKED → ACTIVE → AWAITING_APPROVAL → COMPLETE
                                                         ↘ REJECTED
                                                         ↘ CHANGES_REQUESTED → ACTIVE
```

---

## Database Schema (SQLite → PostgreSQL for production)

```sql
CREATE TABLE missions (
    id          TEXT PRIMARY KEY,  -- UUID
    instruction TEXT NOT NULL,
    repo_url    TEXT,
    phase       TEXT NOT NULL DEFAULT 'P0Trigger',
    status      TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mission_events (
    id          TEXT PRIMARY KEY,
    task_id     TEXT REFERENCES missions(id),
    phase       TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    message     TEXT NOT NULL,
    metadata    TEXT,  -- JSON
    timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blockers (
    id              TEXT PRIMARY KEY,
    task_id         TEXT REFERENCES missions(id),
    blocker_type    TEXT NOT NULL,
    message         TEXT NOT NULL,
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     DATETIME,
    resolution_note TEXT
);
```
