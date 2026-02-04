use rusqlite::{params, Connection, Result};
use std::sync::Mutex;
use tauri::Manager;

use crate::models::*;

/// Database wrapper for managing SQLite connection
pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    /// Create a new database connection
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let app_dir = app_handle.path().app_data_dir()?;
        std::fs::create_dir_all(&app_dir)?;

        let db_path = app_dir.join("spending-analyzer.db");
        println!("Database path: {:?}", db_path);

        let conn = Connection::open(&db_path)?;

        let db = Database {
            conn: Mutex::new(conn),
        };

        db.initialize_schema()?;

        Ok(db)
    }

    /// Initialize database schema
    fn initialize_schema(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL DEFAULT 'manual',
                import_batch_id INTEGER,
                note TEXT DEFAULT '',
                amount REAL NOT NULL,
                category TEXT NOT NULL DEFAULT 'Uncategorized',
                account TEXT NOT NULL DEFAULT 'Unknown',
                currency TEXT NOT NULL DEFAULT 'VND',
                date TEXT NOT NULL,
                event TEXT,
                exclude_report INTEGER DEFAULT 0,
                expense REAL DEFAULT 0,
                income REAL DEFAULT 0,
                year_month TEXT,
                year INTEGER,
                month INTEGER,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                icon TEXT,
                color TEXT,
                is_expense INTEGER DEFAULT 1,
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                account_type TEXT,
                icon TEXT,
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS import_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                record_count INTEGER,
                imported_at TEXT DEFAULT (datetime('now'))
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sync_metadata (
                key TEXT PRIMARY KEY,
                checkpoint_updated_at TEXT,
                checkpoint_id TEXT
            )",
            [],
        )?;

        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(year_month)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source)", [])?;

        println!("Database schema initialized");
        Ok(())
    }

    // =========================================================================
    // Transaction CRUD
    // =========================================================================

    pub fn get_transactions(
        &self,
        filter: Option<TransactionFilter>,
    ) -> Result<Vec<Transaction>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();

        let mut sql = String::from(
            "SELECT id, source, import_batch_id, note, amount, category, account, currency,
                    date, event, exclude_report, expense, income, year_month, year, month,
                    created_at, updated_at, sync_version, synced_at
             FROM transactions WHERE deleted = 0",
        );

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref f) = filter {
            if let Some(ref start) = f.start_date {
                sql.push_str(" AND date >= ?");
                params_vec.push(Box::new(start.clone()));
            }
            if let Some(ref end) = f.end_date {
                sql.push_str(" AND date <= ?");
                params_vec.push(Box::new(end.clone()));
            }
            if let Some(ref categories) = f.categories {
                if !categories.is_empty() {
                    let placeholders: Vec<&str> = categories.iter().map(|_| "?").collect();
                    sql.push_str(&format!(" AND category IN ({})", placeholders.join(",")));
                    for cat in categories {
                        params_vec.push(Box::new(cat.clone()));
                    }
                }
            }
            if let Some(ref accounts) = f.accounts {
                if !accounts.is_empty() {
                    let placeholders: Vec<&str> = accounts.iter().map(|_| "?").collect();
                    sql.push_str(&format!(" AND account IN ({})", placeholders.join(",")));
                    for acc in accounts {
                        params_vec.push(Box::new(acc.clone()));
                    }
                }
            }
            if let Some(ref search) = f.search {
                sql.push_str(" AND note LIKE ?");
                params_vec.push(Box::new(format!("%{}%", search)));
            }
        }

        sql.push_str(" ORDER BY date DESC, created_at DESC");

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params_refs.as_slice(), Self::map_transaction)?;

        let mut transactions = Vec::new();
        for row in rows {
            transactions.push(row?);
        }
        Ok(transactions)
    }

    pub fn add_transaction(
        &self,
        new_tx: NewTransaction,
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let tx = new_tx.into_transaction();

        conn.execute(
            "INSERT INTO transactions (id, source, import_batch_id, note, amount, category, account,
                currency, date, event, exclude_report, expense, income, year_month, year, month,
                created_at, updated_at, sync_version, synced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)",
            params![
                tx.id, tx.source.as_str(), tx.import_batch_id, tx.note, tx.amount,
                tx.category, tx.account, tx.currency, tx.date, tx.event,
                tx.exclude_report as i32, tx.expense, tx.income, tx.year_month,
                tx.year, tx.month, tx.created_at, tx.updated_at,
                tx.sync_version, tx.synced_at,
            ],
        )?;

        // Auto-create categories and accounts with UUID PKs
        let cat_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT OR IGNORE INTO categories (id, name, is_expense) VALUES (?1, ?2, ?3)",
            params![cat_id, tx.category, if tx.amount < 0.0 { 1 } else { 0 }],
        );
        let acc_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT OR IGNORE INTO accounts (id, name) VALUES (?1, ?2)",
            params![acc_id, tx.account],
        );

        Ok(tx)
    }

    pub fn update_transaction(
        &self,
        tx: Transaction,
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

        conn.execute(
            "UPDATE transactions SET
                note = ?1, amount = ?2, category = ?3, account = ?4, currency = ?5,
                date = ?6, event = ?7, exclude_report = ?8, expense = ?9, income = ?10,
                year_month = ?11, year = ?12, month = ?13, updated_at = ?14,
                synced_at = NULL, sync_version = sync_version + 1
             WHERE id = ?15",
            params![
                tx.note, tx.amount, tx.category, tx.account, tx.currency,
                tx.date, tx.event, tx.exclude_report as i32, tx.expense, tx.income,
                tx.year_month, tx.year, tx.month, now, tx.id,
            ],
        )?;

        Ok(tx)
    }

    pub fn delete_transaction(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;
        conn.execute(
            "UPDATE transactions SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn import_transactions(
        &self,
        transactions: Vec<NewTransaction>,
        filename: &str,
    ) -> Result<ImportResult, Box<dyn std::error::Error>> {
        let mut conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO import_batches (filename, record_count) VALUES (?1, ?2)",
            params![filename, transactions.len() as i32],
        )?;

        let batch_id = conn.last_insert_rowid();
        let mut imported_count = 0;
        let mut skipped_count = 0;

        let tx = conn.transaction()?;

        for mut new_tx in transactions {
            new_tx.import_batch_id = Some(batch_id);
            new_tx.source = Some(TransactionSource::CsvImport);
            let transaction = new_tx.into_transaction();

            match tx.execute(
                "INSERT INTO transactions (id, source, import_batch_id, note, amount, category, account,
                    currency, date, event, exclude_report, expense, income, year_month, year, month,
                    created_at, updated_at, sync_version, synced_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)",
                params![
                    transaction.id, transaction.source.as_str(), transaction.import_batch_id,
                    transaction.note, transaction.amount, transaction.category, transaction.account,
                    transaction.currency, transaction.date, transaction.event,
                    transaction.exclude_report as i32, transaction.expense, transaction.income,
                    transaction.year_month, transaction.year, transaction.month,
                    transaction.created_at, transaction.updated_at,
                    transaction.sync_version, transaction.synced_at,
                ],
            ) {
                Ok(_) => {
                    imported_count += 1;
                    let cat_id = uuid::Uuid::new_v4().to_string();
                    let _ = tx.execute(
                        "INSERT OR IGNORE INTO categories (id, name, is_expense) VALUES (?1, ?2, ?3)",
                        params![cat_id, transaction.category, if transaction.amount < 0.0 { 1 } else { 0 }],
                    );
                    let acc_id = uuid::Uuid::new_v4().to_string();
                    let _ = tx.execute(
                        "INSERT OR IGNORE INTO accounts (id, name) VALUES (?1, ?2)",
                        params![acc_id, transaction.account],
                    );
                }
                Err(_) => skipped_count += 1,
            }
        }

        tx.commit()?;

        Ok(ImportResult { batch_id, imported_count, skipped_count })
    }

    // =========================================================================
    // Category / Account CRUD
    // =========================================================================

    pub fn get_categories(&self) -> Result<Vec<Category>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, is_expense, sync_version, synced_at
             FROM categories WHERE deleted = 0 ORDER BY name",
        )?;
        let rows = stmt.query_map([], Self::map_category)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.into())
    }

    pub fn get_accounts(&self) -> Result<Vec<Account>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, account_type, icon, sync_version, synced_at
             FROM accounts WHERE deleted = 0 ORDER BY name",
        )?;
        let rows = stmt.query_map([], Self::map_account)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.into())
    }

    pub fn get_statistics(
        &self,
        filter: Option<TransactionFilter>,
    ) -> Result<Statistics, Box<dyn std::error::Error>> {
        let transactions = self.get_transactions(filter)?;
        let total_expense: f64 = transactions.iter().map(|t| t.expense).sum();
        let total_income: f64 = transactions.iter().map(|t| t.income).sum();
        let net_savings = total_income - total_expense;
        let savings_rate = if total_income > 0.0 { (net_savings / total_income) * 100.0 } else { 0.0 };

        let conn = self.conn.lock().unwrap();
        let category_count: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT category) FROM transactions WHERE deleted = 0", [], |row| row.get(0),
        )?;
        let account_count: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT account) FROM transactions WHERE deleted = 0", [], |row| row.get(0),
        )?;

        Ok(Statistics {
            total_expense, total_income, net_savings, savings_rate,
            transaction_count: transactions.len() as i64, category_count, account_count,
        })
    }

    // =========================================================================
    // Sync helpers
    // =========================================================================

    pub fn query_deleted_transactions(&self) -> Result<Vec<Transaction>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, source, import_batch_id, note, amount, category, account, currency,
                    date, event, exclude_report, expense, income, year_month, year, month,
                    created_at, updated_at, sync_version, synced_at
             FROM transactions WHERE deleted = 1 AND synced_at IS NULL",
        )?;
        let rows = stmt.query_map([], Self::map_transaction)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.into())
    }

    pub fn query_deleted_categories(&self) -> Result<Vec<Category>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, is_expense, sync_version, synced_at
             FROM categories WHERE deleted = 1 AND synced_at IS NULL",
        )?;
        let rows = stmt.query_map([], Self::map_category)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.into())
    }

    pub fn query_deleted_accounts(&self) -> Result<Vec<Account>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, account_type, icon, sync_version, synced_at
             FROM accounts WHERE deleted = 1 AND synced_at IS NULL",
        )?;
        let rows = stmt.query_map([], Self::map_account)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.into())
    }

    pub fn hard_delete_transaction(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn hard_delete_category(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn hard_delete_account(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM accounts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn execute_sql(&self, query: &str, sql_params: &[&str]) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query)?;
        stmt.execute(rusqlite::params_from_iter(sql_params.iter()))?;
        Ok(())
    }

    pub fn query_count(&self, query: &str) -> Result<usize, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query)?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as usize)
    }

    pub fn get_checkpoint(&self) -> Result<Option<(String, String)>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT checkpoint_updated_at, checkpoint_id FROM sync_metadata WHERE key = 'global'",
            [],
            |row| {
                let updated_at: Option<String> = row.get(0)?;
                let id: Option<String> = row.get(1)?;
                Ok((updated_at, id))
            },
        );
        match result {
            Ok((Some(updated_at), Some(id))) => Ok(Some((updated_at, id))),
            Ok(_) => Ok(None),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn save_checkpoint(&self, updated_at: &str, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO sync_metadata (key, checkpoint_updated_at, checkpoint_id) VALUES ('global', ?1, ?2)",
            params![updated_at, id],
        )?;
        Ok(())
    }

    pub fn get_transaction(&self, id: &str) -> Result<Option<Transaction>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT id, source, import_batch_id, note, amount, category, account, currency,
                    date, event, exclude_report, expense, income, year_month, year, month,
                    created_at, updated_at, sync_version, synced_at
             FROM transactions WHERE id = ?1",
            params![id],
            Self::map_transaction,
        );
        match result {
            Ok(tx) => Ok(Some(tx)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn get_category(&self, id: &str) -> Result<Option<Category>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT id, name, icon, color, is_expense, sync_version, synced_at FROM categories WHERE id = ?1",
            params![id], Self::map_category,
        );
        match result {
            Ok(c) => Ok(Some(c)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn get_account(&self, id: &str) -> Result<Option<Account>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT id, name, account_type, icon, sync_version, synced_at FROM accounts WHERE id = ?1",
            params![id], Self::map_account,
        );
        match result {
            Ok(a) => Ok(Some(a)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn create_category(&self, category: &Category) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO categories (id, name, icon, color, is_expense, sync_version, synced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![category.id, category.name, category.icon, category.color,
                    category.is_expense as i32, category.sync_version, category.synced_at],
        )?;
        Ok(())
    }

    pub fn create_account(&self, account: &Account) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO accounts (id, name, account_type, icon, sync_version, synced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![account.id, account.name, account.account_type, account.icon,
                    account.sync_version, account.synced_at],
        )?;
        Ok(())
    }

    pub fn create_transaction(&self, tx: &Transaction) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO transactions (id, source, import_batch_id, note, amount, category, account,
                currency, date, event, exclude_report, expense, income, year_month, year, month,
                created_at, updated_at, sync_version, synced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)",
            params![
                tx.id, tx.source.as_str(), tx.import_batch_id, tx.note, tx.amount,
                tx.category, tx.account, tx.currency, tx.date, tx.event,
                tx.exclude_report as i32, tx.expense, tx.income, tx.year_month,
                tx.year, tx.month, tx.created_at, tx.updated_at,
                tx.sync_version, tx.synced_at,
            ],
        )?;
        Ok(())
    }

    // =========================================================================
    // Row mappers
    // =========================================================================

    fn map_transaction(row: &rusqlite::Row) -> rusqlite::Result<Transaction> {
        Ok(Transaction {
            id: row.get(0)?,
            source: TransactionSource::from_str(&row.get::<_, String>(1)?),
            import_batch_id: row.get(2)?,
            note: row.get(3)?,
            amount: row.get(4)?,
            category: row.get(5)?,
            account: row.get(6)?,
            currency: row.get(7)?,
            date: row.get(8)?,
            event: row.get(9)?,
            exclude_report: row.get::<_, i32>(10)? != 0,
            expense: row.get(11)?,
            income: row.get(12)?,
            year_month: row.get(13)?,
            year: row.get(14)?,
            month: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
            sync_version: row.get(18)?,
            synced_at: row.get(19)?,
        })
    }

    fn map_category(row: &rusqlite::Row) -> rusqlite::Result<Category> {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            color: row.get(3)?,
            is_expense: row.get::<_, i32>(4)? != 0,
            sync_version: row.get(5)?,
            synced_at: row.get(6)?,
        })
    }

    fn map_account(row: &rusqlite::Row) -> rusqlite::Result<Account> {
        Ok(Account {
            id: row.get(0)?,
            name: row.get(1)?,
            account_type: row.get(2)?,
            icon: row.get(3)?,
            sync_version: row.get(4)?,
            synced_at: row.get(5)?,
        })
    }
}
