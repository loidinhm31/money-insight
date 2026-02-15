import type { IAccountService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Account, NewAccount } from "@money-insight/ui/types";
import { db, generateId } from "./database";
import { trackDelete } from "./indexedDbHelpers";

export class IndexedDBAccountAdapter implements IAccountService {
  async getAccounts(): Promise<Account[]> {
    return db.accounts.toArray();
  }

  async addAccount(account: NewAccount): Promise<Account> {
    const now = new Date().toISOString();
    const newAccount: Account = {
      id: generateId(),
      ...account,
      createdAt: now,
      updatedAt: now,
      syncVersion: 1,
      syncedAt: null,
    };
    await db.accounts.add(newAccount);
    return newAccount;
  }

  async updateAccount(account: Account): Promise<Account> {
    const existing = await db.accounts.get(account.id);
    const updated = {
      ...account,
      updatedAt: new Date().toISOString(),
      syncVersion: (existing?.syncVersion || 0) + 1,
      syncedAt: null,
    };
    await db.accounts.put(updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    const existing = await db.accounts.get(id);
    if (existing) {
      await trackDelete("accounts", id, existing.syncVersion || 0);
    }
    await db.accounts.delete(id);
  }
}
