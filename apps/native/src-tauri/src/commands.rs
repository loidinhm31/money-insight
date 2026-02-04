use crate::models::*;
use crate::AppState;
use tauri::State;

/// Get all transactions with optional filter
#[tauri::command]
pub fn get_transactions(
    state: State<AppState>,
    filter: Option<TransactionFilter>,
) -> Result<Vec<Transaction>, String> {
    state.db.get_transactions(filter).map_err(|e| e.to_string())
}

/// Add a new transaction
#[tauri::command]
pub fn add_transaction(
    state: State<AppState>,
    transaction: NewTransaction,
) -> Result<Transaction, String> {
    state.db.add_transaction(transaction).map_err(|e| e.to_string())
}

/// Update an existing transaction
#[tauri::command]
pub fn update_transaction(
    state: State<AppState>,
    transaction: Transaction,
) -> Result<Transaction, String> {
    state.db.update_transaction(transaction)
        .map_err(|e| e.to_string())
}

/// Delete a transaction
#[tauri::command]
pub fn delete_transaction(state: State<AppState>, id: String) -> Result<(), String> {
    state.db.delete_transaction(&id).map_err(|e| e.to_string())
}

/// Import transactions from CSV data
#[tauri::command]
pub fn import_transactions(
    state: State<AppState>,
    transactions: Vec<NewTransaction>,
    filename: String,
) -> Result<ImportResult, String> {
    state.db.import_transactions(transactions, &filename)
        .map_err(|e| e.to_string())
}

/// Get all categories
#[tauri::command]
pub fn get_categories(state: State<AppState>) -> Result<Vec<Category>, String> {
    state.db.get_categories().map_err(|e| e.to_string())
}

/// Get all accounts
#[tauri::command]
pub fn get_accounts(state: State<AppState>) -> Result<Vec<Account>, String> {
    state.db.get_accounts().map_err(|e| e.to_string())
}

/// Get statistics
#[tauri::command]
pub fn get_statistics(
    state: State<AppState>,
    filter: Option<TransactionFilter>,
) -> Result<Statistics, String> {
    state.db.get_statistics(filter).map_err(|e| e.to_string())
}
