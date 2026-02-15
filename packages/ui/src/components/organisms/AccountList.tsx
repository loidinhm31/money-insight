import { AccountItem } from "@money-insight/ui/components/molecules";
import { AddAccountDialog } from "@money-insight/ui/components/organisms";
import type { Account, NewAccount } from "@money-insight/ui/types";

export interface AccountListProps {
  accounts: Account[];
  accountBalances?: Map<string, number>; // Map of account name to calculated balance
  onAccountClick?: (account: Account) => void;
  onAccountDelete?: (id: string) => void;
  onAccountAdd: (account: NewAccount) => Promise<Account | void>;
  onAdjustBalance?: (account: Account) => void;
}

export function AccountList({
  accounts,
  accountBalances,
  onAccountClick,
  onAccountDelete,
  onAccountAdd,
  onAdjustBalance,
}: AccountListProps) {
  // Sort accounts alphabetically by name
  const sortedAccounts = [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {accounts.length === 0
            ? "No accounts yet"
            : `Showing ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
        </p>
        <AddAccountDialog onSubmit={onAccountAdd} />
      </div>

      {sortedAccounts.length > 0 ? (
        <div className="space-y-2">
          {sortedAccounts.map((account) => (
            <AccountItem
              key={account.id}
              {...account}
              balance={accountBalances?.get(account.name)}
              onClick={() => onAccountClick?.(account)}
              onDelete={onAccountDelete}
              onAdjustBalance={
                onAdjustBalance ? () => onAdjustBalance(account) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No accounts found.</p>
          <p className="text-sm mt-2">Click "Add Account" to get started.</p>
        </div>
      )}
    </div>
  );
}
