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
    <div className="sticky top-[60px] z-[5] bg-card border-b py-3 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            ({transactionCount} transaction{transactionCount !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalExpense > 0 && (
            <span className="text-destructive">
              {valuesHidden
                ? maskValue(formatCurrency(totalExpense))
                : `-${formatCurrency(totalExpense)}`}
            </span>
          )}
          {totalIncome > 0 && (
            <span className="text-success">
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
