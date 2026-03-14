# NexusOS Traffic Controller (Orchestration Gateway)

The **Traffic Controller** is the high-performance orchestration layer of NexusOS. Built with **Rust**, **Axum**, and **Tokio**, it serves as the single source of truth for task management, pipeline execution, and mission observability.

## 🚀 Features

- **P0-P8 Phase Runner**: A robust state machine that drives agents through the complete development lifecycle.
- **Real-time Telemetry**: High-frequency WebSocket broadcaster for mission logs, agent thoughts, and file edits.
- **Mission Persistence**: Append-only SQLite audit log for historical mission replay and compliance.
- **Channel Integration**: Built-in support for Telegram notifications and human-in-the-loop approval gates.
- **Git Integration**: Native management of repository context via `git2-rs`.

---

## 🏗️ Technical Stack

- **Framework**: [Axum](https://github.com/tokio-rs/axum) for high-concurrency routing.
- **Runtime**: [Tokio](https://tokio.rs/) for asynchronous I/O.
- **Persistence**: [SQLite](https://www.sqlite.org/) with `sqlx` for lightweight, embedded audit logs.
- **Broadcasting**: Real-time events delivered via WebSockets and direct HTTP notifications.

---

## 🛠️ API Reference (v1)

### Missions
- `POST /api/v1/run`: Trigger a new mission from a description.
- `GET /api/v1/missions`: List historical and active missions.
- `POST /api/v1/resolve`: Resolve a HITL blocker (approval or input).

### Observability
- `WS /ws`: Real-time mission event stream.
- `GET /api/v1/missions/:id/events`: Retrieve full event stream for replay.

---

## 🚀 Quick Start (Development)

```bash
# Provide environment variables (Telegram Bot Token, etc.)
cp .env.example .env

# Run the gateway
cargo run
```

---

© 2026 NexusOS Team. The heart of agent operations.
