// Auth & Sync types
export * from "./auth";
export * from "./sync";

// Base transaction interface from Money Lover CSV
export interface MoneyLoverTransaction {
  id: number;
  note: string;
  amount: number;
  category: string;
  account: string;
  currency: string;
  date: Date;
  event?: string;
  excludeReport: boolean;
}

// Enhanced transaction with computed fields
export interface ProcessedTransaction extends MoneyLoverTransaction {
  expense: number;
  income: number;
  yearMonth: string;
  year: number;
  month: number;
  monthName: string;
}

// Category spending analysis
export interface CategorySpending {
  category: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
  transactions: ProcessedTransaction[];
}

// Monthly analysis
export interface MonthlyAnalysis {
  yearMonth: string;
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: CategorySpending[];
}

// Yearly analysis
export interface YearlyAnalysis {
  year: number;
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  monthlyData: MonthlyAnalysis[];
  categoryBreakdown: CategorySpending[];
}

// Spending bottleneck detection
export interface SpendingBottleneck {
  type: "high_amount" | "high_frequency" | "trend_increase";
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  amount: number;
  percentage: number;
  suggestion: string;
  transactions: ProcessedTransaction[];
}

// Date range filter
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

// Filter state
export interface FilterState {
  dateRange: DateRangeFilter | null;
  categories: string[];
  accounts: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Transaction source type
export type TransactionSource = "csv_import" | "manual";

// New transaction for creation (matches Rust NewTransaction)
export interface NewTransaction {
  note: string;
  amount: number;
  category: string;
  account: string;
  currency: string;
  date: string; // ISO format YYYY-MM-DD
  event?: string;
  excludeReport: boolean;
  source?: TransactionSource;
  importBatchId?: number;
}

// Full transaction from database (matches Rust Transaction)
export interface Transaction {
  id: string;
  source: TransactionSource;
  importBatchId?: number;
  note: string;
  amount: number;
  category: string;
  account: string;
  currency: string;
  date: string;
  event?: string;
  excludeReport: boolean;
  expense: number;
  income: number;
  yearMonth: string;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
  syncedAt: number | null;
}

// Category definition
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isExpense: boolean;
  syncVersion: number;
  syncedAt: number | null;
}

// Account definition
export interface Account {
  id: string;
  name: string;
  accountType?: string;
  icon?: string;
  initialBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
  syncedAt: number | null;
}

// New account for creation
export interface NewAccount {
  name: string;
  accountType?: string;
  icon?: string;
  initialBalance: number;
  currency: string;
}

// Import batch tracking
export interface ImportBatch {
  id: number;
  filename: string;
  recordCount: number;
  importedAt: string;
}

// Filter for querying transactions (matches Rust TransactionFilter)
export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: string[];
  minAmount?: number;
  maxAmount?: number;
  source?: TransactionSource;
  search?: string;
}

// Statistics summary
export interface Statistics {
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  categoryCount: number;
  accountCount: number;
}

// Result of import operation
export interface ImportResult {
  batchId: number;
  importedCount: number;
  skippedCount: number;
}

// Daily spending for a single day
export interface DailySpending {
  date: string; // "YYYY-MM-DD"
  dayOfMonth: number; // 1-31
  displayDate: string; // "MM/DD"
  expense: number;
  income: number;
  cumulativeExpense: number;
  cumulativeIncome: number;
}

// Average daily spending pattern from previous months
export interface DailyAverageSpending {
  dayOfMonth: number;
  displayDate: string;
  averageExpense: number;
  averageCumulativeExpense: number;
}

// Monthly report data
export interface MonthlyReport {
  yearMonth: string;
  year: number;
  month: number;
  daysInMonth: number;
  dailySpending: DailySpending[];
  totalExpense: number;
  totalIncome: number;
  currentDayExpense: number;
  previousThreeMonthAverage: number;
  previousThreeMonthDailyPattern: DailyAverageSpending[];
}
