import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@money-insight/ui/components/atoms";
import { useSpendingStore } from "@money-insight/ui/stores";
import { useNav } from "@money-insight/ui/hooks";
import {
  TimePeriodSelector,
  AccountStats,
} from "@money-insight/ui/components/molecules";
import {
  GroupedTransactionList,
  EditTransactionDialog,
  AccountList,
  EditAccountDialog,
} from "@money-insight/ui/components/organisms";
import type { TimePeriodMode } from "@money-insight/ui/lib";
import type { Transaction, Account } from "@money-insight/ui/types";
import * as categoryService from "@money-insight/ui/services/categoryService";

export function TransactionPage() {
  const { to } = useNav();
  const {
    transactions,
    accounts,
    valuesHidden,
    isDbReady,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useSpendingStore();

  const [activeTab, setActiveTab] = useState("transactions");
  const [periodMode, setPeriodMode] = useState<TimePeriodMode>("month");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const getCategories = useCallback(() => categoryService.getCategories(), []);

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
  }, []);

  const handleTransactionSubmit = useCallback(
    async (transaction: Transaction) => {
      await updateTransaction(transaction);
    },
    [updateTransaction],
  );

  const handleTransactionDelete = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
    },
    [deleteTransaction],
  );

  const handleAccountClick = useCallback((account: Account) => {
    setEditingAccount(account);
  }, []);

  const handleAccountSubmit = useCallback(
    async (account: Account) => {
      await updateAccount(account);
    },
    [updateAccount],
  );

  const handleAccountDelete = useCallback(
    async (id: string) => {
      await deleteAccount(id);
    },
    [deleteAccount],
  );

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Link
          to={to("dashboard")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: "#374151" }} />
        </Link>
        <div>
          <h1
            className="text-xl font-bold font-heading"
            style={{ color: "#111827" }}
          >
            Transactions & Accounts
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {activeTab === "transactions"
              ? `${transactions.length} transactions`
              : `${accounts.length} accounts`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div
            className="sticky top-0 z-10 border-b px-4 pt-2"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <TabsList className="w-full grid grid-cols-2 mb-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            </TabsList>
          </div>

          {/* Transactions Tab Content */}
          <TabsContent value="transactions" className="mt-0">
            {/* Sticky period selector */}
            <div
              className="sticky top-[52px] z-10 border-b p-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: "#374151" }}
                >
                  Group by
                </span>
                <TimePeriodSelector
                  value={periodMode}
                  onChange={setPeriodMode}
                />
              </div>
            </div>

            {/* Grouped transaction list */}
            <div className="p-4">
              <GroupedTransactionList
                transactions={transactions}
                periodMode={periodMode}
                valuesHidden={valuesHidden}
                onTransactionClick={handleTransactionClick}
              />
            </div>
          </TabsContent>

          {/* Accounts Tab Content */}
          <TabsContent value="accounts" className="mt-0">
            <div className="p-4 space-y-4">
              {accounts.length > 0 && <AccountStats accounts={accounts} />}
              <AccountList
                accounts={accounts}
                onAccountClick={handleAccountClick}
                onAccountDelete={handleAccountDelete}
                onAccountAdd={addAccount}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleTransactionSubmit}
        onDelete={handleTransactionDelete}
        isDbReady={isDbReady}
        getCategories={getCategories}
        getAccounts={async () => accounts}
      />

      {/* Edit Account Dialog */}
      <EditAccountDialog
        account={editingAccount}
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        onSubmit={handleAccountSubmit}
        onDelete={handleAccountDelete}
      />
    </div>
  );
}
