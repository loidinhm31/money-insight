import { isTauri } from "@/utils/platform";

// Interfaces
import type {
  ITransactionService,
  ICategoryService,
  IAccountService,
  IStatisticsService,
} from "./interfaces";

// Tauri Adapters
import {
  TauriTransactionAdapter,
  TauriCategoryAdapter,
  TauriAccountAdapter,
  TauriStatisticsAdapter,
} from "./tauri";

// Web Adapters (HTTP-based)
import {
  HttpTransactionAdapter,
  HttpCategoryAdapter,
  HttpAccountAdapter,
  HttpStatisticsAdapter,
} from "./web";

// Singleton instances (lazy initialized)
let transactionService: ITransactionService | null = null;
let categoryService: ICategoryService | null = null;
let accountService: IAccountService | null = null;
let statisticsService: IStatisticsService | null = null;

/**
 * Get the Transaction Service for the current platform
 */
export const getTransactionService = (): ITransactionService => {
  if (!transactionService) {
    transactionService = isTauri()
      ? new TauriTransactionAdapter()
      : new HttpTransactionAdapter();
  }
  return transactionService;
};

/**
 * Get the Category Service for the current platform
 */
export const getCategoryService = (): ICategoryService => {
  if (!categoryService) {
    categoryService = isTauri()
      ? new TauriCategoryAdapter()
      : new HttpCategoryAdapter();
  }
  return categoryService;
};

/**
 * Get the Account Service for the current platform
 */
export const getAccountService = (): IAccountService => {
  if (!accountService) {
    accountService = isTauri()
      ? new TauriAccountAdapter()
      : new HttpAccountAdapter();
  }
  return accountService;
};

/**
 * Get the Statistics Service for the current platform
 */
export const getStatisticsService = (): IStatisticsService => {
  if (!statisticsService) {
    statisticsService = isTauri()
      ? new TauriStatisticsAdapter()
      : new HttpStatisticsAdapter();
  }
  return statisticsService;
};

/**
 * Get all services as an object (useful for context providers)
 */
export const getAllServices = () => ({
  transaction: getTransactionService(),
  category: getCategoryService(),
  account: getAccountService(),
  statistics: getStatisticsService(),
});

/**
 * Reset all service instances (useful for testing)
 */
export const resetServices = (): void => {
  transactionService = null;
  categoryService = null;
  accountService = null;
  statisticsService = null;
};
