import type {
  Checkpoint,
  PullRecord,
  SyncRecord,
} from "@money-insight/shared/types";
import {
  db,
  getCurrentTimestamp,
  SYNC_META_KEYS,
} from "@money-insight/ui/adapters/web";

export class IndexedDBSyncStorage {
  async getPendingChanges(): Promise<SyncRecord[]> {
    const records: SyncRecord[] = [];

    // Unsynced transactions
    const transactions = await db.transactions.toArray();
    for (const tx of transactions) {
      if (tx.synced_at === undefined || tx.synced_at === null) {
        records.push({
          tableName: "transactions",
          rowId: tx.id,
          data: {
            source: tx.source,
            note: tx.note,
            amount: tx.amount,
            category: tx.category,
            account: tx.account,
            currency: tx.currency,
            date: tx.date,
            event: tx.event,
            excludeReport: tx.exclude_report,
            expense: tx.expense,
            income: tx.income,
            yearMonth: tx.year_month,
            year: tx.year,
            month: tx.month,
            createdAt: tx.created_at,
            updatedAt: tx.updated_at,
          },
          version: tx.sync_version || 1,
          deleted: false,
        });
      }
    }

    // Unsynced categories
    const categories = await db.categories.toArray();
    for (const cat of categories) {
      if (cat.synced_at === undefined || cat.synced_at === null) {
        records.push({
          tableName: "categories",
          rowId: cat.id,
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            isExpense: cat.is_expense,
          },
          version: cat.sync_version || 1,
          deleted: false,
        });
      }
    }

    // Unsynced accounts
    const accounts = await db.accounts.toArray();
    for (const acc of accounts) {
      if (acc.synced_at === undefined || acc.synced_at === null) {
        records.push({
          tableName: "accounts",
          rowId: acc.id,
          data: {
            name: acc.name,
            accountType: acc.account_type,
            icon: acc.icon,
          },
          version: acc.sync_version || 1,
          deleted: false,
        });
      }
    }

    // Pending deletes
    const pendingDeletes = await db._pendingChanges
      .filter((change) => change.operation === "delete")
      .toArray();
    for (const change of pendingDeletes) {
      records.push({
        tableName: change.tableName,
        rowId: change.rowId,
        data: {},
        version: change.version,
        deleted: true,
      });
    }

    return records;
  }

  async getPendingChangesCount(): Promise<number> {
    let count = 0;

    const transactions = await db.transactions.toArray();
    count += transactions.filter(
      (t) => t.synced_at === undefined || t.synced_at === null,
    ).length;

    const categories = await db.categories.toArray();
    count += categories.filter(
      (c) => c.synced_at === undefined || c.synced_at === null,
    ).length;

    const accounts = await db.accounts.toArray();
    count += accounts.filter(
      (a) => a.synced_at === undefined || a.synced_at === null,
    ).length;

    count += await db._pendingChanges
      .filter((change) => change.operation === "delete")
      .count();

    return count;
  }

  async markSynced(
    recordIds: Array<{ tableName: string; rowId: string }>,
  ): Promise<void> {
    const now = getCurrentTimestamp();

    await db.transaction(
      "rw",
      [db._pendingChanges, db.transactions, db.categories, db.accounts],
      async () => {
        for (const { tableName, rowId } of recordIds) {
          await db._pendingChanges.where({ tableName, rowId }).delete();

          const table = this.getTable(tableName);
          if (table) {
            const exists = await table.get(rowId);
            if (exists) {
              await table.update(rowId, { synced_at: now });
            }
          }
        }
      },
    );
  }

  async applyRemoteChanges(records: PullRecord[]): Promise<void> {
    const now = getCurrentTimestamp();

    const nonDeleted = records.filter((r) => !r.deleted);
    const deleted = records.filter((r) => r.deleted);

    // All 3 tables are independent, but keep consistent ordering
    nonDeleted.sort(
      (a, b) =>
        this.getTableOrder(a.tableName) - this.getTableOrder(b.tableName),
    );
    deleted.sort(
      (a, b) =>
        this.getTableOrder(b.tableName) - this.getTableOrder(a.tableName),
    );

    await db.transaction(
      "rw",
      [db.transactions, db.categories, db.accounts],
      async () => {
        for (const record of nonDeleted) {
          await this.upsertRecord(record, now);
        }
        for (const record of deleted) {
          await this.deleteRecord(record);
        }
      },
    );
  }

  private async upsertRecord(
    record: PullRecord,
    syncedAt: number,
  ): Promise<void> {
    const table = this.getTable(record.tableName);
    if (!table) {
      console.warn(`Unknown table: ${record.tableName}`);
      return;
    }

    const data: Record<string, unknown> = {
      ...record.data,
      id: record.rowId,
      sync_version: record.version,
      synced_at: syncedAt,
    };

    // Convert camelCase server fields to snake_case local fields
    this.convertCamelToSnake(data, "createdAt", "created_at");
    this.convertCamelToSnake(data, "updatedAt", "updated_at");
    this.convertCamelToSnake(data, "excludeReport", "exclude_report");
    this.convertCamelToSnake(data, "yearMonth", "year_month");
    this.convertCamelToSnake(data, "isExpense", "is_expense");
    this.convertCamelToSnake(data, "accountType", "account_type");

    if (!data.created_at) {
      data.created_at = new Date(syncedAt * 1000).toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await table.put(data as any);
  }

  private convertCamelToSnake(
    data: Record<string, unknown>,
    camelKey: string,
    snakeKey: string,
  ): void {
    if (data[camelKey] !== undefined && data[snakeKey] === undefined) {
      data[snakeKey] = data[camelKey];
      delete data[camelKey];
    }
  }

  private async deleteRecord(record: PullRecord): Promise<void> {
    const table = this.getTable(record.tableName);
    if (!table) return;
    await table.delete(record.rowId);
  }

  async getCheckpoint(): Promise<Checkpoint | undefined> {
    const checkpointJson = await db.getSyncMeta(SYNC_META_KEYS.CHECKPOINT);
    if (!checkpointJson) return undefined;
    try {
      return JSON.parse(checkpointJson) as Checkpoint;
    } catch {
      return undefined;
    }
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    await db.setSyncMeta(SYNC_META_KEYS.CHECKPOINT, JSON.stringify(checkpoint));
  }

  async getLastSyncAt(): Promise<number | undefined> {
    const value = await db.getSyncMeta(SYNC_META_KEYS.LAST_SYNC_AT);
    return value ? parseInt(value, 10) : undefined;
  }

  async saveLastSyncAt(timestamp: number): Promise<void> {
    await db.setSyncMeta(SYNC_META_KEYS.LAST_SYNC_AT, timestamp.toString());
  }

  async clearPendingChanges(): Promise<void> {
    await db._pendingChanges.clear();
  }

  private getTable(tableName: string) {
    switch (tableName) {
      case "transactions":
        return db.transactions;
      case "categories":
        return db.categories;
      case "accounts":
        return db.accounts;
      default:
        return undefined;
    }
  }

  private getTableOrder(tableName: string): number {
    switch (tableName) {
      case "categories":
      case "accounts":
        return 0;
      case "transactions":
        return 1;
      default:
        return 99;
    }
  }
}
