import { format } from "date-fns";
import { Scale } from "lucide-react";
import { Badge } from "@money-insight/ui/components/atoms";
import { formatCurrency, cn } from "@money-insight/ui/lib";
import type { TransactionSource } from "@money-insight/ui/types";

export interface TransactionItemProps {
  id: string | number;
  date: string | Date;
  category: string;
  account: string;
  note?: string;
  expense: number;
  income: number;
  source?: TransactionSource;
  onClick?: () => void;
}

export function TransactionItem({
  date,
  category,
  account,
  note,
  expense,
  income,
  source,
  onClick,
}: TransactionItemProps) {
  const transactionDate = typeof date === "string" ? new Date(date) : date;
  const isExpense = expense > 0;
  const isAdjustment = source === "balance_adjustment";

  // For adjustments, display "Balance Adjustment" instead of the internal category
  const displayCategory = isAdjustment ? "Balance Adjustment" : category;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer",
        isAdjustment && "border-blue-200 bg-blue-50/50",
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {isAdjustment && <Scale className="h-4 w-4 text-blue-600" />}
          <span className="font-medium">
            {format(transactionDate, "MMM dd, yyyy")}
          </span>
          <Badge variant={isAdjustment ? "default" : "outline"}>
            {displayCategory}
          </Badge>
          <Badge variant="secondary">{account}</Badge>
        </div>
        {note && !isAdjustment && (
          <p className="text-sm text-muted-foreground mt-1">{note}</p>
        )}
        {isAdjustment && (
          <p className="text-sm text-blue-600 mt-1">Auto-adjusting entry</p>
        )}
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            isAdjustment
              ? "text-blue-600"
              : isExpense
                ? "text-red-600"
                : "text-green-600",
          )}
        >
          {isExpense
            ? `-${formatCurrency(expense)}`
            : income > 0
              ? `+${formatCurrency(income)}`
              : formatCurrency(0)}
        </p>
      </div>
    </div>
  );
}
