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
                openclaw_session_id TEXT,
                openclaw_channel TEXT,
                source_user_id TEXT,
                plan TEXT,
                feedback TEXT,
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
            "INSERT INTO tasks (id, instruction, repo_url, phase, openclaw_session_id, openclaw_channel, source_user_id, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET 
                phase=excluded.phase,
                openclaw_session_id=excluded.openclaw_session_id,
                openclaw_channel=excluded.openclaw_channel,
                source_user_id=excluded.source_user_id",
            params![
                task.id.to_string(),
                task.instruction,
                task.repo_url,
                serde_json::to_string(&task.phase).unwrap().replace("\"", ""),
                task.openclaw_session_id,
                task.openclaw_channel,
                task.source_user_id,
                chrono::Utc::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    })
    .await
    .expect("Failed to save task");
}

pub async fn get_task(conn: &Connection, id: &str) -> Result<Task, tokio_rusqlite::Error> {
    let id_str = id.to_string();
    conn.call(move |conn| {
        let mut stmt = conn.prepare("SELECT id, instruction, repo_url, phase, openclaw_session_id, openclaw_channel, source_user_id FROM tasks WHERE id = ?1")?;
        let task = stmt.query_row(params![id_str], |row| {
            let phase_str: String = row.get(3)?;
            let phase: Phase = serde_json::from_str(&format!("\"{}\"", phase_str)).unwrap_or(Phase::P0Trigger);

            Ok(Task {
                id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
                instruction: row.get(1)?,
                repo_url: row.get(2)?,
                phase,
                openclaw_session_id: row.get(4)?,
                openclaw_channel: row.get(5)?,
                source_user_id: row.get(6)?,
            })
        })?;
        Ok(task)
    })
    .await
}

pub async fn update_phase(conn: &Connection, id: &str, phase: Phase) -> Result<(), tokio_rusqlite::Error> {
    let id_str = id.to_string();
    let phase_str = serde_json::to_string(&phase).unwrap().replace("\"", "");
    conn.call(move |conn| {
        conn.execute(
            "UPDATE tasks SET phase = ?1 WHERE id = ?2",
            params![phase_str, id_str],
        )?;
        Ok(())
    })
    .await
}

pub async fn store_plan(conn: &Connection, id: &str, plan: &str) -> Result<(), tokio_rusqlite::Error> {
    let id_str = id.to_string();
    let plan_str = plan.to_string();
    conn.call(move |conn| {
        conn.execute(
            "UPDATE tasks SET plan = ?1 WHERE id = ?2",
            params![plan_str, id_str],
        )?;
        Ok(())
    })
    .await
}

pub async fn store_feedback(conn: &Connection, id: &str, feedback: &str) -> Result<(), tokio_rusqlite::Error> {
    let id_str = id.to_string();
    let feedback_str = feedback.to_string();
    conn.call(move |conn| {
        conn.execute(
            "UPDATE tasks SET feedback = ?1 WHERE id = ?2",
            params![feedback_str, id_str],
        )?;
        Ok(())
    })
    .await
}

pub async fn get_all_tasks(conn: &Connection) -> Vec<Task> {
    conn.call(|conn| {
        let mut stmt = conn.prepare("SELECT id, instruction, repo_url, phase, openclaw_session_id, openclaw_channel, source_user_id FROM tasks ORDER BY created_at DESC")?;
        let task_iter = stmt.query_map([], |row| {
            let phase_str: String = row.get(3)?;
            let phase: Phase = serde_json::from_str(&format!("\"{}\"", phase_str)).unwrap_or(Phase::P0Trigger);

            Ok(Task {
                id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
                instruction: row.get(1)?,
                repo_url: row.get(2)?,
                phase,
                openclaw_session_id: row.get(4)?,
                openclaw_channel: row.get(5)?,
                source_user_id: row.get(6)?,
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
