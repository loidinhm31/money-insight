import type { Category } from "@money-insight/ui/types";

/**
 * Category service interface
 */
export interface ICategoryService {
  /**
   * Get all categories
   */
  getCategories(): Promise<Category[]>;
}
