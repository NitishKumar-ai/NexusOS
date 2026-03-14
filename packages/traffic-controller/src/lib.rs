pub mod models {
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct Task {
        pub id: Uuid,
        pub instruction: String,
        pub repo_url: Option<String>,
        pub phase: Phase,
    }

    #[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
    pub enum Phase {
        P0Trigger,
        P1ContextPull,
        P2Planning,
        P3Architecture,
        P4Execution,
        P5Verification,
        P6Review,
        P7Delivery,
        P8Approval,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct MissionEvent {
        pub task_id: Uuid,
        pub phase: Phase,
        pub message: String,
        pub timestamp: String,
    }
}
