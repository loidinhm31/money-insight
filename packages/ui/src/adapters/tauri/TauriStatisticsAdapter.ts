import { invoke } from "@tauri-apps/api/core";
import type { IStatisticsService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Statistics, TransactionFilter } from "@money-insight/ui/types";

/**
 * Tauri adapter for statistics operations using invoke() calls
 */
export class TauriStatisticsAdapter implements IStatisticsService {
  async getStatistics(filter?: TransactionFilter): Promise<Statistics> {
    return invoke("get_statistics", { filter });
  }
}
