import { format } from "date-fns";
import { Scale } from "lucide-react";
import { Badge, CategoryIcon } from "@money-insight/ui/components/atoms";
import { formatCurrency, cn } from "@money-insight/ui/lib";
import { useCategoryIcon } from "@money-insight/ui/hooks";
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
  const { getIcon } = useCategoryIcon();
  const transactionDate = typeof date === "string" ? new Date(date) : date;
  const isExpense = expense > 0;
  const isAdjustment = source === "balance_adjustment";
  const iconName = getIcon(category);

  // For adjustments, display "Balance Adjustment" instead of the internal category
  const displayCategory = isAdjustment ? "Balance Adjustment" : category;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer",
        isAdjustment && "border-primary/20 bg-primary/5",
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {isAdjustment && <Scale className="h-4 w-4 text-primary" />}
          <span className="font-medium">
            {format(transactionDate, "MMM dd, yyyy")}
          </span>
          <Badge variant={isAdjustment ? "default" : "outline"}>
            <span className="inline-flex items-center gap-1">
              {iconName && (
                <CategoryIcon
                  name={iconName}
                  size={14}
                  className="inline-block shrink-0"
                />
              )}
              {displayCategory}
            </span>
          </Badge>
          <Badge variant="secondary">{account}</Badge>
        </div>
        {note && !isAdjustment && (
          <p className="text-sm text-muted-foreground mt-1">{note}</p>
        )}
        {isAdjustment && (
          <p className="text-sm text-primary mt-1">Auto-adjusting entry</p>
        )}
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            isAdjustment
              ? "text-primary"
              : isExpense
                ? "text-destructive"
                : "text-success",
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
