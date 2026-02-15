import { Dialog, DialogContent } from "@money-insight/ui/components/atoms";
import { TransactionForm } from "./TransactionForm";
import type { Transaction, Category, Account } from "@money-insight/ui/types";

export interface EditTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isDbReady: boolean;
  getCategories: () => Promise<Category[]>;
  getAccounts: () => Promise<Account[]>;
}

export function EditTransactionDialog({
  transaction,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  isDbReady,
  getCategories,
  getAccounts,
}: EditTransactionDialogProps) {
  if (!transaction) return null;

  const handleDelete = onDelete
    ? async () => {
        await onDelete(transaction.id);
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        <TransactionForm
          mode="edit"
          transaction={transaction}
          onSubmit={onSubmit}
          onCancel={onClose}
          onDelete={handleDelete}
          isDbReady={isDbReady}
          getCategories={getCategories}
          getAccounts={getAccounts}
        />
      </DialogContent>
    </Dialog>
  );
}
