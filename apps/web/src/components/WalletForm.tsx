import { useState } from "react";
import type { Wallet, WalletInput } from "@myfinances/types";
import {
  decimalToMinor,
  getCurrencyMinorUnits,
  minorToDecimal
} from "@myfinances/utils";
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
  const [initialBalance, setInitialBalance] = useState(
    String(minorToDecimal(initial?.initialBalanceMinor ?? 0, initial?.currency ?? defaultCurrency))
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const normalizedBalance = initialBalance.trim().replace(/\s/g, "").replace(",", ".");
      if (!/^-?\d+(\.\d+)?$/.test(normalizedBalance)) {
        throw new Error(t.wallets.initialBalanceError);
      }
      const fractionLength = normalizedBalance.split(".")[1]?.length ?? 0;
      if (fractionLength > getCurrencyMinorUnits(currency)) {
        throw new Error(t.wallets.initialBalanceError);
      }
      await onSubmit({
        name: name.trim(),
        currency,
        initialBalanceMinor: decimalToMinor(Number(normalizedBalance), currency)
      });
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
      <TextField
        label={`${t.wallets.initialBalance} (${currency})`}
        inputMode="decimal"
        value={initialBalance}
        onChange={(event) => setInitialBalance(event.target.value)}
      />
      <p className="-mt-2 text-xs text-muted">{t.wallets.initialBalanceHint}</p>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
