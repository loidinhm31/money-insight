import { useCallback } from "react";
import { useSpendingStore } from "@money-insight/ui/stores";
import { useNav } from "@money-insight/ui/hooks";
import { AddTransactionEntry } from "@money-insight/ui/components/templates";
import { parseCSVForImport } from "@money-insight/ui/lib";
import * as categoryService from "@money-insight/ui/services/categoryService";
import * as accountService from "@money-insight/ui/services/accountService";
import type { NewTransaction } from "@money-insight/ui/types";

/**
 * Add Transaction page - allows manual transaction entry or CSV import
 */
export function AddTransactionPage() {
  const { nav } = useNav();
  const { isDbReady, addTransaction, importFromCSV } = useSpendingStore();

  // Handle add transaction
  const handleAddTransaction = useCallback(
    async (tx: NewTransaction): Promise<void> => {
      await addTransaction(tx);
    },
    [addTransaction],
  );

  // Handle CSV file processing
  const handleFileProcess = useCallback(
    async (file: File) => {
      const transactions = await parseCSVForImport(file);
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV file");
      }
      await importFromCSV(transactions, file.name);
      // Navigate to dashboard after successful import
      nav("dashboard");
    },
    [importFromCSV, nav],
  );

  // Success handler - navigate to dashboard
  const handleSuccess = useCallback(() => {
    nav("dashboard");
  }, [nav]);

  // Get categories and accounts for form
  const getCategories = useCallback(() => categoryService.getCategories(), []);
  const getAccounts = useCallback(() => accountService.getAccounts(), []);

  return (
    <AddTransactionEntry
      onAddTransaction={handleAddTransaction}
      onImportCSV={handleFileProcess}
      getCategories={getCategories}
      getAccounts={getAccounts}
      isDbReady={isDbReady}
      onSuccess={handleSuccess}
    />
  );
}
