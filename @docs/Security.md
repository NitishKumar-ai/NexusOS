# Security & Governance (AgentShield)

Operating autonomous agents requires a robust security framework. NexusOS implements a "Defense in Depth" strategy through the **AgentShield** governance model, ensuring that agent actions are safe, observable, and revocable.

## 🛡️ The Three Pillars of AgentShield

### 1. Hardened Command Gating
The Agent Harness intercepts all shell command requests before execution.
- **Blocked Commands**: Explicit denial of `rm -rf /`, `sudo`, `curl` (outbound data exfiltration), and credential harvesting tools.
- **Whitelist Operations**: Only a subset of safe, project-scoped commands are permitted by default.
- **Runtime Interception**: If an agent attempts an unauthorized command, the operation is blocked, and an alert is sent to the developer for immediate review.

### 2. Filesystem & Network Isolation
Agents are "jailed" to the workspace directory.
- **Sandbox Boundary**: The agent session cannot traverse outside the target repository (e.g., `cd ..` is ineffective).
- **Environment Isolation**: The agent's shell environment is sanitized. Sensitive host environment variables are stripped, and only project-specific secrets are injected via the secure Traffic Controller layer.

### 3. Human-in-the-Loop (HITL) Governance
NexusOS enforces mandatory human verification at critical decision points:
- **Plan Approval (P2)**: No code is written until the developer approves the high-level plan.
- **Blocker Resolution**: Agents cannot make "best guess" decisions on sensitive inputs (like API keys); they must ask the user.
- **Final Sync (P8)**: Changes are never pushed to the remote repository without explicit human approval of the final diff.

---

## 🔑 Secret Management

NexusOS implements a "Zero-Trust" secret model:
- **Masking**: Secrets are masked in all logs and WebSocket streams.
- **MCP Delivery**: Tool-specific credentials (e.g., Linear tokens) are brokered by the MCP Connector layer and never exposed directly to the core agent logic.
- **Temporary Injection**: Secrets are only injected into the agent subprocess's environment at runtime and disappear with the session.

---

## 🚫 Vulnerability Scanning (Phase 6)
During the **Review Phase (P6)**, a specialized Security Agent scans the newly written code for:
- Hardcoded secrets and tokens.
- SQL injection and XSS patterns.
- Dependency vulnerabilities in newly added packages.
