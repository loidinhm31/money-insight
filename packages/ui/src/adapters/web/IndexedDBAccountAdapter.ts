import type { IAccountService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Account } from "@money-insight/ui/types";
import { db, generateId } from "./database";

export class IndexedDBAccountAdapter implements IAccountService {
  async getAccounts(): Promise<Account[]> {
    // Derive accounts from existing transactions
    const transactions = await db.transactions.toArray();
    const accountSet = new Set<string>();

    for (const tx of transactions) {
      accountSet.add(tx.account);
    }

    // Also include any manually created accounts
    const storedAccounts = await db.accounts.toArray();
    for (const acc of storedAccounts) {
      accountSet.add(acc.name);
    }

    return Array.from(accountSet).map((name) => {
      const stored = storedAccounts.find((a) => a.name === name);
      return {
        id: stored?.id || generateId(),
        name,
        accountType: stored?.accountType,
        icon: stored?.icon,
        syncVersion: stored?.syncVersion ?? 0,
        syncedAt: stored?.syncedAt ?? null,
      };
    });
  }
}
