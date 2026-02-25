import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
  TransferParams,
} from "@money-insight/ui/types";

export interface ITransactionService {
  getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;

  addTransaction(tx: NewTransaction): Promise<Transaction>;

  updateTransaction(tx: Transaction): Promise<Transaction>;

  deleteTransaction(id: string): Promise<void>;

  importTransactions(
    transactions: NewTransaction[],
    filename: string,
  ): Promise<ImportResult>;

  createTransfer(
    params: TransferParams,
  ): Promise<{ outgoing: Transaction; incoming: Transaction }>;

  updateTransfer(
    transferId: string,
    params: TransferParams,
  ): Promise<{ outgoing: Transaction; incoming: Transaction }>;

  deleteTransfer(transferId: string): Promise<void>;

  getTransferPair(transferId: string): Promise<Transaction[]>;
}
