import { useState } from "react";
import type { Wallet, WalletInput, WalletKind } from "@myfinances/types";
import {
  decimalToMinor,
  getCurrencyMinorUnits,
  minorToDecimal
} from "@myfinances/utils";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { WalletIcon, walletIconNames } from "../lib/icons";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";
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
  advancedWalletsEnabled?: boolean;
  onSubmit: (input: WalletInput) => Promise<void>;
}

export function WalletForm({
  initial,
  defaultCurrency,
  t,
  submitLabel,
  advancedWalletsEnabled = false,
  onSubmit
}: WalletFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [color, setColor] = useState(initial?.color ?? walletSwatches[0]);
  const [icon, setIcon] = useState(initial?.icon ?? "wallet-cards");
  const [initialBalance, setInitialBalance] = useState(
    String(minorToDecimal(initial?.initialBalanceMinor ?? 0, initial?.currency ?? defaultCurrency))
  );
  const [kind, setKind] = useState<WalletKind>(initial?.kind ?? "cash");
  const [creditLimit, setCreditLimit] = useState(
    String(minorToDecimal(initial?.creditLimitMinor ?? 0, initial?.currency ?? defaultCurrency))
  );
  const [excludeFromTotals, setExcludeFromTotals] = useState(initial?.excludeFromTotals ?? false);
  const [hideBalance, setHideBalance] = useState(initial?.hideBalance ?? false);
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
      const normalizedCreditLimit = creditLimit.trim().replace(/\s/g, "").replace(",", ".");
      if (kind === "credit" && !/^\d+(\.\d+)?$/.test(normalizedCreditLimit)) {
        throw new Error(t.wallets.creditLimitError);
      }
      if (
        kind === "credit" &&
        (normalizedCreditLimit.split(".")[1]?.length ?? 0) > getCurrencyMinorUnits(currency)
      ) {
        throw new Error(t.wallets.creditLimitError);
      }
      await onSubmit({
        name: name.trim(),
        currency,
        initialBalanceMinor: decimalToMinor(Number(normalizedBalance), currency),
        kind,
        creditLimitMinor:
          kind === "credit" ? decimalToMinor(Number(normalizedCreditLimit), currency) : 0,
        excludeFromTotals,
        hideBalance,
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
      {advancedWalletsEnabled ? (
        <div className="app-control grid gap-4 rounded-app p-3 sm:p-4">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: "cash", label: t.wallets.kindCash },
              { value: "credit", label: t.wallets.kindCredit }
            ]}
          />
          {kind === "credit" ? (
            <div className="grid gap-2">
              <TextField
                label={`${t.wallets.creditLimit} (${currency})`}
                inputMode="decimal"
                value={creditLimit}
                onChange={(event) => setCreditLimit(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted">{t.wallets.creditLimitHint}</p>
            </div>
          ) : null}
          <WalletOptionSwitch
            checked={excludeFromTotals}
            label={t.wallets.excludeFromTotals}
            hint={t.wallets.excludeFromTotalsHint}
            onChange={setExcludeFromTotals}
          />
          <WalletOptionSwitch
            checked={hideBalance}
            label={t.wallets.hideWalletBalance}
            hint={t.wallets.hideWalletBalanceHint}
            onChange={setHideBalance}
          />
        </div>
      ) : null}
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

function WalletOptionSwitch({
  checked,
  label,
  hint,
  onChange
}: {
  checked: boolean;
  label: string;
  hint: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`app-focus relative mt-1 h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked ? "border-accent bg-accent" : "border-line bg-elevated"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 translate-x-0 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
