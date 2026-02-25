import { getTransactionService } from "@money-insight/ui/adapters";
import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
  TransferParams,
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

export async function createTransfer(
  params: TransferParams,
): Promise<{ outgoing: Transaction; incoming: Transaction }> {
  return getTransactionService().createTransfer(params);
}

export async function updateTransfer(
  transferId: string,
  params: TransferParams,
): Promise<{ outgoing: Transaction; incoming: Transaction }> {
  return getTransactionService().updateTransfer(transferId, params);
}

export async function deleteTransfer(transferId: string): Promise<void> {
  return getTransactionService().deleteTransfer(transferId);
}

export async function getTransferPair(
  transferId: string,
): Promise<Transaction[]> {
  return getTransactionService().getTransferPair(transferId);
}
