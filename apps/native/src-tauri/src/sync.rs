use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use qm_sync_client::{Checkpoint, ReqwestHttpClient, QmSyncClient, SyncClientConfig, SyncRecord};

use crate::auth::AuthService;
use crate::database::Database;
use crate::models::*;
use crate::sync_table_map;

#[derive(Clone)]
pub struct SyncService {
    db: Arc<Database>,
    auth: Arc<std::sync::Mutex<AuthService>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub pushed: usize,
    pub pulled: usize,
    pub conflicts: usize,
    pub success: bool,
    pub error: Option<String>,
    pub synced_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub configured: bool,
    pub authenticated: bool,
    pub last_sync_at: Option<i64>,
    pub pending_changes: usize,
    pub server_url: Option<String>,
}

impl SyncService {
    pub fn new(db: Arc<Database>, auth: Arc<std::sync::Mutex<AuthService>>) -> Self {
        Self { db, auth }
    }

    pub async fn get_sync_status(&self, app_handle: &tauri::AppHandle) -> Result<SyncStatus, String> {
        let is_authenticated = {
            let auth = self.auth.lock().map_err(|e| format!("Failed to lock auth: {}", e))?.clone();
            auth.is_authenticated(app_handle).await
        };
        let last_sync_at = self.get_last_sync_timestamp()?;
        let pending_changes = self.count_pending_changes()?;
        let server_url = self.get_stored_server_url(app_handle);

        Ok(SyncStatus {
            configured: server_url.is_some(),
            authenticated: is_authenticated,
            last_sync_at,
            pending_changes,
            server_url,
        })
    }

    pub async fn sync_now(&self, app_handle: &tauri::AppHandle) -> Result<SyncResult, String> {
        let start_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs() as i64;

        let (server_url, app_id, api_key, access_token, refresh_token) = {
            let auth = self.auth.lock().map_err(|e| format!("Failed to lock auth: {}", e))?.clone();
            let access_token = auth.get_access_token(app_handle).await?;
            let refresh_token = auth.get_refresh_token(app_handle).await?;
            let server_url = self.get_stored_server_url(app_handle)
                .ok_or("Server URL not configured. Please configure it in Sync Settings.")?;
            let app_id = self.get_app_id(app_handle).await?;
            let api_key = auth.get_stored_api_key(app_handle)?;
            (server_url, app_id, api_key, access_token, refresh_token)
        };

        let config = SyncClientConfig::new(&server_url, &app_id, &api_key);
        let http = ReqwestHttpClient::new();
        let client = QmSyncClient::new(config, http);
        client.set_tokens(access_token, refresh_token, None).await;

        let local_changes = self.collect_local_changes()?;
        let checkpoint = self.get_checkpoint()?;

        println!("Syncing {} local changes, checkpoint: {:?}", local_changes.len(), checkpoint);

        let response = client.delta(local_changes.clone(), checkpoint).await
            .map_err(|e| format!("Sync failed: {}", e))?;

        let mut pushed = 0;
        let mut conflicts = 0;
        let mut pulled = 0;

        if let Some(push) = &response.push {
            pushed = push.synced;
            conflicts = push.conflicts.len();
            self.mark_records_synced(&local_changes, start_time)?;
        }

        if let Some(pull) = &response.pull {
            pulled = pull.records.len();
            let sync_records: Vec<SyncRecord> = pull.records.iter().map(|r| SyncRecord {
                table_name: r.table_name.clone(),
                row_id: r.row_id.clone(),
                data: r.data.clone(),
                version: r.version,
                deleted: r.deleted,
            }).collect();
            self.apply_remote_changes(&sync_records)?;
            self.save_checkpoint(&pull.checkpoint)?;
        }

        Ok(SyncResult {
            pushed, pulled, conflicts,
            success: true, error: None, synced_at: start_time,
        })
    }

    fn collect_local_changes(&self) -> Result<Vec<SyncRecord>, String> {
        let mut records = Vec::new();

        // Deleted records first
        for tx in self.db.query_deleted_transactions().map_err(|e| e.to_string())? {
            records.push(SyncRecord {
                table_name: "transactions".to_string(),
                row_id: tx.id, data: serde_json::json!({}),
                version: tx.sync_version, deleted: true,
            });
        }
        for cat in self.db.query_deleted_categories().map_err(|e| e.to_string())? {
            records.push(SyncRecord {
                table_name: "categories".to_string(),
                row_id: cat.id, data: serde_json::json!({}),
                version: cat.sync_version, deleted: true,
            });
        }
        for acc in self.db.query_deleted_accounts().map_err(|e| e.to_string())? {
            records.push(SyncRecord {
                table_name: "accounts".to_string(),
                row_id: acc.id, data: serde_json::json!({}),
                version: acc.sync_version, deleted: true,
            });
        }

        // Active unsynced records
        for tx in self.db.get_transactions(None).map_err(|e| e.to_string())? {
            if tx.synced_at.is_none() {
                records.push(self.transaction_to_sync_record(&tx)?);
            }
        }
        for cat in self.db.get_categories().map_err(|e| e.to_string())? {
            if cat.synced_at.is_none() {
                records.push(self.category_to_sync_record(&cat)?);
            }
        }
        for acc in self.db.get_accounts().map_err(|e| e.to_string())? {
            if acc.synced_at.is_none() {
                records.push(self.account_to_sync_record(&acc)?);
            }
        }

        Ok(records)
    }

    fn transaction_to_sync_record(&self, tx: &Transaction) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "source": tx.source.as_str(),
            "note": tx.note,
            "amount": tx.amount,
            "category": tx.category,
            "account": tx.account,
            "currency": tx.currency,
            "date": tx.date,
            "event": tx.event,
            "excludeReport": tx.exclude_report,
            "expense": tx.expense,
            "income": tx.income,
            "yearMonth": tx.year_month,
            "year": tx.year,
            "month": tx.month,
            "createdAt": tx.created_at,
            "updatedAt": tx.updated_at,
        });
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }
        Ok(SyncRecord {
            table_name: "transactions".to_string(),
            row_id: tx.id.clone(),
            data, version: tx.sync_version, deleted: false,
        })
    }

    fn category_to_sync_record(&self, cat: &Category) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "name": cat.name,
            "icon": cat.icon,
            "color": cat.color,
            "isExpense": cat.is_expense,
        });
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }
        Ok(SyncRecord {
            table_name: "categories".to_string(),
            row_id: cat.id.clone(),
            data, version: cat.sync_version, deleted: false,
        })
    }

    fn account_to_sync_record(&self, acc: &Account) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "name": acc.name,
            "accountType": acc.account_type,
            "icon": acc.icon,
        });
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }
        Ok(SyncRecord {
            table_name: "accounts".to_string(),
            row_id: acc.id.clone(),
            data, version: acc.sync_version, deleted: false,
        })
    }

    fn apply_remote_changes(&self, records: &[SyncRecord]) -> Result<(), String> {
        let mut non_deleted: Vec<&SyncRecord> = records.iter().filter(|r| !r.deleted).collect();
        let mut deleted: Vec<&SyncRecord> = records.iter().filter(|r| r.deleted).collect();

        // All 3 tables are independent (no FK), so ordering doesn't matter much
        // but we keep the pattern for consistency
        non_deleted.sort_by_key(|r| match r.table_name.as_str() {
            "categories" | "accounts" => 0,
            "transactions" => 1,
            _ => 2,
        });
        deleted.sort_by_key(|r| match r.table_name.as_str() {
            "transactions" => 0,
            "categories" | "accounts" => 1,
            _ => 2,
        });

        for record in non_deleted {
            self.apply_record(record)?;
        }
        for record in deleted {
            self.apply_record(record)?;
        }
        Ok(())
    }

    fn apply_record(&self, record: &SyncRecord) -> Result<(), String> {
        match record.table_name.as_str() {
            "transactions" => {
                if record.deleted {
                    self.db.hard_delete_transaction(&record.row_id).map_err(|e| e.to_string())?;
                } else {
                    let data = &record.data;
                    let now_ts = chrono::Utc::now().timestamp();
                    let tx = Transaction {
                        id: record.row_id.clone(),
                        source: TransactionSource::from_str(data["source"].as_str().unwrap_or("manual")),
                        import_batch_id: None,
                        note: data["note"].as_str().unwrap_or("").to_string(),
                        amount: data["amount"].as_f64().unwrap_or(0.0),
                        category: data["category"].as_str().unwrap_or("").to_string(),
                        account: data["account"].as_str().unwrap_or("").to_string(),
                        currency: data["currency"].as_str().unwrap_or("VND").to_string(),
                        date: data["date"].as_str().unwrap_or("").to_string(),
                        event: data["event"].as_str().map(|s| s.to_string()),
                        exclude_report: data["excludeReport"].as_bool().unwrap_or(false),
                        expense: data["expense"].as_f64().unwrap_or(0.0),
                        income: data["income"].as_f64().unwrap_or(0.0),
                        year_month: data["yearMonth"].as_str().unwrap_or("").to_string(),
                        year: data["year"].as_i64().unwrap_or(0) as i32,
                        month: data["month"].as_i64().unwrap_or(0) as i32,
                        created_at: data["createdAt"].as_str().unwrap_or("").to_string(),
                        updated_at: data["updatedAt"].as_str().unwrap_or("").to_string(),
                        sync_version: record.version,
                        synced_at: Some(now_ts),
                    };
                    self.db.create_transaction(&tx).map_err(|e| e.to_string())?;
                }
            }
            "categories" => {
                if record.deleted {
                    self.db.hard_delete_category(&record.row_id).map_err(|e| e.to_string())?;
                } else {
                    let data = &record.data;
                    let cat = Category {
                        id: record.row_id.clone(),
                        name: data["name"].as_str().unwrap_or("").to_string(),
                        icon: data["icon"].as_str().map(|s| s.to_string()),
                        color: data["color"].as_str().map(|s| s.to_string()),
                        is_expense: data["isExpense"].as_bool().unwrap_or(true),
                        sync_version: record.version,
                        synced_at: Some(chrono::Utc::now().timestamp()),
                    };
                    self.db.create_category(&cat).map_err(|e| e.to_string())?;
                }
            }
            "accounts" => {
                if record.deleted {
                    self.db.hard_delete_account(&record.row_id).map_err(|e| e.to_string())?;
                } else {
                    let data = &record.data;
                    let acc = Account {
                        id: record.row_id.clone(),
                        name: data["name"].as_str().unwrap_or("").to_string(),
                        account_type: data["accountType"].as_str().map(|s| s.to_string()),
                        icon: data["icon"].as_str().map(|s| s.to_string()),
                        sync_version: record.version,
                        synced_at: Some(chrono::Utc::now().timestamp()),
                    };
                    self.db.create_account(&acc).map_err(|e| e.to_string())?;
                }
            }
            _ => eprintln!("Unknown table: {}", record.table_name),
        }
        Ok(())
    }

    fn mark_records_synced(&self, records: &[SyncRecord], synced_at: i64) -> Result<(), String> {
        for record in records {
            if record.deleted {
                match record.table_name.as_str() {
                    "transactions" => self.db.hard_delete_transaction(&record.row_id),
                    "categories" => self.db.hard_delete_category(&record.row_id),
                    "accounts" => self.db.hard_delete_account(&record.row_id),
                    _ => Ok(()),
                }.map_err(|e| e.to_string())?;
            } else {
                let db_table = sync_table_map::sync_to_db(&record.table_name);
                let query = format!(
                    "UPDATE {} SET synced_at = ?, sync_version = sync_version + 1 WHERE id = ?",
                    db_table
                );
                self.db.execute_sql(&query, &[&synced_at.to_string(), &record.row_id])
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    fn get_checkpoint(&self) -> Result<Option<Checkpoint>, String> {
        let result = self.db.get_checkpoint().map_err(|e| e.to_string())?;
        match result {
            Some((updated_at_str, id)) => {
                let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .map_err(|e| format!("Failed to parse checkpoint timestamp: {}", e))?;
                Ok(Some(Checkpoint::new(updated_at, id)))
            }
            None => Ok(None),
        }
    }

    fn save_checkpoint(&self, checkpoint: &Checkpoint) -> Result<(), String> {
        let updated_at_str = checkpoint.updated_at.to_rfc3339();
        self.db.save_checkpoint(&updated_at_str, &checkpoint.id).map_err(|e| e.to_string())
    }

    fn get_last_sync_timestamp(&self) -> Result<Option<i64>, String> {
        let result = self.db.get_checkpoint().map_err(|e| e.to_string())?;
        match result {
            Some((updated_at_str, _)) => {
                let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .map_err(|e| format!("Failed to parse checkpoint timestamp: {}", e))?;
                Ok(Some(updated_at.timestamp()))
            }
            None => Ok(None),
        }
    }

    fn count_pending_changes(&self) -> Result<usize, String> {
        let mut count = 0;
        count += self.db.query_count("SELECT COUNT(*) FROM transactions WHERE synced_at IS NULL").map_err(|e| e.to_string())?;
        count += self.db.query_count("SELECT COUNT(*) FROM categories WHERE synced_at IS NULL").map_err(|e| e.to_string())?;
        count += self.db.query_count("SELECT COUNT(*) FROM accounts WHERE synced_at IS NULL").map_err(|e| e.to_string())?;
        Ok(count)
    }

    /// Get server URL from auth store (saved by SyncSettings UI)
    fn get_stored_server_url(&self, app_handle: &tauri::AppHandle) -> Option<String> {
        use tauri_plugin_store::StoreExt;
        app_handle.store("auth.json").ok()
            .and_then(|store| store.get("server_url").and_then(|v| v.as_str().map(|s| s.to_string())))
            .filter(|url| !url.is_empty())
    }

    async fn get_app_id(&self, app_handle: &tauri::AppHandle) -> Result<String, String> {
        use tauri_plugin_store::StoreExt;
        let store = app_handle.store("auth.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;
        store.get("app_id")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .ok_or_else(|| "No app ID found".to_string())
    }
}
