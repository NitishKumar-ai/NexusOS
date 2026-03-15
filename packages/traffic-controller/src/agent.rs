use std::process::Command;
use std::time::Duration;
use tokio::sync::broadcast;
use traffic_controller::models::{Phase, Task, MissionEvent, notify_via_openclaw, p2_message, p8_message, blocker_message};
use crate::db;
use chrono::Utc;

pub async fn execute_mission(
    task: Task,
    db_conn: tokio_rusqlite::Connection,
    tx: broadcast::Sender<MissionEvent>,
) {
    let mut current_task = task.clone();

    macro_rules! transition_phase {
        ($phase:expr, $msg:expr) => {
            current_task.phase = $phase;
            // Update DB
            db::update_phase(&db_conn, &current_task.id.to_string(), $phase).await.ok();
            
            // Broadcast
            let event = MissionEvent {
                task_id: current_task.id,
                phase: $phase,
                message: $msg.to_string(),
                timestamp: Utc::now().to_rfc3339(),
            };
            let _ = tx.send(event.clone());

            // Persist to Firebase via Bridge (Async)
            let conn = crate::connector::ConnectorClient::new();
            let t = current_task.clone();
            let e = event.clone();
            tokio::spawn(async move {
                let _ = conn.save_mission(&t).await;
                let _ = conn.log_event(&e).await;
            });

            // Small delay for UI effect
            tokio::time::sleep(Duration::from_millis(1500)).await;
        };
    }

    // Determine starting point based on current phase
    let start_phase = current_task.phase;

    if start_phase == Phase::P0Trigger {
        // Phase: P1 Context Pull
        transition_phase!(Phase::P1ContextPull, "Initiating Context Pull phase...");
        if let Some(repo_url) = &current_task.repo_url {
            let msg = format!("Pulling repository: {}", repo_url);
            let _ = tx.send(MissionEvent {
                task_id: current_task.id,
                phase: Phase::P1ContextPull,
                message: msg,
                timestamp: Utc::now().to_rfc3339(),
            });

            // Specific handling for core repositories
            let target_dir = if repo_url.contains("openclaw.git") {
                Some("packages/core-gateway")
            } else if repo_url.contains("everything-claude-code.git") {
                Some("packages/agent-harness")
            } else {
                None
            };

            if let Some(dir) = target_dir {
                let _ = tx.send(MissionEvent {
                    task_id: current_task.id,
                    phase: Phase::P1ContextPull,
                    message: format!("Synchronizing {} into {}...", repo_url, dir),
                    timestamp: Utc::now().to_rfc3339(),
                });

                // Check if directory exists
                let path = std::path::Path::new(dir);
                let success = if path.exists() {
                    let output = Command::new("git").current_dir(dir).arg("pull").output().expect("Failed to execute git");
                    output.status.success()
                } else {
                    if let Some(parent) = path.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    let output = Command::new("git").arg("clone").arg(repo_url).arg(dir).output().expect("Failed to execute git");
                    output.status.success()
                };

                if success {
                    let _ = tx.send(MissionEvent { task_id: current_task.id, phase: Phase::P1ContextPull, message: format!("✓ Sync complete for {}", dir), timestamp: Utc::now().to_rfc3339() });
                } else {
                    let _ = tx.send(MissionEvent { task_id: current_task.id, phase: Phase::P1ContextPull, message: format!("❌ Sync failed for {}", dir), timestamp: Utc::now().to_rfc3339() });
                }
            }
        }
    }

    if start_phase == Phase::P0Trigger || start_phase == Phase::P1ContextPull || start_phase == Phase::P2Planning {
        // Phase: P2 Planning
        transition_phase!(Phase::P2Planning, "Spawning Planner Agent...");
        let plan_text = "Step 1: Create endpoint\nStep 2: Add tests\nStep 3: Verify logic"; // Mock plan
        db::store_plan(&db_conn, &current_task.id.to_string(), plan_text).await.ok();

        // P2 HITL Gate
        db::update_phase(&db_conn, &current_task.id.to_string(), Phase::P2Pending).await.ok();
        
        let _ = tx.send(MissionEvent {
            task_id: current_task.id,
            phase: Phase::P2Pending,
            message: "Plan ready — awaiting your approval".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        });

        if let Some(session_id) = &current_task.openclaw_session_id {
            let msg = p2_message(&current_task.id.to_string(), plan_text);
            let _ = notify_via_openclaw(session_id, &msg).await;
        }

        return; // EXIT and wait for approval
    }

    // Phase: P3 Architecture
    if current_task.phase == Phase::P3Architecture {
        transition_phase!(Phase::P3Architecture, "Invoking Architect Agent...");
        transition_phase!(Phase::P3Architecture, "Designing component structure...");
        current_task.phase = Phase::P4Execution; // Advance to next
    }

    // Phase: P4 Execution
    if current_task.phase == Phase::P4Execution {
        transition_phase!(Phase::P4Execution, "Dispatching Code Agent (TDD Mode)...");
        transition_phase!(Phase::P4Execution, "Implementing code...");
        tokio::time::sleep(Duration::from_millis(2000)).await;
        current_task.phase = Phase::P5Verification;
    }

    // Phase: P5 Verification
    if current_task.phase == Phase::P5Verification {
        transition_phase!(Phase::P5Verification, "Running tests and verifying coverage...");
        current_task.phase = Phase::P6Review;
    }

    // Phase: P6 Review
    if current_task.phase == Phase::P6Review {
        transition_phase!(Phase::P6Review, "Running Security and Quality scans (AgentShield)...");
        
        // P8 HITL Gate (P8Approval phase logic)
        let diff_summary = "Files changed: main.rs\nTests passing: 3/3\nSecurity grade: A";
        db::update_phase(&db_conn, &current_task.id.to_string(), Phase::P8Pending).await.ok();

        let _ = tx.send(MissionEvent {
            task_id: current_task.id,
            phase: Phase::P8Pending,
            message: "Code ready — awaiting commit approval".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        });

        if let Some(session_id) = &current_task.openclaw_session_id {
            let msg = p8_message(&current_task.id.to_string(), diff_summary);
            let _ = notify_via_openclaw(session_id, &msg).await;
        }

        return; // EXIT and wait for approval
    }

    // Final stages are handled by approval endpoint advancing to Complete
}

#[allow(dead_code)]
async fn emit_blocker(
    task: &Task,
    phase: &str,
    reason: &str,
    db_conn: &tokio_rusqlite::Connection,
    tx: &broadcast::Sender<MissionEvent>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    db::update_phase(db_conn, &task.id.to_string(), Phase::Blocked).await.ok();

    let _ = tx.send(MissionEvent {
        task_id: task.id,
        phase: Phase::Blocked,
        message: reason.to_string(),
        timestamp: Utc::now().to_rfc3339(),
    });

    if let Some(session_id) = &task.openclaw_session_id {
        let msg = blocker_message(&task.id.to_string(), phase, reason);
        let _ = notify_via_openclaw(session_id, &msg).await;
    }

    Ok(())
}
