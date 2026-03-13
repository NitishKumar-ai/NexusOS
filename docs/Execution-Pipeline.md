# The P0-P8 Execution Pipeline

AMC uses a strict, phase-gated execution pipeline for all agent tasks to ensure predictable behavior and enforce Human-in-the-Loop (HITL) approvals.

| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| **P0** | Trigger | Task received from REST API or chat channel. Task is enqueued. | Active |
| **P1** | Context Pull | The Gateway clones or pulls the target repository into a temporary workspace (`git2`). | Active |
| **P2** | Planning | The **Planner Agent** analyzes requirements and generates a step-by-step plan. **[Pauses for Human Approval]** | Active |
| **P3** | Architecture | The **Architect Agent** designs the solution, identifying files and DB schema changes. | Active |
| **P4** | Execution | The **Code Agent** implements the code following TDD principles. | Active |
| **P5** | Verification | The **Verification Agent** runs the test suite and checks build compilation. | Active |
| **P6** | Review | The **Review Agent** scans for hardcoded secrets, injection risks, and code smells. | Active |
| **P7** | Delivery | Output is packaged and the developer is notified that the task is ready. | Active |
| **P8** | Approval | Final tap to **[Approve]**. Changes are committed and pushed to the remote. | Active |

## Blocker Resolution
At any point during P2-P6, an agent can pause execution and ask the user a structured question (e.g., "What is the API key for service X?"). The pipeline enters a `Blocked` state and resumes only when the user submits an answer via the `/resolve` endpoint.