import type { ITransactionService } from "@money-insight/ui/adapters/factory/interfaces";
import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
} from "@money-insight/ui/types";
import { db, generateId } from "./database";
import { trackDelete } from "./indexedDbHelpers";
export class IndexedDBTransactionAdapter implements ITransactionService {
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    let collection = db.transactions.toCollection();

    if (filter?.categories?.length) {
      collection = db.transactions.where("category").anyOf(filter.categories);
    }

    let results = await collection.toArray();

    if (filter?.accounts?.length) {
      results = results.filter((t) => filter.accounts!.includes(t.account));
    }
    if (filter?.startDate) {
      results = results.filter((t) => t.date >= filter.startDate!);
    }
    if (filter?.endDate) {
      results = results.filter((t) => t.date <= filter.endDate!);
    }
    if (filter?.minAmount !== undefined) {
      results = results.filter((t) => t.amount >= filter.minAmount!);
    }
    if (filter?.maxAmount !== undefined) {
      results = results.filter((t) => t.amount <= filter.maxAmount!);
    }
    if (filter?.source) {
      results = results.filter((t) => t.source === filter.source);
    }
    if (filter?.search?.trim()) {
      const term = filter.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.note?.toLowerCase().includes(term) ||
          t.category?.toLowerCase().includes(term) ||
          t.account?.toLowerCase().includes(term) ||
          t.event?.toLowerCase().includes(term) ||
          String(t.amount).includes(term),
      );
    }

    return results.sort((a, b) => b.date.localeCompare(a.date));
  }

  async addTransaction(tx: NewTransaction): Promise<Transaction> {
    const now = new Date().toISOString();
    const date = tx.date;
    const parsedDate = new Date(date);
    const amount = tx.amount;

    const transaction: Transaction = {
      id: generateId(),
      source: tx.source || "manual",
      importBatchId: tx.importBatchId,
      note: tx.note,
      amount,
      category: tx.category,
      account: tx.account,
      currency: tx.currency,
      date,
      event: tx.event,
      excludeReport: tx.excludeReport,
      expense: amount < 0 ? Math.abs(amount) : 0,
      income: amount > 0 ? amount : 0,
      yearMonth: `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`,
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth() + 1,
      createdAt: now,
      updatedAt: now,
      syncVersion: 1,
      syncedAt: null,
    };

    await db.transactions.add(transaction);
    return transaction;
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    const existing = await db.transactions.get(tx.id);
    const updated = {
      ...tx,
      updatedAt: new Date().toISOString(),
      syncVersion: (existing?.syncVersion || 0) + 1,
      syncedAt: null,
    };
    await db.transactions.put(updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    const existing = await db.transactions.get(id);
    if (existing) {
      await trackDelete("transactions", id, existing.syncVersion || 0);
    }
    await db.transactions.delete(id);
  }

  async importTransactions(
    transactions: NewTransaction[],
    filename: string,
  ): Promise<ImportResult> {
    const batchId = Date.now();
    let importedCount = 0;
    let skippedCount = 0;

    await db.transaction("rw", db.transactions, db.importBatches, async () => {
      for (const tx of transactions) {
        try {
          const newTx: NewTransaction = {
            ...tx,
            source: "csv_import",
            importBatchId: batchId,
          };
          await this.addTransaction(newTx);
          importedCount++;
        } catch {
          skippedCount++;
        }
      }

      await db.importBatches.add({
        id: batchId,
        filename,
        recordCount: importedCount,
        importedAt: new Date().toISOString(),
      });
    });

    return {
      batchId: batchId,
      importedCount: importedCount,
      skippedCount: skippedCount,
    };
  }
}
