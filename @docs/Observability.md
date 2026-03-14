# Observability & Real-time Monitoring

NexusOS is designed to be "phone-observable," prioritizing remote transparency over local terminal inspection. This document outlines the mechanisms for real-time telemetry, notifications, and persistence.

## 📡 Live Telemetry (WebSockets)

The NexusOS Traffic Controller exposes a high-frequency WebSocket endpoint (`/ws`) that streams the internal state of the P0-P8 pipeline.

### Broadcasted Event Types
| Event | Payload | Purpose |
|-------|---------|---------|
| `MissionLog` | `MissionID`, `Message`, `Timestamp` | General orchestration logs. |
| `AgentReasoning` | `MissionID`, `Thought` | The internal rationale behind agent decisions. |
| `FileTransformation` | `MissionID`, `FilePath`, `Action` | Real-time tracking of file edits. |
| `PhaseTransition` | `MissionID`, `Phase_From`, `Phase_To` | Tracking progress through the P0-P8 cycle. |
| `BlockerCreated` | `MissionID`, `Question`, `Context` | Signals that a HITL intervention is required. |

---

## 🔔 Cross-Channel Notifications

NexusOS leverages out-of-band communication channels to ensure developers are updated even when they are away from their workstation.

### Telegram Integration
Currently, the system uses the Telegram HTTP API to send critical mission updates:
- **Mission Initialization**: Notification when a task is successfully enqueued.
- **Phase 2 Complete**: A prompt to review and approve the generated implementation plan.
- **Blockers**: Instant alerts when an agent requires manual input or an API key.
- **Final Delivery**: High-level summary of work accomplished with a link to the dashboard.

---

## 🗄️ Persistence & Audit Log (SQLite)

Every granular event in the NexusOS ecosystem is persisted to a local SQLite database (`nexusos.db`). This enables powerful post-mortem analysis and observability features:

### Historical Mission API
- `GET /api/v1/missions`: Retrieves a historical list of all tasks, their timestamps, and final outcomes.
- `GET /api/v1/missions/:id/events`: Returns the complete chronological event stream for a specific mission, allowing the Dashboard's **Replay Mode** to reconstruct the agent's actions second-by-second.

### Audit Integrity
The audit log is append-only and immutable. It serves as the primary source of truth for compliance and troubleshooting, ensuring that every file edit and command execution is logged with sub-second precision.
