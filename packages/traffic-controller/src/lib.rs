pub mod models {
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;
    use reqwest::Client;
    use std::env;

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct Task {
        pub id: Uuid,
        pub instruction: String,
        pub repo_url: Option<String>,
        pub phase: Phase,
        
        // OpenClaw session tracking
        pub openclaw_session_id: Option<String>,
        pub openclaw_channel: Option<String>,
        pub source_user_id: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
    pub enum Phase {
        P0Trigger,
        P1ContextPull,
        P2Planning,
        P2Pending,        // Waiting for developer approval at P2
        P3Architecture,
        P4Execution,
        P5Verification,
        P6Review,
        P7Delivery,
        P8Approval,
        P8Pending,        // Waiting for developer approval at P8
        Complete,
        Rejected,
        Failed,
        Blocked,         // When agent hits ambiguity
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct MissionEvent {
        pub task_id: Uuid,
        pub phase: Phase,
        pub message: String,
        pub timestamp: String,
    }

    /// Send a message back through OpenClaw to the developer.
    pub async fn notify_via_openclaw(
        session_id: &str,
        message: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let gateway = env::var("OPENCLAW_GATEWAY_URL")
            .unwrap_or_else(|_| "http://localhost:18789".to_string());

        let client = Client::new();
        let token = env::var("OPENCLAW_TOKEN").unwrap_or_default();

        let mut req = client
            .post(format!("{}/api/v1/sessions/{}/message", gateway, session_id))
            .header("Content-Type", "application/json");

        if !token.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", token));
        }

        let res = req
            .json(&serde_json::json!({
                "content": message,
                "metadata": {
                    "source": "nexusos",
                    "nexusos_event": true
                }
            }))
            .send()
            .await;

        match res {
            Ok(r) if r.status().is_success() => {
                println!("[OpenClaw] Notification sent to session {}", &session_id[..8]);
                Ok(())
            }
            Ok(r) => {
                println!("[OpenClaw] Warning: session {} returned {}", &session_id[..8], r.status());
                Ok(()) 
            }
            Err(e) => {
                println!("[OpenClaw] Warning: could not reach gateway — {}", e);
                Ok(())
            }
        }
    }

    pub fn p2_message(task_id: &str, plan: &str) -> String {
        format!(
            "🟠 **P2 — Plan ready for approval**\nMission: `{}`\n\n{}\n\nReply:\n`/approve {}` → proceed to implementation\n`/reject {}` → cancel mission\n`/feedback {} \"notes\"` → revise plan",
            &task_id[..8], plan, task_id, task_id, task_id
        )
    }

    pub fn p8_message(task_id: &str, summary: &str) -> String {
        format!(
            "✅ **P8 — Ready to commit**\nMission: `{}`\n\n{}\n\nReply:\n`/approve {}` → commit and push\n`/reject {}` → discard changes",
            &task_id[..8], summary, task_id, task_id
        )
    }

    pub fn blocker_message(task_id: &str, phase: &str, reason: &str) -> String {
        format!(
            "🔴 **Blocked at {}**\nMission: `{}`\nReason: {}\n\nFix the issue, then reply `/resume {}`",
            phase, &task_id[..8], reason, task_id
        )
    }

    pub fn phase_message(task_id: &str, phase: &str, detail: &str) -> String {
        format!(
            "📡 **{}** — `{}`\n{}",
            phase, &task_id[..8], detail
        )
    }
}
