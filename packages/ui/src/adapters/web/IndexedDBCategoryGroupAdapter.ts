import type { ICategoryGroupService } from "@money-insight/ui/adapters/factory/interfaces";
import type { CategoryGroup, CategoryMapping } from "@money-insight/ui/types";
import { db, generateId } from "./database";
import { trackDelete } from "./indexedDbHelpers";

export class IndexedDBCategoryGroupAdapter implements ICategoryGroupService {
  async getCategoryGroups(): Promise<CategoryGroup[]> {
    return db.categoryGroups.toArray();
  }

  async getCategoryGroup(id: string): Promise<CategoryGroup | undefined> {
    return db.categoryGroups.get(id);
  }

  async addCategoryGroup(
    group: Omit<CategoryGroup, "id" | "syncVersion" | "syncedAt">,
  ): Promise<CategoryGroup> {
    const newGroup: CategoryGroup = {
      id: generateId(),
      ...group,
      syncVersion: 1,
      syncedAt: null,
    };
    await db.categoryGroups.add(newGroup);
    return newGroup;
  }

  async updateCategoryGroup(group: CategoryGroup): Promise<CategoryGroup> {
    const existing = await db.categoryGroups.get(group.id);
    const updated: CategoryGroup = {
      ...group,
      syncVersion: (existing?.syncVersion || 0) + 1,
      syncedAt: null,
    };
    await db.categoryGroups.put(updated);
    return updated;
  }

  async deleteCategoryGroup(id: string): Promise<void> {
    const existing = await db.categoryGroups.get(id);
    if (existing) {
      await trackDelete("categoryGroups", id, existing.syncVersion || 0);
    }

    // Cascade delete all mappings for this group
    const mappings = await db.categoryMappings
      .where("parentGroupId")
      .equals(id)
      .toArray();

    for (const mapping of mappings) {
      await trackDelete(
        "categoryMappings",
        mapping.id,
        mapping.syncVersion || 0,
      );
    }

    await db.categoryMappings.where("parentGroupId").equals(id).delete();
    await db.categoryGroups.delete(id);
  }

  async getCategoryMappings(): Promise<CategoryMapping[]> {
    return db.categoryMappings.toArray();
  }

  async getMappingsForGroup(parentGroupId: string): Promise<CategoryMapping[]> {
    return db.categoryMappings
      .where("parentGroupId")
      .equals(parentGroupId)
      .toArray();
  }

  async mapSubCategory(
    subCategory: string,
    parentGroupId: string,
  ): Promise<CategoryMapping> {
    // Check if mapping already exists for this subCategory
    const existing = await db.categoryMappings
      .where("subCategory")
      .equals(subCategory)
      .first();

    if (existing) {
      // Update existing mapping (upsert)
      const updated: CategoryMapping = {
        ...existing,
        parentGroupId,
        syncVersion: existing.syncVersion + 1,
        syncedAt: null,
      };
      await db.categoryMappings.put(updated);
      return updated;
    }

    // Create new mapping
    const newMapping: CategoryMapping = {
      id: generateId(),
      subCategory,
      parentGroupId,
      syncVersion: 1,
      syncedAt: null,
    };
    await db.categoryMappings.add(newMapping);
    return newMapping;
  }

  async unmapSubCategory(subCategory: string): Promise<void> {
    const existing = await db.categoryMappings
      .where("subCategory")
      .equals(subCategory)
      .first();

    if (existing) {
      await trackDelete(
        "categoryMappings",
        existing.id,
        existing.syncVersion || 0,
      );
      await db.categoryMappings.delete(existing.id);
    }
  }

  async buildCategoryLookup(): Promise<Map<string, string>> {
    const [groups, mappings] = await Promise.all([
      this.getCategoryGroups(),
      this.getCategoryMappings(),
    ]);

    const groupMap = new Map<string, string>();
    for (const group of groups) {
      groupMap.set(group.id, group.name);
    }

    const lookup = new Map<string, string>();
    for (const mapping of mappings) {
      const parentName = groupMap.get(mapping.parentGroupId);
      if (parentName) {
        lookup.set(mapping.subCategory, parentName);
      }
    }

    return lookup;
  }
}
