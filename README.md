# NexusOS Agent Pipeline

NexusOS is a systematic, event-driven **Agent Mission Control** system that lets a developer (or small team) remotely command, monitor, and orchestrate AI agents. The system autonomously pulls code from GitHub, executes tasks through a defined P0-P8 pipeline, and delivers outputs directly to your phone (Telegram/PWA) and web dashboard.

---

## 📁 Project Structure

This project is organized as a **pnpm monorepo** for tight integration between the gateway, agent logic, and frontend.

```text
nexusos/
├── dashboard/                 # Next.js 14 Web UI (Perplexity-inspired)
├── docs/                      # Comprehensive Wiki & Documentation
├── packages/
│   ├── traffic-controller/    # Rust (Axum/Tokio) Gateway & Orchestration Layer
│   │   ├── src/agent.rs       # Agent invocation logic (Claude CLI bridge)
│   │   ├── src/lib.rs         # Shared models & Git/Notification logic
│   │   └── src/main.rs        # API Endpoints, WebSockets, & Phase Runner
│   ├── agent-harness/         # Everything-Claude-Code (ECC) Agent Logic
│   │   ├── agents/            # Specialized agent definitions (Planner, Architect, etc.)
│   │   ├── skills/            # Reusable agent skills
│   │   └── scripts/           # CLI wrappers & session management
│   ├── sdk-bridge/            # Adapter for external SDK integration
│   └── connectors/            # MCP Connectors (Linear, Firebase, Figma)
├── docker-compose.yml         # Local infrastructure (Postgres, Redis)
├── package.json               # Root workspace configuration
└── prd.md                     # Detailed Product Requirements Document
```

### Key Components

- **`traffic-controller`**: The heart of the system. Written in Rust for high performance and safety. It manages the P0-P8 state machine, SQLite audit logs, and real-time WebSocket broadcasting.
- **`agent-harness`**: Powered by Everything-Claude-Code. It contains the instructions and logic for specialized AI agents that act as your digital workers.
- **`dashboard`**: The visual control plane. Allows you to monitor live streams, resolve blockers, and view task history.

---

## 🚀 Getting Started

### Prerequisites

- **Rust**: Latest stable version installed.
- **Node.js**: v18 or higher.
- **pnpm**: `npm install -g pnpm`
- **Claude CLI**: `npm install -g @anthropic-ai/claude-code` (and run `/login`)
- **SQLite**: For the audit log.

### Environment Setup

1. Copy the example environment file in the gateway:
   ```bash
   cp packages/traffic-controller/.env.example packages/traffic-controller/.env
   ```
2. Edit `.env` and provide your **Telegram Bot Token** and **Chat ID** for phone notifications.

---

## 🛠️ Running the Application

### 1. Start the Infrastructure
Use Docker to spin up any required services (Postgres/Redis if configured):
```bash
docker-compose up -d
```

### 2. Start the Traffic Controller (Gateway)
Navigate to the package and run the Rust server:
```bash
cd packages/traffic-controller
cargo run
```
The server will start on `http://127.0.0.1:3000`.

### 3. Start the Dashboard
(Work in Progress - Week 4)
```bash
cd dashboard
pnpm dev
```

### 4. Trigger a Task
You can trigger the pipeline manually via `curl` to test the P0-P2 flow:
```bash
curl -X POST http://127.0.0.1:3000/api/v1/agents/coder/run \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Add a health check to the server",
    "repo_url": "https://github.com/rust-lang/rust-installer.git"
  }'
```

### 5. Monitor Live Stream
Connect to the WebSocket to see real-time agent reasoning:
```bash
# Using the provided test script
node test_ws.js
```

---

## 📖 Documentation

For in-depth details on the architecture, execution pipeline, and security model, please refer to the **[Code Wiki](./docs/Home.md)** or the **[Full PRD](./prd.md)**.

## 🏆 Current Roadmap (v2.0)
- **Week 1-2**: Foundation & Pipeline Phases (✅ Complete)
- **Week 3**: Delivery & Observability (✅ Complete)
- **Week 4**: Web Dashboard & SDK Bridge (🔄 In Progress)
- **Week 5**: Intelligence & Sub-Agents
- **Week 6**: Polish & Deploy
