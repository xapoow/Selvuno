import { useState } from "react";
import type {
  SavingsGoal,
  SavingsGoalContributionInput,
  Settings
} from "@myfinances/types";
import { parseAmountToMinor } from "@myfinances/utils";
import type { Dictionary } from "../i18n";
import { fromDateInputValue, toDateInputValue } from "../lib/dates";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { TextField } from "./ui/TextField";

interface SavingsGoalContributionFormProps {
  goal: SavingsGoal;
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: SavingsGoalContributionInput) => Promise<void>;
}

export function SavingsGoalContributionForm({
  goal,
  settings,
  t,
  onSubmit
}: SavingsGoalContributionFormProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date().toISOString()));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        goalId: goal.id,
        amountMinor: parseAmountToMinor(amount, goal.currency),
        contributionDate: fromDateInputValue(date),
        note: note.trim() || undefined
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.goals.contributionError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField
        label={`${t.goals.contributionAmount} (${goal.currency})`}
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <DatePicker
        label={t.goals.contributionDate}
        value={date}
        locale={settings.locale}
        previousMonthLabel={t.common.previousMonth}
        nextMonthLabel={t.common.nextMonth}
        todayLabel={t.common.today}
        onChange={setDate}
      />
      <TextField
        label={t.goals.contributionNote}
        value={note}
        maxLength={160}
        onChange={(event) => setNote(event.target.value)}
      />
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{t.goals.addContribution}</Button>
    </form>
  );
}
