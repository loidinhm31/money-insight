import type { Category } from "@money-insight/ui/types";

/**
 * Category service interface
 */
export interface ICategoryService {
  /**
   * Get all categories (from transactions + manually created)
   */
  getCategories(): Promise<Category[]>;

  /**
   * Add a new category
   */
  addCategory(
    category: Omit<Category, "id" | "syncVersion" | "syncedAt">,
  ): Promise<Category>;

  /**
   * Update an existing category
   */
  updateCategory(category: Category): Promise<Category>;

  /**
   * Delete a category by ID
   */
  deleteCategory(id: string): Promise<void>;

  /**
   * Rename a category (also updates all transactions using this category)
   */
  renameCategory(oldName: string, newName: string): Promise<void>;
}
