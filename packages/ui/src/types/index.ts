// Domain types — single source of truth from shared
export type {
  MoneyLoverTransaction,
  TransactionSource,
  NewTransaction,
  Transaction,
  Category,
  Account,
  ImportBatch,
  TransactionFilter,
  Statistics,
  ImportResult,
} from "@money-insight/shared/types";

// UI-specific types
export type {
  ProcessedTransaction,
  CategorySpending,
  MonthlyAnalysis,
  YearlyAnalysis,
  SpendingBottleneck,
  DateRangeFilter,
  FilterState,
  DailySpending,
  DailyAverageSpending,
  MonthlyReport,
} from "@money-insight/shared/types";
