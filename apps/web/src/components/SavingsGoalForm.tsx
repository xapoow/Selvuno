import { useState } from "react";
import type { SavingsGoal, SavingsGoalInput, Settings, Wallet } from "@myfinances/types";
import { minorToDecimal, parseAmountToMinor } from "@myfinances/utils";
import type { Dictionary } from "../i18n";
import { toCalendarDate } from "../lib/dates";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";

const goalColors = ["#207a6f", "#3f73c9", "#7b61ff", "#c44a42", "#b7791f", "#1f8f66"];

function defaultTargetDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return toCalendarDate(date);
}

interface SavingsGoalFormProps {
  wallets: Wallet[];
  settings: Settings;
  t: Dictionary;
  initial?: SavingsGoal;
  onSubmit: (input: SavingsGoalInput) => Promise<void>;
}

export function SavingsGoalForm({
  wallets,
  settings,
  t,
  initial,
  onSubmit
}: SavingsGoalFormProps) {
  const [walletId, setWalletId] = useState(initial?.walletId ?? wallets[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    initial ? String(minorToDecimal(initial.targetAmountMinor, initial.currency)) : ""
  );
  const [deadlineEnabled, setDeadlineEnabled] = useState(Boolean(initial?.targetDate));
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? defaultTargetDate());
  const [color, setColor] = useState(initial?.color ?? goalColors[0]);
  const [error, setError] = useState("");
  const wallet = wallets.find((item) => item.id === walletId);
  const currency = wallet?.currency ?? initial?.currency ?? settings.currency;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!walletId) {
        throw new Error(t.goals.walletMissing);
      }
      await onSubmit({
        walletId,
        name: name.trim(),
        targetAmountMinor: parseAmountToMinor(targetAmount, currency),
        currency,
        targetDate: deadlineEnabled ? targetDate : undefined,
        color
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.goals.saveError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField
        label={t.goals.name}
        value={name}
        placeholder={t.goals.namePlaceholder}
        maxLength={64}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t.common.wallet}
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
        >
          {wallets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label={`${t.goals.targetAmount} (${currency})`}
          inputMode="decimal"
          placeholder="0.00"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
        />
      </div>

      <div className="app-control grid gap-3 rounded-app p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t.goals.targetDate}</p>
            {!deadlineEnabled ? <p className="text-xs text-muted">{t.goals.noDeadline}</p> : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setDeadlineEnabled((current) => !current)}
          >
            {deadlineEnabled ? t.goals.removeDeadline : t.goals.addDeadline}
          </Button>
        </div>
        {deadlineEnabled ? (
          <DatePicker
            label={t.goals.targetDate}
            value={targetDate}
            locale={settings.locale}
            previousMonthLabel={t.common.previousMonth}
            nextMonthLabel={t.common.nextMonth}
            todayLabel={t.common.today}
            onChange={(value) => setTargetDate(value as typeof targetDate)}
          />
        ) : null}
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{t.common.color}</span>
        <div className="grid grid-cols-6 gap-2">
          {goalColors.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
              className="app-swatch h-10 rounded-app transition active:scale-[0.98]"
              style={{
                backgroundColor: swatch,
                outline: color === swatch ? "2px solid rgb(var(--color-foreground))" : "none"
              }}
            />
          ))}
        </div>
        <label className="app-field app-focus flex h-11 items-center justify-between rounded-app px-3 text-sm font-medium text-foreground">
          <span>{color.toUpperCase()}</span>
          <input
            type="color"
            aria-label={t.common.color}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
          />
        </label>
      </div>

      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit" disabled={!wallets.length}>
        {initial ? t.goals.update : t.goals.create}
      </Button>
    </form>
  );
}
