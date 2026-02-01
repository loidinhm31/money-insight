import type { ICategoryService } from "@/adapters/factory/interfaces";
import type { Category } from "@money-insight/ui/types";
import { db, generateId } from "./database";

export class IndexedDBCategoryAdapter implements ICategoryService {
  async getCategories(): Promise<Category[]> {
    // Derive categories from existing transactions
    const transactions = await db.transactions.toArray();
    const categoryMap = new Map<string, { isExpense: boolean }>();

    for (const tx of transactions) {
      if (!categoryMap.has(tx.category)) {
        categoryMap.set(tx.category, {
          isExpense: tx.expense > 0,
        });
      }
    }

    // Also include any manually created categories
    const storedCategories = await db.categories.toArray();
    for (const cat of storedCategories) {
      if (!categoryMap.has(cat.name)) {
        categoryMap.set(cat.name, { isExpense: cat.is_expense });
      }
    }

    return Array.from(categoryMap.entries()).map(([name, info]) => {
      // Check if there's a stored category with this name to get its UUID
      const stored = storedCategories.find((c) => c.name === name);
      return {
        id: stored?.id || generateId(),
        name,
        icon: stored?.icon,
        color: stored?.color,
        is_expense: info.isExpense,
        sync_version: stored?.sync_version ?? 0,
        synced_at: stored?.synced_at ?? null,
      };
    });
  }
}
