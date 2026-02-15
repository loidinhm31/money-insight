import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@money-insight/ui/components/atoms";
import { AccountForm } from "@money-insight/ui/components/organisms";
import type { NewAccount, Account } from "@money-insight/ui/types";

export interface AddAccountDialogProps {
  onSubmit: (account: NewAccount) => Promise<Account | void>;
}

export function AddAccountDialog({ onSubmit }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (account: NewAccount) => {
    await onSubmit(account);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        <AccountForm
          mode="add"
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
