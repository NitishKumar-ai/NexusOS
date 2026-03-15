use serde_json::json;
use traffic_controller::models::{Task, MissionEvent};
use std::env;

pub struct ConnectorClient {
    client: reqwest::Client,
    base_url: String,
}

impl ConnectorClient {
    pub fn new() -> Self {
        let base_url = env::var("CONNECTOR_BRIDGE_URL")
            .unwrap_or_else(|_| "http://localhost:3002".to_string());
        
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }

    pub async fn save_mission(&self, task: &Task) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/connector/firebase/mission.save", self.base_url);
        
        // Convert Task to JSON-compatible map for mission.save
        let mission_data = json!({
            "id": task.id.to_string(),
            "instruction": task.instruction,
            "repo_url": task.repo_url,
            "phase": format!("{:?}", task.phase),
            "openclaw_session_id": task.openclaw_session_id,
        });

        let res = self.client.post(url)
            .json(&json!({ "mission": mission_data }))
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await?;
            println!("[Connector] Error saving mission: {}", err_text);
        }

        Ok(())
    }

    pub async fn log_event(&self, event: &MissionEvent) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/connector/firebase/event.log", self.base_url);

        let event_data = json!({
            "task_id": event.task_id.to_string(),
            "phase": format!("{:?}", event.phase),
            "message": event.message,
            "timestamp": event.timestamp,
        });

        let res = self.client.post(url)
            .json(&json!({ "event": event_data }))
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await?;
            println!("[Connector] Error logging event: {}", err_text);
        }

        Ok(())
    }
}
