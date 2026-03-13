# Security & AgentShield

Given that agents are executing code and running shell commands, security is a primary focus of AMC.

## Human-in-the-Loop (HITL)
By default, the pipeline enforces hard stops at:
1.  **P2 (Planning):** You must approve the implementation plan before any code is written.
2.  **P8 (Delivery):** You must approve the final diff before it is pushed to the repository or deployed.

## AgentShield (ECC Integration)
*Pending active integration in Week 3/4.*
The system leverages the Everything-Claude-Code AgentShield ruleset (102 rules).
*   **Restricted Filesystem:** Agents are sandboxed to the temporary workspace directory.
*   **Command Gating:** `sudo`, `rm -rf`, and network exfiltration commands are explicitly blocked.
*   **Secret Management:** Secrets are injected via the MCP layer; they are never stored in the agent's memory or printed to the logs.