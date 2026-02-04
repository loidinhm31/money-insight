import { invoke } from "@tauri-apps/api/core";
import type { IAccountService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Account } from "@money-insight/ui/types";

/**
 * Tauri adapter for account operations using invoke() calls
 */
export class TauriAccountAdapter implements IAccountService {
  async getAccounts(): Promise<Account[]> {
    return invoke("get_accounts");
  }
}
