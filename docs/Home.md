# Agent Mission Control (AMC) Wiki

Welcome to the official documentation for Agent Mission Control (Codename: AMC). AMC is an open-source, developer-first platform that provides a centralized remote control for all your AI agents running inside your SDK. 

Think of it as **Vercel for AI agents** — deploy, monitor, control, and secure them from anywhere using everyday apps like Discord and WhatsApp.

## Quick Links
- [Architecture Overview](Architecture.md)
- [Monorepo Structure](Monorepo-Structure.md)
- [Agent Execution Pipeline (P0-P8)](Execution-Pipeline.md)
- [Observability & Audit Log](Observability.md)
- [Security (AgentShield)](Security.md)

## Core Philosophy
**Agent does the work. You approve, unblock, and receive results.**

AMC is built by merging two battle-tested open-source foundations:
1.  **OpenClaw**: Provides the multi-channel gateway (Discord/WhatsApp), agent routing, and tools platform.
2.  **Everything-Claude-Code (ECC)**: Provides the specialized agent harness, memory/skills, and the AgentShield security rules.