import { formatCurrency } from "@money-insight/ui/lib";

export interface TimePeriodGroupHeaderProps {
  label: string;
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
  valuesHidden?: boolean;
}

export function TimePeriodGroupHeader({
  label,
  totalExpense,
  totalIncome,
  transactionCount,
  valuesHidden = false,
}: TimePeriodGroupHeaderProps) {
  const maskValue = (value: string) => "*".repeat(value.length);

  return (
    <div
      className="sticky top-[60px] z-[5] bg-background border-b py-3 px-1"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#111827" }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            ({transactionCount} transaction{transactionCount !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalExpense > 0 && (
            <span style={{ color: "#DC2626" }}>
              {valuesHidden
                ? maskValue(formatCurrency(totalExpense))
                : `-${formatCurrency(totalExpense)}`}
            </span>
          )}
          {totalIncome > 0 && (
            <span style={{ color: "#059669" }}>
              {valuesHidden
                ? maskValue(formatCurrency(totalIncome))
                : `+${formatCurrency(totalIncome)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
