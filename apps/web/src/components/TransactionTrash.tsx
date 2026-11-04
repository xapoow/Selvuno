import { useRef, useState } from "react";
import type { Category, Settings, Transaction, Wallet } from "@myfinances/types";
import { formatDate, formatSignedMoney } from "@myfinances/utils";
import { LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import type { DeletedTransactionRef } from "../repositories/transactionRepository";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";

interface TransactionTrashProps {
  open: boolean;
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  t: Dictionary;
  loading: boolean;
  loadError: boolean;
  onClose: () => void;
  onRestore: (deleted: DeletedTransactionRef[]) => Promise<void>;
  onRetry: () => void;
}

export function TransactionTrash({ open, transactions, wallets, categories, settings, t, loading, loadError, onClose, onRestore, onRetry }: TransactionTrashProps) {
  const [restoring, setRestoring] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  async function restore(items: Transaction[], key: string) {
    if (busy.current) return;
    busy.current = true;
    setRestoring(key);
    setFailed(false);
    try {
      await onRestore(items.filter((item) => item.deletedAt).map((item) => ({ id: item.id, deletedAt: item.deletedAt! })));
    } catch {
      setFailed(true);
      onRetry();
    } finally {
      busy.current = false;
      setRestoring(null);
    }
  }

  return (
    <BottomSheet open={open} title={t.undo.trash} closeLabel={t.common.close} onClose={onClose} onExitComplete={() => setFailed(false)}>
      <p className="mb-4 text-sm leading-6 text-muted">{t.undo.trashHint}</p>
      {loadError ? <div role="alert" className="grid gap-3 text-sm text-expense">
        <p>{t.undo.loadError}</p><Button type="button" variant="secondary" onClick={onRetry}>{t.undo.retry}</Button>
      </div> : loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="h-4 w-4 animate-spin" />{t.undo.loading}</p> : (
        <div className="grid gap-3">
          {transactions.length ? <>
            <Button type="button" variant="secondary" disabled={Boolean(restoring)} onClick={() => void restore(transactions, "all")}>
              {restoring === "all" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {t.undo.restoreAll}
            </Button>
            {transactions.map((transaction) => {
              const wallet = wallets.find((item) => item.id === transaction.walletId);
              const category = categories.find((item) => item.id === transaction.categoryId);
              return (
                <article key={transaction.id} className="app-control grid min-w-0 gap-3 rounded-xl p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{getCategoryName(category?.name, t)}</p>
                      <p className="mt-1 text-xs text-muted">{wallet?.name ?? t.undo.unavailableWallet} · {formatDate(transaction.transactionDate, settings.locale, settings.dateFormat, settings.timeZone)}</p>
                      {transaction.note ? <p className="mt-1 line-clamp-2 text-xs text-muted">{transaction.note}</p> : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">{formatSignedMoney(transaction.amountMinor, transaction.currency, settings.locale, transaction.type, shouldHideWalletAmounts(settings, wallet))}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1 text-xs text-muted"><Trash2 className="h-3 w-3" />{t.undo.deletedOn} {formatDate(transaction.deletedAt!, settings.locale, settings.dateFormat, settings.timeZone)}</p>
                    <Button type="button" size="small" variant="secondary" disabled={Boolean(restoring)} onClick={() => void restore([transaction], transaction.id)} aria-label={`${t.undo.restore}: ${getCategoryName(category?.name, t)}`}>
                      {restoring === transaction.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      {t.undo.restore}
                    </Button>
                  </div>
                </article>
              );
            })}
          </> : <p className="app-control rounded-xl p-5 text-center text-sm text-muted">{t.undo.empty}</p>}
        </div>
      )}
      {failed ? <p role="alert" className="mt-3 text-sm text-expense">{t.undo.restoreError}</p> : null}
    </BottomSheet>
  );
}
