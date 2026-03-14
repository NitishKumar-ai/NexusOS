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

struct AppState {
    db: tokio_rusqlite::Connection,
    tx: broadcast::Sender<MissionEvent>,
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
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    let instruction = payload["instruction"].as_str().unwrap_or("Unknown task").to_string();
    let repo_url = payload["repo_url"].as_str().map(|s| s.to_string());
    
    let task = Task {
        id: Uuid::new_v4(),
        instruction,
        repo_url,
        phase: Phase::P0Trigger,
    };

    // Save to DB
    db::save_task(&state.db, &task).await;

    // Broadcast Event
    let event = MissionEvent {
        task_id: task.id,
        phase: Phase::P0Trigger,
        message: format!("Task received: {}", task.instruction),
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    let _ = state.tx.send(event);

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
