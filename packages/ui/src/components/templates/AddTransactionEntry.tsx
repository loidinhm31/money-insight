import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@money-insight/ui/components/atoms";
import { PenLine, Upload } from "lucide-react";
import type {
  Account,
  Category,
  NewTransaction,
} from "@money-insight/ui/types";
import {
  AddTransactionForm,
  FileUpload,
} from "@money-insight/ui/components/organisms";
import { MobileHeader } from "@money-insight/ui/components/molecules";

interface AddTransactionPageProps {
  onAddTransaction: (tx: NewTransaction) => Promise<void>;
  onImportCSV: (file: File) => Promise<void>;
  getCategories: () => Promise<Category[]>;
  getAccounts: () => Promise<Account[]>;
  isDbReady: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

/**
 * Add Transaction page - supports both manual entry and CSV import
 */
export function AddTransactionEntry({
  onAddTransaction,
  onImportCSV,
  getCategories,
  getAccounts,
  isDbReady,
  onBack,
  onSuccess,
}: AddTransactionPageProps) {
  const [activeTab, setActiveTab] = useState<string>("manual");

  const handleAddTransaction = useCallback(
    async (tx: NewTransaction) => {
      await onAddTransaction(tx);
      if (onSuccess) {
        onSuccess();
      }
    },
    [onAddTransaction, onSuccess],
  );

  const handleFileProcess = useCallback(
    async (file: File) => {
      await onImportCSV(file);
      if (onSuccess) {
        onSuccess();
      }
    },
    [onImportCSV, onSuccess],
  );

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <MobileHeader
        title="Add Transaction"
        showBack={!!onBack}
        onBack={onBack}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" className="gap-2">
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>
                  Enter the details of your transaction manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddTransactionForm
                  onSubmit={handleAddTransaction}
                  getCategories={getCategories}
                  getAccounts={getAccounts}
                  isDbReady={isDbReady}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Import from CSV</CardTitle>
                <CardDescription>
                  Upload a Money Lover export or similar CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileProcess={handleFileProcess} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
