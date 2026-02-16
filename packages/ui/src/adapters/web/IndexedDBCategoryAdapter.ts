import type { ICategoryService } from "@money-insight/ui/adapters/factory/interfaces";
import type { Category } from "@money-insight/ui/types";
import { db, generateId, getCurrentTimestamp } from "./database";

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
        categoryMap.set(cat.name, { isExpense: cat.isExpense });
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
        isExpense: info.isExpense,
        syncVersion: stored?.syncVersion ?? 0,
        syncedAt: stored?.syncedAt ?? null,
      };
    });
  }

  async addCategory(
    categoryData: Omit<Category, "id" | "syncVersion" | "syncedAt">,
  ): Promise<Category> {
    const category: Category = {
      ...categoryData,
      id: generateId(),
      syncVersion: getCurrentTimestamp(),
      syncedAt: null,
    };

    await db.categories.add(category);
    return category;
  }

  async updateCategory(category: Category): Promise<Category> {
    const updated: Category = {
      ...category,
      syncVersion: getCurrentTimestamp(),
      syncedAt: null,
    };

    await db.categories.put(updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.categories.delete(id);
  }

  async renameCategory(oldName: string, newName: string): Promise<void> {
    // Update all transactions with the old category name
    await db.transaction("rw", db.transactions, db.categories, async () => {
      // Update transactions
      const transactionsToUpdate = await db.transactions
        .where("category")
        .equals(oldName)
        .toArray();

      for (const tx of transactionsToUpdate) {
        await db.transactions.update(tx.id, {
          category: newName,
          syncVersion: getCurrentTimestamp(),
          syncedAt: null,
        });
      }

      // Update the category record if it exists
      const storedCategory = await db.categories
        .filter((c) => c.name === oldName)
        .first();

      if (storedCategory) {
        await db.categories.update(storedCategory.id, {
          name: newName,
          syncVersion: getCurrentTimestamp(),
          syncedAt: null,
        });
      }
    });
  }
}
