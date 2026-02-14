import { serviceLogger } from "@money-insight/ui/utils";

// Interfaces
import type {
  ITransactionService,
  ICategoryService,
  IAccountService,
  IStatisticsService,
  ISyncService,
  IAuthService,
} from "./interfaces";

// Singleton instances (lazy initialized or injected via setters)
let transactionService: ITransactionService | null = null;
let categoryService: ICategoryService | null = null;
let accountService: IAccountService | null = null;
let statisticsService: IStatisticsService | null = null;
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;

// Setter functions for dependency injection from embed component
export const setTransactionService = (svc: ITransactionService): void => {
  transactionService = svc;
  serviceLogger.factory("Set custom TransactionService");
};

export const setCategoryService = (svc: ICategoryService): void => {
  categoryService = svc;
  serviceLogger.factory("Set custom CategoryService");
};

export const setAccountService = (svc: IAccountService): void => {
  accountService = svc;
  serviceLogger.factory("Set custom AccountService");
};

export const setStatisticsService = (svc: IStatisticsService): void => {
  statisticsService = svc;
  serviceLogger.factory("Set custom StatisticsService");
};

export const setAuthService = (svc: IAuthService): void => {
  authService = svc;
  serviceLogger.factory("Set custom AuthService");
};

export const setSyncService = (svc: ISyncService): void => {
  syncService = svc;
  serviceLogger.factory("Set custom SyncService");
};

export const getTransactionService = (): ITransactionService => {
  if (!transactionService) {
    throw new Error(
      "TransactionService not initialized. Call setTransactionService() first.",
    );
  }
  return transactionService;
};

export const getCategoryService = (): ICategoryService => {
  if (!categoryService) {
    throw new Error(
      "CategoryService not initialized. Call setCategoryService() first.",
    );
  }
  return categoryService;
};

export const getAccountService = (): IAccountService => {
  if (!accountService) {
    throw new Error(
      "AccountService not initialized. Call setAccountService() first.",
    );
  }
  return accountService;
};

export const getStatisticsService = (): IStatisticsService => {
  if (!statisticsService) {
    throw new Error(
      "StatisticsService not initialized. Call setStatisticsService() first.",
    );
  }
  return statisticsService;
};

export const getAuthService = (): IAuthService => {
  if (!authService) {
    throw new Error(
      "AuthService not initialized. Call setAuthService() first.",
    );
  }
  return authService;
};

export const getSyncService = (): ISyncService => {
  if (!syncService) {
    throw new Error(
      "SyncService not initialized. Call setSyncService() first.",
    );
  }
  return syncService;
};

export const getAllServices = () => ({
  transaction: getTransactionService(),
  category: getCategoryService(),
  account: getAccountService(),
  statistics: getStatisticsService(),
  auth: getAuthService(),
  sync: getSyncService(),
});

export const resetServices = (): void => {
  transactionService = null;
  categoryService = null;
  accountService = null;
  statisticsService = null;
  authService = null;
  syncService = null;
  serviceLogger.factory("Reset all services");
};
