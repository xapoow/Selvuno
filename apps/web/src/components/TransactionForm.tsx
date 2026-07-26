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
import { CalendarDays, ChevronDown, Hash, StickyNote } from "lucide-react";
import { type Dictionary } from "../i18n";
import { cn } from "../lib/cn";
import { fromDateInputValue, toDateInputValue } from "../lib/dates";
import { formatTagsInput, parseTagsInput } from "../lib/tags";
import { TransactionCategoryPicker } from "./TransactionCategoryPicker";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";

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
  const [detailsOpen, setDetailsOpen] = useState(Boolean(initial));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const currency = selectedWallet?.currency ?? initial?.currency ?? settings.currency;

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );
  const today = toDateInputValue(new Date().toISOString());
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(settings.locale, { dateStyle: "medium" }).format(
        new Date(`${date}T12:00:00`)
      ),
    [date, settings.locale]
  );
  const detailSummary = [
    date === today ? t.common.today : formattedDate,
    note.trim() || undefined,
    tagsInput.trim() ? `#${parseTagsInput(tagsInput)[0] ?? ""}` : undefined
  ]
    .filter(Boolean)
    .join(" · ");

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
        setDetailsOpen(false);
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.transaction.saveError);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <SegmentedControl
        value={type}
        onChange={(nextType) => {
          setType(nextType);
          setSaved(false);
        }}
        options={[
          { value: "expense", label: t.common.expense },
          { value: "income", label: t.common.income }
        ]}
      />
      <label
        className={cn(
          "app-control grid gap-2 rounded-app border p-4 sm:p-5",
          type === "income" ? "border-income/25" : "border-expense/25"
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {t.transaction.amount}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <input
            aria-label={`${t.transaction.amount} (${currency})`}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setSaved(false);
            }}
            className="app-focus min-w-0 flex-1 bg-transparent text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted/45 sm:text-5xl"
          />
          <span className="text-lg font-semibold text-muted">{currency}</span>
        </span>
      </label>

      {!lockWalletToActive ? (
        <SelectField
          label={t.common.wallet}
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </SelectField>
      ) : null}

      <TransactionCategoryPicker
        categories={typeCategories}
        value={categoryId}
        t={t}
        onChange={(nextCategoryId) => {
          setCategoryId(nextCategoryId);
          setSaved(false);
        }}
      />

      <div className="grid gap-3">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? t.transaction.hideDetails : t.transaction.showDetails}
          onClick={() => setDetailsOpen((current) => !current)}
          className="app-focus app-control grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-app p-3 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-app bg-accent-soft text-accent">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{t.transaction.details}</span>
            <span className="block truncate text-xs text-muted">
              {detailsOpen ? t.transaction.detailsHint : detailSummary}
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform", detailsOpen && "rotate-180")}
          />
        </button>

        {detailsOpen ? (
          <div className="app-control grid gap-4 rounded-app p-3 sm:p-4">
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
              <TextField
                label={t.common.note}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={240}
              />
            </div>
            <TextField
              label={t.transaction.tags}
              value={tagsInput}
              placeholder={t.transaction.tagsPlaceholder}
              onChange={(event) => setTagsInput(event.target.value)}
              maxLength={220}
            />
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <StickyNote className="h-3.5 w-3.5" />
                {t.common.note}
              </span>
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {t.transaction.tags}
              </span>
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-income">{t.common.saved}</p> : null}
      <Button
        type="submit"
        className="h-12 text-base"
        disabled={!wallets.length || !typeCategories.length}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
