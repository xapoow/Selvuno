import { useState } from "react";
import type {
  Settings,
  Transaction,
  Wallet,
  WalletInput,
  WalletTransfer,
  WalletView
} from "@myfinances/types";
import { Archive, Edit3, Plus, RotateCcw, WalletCards } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@myfinances/utils";
import { WalletForm } from "../components/WalletForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";
import { WalletIcon } from "../lib/icons";

interface WalletsViewProps {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  activeWalletId?: WalletView;
  showTitle?: boolean;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}

export function WalletsView({
  wallets,
  archivedWallets,
  transactions,
  transfers,
  settings,
  t,
  activeWalletId = "all",
  showTitle = true,
  onCreate,
  onUpdate,
  onArchive,
  onRestore
}: WalletsViewProps) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [operationError, setOperationError] = useState("");
  const visibleWallets =
    activeWalletId === "all" ? wallets : wallets.filter((wallet) => wallet.id === activeWalletId);

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        {showTitle ? (
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t.wallets.title}</h2>
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setArchiveOpen(true)}
            aria-label={t.wallets.manageArchive}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => setCreating(true)} aria-label={t.wallets.add}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {operationError ? (
        <p className="rounded-app bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
          {operationError}
        </p>
      ) : null}

      {visibleWallets.length ? (
        <div className="grid gap-2">
          {visibleWallets.map((wallet) => {
            const totals = calculateWalletTotals(wallet, transactions, transfers);
            return (
              <article key={wallet.id} className="app-surface grid gap-3 rounded-app p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-app text-white shadow-[0_8px_18px_rgb(0_0_0/0.16)]"
                      style={{ backgroundColor: wallet.color }}
                    >
                      <WalletIcon name={wallet.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{wallet.name}</h3>
                      <p className="text-sm text-muted">{wallet.currency}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(wallet)} aria-label={t.wallets.editTitle}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted">{t.common.balance}</p>
                    <p className="font-semibold text-foreground">
                      {formatMoney(totals.balanceMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted">{t.common.income}</p>
                    <p className="font-semibold text-income">
                      {formatMoney(totals.incomeMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted">{t.common.expenses}</p>
                    <p className="font-semibold text-expense">
                      {formatMoney(totals.expenseMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={async () => {
                    setOperationError("");
                    if (wallets.length <= 1) {
                      setOperationError(t.wallets.cannotArchiveLast);
                      return;
                    }
                    if (window.confirm(t.wallets.confirmArchive)) {
                      try {
                        await onArchive(wallet.id);
                      } catch {
                        setOperationError(t.wallets.archiveError);
                      }
                    }
                  }}
                >
                  {t.wallets.archive}
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={WalletCards} title={t.wallets.createEmpty} />
      )}

      <BottomSheet open={creating} title={t.wallets.newTitle} onClose={() => setCreating(false)}>
        <WalletForm
          defaultCurrency={settings.currency}
          t={t}
          submitLabel={t.wallets.create}
          onSubmit={async (input) => {
            await onCreate(input);
            setCreating(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editing)} title={t.wallets.editTitle} onClose={() => setEditing(null)}>
        {editing ? (
          <WalletForm
            initial={editing}
            defaultCurrency={settings.currency}
            t={t}
            submitLabel={t.wallets.update}
            onSubmit={async (input) => {
              await onUpdate(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={archiveOpen}
        title={t.wallets.archiveTitle}
        onClose={() => {
          setArchiveOpen(false);
          setOperationError("");
        }}
      >
        {archivedWallets.length ? (
          <div className="grid gap-2">
            {archivedWallets.map((wallet) => (
              <article
                key={wallet.id}
                className="app-control flex items-center justify-between gap-3 rounded-app p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-app text-white"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <WalletIcon name={wallet.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted">{wallet.currency}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={async () => {
                    setOperationError("");
                    try {
                      await onRestore(wallet.id);
                    } catch {
                      setOperationError(t.wallets.restoreError);
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.wallets.restore}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Archive} title={t.wallets.archiveEmpty} />
        )}
        {operationError ? (
          <p className="mt-3 text-sm font-medium text-expense">{operationError}</p>
        ) : null}
      </BottomSheet>
    </div>
  );
}
