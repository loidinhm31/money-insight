import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowRight, DollarSign, Trash2 } from "lucide-react";
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
import { DatePicker, FormField } from "@money-insight/ui/components/molecules";
import { parseTransferNote } from "@money-insight/ui/services/transferService";
import { SUPPORTED_CURRENCIES } from "@money-insight/shared";
import type { Transaction, Account, TransferParams } from "@money-insight/ui/types";

interface TransferFormBaseProps {
  accounts: Account[];
  isDbReady: boolean;
  onCancel: () => void;
}

interface TransferFormAddProps extends TransferFormBaseProps {
  mode: "add";
  onSubmit: (params: TransferParams) => Promise<void>;
}

interface TransferFormEditProps extends TransferFormBaseProps {
  mode: "edit";
  transferId: string;
  outgoing: Transaction;
  incoming: Transaction;
  onSubmit: (transferId: string, params: TransferParams) => Promise<void>;
  onDelete: (transferId: string) => Promise<void>;
}

export type TransferFormProps = TransferFormAddProps | TransferFormEditProps;

export function TransferForm(props: TransferFormProps) {
  const { mode, accounts, isDbReady, onCancel } = props;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState("");

  const outgoing = mode === "edit" ? props.outgoing : undefined;
  const incoming = mode === "edit" ? props.incoming : undefined;

  useEffect(() => {
    if (mode === "edit" && outgoing && incoming) {
      setFromAccount(outgoing.account);
      setToAccount(incoming.account);
      setAmount(String(Math.abs(outgoing.amount)));
      setCurrency(outgoing.currency);
      setDate(new Date(outgoing.date));
      const parsed = parseTransferNote(outgoing.note);
      setNote(parsed?.userNote ?? outgoing.note);
      setConfirmDelete(false);
    }
  // Include all fields read by the effect so the form reinitializes when
  // the same transfer is updated (ids unchanged, but amounts/accounts differ).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    outgoing?.id,
    incoming?.id,
    outgoing?.amount,
    outgoing?.account,
    incoming?.account,
    outgoing?.date,
    outgoing?.currency,
    outgoing?.note,
  ]);

  function resetForm() {
    setFromAccount("");
    setToAccount("");
    setAmount("");
    setCurrency("VND");
    setDate(new Date());
    setNote("");
    setConfirmDelete(false);
  }

  function buildParams(): TransferParams {
    return {
      fromAccount: fromAccount.trim(),
      toAccount: toAccount.trim(),
      amount: parseFloat(amount),
      date: format(date, "yyyy-MM-dd"),
      note,
      currency,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || !fromAccount || !toAccount) return;
    if (fromAccount.trim() === toAccount.trim()) return;

    setLoading(true);
    try {
      if (mode === "edit") {
        await props.onSubmit(props.transferId, buildParams());
      } else {
        await props.onSubmit(buildParams());
        resetForm();
      }
      onCancel();
    } catch (error) {
      console.error("Failed to save transfer:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (mode !== "edit") return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await props.onDelete(props.transferId);
      onCancel();
    } catch (error) {
      console.error("Failed to delete transfer:", error);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const isSameAccount =
    fromAccount.trim() !== "" &&
    toAccount.trim() !== "" &&
    fromAccount.trim() === toAccount.trim();

  const canSubmit =
    !!amount &&
    parseFloat(amount) > 0 &&
    !!fromAccount.trim() &&
    !!toAccount.trim() &&
    !isSameAccount;

  return (
    <>
      <DialogHeader className="sticky top-0 z-10 px-6 pt-6 pb-4 flex-shrink-0">
        <DialogTitle>
          {mode === "edit" ? "Edit Transfer" : "New Transfer"}
        </DialogTitle>
        <DialogDescription>
          {mode === "edit"
            ? "Update the transfer between accounts."
            : "Move money between your accounts."}
        </DialogDescription>
      </DialogHeader>

      <div
        className="overflow-y-auto px-6 py-4 flex-1"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} id="transfer-form">
          <div className="grid gap-4">
            {/* From → To accounts */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormField
                  label="From Account"
                  id="transfer-from"
                  type="text"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  placeholder="e.g., Cash"
                  list="transfer-accounts-from"
                  required
                />
                <datalist id="transfer-accounts-from">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.name} />
                  ))}
                </datalist>
              </div>

              <div className="pb-[2px] flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <FormField
                  label="To Account"
                  id="transfer-to"
                  type="text"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  placeholder="e.g., Savings"
                  list="transfer-accounts-to"
                  required
                />
                <datalist id="transfer-accounts-to">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {isSameAccount && (
              <p className="text-xs text-destructive -mt-2">
                From and To accounts must be different.
              </p>
            )}

            {/* Amount + currency */}
            <FormField
              label="Amount"
              id="transfer-amount"
              icon={<DollarSign className="h-4 w-4" />}
              required
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1"
                  required
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormField>

            {/* Date */}
            <FormField label="Date" id="transfer-date">
              <DatePicker
                date={date}
                onDateChange={(d) => d && setDate(d)}
                className="w-full"
              />
            </FormField>

            {/* Note */}
            <FormField
              label="Note"
              id="transfer-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </form>
      </div>

      <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === "edit" && (
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
            form="transfer-form"
            disabled={loading || deleting || !canSubmit || !isDbReady}
          >
            {loading
              ? mode === "edit"
                ? "Saving..."
                : "Transferring..."
              : mode === "edit"
                ? "Save Changes"
                : "Transfer"}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
