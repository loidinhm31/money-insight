use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SharedAuthStatus {
    pub is_authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apps: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_admin: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_url: Option<String>,
}

#[derive(Clone)]
pub struct AuthStatusHolder {
    status: Arc<RwLock<SharedAuthStatus>>,
}

impl AuthStatusHolder {
    pub fn new() -> Self {
        Self { status: Arc::new(RwLock::new(SharedAuthStatus::default())) }
    }

    pub fn get(&self) -> SharedAuthStatus {
        self.status.read().unwrap().clone()
    }

    pub fn update(&self, status: SharedAuthStatus) {
        *self.status.write().unwrap() = status;
    }

    pub fn clear(&self) {
        *self.status.write().unwrap() = SharedAuthStatus::default();
    }
}

impl Default for AuthStatusHolder {
    fn default() -> Self { Self::new() }
}

pub type SharedAuthStatusHolder = Arc<AuthStatusHolder>;

pub fn create_auth_status_holder() -> SharedAuthStatusHolder {
    Arc::new(AuthStatusHolder::new())
}
