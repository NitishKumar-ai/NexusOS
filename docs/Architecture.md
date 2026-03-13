# System Architecture

Agent Mission Control uses a multi-layered, event-driven architecture to connect remote communication channels with local or containerized agent execution environments.

## High-Level Components

```text
TRIGGER LAYER (Discord / WhatsApp / PWA / API)
        |
        v
ORCHESTRATION LAYER (AMC Gateway - Rust/Axum)
  Task Queue → Phase Runner (P0-P8) → Agent Dispatcher
        |
        v
AGENT EXECUTION LAYER (Everything-Claude-Code)
  Planner → Architect → Coder → TDD → Reviewer → Security
        |
        v
MCP CONNECTOR LAYER
  Linear | Firebase | Figma
        |
        v
DELIVERY LAYER (WebSocket + Telegram + Dashboard)
  Phone Notifications → Live Stream → Web Dashboard
```

## Component Breakdown

1.  **Traffic Controller (Gateway)**: Written in Rust (Axum/Tokio), this is the control plane. It handles incoming requests, orchestrates the P0-P8 execution pipeline, and broadcasts real-time events via WebSockets.
2.  **Agent Harness**: Built on Everything-Claude-Code (ECC). It defines the specialized roles (Planner, Architect, Coder) and provides the system prompts and CLI invocation logic.
3.  **MCP Connectors**: Microservices that provide standardized tool access to external platforms (Linear, Firebase, Figma) using the Model Context Protocol.
4.  **Dashboard**: A React/Next.js interface for visual orchestration, log replay, and manual intervention.