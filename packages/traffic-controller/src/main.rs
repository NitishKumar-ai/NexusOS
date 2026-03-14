use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod agent;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "traffic_controller=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Define routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/agents/coder/run", post(run_agent))
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Starting NexusOS Gateway on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "NexusOS Gateway Active"
}

// Initial placeholder for agent execution
async fn run_agent(axum::Json(payload): axum::Json<serde_json::Value>) -> impl axum::response::IntoResponse {
    tracing::info!("Received agent task: {:?}", payload);
    axum::Json(serde_json::json!({
        "status": "accepted",
        "message": "Task queued for processing (P0 Trigger)"
    }))
}
