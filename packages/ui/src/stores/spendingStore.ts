import { create } from "zustand";
import type {
  Transaction,
  NewTransaction,
  Account,
  NewAccount,
  FilterState,
  CategorySpending,
  MonthlyAnalysis,
  YearlyAnalysis,
  SpendingBottleneck,
  ProcessedTransaction,
  MonthlyReport,
} from "@money-insight/ui/types";
import { matchesSearch, MoneyInsightAnalyzer } from "@money-insight/ui/lib";
import * as transactionService from "@money-insight/ui/services/transactionService";
import * as accountService from "@money-insight/ui/services/accountService";
import * as balanceAdjustmentService from "@money-insight/ui/services/balanceAdjustmentService";

// Convert Transaction (from DB) to ProcessedTransaction (for analysis)
function toProcessedTransaction(tx: Transaction): ProcessedTransaction {
  return {
    id: parseInt(tx.id) || 0, // Old interface uses number id
    note: tx.note,
    amount: tx.amount,
    category: tx.category,
    account: tx.account,
    currency: tx.currency,
    date: new Date(tx.date),
    event: tx.event,
    excludeReport: tx.excludeReport,
    expense: tx.expense,
    income: tx.income,
    yearMonth: tx.yearMonth,
    year: tx.year,
    month: tx.month,
    monthName: new Date(tx.date).toLocaleString("default", { month: "long" }),
  };
}

interface Statistics {
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  avgTransaction: number;
  transactionCount: number;
  categoryCount: number;
  accountCount: number;
  dateRange: { start: Date | undefined; end: Date | undefined };
}

interface WalletBalance {
  account: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

interface SpendingStore {
  // Data
  transactions: Transaction[];
  processedTransactions: ProcessedTransaction[];
  accounts: Account[];
  analyzer: MoneyInsightAnalyzer | null;

  // Filter state
  filter: FilterState;

  // Cached analysis
  statistics: Statistics | null;
  filteredTransactions: Transaction[];
  categorySpending: CategorySpending[];
  monthlyAnalysis: MonthlyAnalysis[];
  yearlyAnalysis: YearlyAnalysis[];
  bottlenecks: SpendingBottleneck[];
  walletBalances: WalletBalance[];
  currentMonthReport: MonthlyReport | null;

  // Selected items for drill-down
  selectedCategory: string | null;
  selectedMonth: string | null;
  selectedYear: number | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  isDbReady: boolean;
  valuesHidden: boolean;

  // Actions
  initFromDatabase: () => Promise<void>;
  addTransaction: (tx: NewTransaction) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  importFromCSV: (
    transactions: NewTransaction[],
    filename: string,
  ) => Promise<void>;
  loadTransactions: (transactions: ProcessedTransaction[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;
  selectCategory: (category: string | null) => void;
  selectMonth: (month: string | null) => void;
  selectYear: (year: number | null) => void;
  refreshAnalysis: () => void;
  reset: () => void;
  toggleValuesHidden: () => void;

  // Account actions
  addAccount: (account: NewAccount) => Promise<Account>;
  updateAccount: (account: Account) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;

  // Balance adjustment actions
  adjustBalance: (
    accountName: string,
    targetBalance: number,
    date: string,
  ) => Promise<Transaction>;
  recalculateAdjustmentsForAccount: (accountName: string) => Promise<void>;
}

const initialFilter: FilterState = {
  dateRange: null,
  categories: [],
  accounts: [],
  search: "",
};

export const useSpendingStore = create<SpendingStore>()((set, get) => ({
  // Initial state
  transactions: [],
  processedTransactions: [],
  accounts: [],
  analyzer: null,
  filter: initialFilter,
  statistics: null,
  filteredTransactions: [],
  categorySpending: [],
  monthlyAnalysis: [],
  yearlyAnalysis: [],
  bottlenecks: [],
  walletBalances: [],
  currentMonthReport: null,
  selectedCategory: null,
  selectedMonth: null,
  selectedYear: null,
  isLoading: false,
  error: null,
  isDbReady: false,
  valuesHidden: false,

  // Initialize from database
  initFromDatabase: async () => {
    set({ isLoading: true, error: null });

    try {
      const [transactions, accounts] = await Promise.all([
        transactionService.getTransactions(),
        accountService.getAccounts(),
      ]);
      const processedTransactions = transactions.map(toProcessedTransaction);
      // Filter out transactions with excludeReport=true for analysis
      const reportableTransactions = processedTransactions.filter(
        (t: ProcessedTransaction) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions,
        processedTransactions,
        accounts,
        analyzer,
        isLoading: false,
        isDbReady: true,
      });

      get().refreshAnalysis();
    } catch (error) {
      console.error("Failed to initialize from database:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
        isDbReady: false,
      });
    }
  },

  // Add a new transaction
  addTransaction: async (tx) => {
    set({ isLoading: true });

    try {
      const transaction = await transactionService.addTransaction(tx);
      let transactions = [...get().transactions, transaction];

      // Recalculate adjustments for the affected account
      const account = get().accounts.find((a) => a.name === tx.account);
      if (account) {
        const updatedAdjs = balanceAdjustmentService.recalculateAdjustments(
          transactions,
          account,
        );
        // Update adjustment transactions in DB and local state
        for (const adj of updatedAdjs) {
          await transactionService.updateTransaction(adj);
          transactions = transactions.map((t) => (t.id === adj.id ? adj : t));
        }
      }

      const processedTransactions = transactions.map(toProcessedTransaction);
      // Filter out transactions with excludeReport=true for analysis
      const reportableTransactions = processedTransactions.filter(
        (t) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions,
        processedTransactions,
        analyzer,
        isLoading: false,
      });

      get().refreshAnalysis();
      return transaction;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add transaction",
      });
      throw error;
    }
  },

  // Update an existing transaction
  updateTransaction: async (tx) => {
    set({ isLoading: true });

    try {
      const updated = await transactionService.updateTransaction(tx);
      let transactions = get().transactions.map((t) =>
        t.id === updated.id ? updated : t,
      );

      // Recalculate adjustments for the affected account
      // Skip if this is an adjustment being updated (to avoid infinite loop)
      if (!balanceAdjustmentService.isAdjustmentTransaction(updated)) {
        const account = get().accounts.find((a) => a.name === tx.account);
        if (account) {
          const updatedAdjs = balanceAdjustmentService.recalculateAdjustments(
            transactions,
            account,
          );
          for (const adj of updatedAdjs) {
            await transactionService.updateTransaction(adj);
            transactions = transactions.map((t) => (t.id === adj.id ? adj : t));
          }
        }
      }

      const processedTransactions = transactions.map(toProcessedTransaction);
      // Filter out transactions with excludeReport=true for analysis
      const reportableTransactions = processedTransactions.filter(
        (t) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions,
        processedTransactions,
        analyzer,
        isLoading: false,
      });

      get().refreshAnalysis();
      return updated;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transaction",
      });
      throw error;
    }
  },

  // Delete a transaction
  deleteTransaction: async (id) => {
    set({ isLoading: true });

    try {
      // Get the transaction before deleting to know which account to recalculate
      const deletedTx = get().transactions.find((t) => t.id === id);
      await transactionService.deleteTransaction(id);
      let transactions = get().transactions.filter((t) => t.id !== id);

      // Recalculate adjustments for the affected account
      if (
        deletedTx &&
        !balanceAdjustmentService.isAdjustmentTransaction(deletedTx)
      ) {
        const account = get().accounts.find(
          (a) => a.name === deletedTx.account,
        );
        if (account) {
          const updatedAdjs = balanceAdjustmentService.recalculateAdjustments(
            transactions,
            account,
          );
          for (const adj of updatedAdjs) {
            await transactionService.updateTransaction(adj);
            transactions = transactions.map((t) => (t.id === adj.id ? adj : t));
          }
        }
      }

      const processedTransactions = transactions.map(toProcessedTransaction);
      // Filter out transactions with excludeReport=true for analysis
      const reportableTransactions = processedTransactions.filter(
        (t) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions,
        processedTransactions,
        analyzer,
        isLoading: false,
      });

      get().refreshAnalysis();
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      });
      throw error;
    }
  },

  // Import transactions from CSV
  importFromCSV: async (transactions, filename) => {
    set({ isLoading: true });

    try {
      const result = await transactionService.importTransactions(
        transactions,
        filename,
      );
      console.log(
        `Imported ${result.importedCount} transactions, skipped ${result.skippedCount}`,
      );

      // Reload all transactions from database
      await get().initFromDatabase();
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to import transactions",
      });
      throw error;
    }
  },

  // Legacy method for backward compatibility with existing CSV import flow
  loadTransactions: (transactions) => {
    // Filter out transactions with excludeReport=true for analysis
    const reportableTransactions = transactions.filter((t) => !t.excludeReport);
    const analyzer = new MoneyInsightAnalyzer(reportableTransactions);
    set({
      processedTransactions: transactions,
      analyzer,
      isLoading: false,
      error: null,
    });
    get().refreshAnalysis();
  },

  // Update filter
  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    get().refreshAnalysis();
  },

  // Clear all filters
  clearFilter: () => {
    set({ filter: initialFilter });
    get().refreshAnalysis();
  },

  // Select category for drill-down
  selectCategory: (category) => {
    set({ selectedCategory: category });
  },

  // Select month for drill-down
  selectMonth: (month) => {
    set({ selectedMonth: month });
  },

  // Select year for drill-down
  selectYear: (year) => {
    set({ selectedYear: year });
  },

  // Refresh all analysis
  refreshAnalysis: () => {
    const { analyzer, filter, transactions } = get();
    if (!analyzer) return;

    set({ isLoading: true });

    try {
      const filteredProcessed = analyzer.filterTransactions(filter);
      const statistics = analyzer.getStatistics(filteredProcessed);
      const categorySpending =
        analyzer.analyzeCategorySpending(filteredProcessed);
      const monthlyAnalysis = analyzer.analyzeMonthly(filteredProcessed);
      const yearlyAnalysis = analyzer.analyzeYearly(filteredProcessed);
      const bottlenecks = analyzer.detectBottlenecks(filteredProcessed);

      // Filter Transaction[] for display (same logic as analyzer.filterTransactions)
      // Also exclude transactions with excludeReport=true to match analysis
      let filteredTransactions = transactions.filter((t) => !t.excludeReport);
      if (filter.dateRange) {
        filteredTransactions = filteredTransactions.filter((t) => {
          const date = new Date(t.date);
          return (
            date >= filter.dateRange!.startDate &&
            date <= filter.dateRange!.endDate
          );
        });
      }
      if (filter.categories.length > 0) {
        filteredTransactions = filteredTransactions.filter((t) =>
          filter.categories.includes(t.category),
        );
      }
      if (filter.accounts.length > 0) {
        filteredTransactions = filteredTransactions.filter((t) =>
          filter.accounts.includes(t.account),
        );
      }
      if (filter.search?.trim()) {
        filteredTransactions = filteredTransactions.filter((t) =>
          matchesSearch(t, filter.search!),
        );
      }

      // Calculate wallet balances (using all transactions, not filtered)
      const walletMap = new Map<
        string,
        { totalIncome: number; totalExpense: number }
      >();
      for (const tx of transactions) {
        const current = walletMap.get(tx.account) || {
          totalIncome: 0,
          totalExpense: 0,
        };
        walletMap.set(tx.account, {
          totalIncome: current.totalIncome + tx.income,
          totalExpense: current.totalExpense + tx.expense,
        });
      }
      const walletBalances: WalletBalance[] = Array.from(walletMap.entries())
        .map(([account, data]) => ({
          account,
          balance: data.totalIncome - data.totalExpense,
          totalIncome: data.totalIncome,
          totalExpense: data.totalExpense,
        }))
        .sort((a, b) => b.balance - a.balance);

      // Calculate current month report
      const currentMonthReport = analyzer.getMonthlyReport();

      set({
        statistics,
        filteredTransactions,
        categorySpending,
        monthlyAnalysis,
        yearlyAnalysis,
        bottlenecks,
        walletBalances,
        currentMonthReport,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      });
    }
  },

  // Reset everything
  reset: () => {
    set({
      transactions: [],
      processedTransactions: [],
      accounts: [],
      analyzer: null,
      filter: initialFilter,
      statistics: null,
      filteredTransactions: [],
      categorySpending: [],
      monthlyAnalysis: [],
      yearlyAnalysis: [],
      bottlenecks: [],
      walletBalances: [],
      currentMonthReport: null,
      selectedCategory: null,
      selectedMonth: null,
      selectedYear: null,
      isLoading: false,
      error: null,
      isDbReady: false,
    });
  },

  // Toggle values visibility
  toggleValuesHidden: () => {
    set((state) => ({ valuesHidden: !state.valuesHidden }));
  },

  // Add a new account
  addAccount: async (account) => {
    set({ isLoading: true });

    try {
      const newAccount = await accountService.addAccount(account);
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isLoading: false,
      }));
      return newAccount;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to add account",
      });
      throw error;
    }
  },

  // Update an existing account
  updateAccount: async (account) => {
    set({ isLoading: true });

    try {
      const updated = await accountService.updateAccount(account);
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === updated.id ? updated : a,
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update account",
      });
      throw error;
    }
  },

  // Delete an account
  deleteAccount: async (id) => {
    set({ isLoading: true });

    try {
      await accountService.deleteAccount(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete account",
      });
      throw error;
    }
  },

  // Adjust balance for an account
  adjustBalance: async (accountName, targetBalance, date) => {
    set({ isLoading: true });

    try {
      const { transactions, accounts } = get();
      const account = accounts.find((a) => a.name === accountName);
      if (!account) {
        throw new Error(`Account "${accountName}" not found`);
      }

      // Calculate current balance at the adjustment date
      const currentBalance = balanceAdjustmentService.getBalanceAtDate(
        transactions,
        account,
        date,
      );

      // Create adjustment transaction
      const adjustmentData = balanceAdjustmentService.createAdjustment(
        accountName,
        targetBalance,
        date,
        account.currency,
        currentBalance,
      );

      // Add the adjustment transaction
      const transaction =
        await transactionService.addTransaction(adjustmentData);
      const newTransactions = [...transactions, transaction];
      const processedTransactions = newTransactions.map(toProcessedTransaction);
      const reportableTransactions = processedTransactions.filter(
        (t) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions: newTransactions,
        processedTransactions,
        analyzer,
        isLoading: false,
      });

      get().refreshAnalysis();
      return transaction;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to adjust balance",
      });
      throw error;
    }
  },

  // Recalculate adjustments for a specific account
  recalculateAdjustmentsForAccount: async (accountName) => {
    const { transactions, accounts } = get();
    const account = accounts.find((a) => a.name === accountName);
    if (!account) return;

    const updatedAdjs = balanceAdjustmentService.recalculateAdjustments(
      transactions,
      account,
    );

    if (updatedAdjs.length === 0) return;

    set({ isLoading: true });

    try {
      let updatedTransactions = [...transactions];

      for (const adj of updatedAdjs) {
        await transactionService.updateTransaction(adj);
        updatedTransactions = updatedTransactions.map((t) =>
          t.id === adj.id ? adj : t,
        );
      }

      const processedTransactions = updatedTransactions.map(
        toProcessedTransaction,
      );
      const reportableTransactions = processedTransactions.filter(
        (t) => !t.excludeReport,
      );
      const analyzer = new MoneyInsightAnalyzer(reportableTransactions);

      set({
        transactions: updatedTransactions,
        processedTransactions,
        analyzer,
        isLoading: false,
      });

      get().refreshAnalysis();
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to recalculate adjustments",
      });
      throw error;
    }
  },
}));
