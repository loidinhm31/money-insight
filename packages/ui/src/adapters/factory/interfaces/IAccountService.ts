import type { Account } from "@money-insight/ui/types";

/**
 * Account service interface
 */
export interface IAccountService {
  /**
   * Get all accounts
   */
  getAccounts(): Promise<Account[]>;
}
