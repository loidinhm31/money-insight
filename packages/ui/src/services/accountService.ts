import { getAccountService } from "@money-insight/ui/adapters";
import type { Account } from "@money-insight/ui/types";

export async function getAccounts(): Promise<Account[]> {
  return getAccountService().getAccounts();
}
