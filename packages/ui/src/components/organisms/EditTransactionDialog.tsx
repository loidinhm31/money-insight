import { useMemo } from "react";
import { Dialog, DialogContent } from "@money-insight/ui/components/atoms";
import { TransactionForm } from "./TransactionForm";
import { TransferForm } from "./TransferForm";
import type {
  Transaction,
  Category,
  Account,
  TransferParams,
} from "@money-insight/ui/types";

export interface EditTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateTransfer?: (
    transferId: string,
    params: TransferParams,
  ) => Promise<void>;
  onDeleteTransfer?: (transferId: string) => Promise<void>;
  isDbReady: boolean;
  getCategories: () => Promise<Category[]>;
  getAccounts: () => Promise<Account[]>;
  accounts?: Account[];
  /** All transactions for in-store transfer pair lookup */
  allTransactions?: Transaction[];
}

export function EditTransactionDialog({
  transaction,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  onUpdateTransfer,
  onDeleteTransfer,
  isDbReady,
  getCategories,
  getAccounts,
  accounts = [],
  allTransactions = [],
}: EditTransactionDialogProps) {
  const isTransfer =
    !!transaction &&
    transaction.source === "transfer" &&
    !!transaction.transferId;

  // Synchronous in-store lookup — avoids async DB round-trip per dialog open
  const transferPair = useMemo(() => {
    if (!isTransfer || !transaction?.transferId || !isOpen) return null;
    const pair = allTransactions.filter(
      (t) => t.transferId === transaction.transferId,
    );
    const outgoing = pair.find((t) => t.amount < 0);
    const incoming = pair.find((t) => t.amount > 0);
    if (outgoing && incoming) return { outgoing, incoming };
    return null;
  }, [isTransfer, transaction?.transferId, isOpen, allTransactions]);

  if (!transaction) return null;

  const handleDelete = onDelete
    ? async () => {
        await onDelete(transaction.id);
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        {isTransfer && transferPair ? (
          <TransferForm
            mode="edit"
            transferId={transaction.transferId!}
            outgoing={transferPair.outgoing}
            incoming={transferPair.incoming}
            accounts={accounts}
            isDbReady={isDbReady}
            onSubmit={async (transferId, params) => {
              await onUpdateTransfer?.(transferId, params);
              onClose();
            }}
            onDelete={async (transferId) => {
              await onDeleteTransfer?.(transferId);
              onClose();
            }}
            onCancel={onClose}
          />
        ) : isTransfer && !transferPair ? (
          // Loading state while fetching pair
          <div className="p-6 text-center text-muted-foreground text-sm">
            Loading transfer…
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
