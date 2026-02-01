import { isTauri } from "@money-insight/ui/utils";

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
  TauriAuthAdapter,
  TauriSyncAdapter,
} from "@money-insight/ui/adapters/tauri";

// IndexedDB Adapters (standalone web mode)
import {
  IndexedDBTransactionAdapter,
  IndexedDBCategoryAdapter,
  IndexedDBAccountAdapter,
  IndexedDBStatisticsAdapter,
} from "@money-insight/ui/adapters/web";

// Shared adapters
import { QmServerAuthAdapter } from "@money-insight/ui/adapters/shared";
import { createIndexedDBSyncAdapter } from "@money-insight/ui/adapters/web";
import { env } from "@money-insight/shared/utils";
import type { ISyncService, IAuthService } from "./interfaces";

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
};

export const setCategoryService = (svc: ICategoryService): void => {
  categoryService = svc;
};

export const setAccountService = (svc: IAccountService): void => {
  accountService = svc;
};

export const setStatisticsService = (svc: IStatisticsService): void => {
  statisticsService = svc;
};

export const setAuthService = (svc: IAuthService): void => {
  authService = svc;
};

export const setSyncService = (svc: ISyncService): void => {
  syncService = svc;
};

/**
 * Auto-detect platform and create appropriate adapter.
 * Priority: Tauri > HTTP (desktop browser mode) > IndexedDB (standalone web)
 */
function autoCreateTransactionService(): ITransactionService {
  if (isTauri()) return new TauriTransactionAdapter();
  // Default to IndexedDB for standalone web
  return new IndexedDBTransactionAdapter();
}

function autoCreateCategoryService(): ICategoryService {
  if (isTauri()) return new TauriCategoryAdapter();
  return new IndexedDBCategoryAdapter();
}

function autoCreateAccountService(): IAccountService {
  if (isTauri()) return new TauriAccountAdapter();
  return new IndexedDBAccountAdapter();
}

function autoCreateStatisticsService(): IStatisticsService {
  if (isTauri()) return new TauriStatisticsAdapter();
  return new IndexedDBStatisticsAdapter();
}

function autoCreateAuthService(): IAuthService {
  if (isTauri()) return new TauriAuthAdapter();
  return new QmServerAuthAdapter();
}

function autoCreateSyncService(): ISyncService {
  if (isTauri()) return new TauriSyncAdapter();
  const auth = getAuthService();
  return createIndexedDBSyncAdapter({
    serverUrl: env.serverUrl,
    appId: env.appId,
    apiKey: env.apiKey,
    getTokens: () => auth.getTokens(),
    saveTokens: auth.saveTokensExternal
      ? (a: string, r: string, u: string) => auth.saveTokensExternal!(a, r, u)
      : undefined,
  });
}

export const getTransactionService = (): ITransactionService => {
  if (!transactionService) {
    transactionService = autoCreateTransactionService();
  }
  return transactionService;
};

export const getCategoryService = (): ICategoryService => {
  if (!categoryService) {
    categoryService = autoCreateCategoryService();
  }
  return categoryService;
};

export const getAccountService = (): IAccountService => {
  if (!accountService) {
    accountService = autoCreateAccountService();
  }
  return accountService;
};

export const getStatisticsService = (): IStatisticsService => {
  if (!statisticsService) {
    statisticsService = autoCreateStatisticsService();
  }
  return statisticsService;
};

export const getAuthService = (): IAuthService => {
  if (!authService) {
    authService = autoCreateAuthService();
  }
  return authService;
};

export const getSyncService = (): ISyncService => {
  if (!syncService) {
    syncService = autoCreateSyncService();
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
};
