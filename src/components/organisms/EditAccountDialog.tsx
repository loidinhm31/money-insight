import { Dialog, DialogContent } from "../atoms";
import { AccountForm } from ".";
import type { Account } from "../../types";

export interface EditAccountDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (account: Account) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: EditAccountDialogProps) {
  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        <AccountForm
          mode="edit"
          account={account}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
