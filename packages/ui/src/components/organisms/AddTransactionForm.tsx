import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@money-insight/ui/components/atoms";
import { TransactionForm } from "./TransactionForm";
import type {
  NewTransaction,
  Category,
  Account,
} from "@money-insight/ui/types";

export interface AddTransactionFormProps {
  onSubmit: (transaction: NewTransaction) => Promise<void>;
  isDbReady: boolean;
  getCategories: () => Promise<Category[]>;
  getAccounts: () => Promise<Account[]>;
  onSuccess?: () => void;
}

export function AddTransactionForm({
  onSubmit,
  isDbReady,
  getCategories,
  getAccounts,
  onSuccess,
}: AddTransactionFormProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        <TransactionForm
          mode="add"
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          isDbReady={isDbReady}
          getCategories={getCategories}
          getAccounts={getAccounts}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
