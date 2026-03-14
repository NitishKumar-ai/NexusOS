# NexusOS Documentation Hub

Welcome to the NexusOS Wiki. This documentation provides a comprehensive guide to understanding, deploying, and operating the NexusOS Agent Pipeline.

## 🏁 Getting Started
- **[Overview](Architecture.md)**: Understand the high-level layers and component interactions.
- **[Installation Guide](../README.md#🚀-getting-started)**: Step-by-step setup for local development.

## 🛠️ Technical Deep Dives
- **[The P0-P8 Pipeline](Execution-Pipeline.md)**: A detailed look at the gated execution lifecycle and HITL approvals.
- **[Observability & Monitoring](Observability.md)**: Real-time tracking via WebSockets and audit log persistence.
- **[Security & Governance](Security.md)**: Protecting your environment with AgentShield and command gating.

## 🏗️ Repository Architecture
- **[Monorepo Structure](Monorepo-Structure.md)**: How the project is organized into pnpm workspaces.
- **[Product Requirements (PRD)](prd.md)**: The technical blueprint and strategic roadmap for NexusOS.

---

## 💡 Core Philosophy
> **"Agent does the work. You approve, unblock, and receive results."**

NexusOS is built on the belief that AI automation should be **predictable**, **observable**, and **safe**. By merging high-performance Rust orchestration with specialized agent harnesses, we provide a robust ecosystem for the next generation of autonomous development.
