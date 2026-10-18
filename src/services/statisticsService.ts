import { getStatisticsService } from "../adapters";
import type { Statistics, TransactionFilter } from "../types";

export async function getStatistics(
  filter?: TransactionFilter,
): Promise<Statistics> {
  return getStatisticsService().getStatistics(filter);
}
