import type { ITransactionService } from "@money-insight/ui/adapters/factory/interfaces";
import type {
  Transaction,
  NewTransaction,
  TransactionFilter,
  ImportResult,
  Account,
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

    // Ensure account exists (for manual entry with new account names)
    if (tx.account?.trim()) {
      await this.ensureAccountsExist([tx]);
    }

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

    await db.transaction(
      "rw",
      db.transactions,
      db.importBatches,
      db.accounts,
      async () => {
        // Auto-create missing accounts from imported transactions
        await this.ensureAccountsExist(transactions);

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
      },
    );

    return {
      batchId: batchId,
      importedCount: importedCount,
      skippedCount: skippedCount,
    };
  }

  /**
   * Ensure all account names from transactions exist in the accounts table.
   * Creates missing accounts automatically with default values.
   */
  private async ensureAccountsExist(
    transactions: NewTransaction[],
  ): Promise<void> {
    // Extract unique account names from transactions
    const accountNames = new Set<string>();
    for (const tx of transactions) {
      if (tx.account?.trim()) {
        accountNames.add(tx.account.trim());
      }
    }

    // Get existing accounts
    const existingAccounts = await db.accounts.toArray();
    const existingNames = new Set(existingAccounts.map((a) => a.name));

    // Create missing accounts
    const now = new Date().toISOString();
    for (const accountName of accountNames) {
      if (!existingNames.has(accountName)) {
        // Determine account type and icon based on name
        const { accountType, icon } = this.inferAccountType(accountName);

        const newAccount: Account = {
          id: generateId(),
          name: accountName,
          accountType,
          icon,
          initialBalance: 0, // Default to 0, user can update later
          currency: "VND", // Default currency
          createdAt: now,
          updatedAt: now,
          syncVersion: 1,
          syncedAt: null,
        };

        await db.accounts.add(newAccount);
      }
    }
  }

  /**
   * Infer account type and icon from account name
   */
  private inferAccountType(name: string): {
    accountType: string;
    icon: string;
  } {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes("credit") ||
      lowerName.includes("card") ||
      lowerName.includes("visa") ||
      lowerName.includes("mastercard")
    ) {
      return { accountType: "Credit Card", icon: "💳" };
    } else if (
      lowerName.includes("bank") ||
      lowerName.includes("checking") ||
      lowerName.includes("savings")
    ) {
      return { accountType: "Bank Account", icon: "🏦" };
    } else if (
      lowerName.includes("invest") ||
      lowerName.includes("stock") ||
      lowerName.includes("portfolio")
    ) {
      return { accountType: "Investment", icon: "📊" };
    } else if (lowerName.includes("save")) {
      return { accountType: "Savings", icon: "💎" };
    } else if (lowerName.includes("cash") || lowerName.includes("wallet")) {
      return { accountType: "Cash", icon: "💰" };
    }

    // Default to Cash
    return { accountType: "Cash", icon: "💰" };
  }
}
