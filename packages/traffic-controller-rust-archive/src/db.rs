// packages/traffic-controller/src/db.rs
// Cloudflare D1 integration using REST API

use reqwest::Client;
use std::env;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use traffic_controller::models::{Task, Phase};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct D1Query {
    pub sql: String,
    pub params: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct D1Response {
    pub result: Vec<D1Result>,
    pub success: bool,
}

#[derive(Debug, Deserialize)]
pub struct D1Result {
    pub results: Option<Vec<serde_json::Value>>,
    pub success: bool,
}

pub struct D1Client {
    account_id: String,
    database_id: String,
    api_token: String,
    client: Client,
}

impl D1Client {
    pub fn new() -> Self {
        Self {
            account_id: env::var("CF_ACCOUNT_ID").expect("CF_ACCOUNT_ID required"),
            database_id: env::var("CF_D1_DATABASE_ID").expect("CF_D1_DATABASE_ID required"),
            api_token: env::var("CF_API_TOKEN").expect("CF_API_TOKEN required"),
            client: Client::new(),
        }
    }

    pub async fn query(&self, sql: &str, params: Vec<serde_json::Value>) 
        -> Result<Option<Vec<serde_json::Value>>, Box<dyn std::error::Error + Send + Sync>> 
    {
        let url = format!(
            "https://api.cloudflare.com/client/v4/accounts/{}/d1/database/{}/query",
            self.account_id, self.database_id
        );

        let res = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_token))
            .header("Content-Type", "application/json")
            .json(&D1Query {
                sql: sql.to_string(),
                params,
            })
            .send()
            .await?;

        let body: D1Response = res.json().await?;
        if !body.success || body.result.is_empty() {
            return Err("D1 query failed".into());
        }

        Ok(body.result[0].results.clone())
    }
}

pub type Connection = Arc<D1Client>;

pub async fn init_db() -> Connection {
    Arc::new(D1Client::new())
}

pub async fn save_task(db: &Connection, task: &Task) {
    db.query(
        "INSERT INTO missions (id, instruction, repo_url, phase, status, openclaw_session_id, openclaw_channel, source_user_id, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET 
            phase=excluded.phase,
            openclaw_session_id=excluded.openclaw_session_id,
            openclaw_channel=excluded.openclaw_channel,
            source_user_id=excluded.source_user_id,
            updated_at=datetime('now')",
        vec![
            serde_json::json!(task.id.to_string()),
            serde_json::json!(task.instruction),
            serde_json::json!(task.repo_url),
            serde_json::json!(format!("{:?}", task.phase)),
            serde_json::json!("ACTIVE"),
            serde_json::json!(task.openclaw_session_id),
            serde_json::json!(task.openclaw_channel),
            serde_json::json!(task.source_user_id),
        ],
    ).await.expect("Failed to save task to D1");
}

pub async fn get_task(db: &Connection, id: &str) -> Result<Task, Box<dyn std::error::Error + Send + Sync>> {
    let results = db.query(
        "SELECT id, instruction, repo_url, phase, openclaw_session_id, openclaw_channel, source_user_id FROM missions WHERE id = ?1",
        vec![serde_json::json!(id)]
    ).await?;

    if let Some(rows) = results {
        if let Some(row) = rows.get(0) {
            let phase_str = row.get("phase").and_then(|v| v.as_str()).unwrap_or("P0Trigger");
            let phase: Phase = serde_json::from_str(&format!("\"{}\"", phase_str)).unwrap_or(Phase::P0Trigger);

            return Ok(Task {
                id: Uuid::parse_str(row.get("id").and_then(|v| v.as_str()).unwrap())?,
                instruction: row.get("instruction").and_then(|v| v.as_str()).unwrap().to_string(),
                repo_url: row.get("repo_url").and_then(|v| v.as_str().map(|s| s.to_string())),
                phase,
                openclaw_session_id: row.get("openclaw_session_id").and_then(|v| v.as_str().map(|s| s.to_string())),
                openclaw_channel: row.get("openclaw_channel").and_then(|v| v.as_str().map(|s| s.to_string())),
                source_user_id: row.get("source_user_id").and_then(|v| v.as_str().map(|s| s.to_string())),
            });
        }
    }

    Err("Task not found".into())
}

pub async fn update_phase(db: &Connection, id: &str, phase: Phase) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let phase_str = format!("{:?}", phase);
    db.query(
        "UPDATE missions SET phase = ?1, updated_at = datetime('now') WHERE id = ?2",
        vec![serde_json::json!(phase_str), serde_json::json!(id)],
    ).await?;
    Ok(())
}

pub async fn store_plan(db: &Connection, id: &str, plan: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    db.query(
        "INSERT INTO mission_plans (id, task_id, plan_text) VALUES (?1, ?2, ?3)",
        vec![
            serde_json::json!(Uuid::new_v4().to_string()),
            serde_json::json!(id),
            serde_json::json!(plan),
        ],
    ).await?;
    Ok(())
}

pub async fn store_feedback(db: &Connection, id: &str, feedback: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    db.query(
        "UPDATE mission_plans SET feedback = ?1 WHERE task_id = ?2",
        vec![serde_json::json!(feedback), serde_json::json!(id)],
    ).await?;
    Ok(())
}

pub async fn get_all_tasks(db: &Connection) -> Vec<Task> {
    let results = db.query(
        "SELECT id, instruction, repo_url, phase, openclaw_session_id, openclaw_channel, source_user_id FROM missions ORDER BY created_at DESC",
        vec![]
    ).await.unwrap_or_default();

    let mut tasks = Vec::new();
    if let Some(rows) = results {
        for row in rows {
            let phase_str = row.get("phase").and_then(|v| v.as_str()).unwrap_or("P0Trigger");
            let phase: Phase = serde_json::from_str(&format!("\"{}\"", phase_str)).unwrap_or(Phase::P0Trigger);

            tasks.push(Task {
                id: Uuid::parse_str(row.get("id").and_then(|v| v.as_str()).unwrap()).unwrap(),
                instruction: row.get("instruction").and_then(|v| v.as_str()).unwrap().to_string(),
                repo_url: row.get("repo_url").and_then(|v| v.as_str().map(|s| s.to_string())),
                phase,
                openclaw_session_id: row.get("openclaw_session_id").and_then(|v| v.as_str().map(|s| s.to_string())),
                openclaw_channel: row.get("openclaw_channel").and_then(|v| v.as_str().map(|s| s.to_string())),
                source_user_id: row.get("source_user_id").and_then(|v| v.as_str().map(|s| s.to_string())),
            });
        }
    }
    tasks
}
