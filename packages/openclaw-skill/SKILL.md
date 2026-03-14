---
name: nexusos-pipeline
version: 1.0.0
description: >
  Executes software development missions through NexusOS's P0-P8 structured pipeline.
  Autonomously pulls code, plans, implements with TDD, scans with AgentShield,
  and delivers results — with mandatory human approval at planning (P2) and commit (P8).
  Triggers: /mission, /run, /code, "build", "implement", "fix the bug", "add feature".
metadata:
  {
    "openclaw": {
      "emoji": "🚀",
      "requires": { "anyBins": ["curl"] },
      "triggers": ["/mission", "/run", "/code"]
    }
  }
---

# NexusOS Pipeline Skill

## What I Do

When you send me a coding task, I run it through a structured 9-phase pipeline:

| Phase | Name | HITL? |
|-------|------|-------|
| P0 | Trigger — task received, session created | — |
| P1 | Context Pull — clone repo, index codebase | — |
| P2 | Planning — architect writes implementation plan | **⏸ you approve** |
| P3 | Architecture — design patterns + TDD test spec | — |
| P4 | Implementation — code written to pass tests | — |
| P5 | Validation — tests, build, lint all pass | — |
| P6 | Security — AgentShield scans (102 rules) | — |
| P7 | Documentation — docs updated | — |
| P8 | Approval — final diff ready | **⏸ you approve** |

## How to Use

```
/mission Add user authentication to the API
/run Fix the null pointer bug in src/agent.rs  
/code Implement the Firebase connector
/status <task-id>
/approve <task-id>
/reject <task-id> "feedback here"
```

## How It Works Internally

This skill submits tasks to the NexusOS Rust Traffic Controller at `http://localhost:3000`.
The Rust gateway orchestrates the full P0-P8 pipeline using 18 ECC specialized agents.
Results are delivered back through OpenClaw to whatever channel you used.

## HITL Gates

I will **always** pause and ask your approval at:
1. **P2** — Before writing any code (I'll show you the complete implementation plan)
2. **P8** — Before committing anything (I'll show you the full diff + test results)
