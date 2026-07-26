import { useState } from "react";
import type {
  Settings,
  Transaction,
  Wallet,
  WalletInput,
  WalletTransfer,
  WalletView
} from "@myfinances/types";
import { Edit3, Plus, WalletCards } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@myfinances/utils";
import { WalletForm } from "../components/WalletForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  activeWalletId?: WalletView;
  showTitle?: boolean;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function WalletsView({
  wallets,
  transactions,
  transfers,
  settings,
  t,
  activeWalletId = "all",
  showTitle = true,
  onCreate,
  onUpdate,
  onArchive
}: WalletsViewProps) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
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
        <Button size="icon" onClick={() => setCreating(true)} aria-label={t.wallets.add}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {visibleWallets.length ? (
        <div className="grid gap-2">
          {visibleWallets.map((wallet) => {
            const totals = calculateWalletTotals(wallet, transactions, transfers);
            return (
              <article key={wallet.id} className="app-surface grid gap-3 rounded-app p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{wallet.name}</h3>
                    <p className="text-sm text-muted">{wallet.currency}</p>
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
                  onClick={() => {
                    if (window.confirm(t.wallets.confirmArchive)) {
                      void onArchive(wallet.id);
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
    </div>
  );
}
