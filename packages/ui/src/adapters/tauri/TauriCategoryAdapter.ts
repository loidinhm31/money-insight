import { invoke } from "@tauri-apps/api/core";
import type { ICategoryService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Category } from "@money-insight/ui/types";

/**
 * Tauri adapter for category operations using invoke() calls
 */
export class TauriCategoryAdapter implements ICategoryService {
  async getCategories(): Promise<Category[]> {
    return invoke("get_categories");
  }
}
