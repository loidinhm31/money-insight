import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Scale } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  Badge,
} from "@money-insight/ui/components/atoms";
import {
  cn,
  formatCurrency,
  groupTransactionsByTimePeriod,
  type TimePeriodMode,
} from "@money-insight/ui/lib";
import type { Transaction } from "@money-insight/ui/types";

export interface GroupedTransactionListProps {
  transactions: Transaction[];
  periodMode: TimePeriodMode;
  valuesHidden?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
}

export function GroupedTransactionList({
  transactions,
  periodMode,
  valuesHidden = false,
  onTransactionClick,
}: GroupedTransactionListProps) {
  const maskValue = (value: string) => "*".repeat(value.length);

  const groups = groupTransactionsByTimePeriod(transactions, periodMode);

  // Default open the first group (most recent)
  const [openGroups, setOpenGroups] = useState<string[]>(
    groups.length > 0 ? [groups[0].key] : [],
  );

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: "#6B7280" }}>
          No transactions found
        </p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      value={openGroups}
      onValueChange={setOpenGroups}
      className="space-y-2"
    >
      {groups.map((group) => {
        const isOpen = openGroups.includes(group.key);

        return (
          <AccordionItem
            key={group.key}
            value={group.key}
            className="border rounded-lg overflow-hidden"
          >
            {/* Custom Accordion Trigger with Group Header */}
            <button
              type="button"
              onClick={() => {
                if (isOpen) {
                  setOpenGroups(openGroups.filter((k) => k !== group.key));
                } else {
                  setOpenGroups([...openGroups, group.key]);
                }
              }}
              className={cn(
                "flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/50",
                isOpen && "bg-accent/30",
              )}
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                  style={{ color: "#6B7280" }}
                />
                <div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#111827" }}
                  >
                    {group.label}
                  </span>
                  <span className="text-xs ml-2" style={{ color: "#9CA3AF" }}>
                    ({group.transactions.length} transaction
                    {group.transactions.length !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {group.totalExpense > 0 && (
                  <span className="font-medium" style={{ color: "#DC2626" }}>
                    {valuesHidden
                      ? maskValue(formatCurrency(group.totalExpense))
                      : `-${formatCurrency(group.totalExpense)}`}
                  </span>
                )}
                {group.totalIncome > 0 && (
                  <span className="font-medium" style={{ color: "#059669" }}>
                    {valuesHidden
                      ? maskValue(formatCurrency(group.totalIncome))
                      : `+${formatCurrency(group.totalIncome)}`}
                  </span>
                )}
              </div>
            </button>

            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {group.transactions.map((transaction) => {
                  const isExpense = transaction.expense > 0;
                  const isAdjustment =
                    transaction.source === "balance_adjustment";
                  const transactionDate = new Date(transaction.date);

                  // Determine display values based on transaction type
                  const displayCategory = isAdjustment
                    ? "Balance Adjustment"
                    : transaction.category;
                  const amountColor = isAdjustment
                    ? "#2563EB"
                    : isExpense
                      ? "#DC2626"
                      : "#059669";

                  return (
                    <div
                      key={transaction.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors",
                        onTransactionClick && "cursor-pointer",
                        isAdjustment && "border-blue-200 bg-blue-50/50",
                      )}
                      onClick={() => onTransactionClick?.(transaction)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isAdjustment && (
                            <Scale className="h-4 w-4 text-blue-600" />
                          )}
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#374151" }}
                          >
                            {format(transactionDate, "MMM dd")}
                          </span>
                          <Badge variant={isAdjustment ? "default" : "outline"}>
                            {displayCategory}
                          </Badge>
                          <Badge variant="secondary">
                            {transaction.account}
                          </Badge>
                        </div>
                        {transaction.note && !isAdjustment && (
                          <p
                            className="text-sm truncate mt-1"
                            style={{ color: "#6B7280" }}
                          >
                            {transaction.note}
                          </p>
                        )}
                        {isAdjustment && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: "#2563EB" }}
                          >
                            Auto-adjusting entry
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <p
                          className="font-semibold"
                          style={{ color: amountColor }}
                        >
                          {valuesHidden
                            ? maskValue(
                                formatCurrency(
                                  isExpense
                                    ? transaction.expense
                                    : transaction.income,
                                ),
                              )
                            : isExpense
                              ? `-${formatCurrency(transaction.expense)}`
                              : transaction.income > 0
                                ? `+${formatCurrency(transaction.income)}`
                                : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
