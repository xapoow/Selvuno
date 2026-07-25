import { useState } from "react";
import type { Wallet, WalletInput } from "@myfinances/types";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";
import type { Dictionary } from "../i18n";

interface WalletFormProps {
  initial?: Wallet;
  defaultCurrency: string;
  t: Dictionary;
  submitLabel: string;
  onSubmit: (input: WalletInput) => Promise<void>;
}

export function WalletForm({ initial, defaultCurrency, t, submitLabel, onSubmit }: WalletFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ name: name.trim(), currency });
      if (!initial) {
        setName("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.wallets.saveError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField label={t.common.name} value={name} onChange={(event) => setName(event.target.value)} maxLength={64} />
      <SelectField label={t.common.currency} value={currency} onChange={(event) => setCurrency(event.target.value)}>
        {currencyOptions.map((option) => (
          <option key={option} value={option}>
            {getCurrencyLabel(option)}
          </option>
        ))}
      </SelectField>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
