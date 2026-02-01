use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SharedSyncStatus {
    pub configured: bool,
    pub authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_at: Option<i64>,
    pub pending_changes: i32,
}

#[derive(Clone)]
pub struct SyncStatusHolder {
    status: Arc<RwLock<SharedSyncStatus>>,
}

impl SyncStatusHolder {
    pub fn new() -> Self {
        Self { status: Arc::new(RwLock::new(SharedSyncStatus::default())) }
    }

    pub fn get(&self) -> SharedSyncStatus {
        self.status.read().unwrap().clone()
    }

    pub fn update(&self, status: SharedSyncStatus) {
        *self.status.write().unwrap() = status;
    }
}

impl Default for SyncStatusHolder {
    fn default() -> Self { Self::new() }
}

pub type SharedSyncStatusHolder = Arc<SyncStatusHolder>;

pub fn create_sync_status_holder() -> SharedSyncStatusHolder {
    Arc::new(SyncStatusHolder::new())
}
