import { StatCard } from "@money-insight/ui/components/molecules";
import { formatCurrency } from "@money-insight/ui/lib";
import type { Account } from "@money-insight/ui/types";

export interface AccountStatsProps {
  accounts: Account[];
  accountBalances?: Map<string, number>; // Optional map of account name to calculated balance
}

export function AccountStats({ accounts, accountBalances }: AccountStatsProps) {
  const totalAccounts = accounts.length;

  // Calculate total balance using calculated balances if available, otherwise use initialBalance
  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = accountBalances?.get(acc.name) ?? acc.initialBalance;
    return sum + balance;
  }, 0);

  const currencies = [...new Set(accounts.map((a) => a.currency))];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Total Accounts" value={totalAccounts.toString()} />
      <StatCard
        title="Total Balance"
        value={formatCurrency(totalBalance)}
        valueColor={totalBalance >= 0 ? "#16a34a" : "#dc2626"}
      />
      <StatCard
        title="Currencies"
        value={currencies.length > 0 ? currencies.join(", ") : "None"}
      />
    </div>
  );
}
