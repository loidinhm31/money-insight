import { useState, useEffect } from "react";
import { Trash2, DollarSign, CreditCard, Tag } from "lucide-react";
import {
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@money-insight/ui/components/atoms";
import { FormField } from "@money-insight/ui/components/molecules";
import type { Account, NewAccount } from "@money-insight/ui/types";

interface BaseAccountFormProps {
  onCancel: () => void;
}

interface AddAccountFormProps extends BaseAccountFormProps {
  mode: "add";
  account?: never;
  onSubmit: (account: NewAccount) => Promise<void>;
  onDelete?: never;
}

interface EditAccountFormProps extends BaseAccountFormProps {
  mode: "edit";
  account: Account;
  onSubmit: (account: Account) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export type AccountFormProps = AddAccountFormProps | EditAccountFormProps;

export function AccountForm(props: AccountFormProps) {
  const { mode, onCancel } = props;
  const account = mode === "edit" ? props.account : undefined;
  const onDelete = mode === "edit" ? props.onDelete : undefined;

  const [name, setName] = useState(account?.name || "");
  const [accountType, setAccountType] = useState(
    account?.accountType || "Cash",
  );
  const [icon, setIcon] = useState(account?.icon || "💰");
  const [initialBalance, setInitialBalance] = useState(
    account?.initialBalance?.toString() || "0",
  );
  const [currency, setCurrency] = useState(account?.currency || "VND");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form when switching between add/edit or when account changes
  useEffect(() => {
    if (mode === "edit" && account) {
      setName(account.name);
      setAccountType(account.accountType || "Cash");
      setIcon(account.icon || "💰");
      setInitialBalance(account.initialBalance.toString());
      setCurrency(account.currency);
      setConfirmDelete(false);
    } else if (mode === "add") {
      setName("");
      setAccountType("Cash");
      setIcon("💰");
      setInitialBalance("0");
      setCurrency("VND");
      setConfirmDelete(false);
    }
  }, [mode, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setLoading(true);

    try {
      const numericBalance = parseFloat(initialBalance) || 0;

      if (mode === "edit" && account) {
        const updatedAccount: Account = {
          ...account,
          name: name.trim(),
          accountType: accountType || undefined,
          icon: icon || undefined,
          initialBalance: numericBalance,
          currency,
          updatedAt: new Date().toISOString(),
        };

        await props.onSubmit(updatedAccount);
      } else if (mode === "add") {
        const newAccount: NewAccount = {
          name: name.trim(),
          accountType: accountType || undefined,
          icon: icon || undefined,
          initialBalance: numericBalance,
          currency,
        };

        await props.onSubmit(newAccount);
      }

      onCancel();
    } catch (error) {
      console.error("Failed to save account:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !account) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await onDelete(account.id);
      onCancel();
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const isEdit = mode === "edit";

  return (
    <>
      {/* Sticky Header */}
      <DialogHeader className="sticky top-0 z-10 px-6 pt-6 pb-4 flex-shrink-0">
        <DialogTitle>{isEdit ? "Edit Account" : "Add New Account"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the account details."
            : "Create a new account to track your finances."}
        </DialogDescription>
      </DialogHeader>

      {/* Scrollable Content */}
      <div
        className="overflow-y-auto px-6 py-4 flex-1"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} id="account-form">
          <div className="grid gap-4">
            {/* Name */}
            <FormField
              label="Name"
              id="account-name"
              icon={<Tag className="h-4 w-4" />}
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Wallet, Savings, Credit Card"
            />

            {/* Account Type */}
            <FormField
              label="Account Type"
              id="account-type"
              icon={<CreditCard className="h-4 w-4" />}
            >
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Account">Bank Account</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Icon */}
            <FormField
              label="Icon"
              id="account-icon"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g., 💰 🏦 💳 📊 💎"
            />

            {/* Initial Balance & Currency */}
            <FormField
              label="Initial Balance"
              id="account-balance"
              icon={<DollarSign className="h-4 w-4" />}
              required
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0"
                  className="flex-1"
                  required
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormField>
          </div>
        </form>
      </div>

      {/* Fixed Footer */}
      <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEdit && onDelete && (
            <Button
              type="button"
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={deleting || loading}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting
                ? "Deleting..."
                : confirmDelete
                  ? "Confirm Delete"
                  : "Delete"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || deleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="account-form"
            disabled={loading || deleting || !name.trim()}
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Adding..."
              : isEdit
                ? "Save Changes"
                : "Add Account"}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
