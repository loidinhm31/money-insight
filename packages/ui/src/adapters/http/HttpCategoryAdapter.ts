import { HttpAdapter } from "./HttpAdapter";
import type { ICategoryService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Category } from "@money-insight/ui/types";

/**
 * HTTP adapter for category operations
 */
export class HttpCategoryAdapter
  extends HttpAdapter
  implements ICategoryService
{
  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>("/categories");
  }

  async addCategory(
    category: Omit<Category, "id" | "syncVersion" | "syncedAt">,
  ): Promise<Category> {
    return this.post<Category>("/categories", category);
  }

  async updateCategory(category: Category): Promise<Category> {
    return this.put<Category>(`/categories/${category.id}`, category);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.delete(`/categories/${id}`);
  }

  async renameCategory(oldName: string, newName: string): Promise<void> {
    return this.post("/categories/rename", { oldName, newName });
  }
}
