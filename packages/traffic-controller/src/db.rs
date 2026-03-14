use rusqlite::params;
use tokio_rusqlite::Connection;
use traffic_controller::models::{Task, Phase};
use uuid::Uuid;

pub async fn init_db() -> Connection {
    let conn = Connection::open("nexusos.db").await.expect("Failed to open database");
    
    conn.call(|conn| {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                instruction TEXT NOT NULL,
                repo_url TEXT,
                phase TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        Ok(())
    })
    .await
    .expect("Failed to create table");

    conn
}

pub async fn save_task(conn: &Connection, task: &Task) {
    let task = task.clone();
    conn.call(move |conn| {
        conn.execute(
            "INSERT INTO tasks (id, instruction, repo_url, phase, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                task.id.to_string(),
                task.instruction,
                task.repo_url,
                serde_json::to_string(&task.phase).unwrap().replace("\"", ""),
                chrono::Utc::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    })
    .await
    .expect("Failed to save task");
}

pub async fn get_all_tasks(conn: &Connection) -> Vec<Task> {
    conn.call(|conn| {
        let mut stmt = conn.prepare("SELECT id, instruction, repo_url, phase FROM tasks ORDER BY created_at DESC")?;
        let task_iter = stmt.query_map([], |row| {
            let phase_str: String = row.get(3)?;
            // Simple deserialization for phase
            let phase = match phase_str.as_str() {
                "P0Trigger" => Phase::P0Trigger,
                "P1ContextPull" => Phase::P1ContextPull,
                "P2Planning" => Phase::P2Planning,
                "P3Architecture" => Phase::P3Architecture,
                "P4Execution" => Phase::P4Execution,
                "P5Verification" => Phase::P5Verification,
                "P6Review" => Phase::P6Review,
                "P7Delivery" => Phase::P7Delivery,
                "P8Approval" => Phase::P8Approval,
                _ => Phase::P0Trigger,
            };

            Ok(Task {
                id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
                instruction: row.get(1)?,
                repo_url: row.get(2)?,
                phase,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    })
    .await
    .expect("Failed to fetch tasks")
}
