// Re-export interfaces
export type {
  ITransactionService,
  ICategoryService,
  IAccountService,
  IStatisticsService,
} from "./interfaces";

// Re-export factory functions
export {
  getTransactionService,
  getCategoryService,
  getAccountService,
  getStatisticsService,
  getAllServices,
  resetServices,
} from "./ServiceFactory";
