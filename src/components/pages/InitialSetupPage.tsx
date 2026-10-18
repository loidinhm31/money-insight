import { useCallback } from "react";
import { useSpendingStore } from "../../stores";
import { useNav } from "../../hooks";
import { FileUploadSection } from "../templates";
import { parseCSVForImport } from "../../lib";
import * as categoryService from "../../services/categoryService";
import * as accountService from "../../services/accountService";
import type { NewTransaction } from "../../types";

/**
 * Initial setup page - shown when no transactions exist
 * Allows user to upload CSV or manually add first transaction
 */
export function InitialSetupPage() {
  const { navigate } = useNav();
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
      navigate("/dashboard");
    },
    [importFromCSV, navigate],
  );

  // Handle add transaction
  const handleAddTransaction = useCallback(
    async (tx: NewTransaction): Promise<void> => {
      await addTransaction(tx);
      // Navigate to dashboard after adding first transaction
      navigate("/dashboard");
    },
    [addTransaction, navigate],
  );

  // Get categories and accounts for form
  const getCategories = useCallback(() => categoryService.getCategories(), []);
  const getAccounts = useCallback(() => accountService.getAccounts(), []);

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
