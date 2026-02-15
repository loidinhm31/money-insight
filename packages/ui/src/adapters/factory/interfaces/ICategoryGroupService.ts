import type { CategoryGroup, CategoryMapping } from "@money-insight/ui/types";

/**
 * Category group service interface for managing parent categories and sub-category mappings
 */
export interface ICategoryGroupService {
  /**
   * Get all category groups
   */
  getCategoryGroups(): Promise<CategoryGroup[]>;

  /**
   * Get a single category group by ID
   */
  getCategoryGroup(id: string): Promise<CategoryGroup | undefined>;

  /**
   * Add a new category group
   */
  addCategoryGroup(
    group: Omit<CategoryGroup, "id" | "syncVersion" | "syncedAt">,
  ): Promise<CategoryGroup>;

  /**
   * Update an existing category group
   */
  updateCategoryGroup(group: CategoryGroup): Promise<CategoryGroup>;

  /**
   * Delete a category group and all its mappings (cascade delete)
   */
  deleteCategoryGroup(id: string): Promise<void>;

  /**
   * Get all category mappings
   */
  getCategoryMappings(): Promise<CategoryMapping[]>;

  /**
   * Get mappings for a specific parent group
   */
  getMappingsForGroup(parentGroupId: string): Promise<CategoryMapping[]>;

  /**
   * Map a sub-category to a parent group (upserts if mapping already exists)
   */
  mapSubCategory(
    subCategory: string,
    parentGroupId: string,
  ): Promise<CategoryMapping>;

  /**
   * Remove a sub-category mapping
   */
  unmapSubCategory(subCategory: string): Promise<void>;

  /**
   * Build a lookup map from sub-category name to parent group name
   * Used for efficient category resolution during analysis
   */
  buildCategoryLookup(): Promise<Map<string, string>>;
}
