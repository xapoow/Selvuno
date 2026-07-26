import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  RecurrenceFrequency,
  RecurringTransaction,
  RecurringTransactionInput,
  Settings,
  TransactionType,
  Wallet
} from "@myfinances/types";
import { minorToDecimal, parseAmountToMinor } from "@myfinances/utils";
import { getCategoryName, type Dictionary } from "../i18n";
import { toCalendarDate } from "../lib/dates";
import { formatTagsInput, parseTagsInput } from "../lib/tags";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { SegmentedControl } from "./ui/SegmentedControl";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";

interface RecurringTransactionFormProps {
  wallet: Wallet;
  categories: Category[];
  settings: Settings;
  t: Dictionary;
  initial?: RecurringTransaction;
  onSubmit: (input: RecurringTransactionInput) => Promise<void>;
}

export function RecurringTransactionForm({
  wallet,
  categories,
  settings,
  t,
  initial,
  onSubmit
}: RecurringTransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [amount, setAmount] = useState(
    initial ? String(minorToDecimal(initial.amountMinor, initial.currency)) : ""
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(initial?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(initial?.startDate ?? toCalendarDate(new Date()));
  const [note, setNote] = useState(initial?.note ?? "");
  const [tagsInput, setTagsInput] = useState(formatTagsInput(initial?.tags));
  const [error, setError] = useState("");
  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!categoryId || !typeCategories.some((category) => category.id === categoryId)) {
      setCategoryId(typeCategories[0]?.id ?? "");
    }
  }, [categoryId, typeCategories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!categoryId) {
        throw new Error(t.recurring.chooseCategory);
      }
      await onSubmit({
        walletId: wallet.id,
        categoryId,
        amountMinor: parseAmountToMinor(amount, wallet.currency),
        currency: wallet.currency,
        type,
        note: note.trim() || undefined,
        tags: parseTagsInput(tagsInput),
        frequency,
        startDate
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.recurring.saveError);
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
        label={`${t.transaction.amount} (${wallet.currency})`}
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t.common.category}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {typeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryName(category.name, t)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t.recurring.frequency}
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}
        >
          <option value="daily">{t.recurring.daily}</option>
          <option value="weekly">{t.recurring.weekly}</option>
          <option value="monthly">{t.recurring.monthly}</option>
          <option value="yearly">{t.recurring.yearly}</option>
        </SelectField>
      </div>
      <DatePicker
        label={t.recurring.firstDate}
        value={startDate}
        locale={settings.locale}
        previousMonthLabel={t.common.previousMonth}
        nextMonthLabel={t.common.nextMonth}
        todayLabel={t.common.today}
        onChange={(value) => setStartDate(value as typeof startDate)}
      />
      <TextField
        label={t.common.note}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={240}
      />
      <TextField
        label={t.transaction.tags}
        value={tagsInput}
        placeholder={t.transaction.tagsPlaceholder}
        onChange={(event) => setTagsInput(event.target.value)}
        maxLength={220}
      />
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit" disabled={!typeCategories.length}>
        {initial ? t.recurring.update : t.recurring.create}
      </Button>
    </form>
  );
}
