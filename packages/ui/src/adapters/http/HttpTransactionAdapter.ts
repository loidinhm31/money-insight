import { HttpAdapter } from "./HttpAdapter";
import type { ITransactionService } from "@money-insight/ui/adapters/factory/interfaces";
import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
  TransferParams,
} from "@money-insight/ui/types";

/**
 * HTTP adapter for transaction operations
 */
export class HttpTransactionAdapter
  extends HttpAdapter
  implements ITransactionService
{
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    return this.get<Transaction[]>("/transactions", { filter });
  }

  async addTransaction(transaction: NewTransaction): Promise<Transaction> {
    return this.post<Transaction>("/transactions", transaction);
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    return this.put<Transaction>("/transactions", transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.delete<void>(`/transactions/${id}`);
  }

  async importTransactions(
    transactions: NewTransaction[],
    filename: string,
  ): Promise<ImportResult> {
    return this.post<ImportResult>("/transactions/import", {
      transactions,
      filename,
    });
  }

  async createTransfer(
    params: TransferParams,
  ): Promise<{ outgoing: Transaction; incoming: Transaction }> {
    return this.post<{ outgoing: Transaction; incoming: Transaction }>(
      "/transactions/transfer",
      params,
    );
  }

  async updateTransfer(
    transferId: string,
    params: TransferParams,
  ): Promise<{ outgoing: Transaction; incoming: Transaction }> {
    return this.put<{ outgoing: Transaction; incoming: Transaction }>(
      `/transactions/transfer/${transferId}`,
      params,
    );
  }

  async deleteTransfer(transferId: string): Promise<void> {
    return this.delete<void>(`/transactions/transfer/${transferId}`);
  }

  async getTransferPair(transferId: string): Promise<Transaction[]> {
    return this.get<Transaction[]>(`/transactions/transfer/${transferId}`);
  }
}
