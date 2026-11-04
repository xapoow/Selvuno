import { useRef, useState } from "react";
import type { Settings, Transaction, Wallet, WalletReconciliationInput, WalletTransfer } from "@myfinances/types";
import { calculateWalletTotals, formatDate, formatMoney } from "@myfinances/utils";
import { Check, Eye, EyeOff, History, LoaderCircle, Scale } from "lucide-react";
import type { Dictionary } from "../i18n";
import { parseBalanceToMinor, WalletBalanceChangedError } from "../lib/walletReconciliation";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { Button } from "./ui/Button";
import { TextField } from "./ui/TextField";

export function WalletReconciliationForm({ wallet, transactions, transfers, settings, t, onSubmit }: {
  wallet: Wallet;
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: WalletReconciliationInput) => Promise<void>;
}) {
  const [actual, setActual] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reveal, setReveal] = useState(false);
  const submitting = useRef(false);
  const expected = calculateWalletTotals(wallet, transactions, transfers).balanceMinor;
  const privacyEnabled = shouldHideWalletAmounts(settings, wallet);
  const hidden = privacyEnabled && !reveal;
  let actualMinor: number | null = null;
  try { actualMinor = parseBalanceToMinor(actual, wallet.currency); } catch { /* Show validation after submit. */ }
  const difference = actualMinor === null ? null : actualMinor - expected;
  const matched = difference === 0;
  const money = (amount: number) => formatMoney(amount, wallet.currency, settings.locale, hidden);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (actualMinor === null || !Number.isSafeInteger(difference)) {
      setError(t.reconciliation.invalidAmount);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit({ walletId: wallet.id, currency: wallet.currency, expectedBalanceMinor: expected, actualBalanceMinor: actualMinor, note: note.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof WalletBalanceChangedError ? t.reconciliation.balanceChanged : t.reconciliation.saveError);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <div className="grid gap-5">
    <div className="app-control grid gap-2 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-foreground">{wallet.name}</p><p className="mt-1 text-xs text-muted">{t.reconciliation.recordedBalance}</p></div>
        {privacyEnabled ? <Button type="button" variant="ghost" size="icon" aria-label={reveal ? t.settings.hideAmounts : t.settings.showAmounts} onClick={() => setReveal((value) => !value)}>{reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button> : null}
      </div>
      <p className="text-2xl font-bold text-foreground">{money(expected)}</p>
    </div>
    <p className="text-sm leading-6 text-muted">{t.reconciliation.intro}</p>
    {!wallet.balanceReconciliations?.length ? <p className="-mt-3 text-xs leading-5 text-muted">{t.reconciliation.currencyLockHint}</p> : null}
    {wallet.kind === "credit" ? <p className="-mt-3 text-xs leading-5 text-muted">{t.reconciliation.creditHint}</p> : null}
    <form className="grid gap-4" onSubmit={(event) => void save(event)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <TextField label={`${t.reconciliation.actualBalance} (${wallet.currency})`} inputMode="decimal" placeholder="0" value={actual} disabled={busy} onChange={(event) => { setActual(event.target.value); setError(""); }} />
        <Button type="button" variant="secondary" disabled={busy} className="h-11" aria-label={t.reconciliation.toggleSign} onClick={() => setActual((value) => value.trim().startsWith("-") ? value.trim().slice(1) : `-${value.trim()}`)}>±</Button>
      </div>
      {difference !== null && Number.isSafeInteger(difference) ? (
        <div className={`grid gap-1 rounded-xl border p-4 ${matched ? "border-income/25 bg-income/5" : "border-line bg-elevated/60"}`} aria-live="polite">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted">{matched ? <Check className="h-4 w-4 text-income" /> : <Scale className="h-4 w-4" />}{matched ? t.reconciliation.matched : t.reconciliation.difference}</p>
          {!matched ? <p className="text-xl font-semibold text-foreground">{difference > 0 && !hidden ? "+" : ""}{money(difference)}</p> : null}
          <p className="mt-1 text-xs leading-5 text-muted">{matched ? t.reconciliation.matchHint : t.reconciliation.adjustmentHint}</p>
        </div>
      ) : null}
      <TextField label={t.reconciliation.note} value={note} maxLength={240} disabled={busy} onChange={(event) => setNote(event.target.value)} />
      {error ? <p role="alert" className="text-sm text-expense">{error}</p> : null}
      <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{matched ? t.reconciliation.confirmMatch : t.reconciliation.applyAdjustment}</Button>
    </form>
    <section className="grid gap-3 border-t border-line/60 pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><History className="h-4 w-4 text-muted" />{t.reconciliation.history}</h3>
      {wallet.balanceReconciliations?.length ? [...wallet.balanceReconciliations].reverse().map((item) => (
        <article key={item.id} className="app-control grid gap-2 rounded-xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><time dateTime={item.createdAt} className="text-xs text-muted">{formatDate(item.createdAt, settings.locale, settings.dateFormat, settings.timeZone)}</time><span className="text-sm font-semibold text-foreground">{item.adjustmentMinor === 0 ? t.reconciliation.checked : `${item.adjustmentMinor > 0 && !hidden ? "+" : ""}${money(item.adjustmentMinor)}`}</span></div>
          <p className="text-xs leading-5 text-muted">{t.reconciliation.recordedBalance}: {money(item.expectedBalanceMinor)}<br />{t.reconciliation.actualBalance}: {money(item.actualBalanceMinor)}</p>
          {item.note ? <p className="text-xs leading-5 text-foreground">{item.note}</p> : null}
        </article>
      )) : <p className="text-xs text-muted">{t.reconciliation.noHistory}</p>}
    </section>
  </div>;
}
