import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  TransactionType,
  Wallet,
  WalletView
} from "@myfinances/types";
import { minorToDecimal, parseAmountToMinor } from "@myfinances/utils";
import { fromDateInputValue, toDateInputValue } from "../lib/dates";
import { formatTagsInput, parseTagsInput } from "../lib/tags";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";
import { getCategoryName, type Dictionary } from "../i18n";

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  t: Dictionary;
  initial?: Transaction;
  activeWalletId: WalletView;
  lockWalletToActive?: boolean;
  submitLabel: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function TransactionForm({
  wallets,
  categories,
  settings,
  t,
  initial,
  activeWalletId,
  lockWalletToActive = false,
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
  const [tagsInput, setTagsInput] = useState(formatTagsInput(initial?.tags));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const currency = selectedWallet?.currency ?? initial?.currency ?? settings.currency;

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!categoryId || !typeCategories.some((category) => category.id === categoryId)) {
      setCategoryId(typeCategories[0]?.id ?? "");
    }
  }, [categoryId, typeCategories]);

  useEffect(() => {
    if (!initial && lockWalletToActive && activeWalletId !== "all") {
      setWalletId(activeWalletId);
    }
  }, [activeWalletId, initial, lockWalletToActive]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      if (!walletId || !categoryId) {
        throw new Error(walletId ? t.transaction.chooseCategory : t.transaction.chooseWalletAndCategory);
      }
      await onSubmit({
        walletId,
        categoryId,
        type,
        amountMinor: parseAmountToMinor(amount, currency),
        currency,
        transactionDate: fromDateInputValue(date),
        note: note.trim() || undefined,
        tags: parseTagsInput(tagsInput)
      });
      if (!initial) {
        setAmount("");
        setNote("");
        setTagsInput("");
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.transaction.saveError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: "expense", label: t.common.expense },
          { value: "income", label: t.common.income }
        ]}
      />
      <TextField
        label={`${t.transaction.amount} (${currency})`}
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <div className={lockWalletToActive ? "grid gap-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
        {!lockWalletToActive ? (
          <SelectField label={t.common.wallet} value={walletId} onChange={(event) => setWalletId(event.target.value)}>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </SelectField>
        ) : null}
        <SelectField label={t.common.category} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {typeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryName(category.name, t)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label={t.common.date}
          value={date}
          locale={settings.locale}
          previousMonthLabel={t.common.previousMonth}
          nextMonthLabel={t.common.nextMonth}
          todayLabel={t.common.today}
          onChange={setDate}
        />
        <TextField label={t.common.note} value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} />
      </div>
      <TextField
        label={t.transaction.tags}
        value={tagsInput}
        placeholder={t.transaction.tagsPlaceholder}
        onChange={(event) => setTagsInput(event.target.value)}
        maxLength={220}
      />
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-income">{t.common.saved}</p> : null}
      <Button type="submit" disabled={!wallets.length || !typeCategories.length}>
        {submitLabel}
      </Button>
    </form>
  );
}
