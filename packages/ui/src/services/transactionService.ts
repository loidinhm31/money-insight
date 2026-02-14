import { getTransactionService } from "@money-insight/ui/adapters";
import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
} from "@money-insight/ui/types";

export async function getTransactions(
  filter?: TransactionFilter,
): Promise<Transaction[]> {
  return getTransactionService().getTransactions(filter);
}

export async function addTransaction(tx: NewTransaction): Promise<Transaction> {
  return getTransactionService().addTransaction(tx);
}

export async function updateTransaction(tx: Transaction): Promise<Transaction> {
  return getTransactionService().updateTransaction(tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  return getTransactionService().deleteTransaction(id);
}

export async function importTransactions(
  transactions: NewTransaction[],
  filename: string,
): Promise<ImportResult> {
  return getTransactionService().importTransactions(transactions, filename);
}
