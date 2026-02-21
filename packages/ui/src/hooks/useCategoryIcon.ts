import { useCallback } from "react";
import { useCategoryGroupStore } from "@money-insight/ui/stores";

/**
 * Hook that resolves a category name to its icon name.
 *
 * Resolution order:
 * 1. If the category is a parent group name → return that group's icon
 * 2. If the category is a mapped sub-category → resolve to parent group → return parent's icon
 * 3. Fallback: undefined (no icon)
 */
export function useCategoryIcon() {
  const { groups, mappings } = useCategoryGroupStore();

  const getIcon = useCallback(
    (categoryName: string): string | undefined => {
      // 1. Check if it's a parent group name
      const group = groups.find((g) => g.name === categoryName);
      if (group) return group.icon;

      // 2. Check if it's a mapped sub-category → resolve to parent group
      const mapping = mappings.find((m) => m.subCategory === categoryName);
      if (mapping) {
        const parentGroup = groups.find((g) => g.id === mapping.parentGroupId);
        if (parentGroup) return parentGroup.icon;
      }

      // 3. No icon found
      return undefined;
    },
    [groups, mappings],
  );

  return { getIcon };
}
