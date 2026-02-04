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
}
