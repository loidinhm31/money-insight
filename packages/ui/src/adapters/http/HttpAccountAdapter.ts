import { HttpAdapter } from "./HttpAdapter";
import type { IAccountService } from "@/adapters/factory/interfaces";
import type { Account } from "@money-insight/ui/types";

/**
 * HTTP adapter for account operations
 */
export class HttpAccountAdapter extends HttpAdapter implements IAccountService {
  async getAccounts(): Promise<Account[]> {
    return this.get<Account[]>("/accounts");
  }
}
