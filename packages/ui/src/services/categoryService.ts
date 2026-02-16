import { getCategoryService } from "@money-insight/ui/adapters";
import type { Category } from "@money-insight/ui/types";

export async function getCategories(): Promise<Category[]> {
  return getCategoryService().getCategories();
}

export async function addCategory(
  category: Omit<Category, "id" | "syncVersion" | "syncedAt">,
): Promise<Category> {
  return getCategoryService().addCategory(category);
}

export async function updateCategory(category: Category): Promise<Category> {
  return getCategoryService().updateCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  return getCategoryService().deleteCategory(id);
}

export async function renameCategory(
  oldName: string,
  newName: string,
): Promise<void> {
  return getCategoryService().renameCategory(oldName, newName);
}
