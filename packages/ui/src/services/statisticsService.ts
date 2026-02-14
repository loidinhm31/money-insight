import { getStatisticsService } from "@money-insight/ui/adapters";
import type { Statistics, TransactionFilter } from "@money-insight/ui/types";

export async function getStatistics(
  filter?: TransactionFilter,
): Promise<Statistics> {
  return getStatisticsService().getStatistics(filter);
}
