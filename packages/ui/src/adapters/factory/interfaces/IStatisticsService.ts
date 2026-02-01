import type { Statistics, TransactionFilter } from "@money-insight/ui/types";

/**
 * Statistics service interface
 */
export interface IStatisticsService {
  /**
   * Get statistics with optional filter
   */
  getStatistics(filter?: TransactionFilter): Promise<Statistics>;
}
