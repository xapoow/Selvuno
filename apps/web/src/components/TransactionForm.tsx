import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  TransactionType,
  Wallet
} from "@myfinances/types";
import { minorToDecimal, parseAmountToMinor } from "@myfinances/utils";
import { fromDateInputValue, toDateInputValue } from "../lib/dates";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  initial?: Transaction;
  activeWalletId: string;
  submitLabel: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function TransactionForm({
  wallets,
  categories,
  settings,
  initial,
  activeWalletId,
  submitLabel,
  onSubmit
}: TransactionFormProps) {
  const defaultWalletId =
    initial?.walletId ?? (activeWalletId !== "all" ? activeWalletId : wallets[0]?.id ?? "");
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [amount, setAmount] = useState(
    initial ? String(minorToDecimal(initial.amountMinor, initial.currency)) : ""
  );
  const [date, setDate] = useState(toDateInputValue(initial?.transactionDate ?? new Date().toISOString()));
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!categoryId || !typeCategories.some((category) => category.id === categoryId)) {
      setCategoryId(typeCategories[0]?.id ?? "");
    }
  }, [categoryId, typeCategories]);

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const currency = selectedWallet?.currency ?? settings.currency;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      if (!walletId || !categoryId) {
        throw new Error("Choose a wallet and category.");
      }
      await onSubmit({
        walletId,
        categoryId,
        type,
        amountMinor: parseAmountToMinor(amount, currency),
        currency,
        transactionDate: fromDateInputValue(date),
        note: note.trim() || undefined
      });
      if (!initial) {
        setAmount("");
        setNote("");
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save transaction.");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" }
        ]}
      />
      <TextField
        label={`Amount (${currency})`}
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Wallet" value={walletId} onChange={(event) => setWalletId(event.target.value)}>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {typeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} />
      </div>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-income">Saved</p> : null}
      <Button type="submit" disabled={!wallets.length || !typeCategories.length}>
        {submitLabel}
      </Button>
    </form>
  );
}
