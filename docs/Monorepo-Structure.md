# Monorepo Structure

AMC uses a unified monorepo managed by `pnpm` workspaces to ensure tight integration between the gateway, the agents, and the frontend.

```text
agent-mission-control/
├── packages/
│   ├── traffic-controller/    # The Rust/Axum orchestration gateway (formerly OpenClaw core)
│   ├── agent-harness/         # The agent definitions and CLI wrappers (Everything-Claude-Code)
│   ├── sdk-bridge/            # Adapter for plugging in custom external SDKs
│   └── connectors/            # MCP implementations for Linear, Firebase, Figma
├── dashboard/                 # Next.js 14 Web UI for observability and control
├── docs/                      # This wiki documentation
├── docker-compose.yml         # Local orchestration of gateway, postgres, and redis
├── package.json               # Root workspace configuration
└── prd.md                     # The definitive Product Requirements Document
```

## Key Architectural Decision: Direct Merge
Instead of using git submodules, the source code from `OpenClaw` and `Everything-Claude-Code` has been pulled directly into `traffic-controller` and `agent-harness`. This prioritizes developer velocity, simplified CI/CD, and tight internal integration over easy upstream updates.