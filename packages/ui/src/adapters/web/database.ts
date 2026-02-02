import Dexie, { type EntityTable, type Table } from "dexie";
import type {
  Transaction,
  Category,
  Account,
  ImportBatch,
} from "@money-insight/ui/types";

export interface SyncMeta {
  key: string;
  value: string;
}

export interface PendingChange {
  id?: number;
  tableName: string;
  rowId: string;
  operation: "create" | "update" | "delete";
  data: Record<string, unknown>;
  version: number;
  createdAt: number;
}

export class MoneyInsightDatabase extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  accounts!: EntityTable<Account, "id">;
  importBatches!: EntityTable<ImportBatch, "id">;
  _syncMeta!: Table<SyncMeta, string>;
  _pendingChanges!: Table<PendingChange, number>;

  constructor() {
    super("MoneyInsightDB");

    this.version(1).stores({
      transactions:
        "id, category, account, date, year_month, year, month, source, import_batch_id, sync_version, synced_at",
      categories: "id, name, sync_version, synced_at",
      accounts: "id, name, sync_version, synced_at",
      importBatches: "id, filename, imported_at",
      _syncMeta: "key",
      _pendingChanges: "++id, tableName, rowId",
    });

    this.transactions = this.table("transactions");
    this.categories = this.table("categories");
    this.accounts = this.table("accounts");
    this.importBatches = this.table("importBatches");
    this._syncMeta = this.table("_syncMeta");
    this._pendingChanges = this.table("_pendingChanges");
  }

  async getSyncMeta(key: string): Promise<string | undefined> {
    const record = await this._syncMeta.get(key);
    return record?.value;
  }

  async setSyncMeta(key: string, value: string): Promise<void> {
    await this._syncMeta.put({ key, value });
  }

  async deleteSyncMeta(key: string): Promise<void> {
    await this._syncMeta.delete(key);
  }
}

export const db = new MoneyInsightDatabase();

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export const SYNC_META_KEYS = {
  CHECKPOINT: "checkpoint",
  LAST_SYNC_AT: "lastSyncAt",
} as const;
