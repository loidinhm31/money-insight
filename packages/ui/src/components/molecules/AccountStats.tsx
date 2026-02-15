import { StatCard } from "@money-insight/ui/components/molecules";
import { formatCurrency } from "@money-insight/ui/lib";
import type { Account } from "@money-insight/ui/types";

export interface AccountStatsProps {
  accounts: Account[];
}

export function AccountStats({ accounts }: AccountStatsProps) {
  const totalAccounts = accounts.length;
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + acc.initialBalance,
    0,
  );
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
