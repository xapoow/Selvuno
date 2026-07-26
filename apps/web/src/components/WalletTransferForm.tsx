import { useEffect, useMemo, useState } from "react";
import type { Settings, Wallet, WalletTransferInput } from "@myfinances/types";
import { parseAmountToMinor } from "@myfinances/utils";
import type { Dictionary } from "../i18n";
import { fromDateInputValue, toDateInputValue } from "../lib/dates";
import { Button } from "./ui/Button";
import { DatePicker } from "./ui/DatePicker";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";

interface WalletTransferFormProps {
  wallets: Wallet[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: WalletTransferInput) => Promise<void>;
}

export function WalletTransferForm({
  wallets,
  settings,
  t,
  onSubmit
}: WalletTransferFormProps) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? "");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date().toISOString()));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const fromWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === fromWalletId),
    [fromWalletId, wallets]
  );
  const toWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === toWalletId),
    [toWalletId, wallets]
  );
  const sameCurrency = Boolean(
    fromWallet && toWallet && fromWallet.currency === toWallet.currency
  );

  useEffect(() => {
    if (sameCurrency) {
      setToAmount(fromAmount);
    }
  }, [fromAmount, sameCurrency]);

  function selectFrom(nextId: string) {
    setFromWalletId(nextId);
    if (nextId === toWalletId) {
      setToWalletId(wallets.find((wallet) => wallet.id !== nextId)?.id ?? "");
    }
  }

  function selectTo(nextId: string) {
    setToWalletId(nextId);
    if (nextId === fromWalletId) {
      setFromWalletId(wallets.find((wallet) => wallet.id !== nextId)?.id ?? "");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!fromWallet || !toWallet) {
        throw new Error(t.wallets.transferNeedsWallets);
      }
      const fromAmountMinor = parseAmountToMinor(fromAmount, fromWallet.currency);
      await onSubmit({
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        fromAmountMinor,
        toAmountMinor: sameCurrency
          ? fromAmountMinor
          : parseAmountToMinor(toAmount, toWallet.currency),
        transferDate: fromDateInputValue(date),
        note: note.trim() || undefined
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.wallets.transferSaveError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t.wallets.fromWallet}
          value={fromWalletId}
          onChange={(event) => selectFrom(event.target.value)}
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} · {wallet.currency}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t.wallets.toWallet}
          value={toWalletId}
          onChange={(event) => selectTo(event.target.value)}
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} · {wallet.currency}
            </option>
          ))}
        </SelectField>
      </div>

      <div className={`grid gap-4 ${sameCurrency ? "" : "sm:grid-cols-2"}`}>
        <TextField
          label={`${t.wallets.sentAmount} (${fromWallet?.currency ?? ""})`}
          inputMode="decimal"
          placeholder="0.00"
          value={fromAmount}
          onChange={(event) => setFromAmount(event.target.value)}
        />
        {!sameCurrency ? (
          <TextField
            label={`${t.wallets.receivedAmount} (${toWallet?.currency ?? ""})`}
            inputMode="decimal"
            placeholder="0.00"
            value={toAmount}
            onChange={(event) => setToAmount(event.target.value)}
          />
        ) : null}
      </div>

      <DatePicker
        label={t.wallets.transferDate}
        value={date}
        locale={settings.locale}
        previousMonthLabel={t.common.previousMonth}
        nextMonthLabel={t.common.nextMonth}
        todayLabel={t.common.today}
        onChange={setDate}
      />
      <TextField
        label={t.wallets.transferNote}
        value={note}
        maxLength={160}
        onChange={(event) => setNote(event.target.value)}
      />
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{t.wallets.saveTransfer}</Button>
    </form>
  );
}
