# Observability & Audit Log

AMC is designed to be "phone-observable," meaning you can monitor complex agent workflows entirely remotely without needing a laptop open.

## 1. Live Stream (WebSockets)
The `traffic-controller` broadcasts every pipeline event in real-time via `ws://<host>/ws`.
*   **Events tracked:** `Log`, `PhaseTransition`, `Reasoning`, `FileAction`, `Blocker`, `Resolution`.
*   The Next.js Dashboard consumes this stream to provide a live view of the agent's "thoughts" and file edits.

## 2. Push Notifications
Critical state changes are pushed directly to the developer. Currently implemented via a direct **Telegram HTTP API** integration.
*   "Task Accepted"
*   "Plan Generated (Awaiting Approval)"
*   "Blocker: Missing Database URL"
*   "Final Output Ready"

## 3. SQLite Audit Log
Every task and every granular event is persisted to a local `sqlite` database (`mission_control.db`).
*   **Task History:** `GET /api/v1/tasks` returns all historical tasks and their final status.
*   **Replay Mode:** `GET /api/v1/tasks/:id/events` allows the dashboard to reconstruct exactly what the agent did, second-by-second, for post-mortem analysis.