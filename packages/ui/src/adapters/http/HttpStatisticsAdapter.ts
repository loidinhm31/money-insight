import { HttpAdapter } from "./HttpAdapter";
import type { IStatisticsService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Statistics, TransactionFilter } from "@money-insight/ui/types";

/**
 * HTTP adapter for statistics operations
 */
export class HttpStatisticsAdapter
  extends HttpAdapter
  implements IStatisticsService
{
  async getStatistics(filter?: TransactionFilter): Promise<Statistics> {
    return this.get<Statistics>("/statistics", { filter });
  }
}
