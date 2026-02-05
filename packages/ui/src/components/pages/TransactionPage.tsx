import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSpendingStore } from "@money-insight/ui/stores";
import { useNav } from "@money-insight/ui/hooks";
import { TimePeriodSelector } from "@money-insight/ui/components/molecules";
import { GroupedTransactionList } from "@money-insight/ui/components/organisms";
import type { TimePeriodMode } from "@money-insight/ui/lib";

export function TransactionPage() {
  const { to } = useNav();
  const { transactions, valuesHidden } = useSpendingStore();
  const [periodMode, setPeriodMode] = useState<TimePeriodMode>("month");

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Link
          to={to("dashboard")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: "#374151" }} />
        </Link>
        <div>
          <h1
            className="text-xl font-bold font-heading"
            style={{ color: "#111827" }}
          >
            All Transactions
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {transactions.length} transactions
          </p>
        </div>
      </div>

      {/* Sticky period selector */}
      <div
        className="sticky top-0 z-10 border-b p-4"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "#374151" }}>
            Group by
          </span>
          <TimePeriodSelector value={periodMode} onChange={setPeriodMode} />
        </div>
      </div>

      {/* Grouped transaction list */}
      <div className="flex-1 overflow-auto p-4">
        <GroupedTransactionList
          transactions={transactions}
          periodMode={periodMode}
          valuesHidden={valuesHidden}
        />
      </div>
    </div>
  );
}
