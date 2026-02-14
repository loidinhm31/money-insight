import { getCategoryService } from "@money-insight/ui/adapters";
import type { Category } from "@money-insight/ui/types";

export async function getCategories(): Promise<Category[]> {
  return getCategoryService().getCategories();
}
