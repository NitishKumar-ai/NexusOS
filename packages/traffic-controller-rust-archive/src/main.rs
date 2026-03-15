use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::trace::TraceLayer;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;
use traffic_controller::models::{Phase, Task, MissionEvent};
use futures_util::{SinkExt, StreamExt};

mod agent;
mod db;
mod connector;

struct AppState {
    db: db::Connection,
    tx: broadcast::Sender<MissionEvent>,
}

#[derive(serde::Deserialize)]
struct RunRequest {
    instruction: String,
    repo_url: Option<String>,
    metadata: Option<RunMetadata>,
}

#[derive(serde::Deserialize)]
struct RunMetadata {
    openclaw_session: Option<String>,
    source_channel: Option<String>,
    user_id: Option<String>,
}

#[derive(serde::Deserialize)]
struct ApprovalBody {
    note: Option<String>,
}

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "traffic_controller=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize Database
    let db = db::init_db().await;
    
    // Initialize Broadcast Channel
    let (tx, _rx) = broadcast::channel(100);

    let state = Arc::new(AppState { db, tx });

    // Define routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ws", get(ws_handler))
        .route("/api/v1/agents/coder/run", post(run_agent))
        .route("/api/v1/missions", get(list_missions))
        .route("/api/v1/missions/:id/approve", post(approve_mission))
        .route("/api/v1/missions/:id/reject", post(reject_mission))
        .route("/api/v1/missions/:id/feedback", post(feedback_mission))
        .route("/api/v1/missions/:id", get(get_mission))
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Starting NexusOS Gateway on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "NexusOS Gateway Active"
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, _receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    while let Ok(event) = rx.recv().await {
        let msg = serde_json::to_string(&event).unwrap();
        if sender.send(Message::Text(msg)).await.is_err() {
            break;
        }
    }
}

async fn run_agent(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RunRequest>,
) -> impl IntoResponse {
    let task = Task {
        id: Uuid::new_v4(),
        instruction: payload.instruction,
        repo_url: payload.repo_url,
        phase: Phase::P0Trigger,
        openclaw_session_id: payload.metadata.as_ref().and_then(|m| m.openclaw_session.clone()),
        openclaw_channel: payload.metadata.as_ref().and_then(|m| m.source_channel.clone()),
        source_user_id: payload.metadata.as_ref().and_then(|m| m.user_id.clone()),
    };

    // Save to DB (Initial State)
    db::save_task(&state.db, &task).await;

    // Broadcast Initial Event
    let event = MissionEvent {
        task_id: task.id,
        phase: Phase::P0Trigger,
        message: format!("Task received: {}", task.instruction),
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    let _ = state.tx.send(event);

    tracing::info!("Starting background mission: {}", task.id);
    let bg_tx = state.tx.clone();
    let bg_task = task.clone();
    tokio::spawn(async move {
        tracing::info!("Background task started for {}", bg_task.id);
        let bg_db = db::init_db().await;
        agent::execute_mission(bg_task, bg_db, bg_tx).await;
        tracing::info!("Background task finished");
    });

    Json(serde_json::json!({
        "status": "accepted",
        "task_id": task.id,
        "message": "Task queued for processing (P0 Trigger)"
    }))
}

async fn list_missions(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let tasks = db::get_all_tasks(&state.db).await;
    Json(tasks)
}

async fn approve_mission(
    axum::extract::Path(id): axum::extract::Path<String>,
    State(state): State<Arc<AppState>>,
    Json(_body): Json<ApprovalBody>,
) -> impl IntoResponse {
    let task = match db::get_task(&state.db, &id).await {
        Ok(t) => t,
        Err(_) => return Json(serde_json::json!({ "error": "Mission not found" })),
    };

    match task.phase {
        Phase::P2Pending => {
            db::update_phase(&state.db, &id, Phase::P3Architecture).await.ok();

            let event = MissionEvent {
                task_id: task.id,
                phase: Phase::P3Architecture,
                message: "Plan approved — starting implementation".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            };
            let _ = state.tx.send(event);

            if let Some(session_id) = &task.openclaw_session_id {
                let msg = traffic_controller::models::phase_message(&id, "P3 Architecture", "Plan approved. Starting implementation now.");
                let _ = traffic_controller::models::notify_via_openclaw(session_id, &msg).await;
            }

            let bg_tx = state.tx.clone();
            let bg_task = task.clone();
            tokio::spawn(async move {
                let bg_db = db::init_db().await;
                // For now, re-running execute_mission, but it needs to handle jumping to phase
                agent::execute_mission(bg_task, bg_db, bg_tx).await;
            });

            Json(serde_json::json!({ "status": "approved", "phase": "P3Architecture", "mission_id": id }))
        }
        Phase::P8Pending => {
            db::update_phase(&state.db, &id, Phase::Complete).await.ok();

            let event = MissionEvent {
                task_id: task.id,
                phase: Phase::Complete,
                message: "Code committed successfully".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            };
            let _ = state.tx.send(event);

            if let Some(session_id) = &task.openclaw_session_id {
                let msg = format!("🎉 **Mission complete** — `{}`\nCode committed and pushed.", &id[..8]);
                let _ = traffic_controller::models::notify_via_openclaw(session_id, &msg).await;
            }

            Json(serde_json::json!({ "status": "committed", "phase": "Complete", "mission_id": id }))
        }
        _ => Json(serde_json::json!({
            "error": "Mission is not at a HITL gate",
            "current_phase": format!("{:?}", task.phase)
        }))
    }
}

async fn reject_mission(
    axum::extract::Path(id): axum::extract::Path<String>,
    State(state): State<Arc<AppState>>,
    Json(body): Json<ApprovalBody>,
) -> impl IntoResponse {
    db::update_phase(&state.db, &id, Phase::Rejected).await.ok();

    if let Ok(task) = db::get_task(&state.db, &id).await {
        if let Some(session_id) = &task.openclaw_session_id {
            let msg = format!("❌ **Mission rejected** — `{}`\n{}", &id[..8],
                body.note.as_deref().unwrap_or("Mission stopped."));
            let _ = traffic_controller::models::notify_via_openclaw(session_id, &msg).await;
        }
    }

    Json(serde_json::json!({ "status": "rejected", "mission_id": id }))
}

async fn feedback_mission(
    axum::extract::Path(id): axum::extract::Path<String>,
    State(state): State<Arc<AppState>>,
    Json(body): Json<ApprovalBody>,
) -> impl IntoResponse {
    let note = body.note.clone().unwrap_or_default();
    db::store_feedback(&state.db, &id, &note).await.ok();
    db::update_phase(&state.db, &id, Phase::P2Planning).await.ok();

    if let Ok(task) = db::get_task(&state.db, &id).await {
        if let Some(session_id) = &task.openclaw_session_id {
            let msg = format!("🔄 **Replanning** — `{}`\nIncorporating your feedback: {}", &id[..8], note);
            let _ = traffic_controller::models::notify_via_openclaw(session_id, &msg).await;
        }

        let bg_tx = state.tx.clone();
        let bg_task = task.clone();
        tokio::spawn(async move {
            let bg_db = db::init_db().await;
            // In a real scenario, this would pass the feedback to the agent
            agent::execute_mission(bg_task, bg_db, bg_tx).await;
        });
    }

    Json(serde_json::json!({ "status": "replanning", "mission_id": id }))
}

async fn get_mission(
    axum::extract::Path(id): axum::extract::Path<String>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match db::get_task(&state.db, &id).await {
        Ok(task) => Json(serde_json::json!({
            "id": task.id,
            "instruction": task.instruction,
            "phase": format!("{:?}", task.phase),
            "status": match task.phase {
                Phase::P2Pending | Phase::P8Pending => "AWAITING_APPROVAL",
                Phase::Complete => "COMPLETE",
                Phase::Rejected => "REJECTED",
                Phase::Failed => "FAILED",
                _ => "ACTIVE",
            },
            "openclaw_channel": task.openclaw_channel,
        })),
        Err(_) => Json(serde_json::json!({ "error": "Mission not found" }))
    }
}
