import { useCallback } from "react";
import { useSpendingStore } from "@money-insight/ui/stores";
import { useNav } from "@money-insight/ui/hooks";
import { FileUploadSection } from "@money-insight/ui/components/templates";
import { parseCSVForImport, databaseService } from "@money-insight/ui/lib";
import type { NewTransaction } from "@money-insight/ui/types";

/**
 * Initial setup page - shown when no transactions exist
 * Allows user to upload CSV or manually add first transaction
 */
export function InitialSetupPage() {
  const { nav } = useNav();
  const { isDbReady, addTransaction, importFromCSV } = useSpendingStore();

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

  // Handle add transaction
  const handleAddTransaction = useCallback(
    async (tx: NewTransaction): Promise<void> => {
      await addTransaction(tx);
      // Navigate to dashboard after adding first transaction
      nav("dashboard");
    },
    [addTransaction, nav],
  );

  // Get categories and accounts for form
  const getCategories = useCallback(() => databaseService.getCategories(), []);
  const getAccounts = useCallback(() => databaseService.getAccounts(), []);

  return (
    <FileUploadSection
      isDbReady={isDbReady}
      onFileProcess={handleFileProcess}
      onAddTransaction={handleAddTransaction}
      getCategories={getCategories}
      getAccounts={getAccounts}
    />
  );
}
