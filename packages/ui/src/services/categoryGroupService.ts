import { getCategoryGroupService } from "@money-insight/ui/adapters";
import type { CategoryGroup, CategoryMapping } from "@money-insight/ui/types";

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  return getCategoryGroupService().getCategoryGroups();
}

export async function getCategoryGroup(
  id: string,
): Promise<CategoryGroup | undefined> {
  return getCategoryGroupService().getCategoryGroup(id);
}

export async function addCategoryGroup(
  group: Omit<CategoryGroup, "id" | "syncVersion" | "syncedAt">,
): Promise<CategoryGroup> {
  return getCategoryGroupService().addCategoryGroup(group);
}

export async function updateCategoryGroup(
  group: CategoryGroup,
): Promise<CategoryGroup> {
  return getCategoryGroupService().updateCategoryGroup(group);
}

export async function deleteCategoryGroup(id: string): Promise<void> {
  return getCategoryGroupService().deleteCategoryGroup(id);
}

export async function getCategoryMappings(): Promise<CategoryMapping[]> {
  return getCategoryGroupService().getCategoryMappings();
}

export async function getMappingsForGroup(
  parentGroupId: string,
): Promise<CategoryMapping[]> {
  return getCategoryGroupService().getMappingsForGroup(parentGroupId);
}

export async function mapSubCategory(
  subCategory: string,
  parentGroupId: string,
): Promise<CategoryMapping> {
  return getCategoryGroupService().mapSubCategory(subCategory, parentGroupId);
}

export async function unmapSubCategory(subCategory: string): Promise<void> {
  return getCategoryGroupService().unmapSubCategory(subCategory);
}

export async function buildCategoryLookup(): Promise<Map<string, string>> {
  return getCategoryGroupService().buildCategoryLookup();
}
