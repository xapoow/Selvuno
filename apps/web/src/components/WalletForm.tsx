import { useState } from "react";
import type { Wallet, WalletInput } from "@myfinances/types";
import {
  decimalToMinor,
  getCurrencyMinorUnits,
  minorToDecimal
} from "@myfinances/utils";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { WalletIcon, walletIconNames } from "../lib/icons";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";
import type { Dictionary } from "../i18n";

const walletSwatches = [
  "#207a6f",
  "#3f73c9",
  "#7b61ff",
  "#b7791f",
  "#c44a42",
  "#1f8f66"
];

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
  const [color, setColor] = useState(initial?.color ?? walletSwatches[0]);
  const [icon, setIcon] = useState(initial?.icon ?? "wallet-cards");
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
        initialBalanceMinor: decimalToMinor(Number(normalizedBalance), currency),
        color,
        icon
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
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-foreground">{t.wallets.icon}</legend>
        <div className="app-field grid grid-cols-5 gap-2 rounded-app p-2 sm:grid-cols-9">
          {walletIconNames.map((iconName) => {
            const selected = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                aria-label={iconName}
                aria-pressed={selected}
                title={iconName}
                onClick={() => setIcon(iconName)}
                className={`app-focus grid aspect-square place-items-center rounded-app ${
                  selected
                    ? "app-navigation-active"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <WalletIcon name={iconName} className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{t.wallets.color}</span>
        <div className="grid grid-cols-6 gap-2">
          {walletSwatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
              className="app-swatch h-10 rounded-app transition active:scale-[0.98]"
              style={{
                backgroundColor: swatch,
                outline:
                  color === swatch
                    ? "2px solid rgb(var(--color-foreground))"
                    : "none"
              }}
            />
          ))}
        </div>
        <label className="app-field app-focus flex h-11 items-center justify-between rounded-app px-3 text-sm font-medium text-foreground">
          <span>{color.toUpperCase()}</span>
          <input
            type="color"
            aria-label={t.wallets.color}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
          />
        </label>
      </div>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
