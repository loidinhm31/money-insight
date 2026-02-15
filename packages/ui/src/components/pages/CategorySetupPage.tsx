import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Layers,
  Loader2,
  Plus,
  Trash2,
  X,
  Edit2,
  Check,
  ArrowUpCircle,
  Link,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@money-insight/ui/components/atoms";
import { MobileHeader } from "@money-insight/ui/components/molecules";
import {
  useCategoryGroupStore,
  useSpendingStore,
} from "@money-insight/ui/stores";
import type { CategoryGroup } from "@money-insight/ui/types";
import { formatCurrency } from "@money-insight/ui/lib";

interface CategorySetupPageProps {
  onBack?: () => void;
}

export function CategorySetupPage({ onBack }: CategorySetupPageProps) {
  const {
    groups,
    mappings,
    isLoading,
    addGroup,
    updateGroup,
    deleteGroup,
    mapSubCategory,
    unmapSubCategory,
  } = useCategoryGroupStore();

  const { transactions } = useSpendingStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all unique categories from transactions with their stats
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();

    transactions.forEach((t) => {
      if (t.expense > 0) {
        const current = stats.get(t.category) || { count: 0, total: 0 };
        stats.set(t.category, {
          count: current.count + 1,
          total: current.total + t.expense,
        });
      }
    });

    return stats;
  }, [transactions]);

  // Get mapped sub-categories (sub-category name -> parent group id)
  const mappedCategories = useMemo(() => {
    const map = new Map<string, string>();
    mappings.forEach((m) => {
      map.set(m.subCategory, m.parentGroupId);
    });
    return map;
  }, [mappings]);

  // Get parent group names for quick lookup
  const parentGroupNames = useMemo(() => {
    return new Set(groups.map((g) => g.name));
  }, [groups]);

  // Get unmapped categories (excluding those that are already parent groups)
  const unmappedCategories = useMemo(() => {
    return Array.from(categoryStats.keys())
      .filter((cat) => !mappedCategories.has(cat) && !parentGroupNames.has(cat))
      .sort((a, b) => {
        const statsA = categoryStats.get(a)!;
        const statsB = categoryStats.get(b)!;
        return statsB.total - statsA.total;
      });
  }, [categoryStats, mappedCategories, parentGroupNames]);

  // Get sub-categories for a group
  const getSubCategoriesForGroup = useCallback(
    (groupId: string) => {
      return mappings
        .filter((m) => m.parentGroupId === groupId)
        .map((m) => ({
          name: m.subCategory,
          stats: categoryStats.get(m.subCategory) || { count: 0, total: 0 },
        }))
        .sort((a, b) => b.stats.total - a.stats.total);
    },
    [mappings, categoryStats],
  );

  // Get stats for a parent group (including its own transactions if any)
  const getGroupStats = useCallback(
    (group: CategoryGroup) => {
      const subCategories = getSubCategoriesForGroup(group.id);
      const subTotal = subCategories.reduce((sum, c) => sum + c.stats.total, 0);
      const ownStats = categoryStats.get(group.name) || { count: 0, total: 0 };
      return {
        total: subTotal + ownStats.total,
        subCount: subCategories.length,
        ownStats,
      };
    },
    [getSubCategoriesForGroup, categoryStats],
  );

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      await addGroup({
        name: newGroupName.trim(),
        isExpense: true,
      });
      setNewGroupName("");
      setIsAddingGroup(false);
    } catch (error) {
      console.error("Failed to add group:", error);
    }
  };

  // Promote an existing category to be a parent group
  const handlePromoteToParent = async (categoryName: string) => {
    try {
      await addGroup({
        name: categoryName,
        isExpense: true,
      });
      setSelectedCategory(null);
    } catch (error) {
      console.error("Failed to promote category:", error);
    }
  };

  const handleUpdateGroup = async (group: CategoryGroup) => {
    if (!editingGroupName.trim()) return;

    try {
      await updateGroup({
        ...group,
        name: editingGroupName.trim(),
      });
      setEditingGroupId(null);
      setEditingGroupName("");
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleMapCategory = async (subCategory: string, groupId: string) => {
    try {
      await mapSubCategory(subCategory, groupId);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Failed to map category:", error);
    }
  };

  const handleUnmapCategory = async (subCategory: string) => {
    try {
      await unmapSubCategory(subCategory);
    } catch (error) {
      console.error("Failed to unmap category:", error);
    }
  };

  // Auto-expand groups when first loaded
  useEffect(() => {
    if (groups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groups.map((g) => g.id)));
    }
  }, [groups, expandedGroups.size]);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <MobileHeader
        title="Category Setup"
        showBack={!!onBack}
        onBack={onBack}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Parent Groups Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Parent Categories</CardTitle>
                  <CardDescription>
                    Group related categories together for analysis
                  </CardDescription>
                </div>
              </div>
              {!isAddingGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add new group input */}
            {isAddingGroup && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New parent category name..."
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGroup();
                    if (e.key === "Escape") {
                      setIsAddingGroup(false);
                      setNewGroupName("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddGroup}
                  disabled={!newGroupName.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingGroup(false);
                    setNewGroupName("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Existing groups */}
            {groups.length === 0 && !isAddingGroup ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No parent categories yet</p>
                <p className="text-xs mt-1">
                  Create one or promote an existing category below
                </p>
              </div>
            ) : (
              groups.map((group) => {
                const subCategories = getSubCategoriesForGroup(group.id);
                const isExpanded = expandedGroups.has(group.id);
                const isEditing = editingGroupId === group.id;
                const groupStats = getGroupStats(group);

                return (
                  <div
                    key={group.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Group header */}
                    <div
                      className="flex items-center gap-2 p-3 bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        !isEditing && toggleGroupExpanded(group.id)
                      }
                    >
                      {(subCategories.length > 0 ||
                        groupStats.ownStats.count > 0) && (
                        <button className="p-0.5">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      {subCategories.length === 0 &&
                        groupStats.ownStats.count === 0 && (
                          <div className="w-5" />
                        )}

                      {isEditing ? (
                        <Input
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          className="flex-1 h-7 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateGroup(group);
                            if (e.key === "Escape") {
                              setEditingGroupId(null);
                              setEditingGroupName("");
                            }
                          }}
                        />
                      ) : (
                        <span className="flex-1 font-medium text-sm">
                          {group.name}
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground">
                        {subCategories.length > 0
                          ? `${subCategories.length} sub-cat`
                          : "no sub-cat"}
                      </span>
                      {groupStats.total > 0 && (
                        <span className="text-xs font-medium text-destructive">
                          {formatCurrency(groupStats.total)}
                        </span>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateGroup(group);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(null);
                              setEditingGroupName("");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Sub-categories and own transactions */}
                    {isExpanded &&
                      (subCategories.length > 0 ||
                        groupStats.ownStats.count > 0) && (
                        <div className="border-t divide-y">
                          {/* Show parent's own transactions if any */}
                          {groupStats.ownStats.count > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2 pl-10 text-sm bg-primary/5">
                              <span className="flex-1 italic text-muted-foreground">
                                (direct transactions)
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {groupStats.ownStats.count} txns
                              </span>
                              <span className="text-xs text-destructive">
                                {formatCurrency(groupStats.ownStats.total)}
                              </span>
                              <div className="w-6" />
                            </div>
                          )}
                          {subCategories.map((subCat) => (
                            <div
                              key={subCat.name}
                              className="flex items-center gap-3 px-4 py-2 pl-10 text-sm hover:bg-accent/20"
                            >
                              <span className="flex-1">{subCat.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {subCat.stats.count} txns
                              </span>
                              <span className="text-xs text-destructive">
                                {formatCurrency(subCat.stats.total)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleUnmapCategory(subCat.name)}
                                title="Remove from parent"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Unmapped Categories Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FolderPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Standalone Categories
                </CardTitle>
                <CardDescription>
                  Click to make parent or assign to existing parent
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {unmappedCategories.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="h-10 w-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All categories are organized!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unmappedCategories.map((category) => {
                  const stats = categoryStats.get(category)!;
                  const isSelected = selectedCategory === category;

                  return (
                    <div key={category}>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() =>
                          setSelectedCategory(isSelected ? null : category)
                        }
                      >
                        <span className="flex-1 text-sm font-medium">
                          {category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stats.count} txns
                        </span>
                        <span className="text-xs font-medium text-destructive">
                          {formatCurrency(stats.total)}
                        </span>
                      </div>

                      {/* Action options */}
                      {isSelected && (
                        <div className="mt-2 ml-4 p-3 rounded-lg bg-accent/30 space-y-3">
                          {/* Option 1: Make as parent */}
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-sm"
                              onClick={() => handlePromoteToParent(category)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                              )}
                              Make "{category}" a parent category
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 ml-1">
                              This category will become a parent that other
                              categories can be grouped under
                            </p>
                          </div>

                          {/* Option 2: Assign to existing parent */}
                          {groups.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                Or assign to existing parent:
                              </p>
                              <div className="space-y-1">
                                {groups.map((group) => (
                                  <Button
                                    key={group.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-sm h-8"
                                    onClick={() =>
                                      handleMapCategory(category, group.id)
                                    }
                                  >
                                    <Layers className="h-3.5 w-3.5 mr-2 text-primary" />
                                    {group.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
