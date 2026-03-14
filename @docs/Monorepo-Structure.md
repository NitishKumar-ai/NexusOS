# NexusOS Monorepo Structure

NexusOS utilizes a **pnpm-based monorepo** architecture. This structure ensures a unified development experience, shared type safety, and optimized build cycles across the entire agent lifecycle.

## 📁 Workspace Map

```text
nexusos/
├── docs/                      # Centralized documentation and PRD
├── packages/                  # Workspace components
│   ├── traffic-controller/    # Rust (Axum) Orchestration Gateway
│   ├── agent-harness/         # Core AI Agent definitions and skills
│   ├── sdk-bridge/            # Integration layer for external engines
│   └── connectors/            # MCP-compliant tool servers
├── dashboard/                 # Next.js 14 real-time control plane
├── docker-compose.yml         # Shared infrastructure (Redis, Postgres, etc.)
└── package.json               # Root workspace manifest
```

---

## 🛠️ Package Deep Dive

### 1. `traffic-controller` (Rust)
The "Heart" of the system.
- Manages the **P0-P8 Runner**.
- Handles **WebSocket** broadcasting to the Dashboard.
- Orchestrates **git operations** for context pulling and syncing.

### 2. `agent-harness` (Node.js/Python)
The "Brain" of the system.
- Contains the **System Prompts** for specialized roles.
- Implements **Skill Collections** (TDD, Security, Planning).
- Enforces **AgentShield** security policies.

### 3. `dashboard` (Next.js)
The "Face" of the system.
- Provides a **Perplexity-inspired** command center.
- Displays **Live Streams** of agent reasoning and file transformations.

---

## 🔗 Internal Integration Pattern

NexusOS components communicate through a combination of **REST APIs** for command/control and **WebSockets** for real-time telemetry. The `traffic-controller` acts as the single source of truth for the mission state, while the `agent-harness` is invoked as a subprocess with a strictly defined environment.
