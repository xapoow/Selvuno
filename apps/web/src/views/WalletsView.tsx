import { useState } from "react";
import type { Settings, Transaction, Wallet, WalletInput } from "@myfinances/types";
import { Edit3, Plus, WalletCards } from "lucide-react";
import { calculateTransactionTotals, formatMoney } from "@myfinances/utils";
import { WalletForm } from "../components/WalletForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  settings: Settings;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function WalletsView({ wallets, transactions, settings, onCreate, onUpdate, onArchive }: WalletsViewProps) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Wallets</h2>
        </div>
        <Button size="icon" onClick={() => setCreating(true)} aria-label="Add wallet">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {wallets.length ? (
        <div className="grid gap-2">
          {wallets.map((wallet) => {
            const totals = calculateTransactionTotals(transactions, wallet.id);
            return (
              <article key={wallet.id} className="grid gap-3 rounded-app border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{wallet.name}</h3>
                    <p className="text-sm text-muted">{wallet.currency}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(wallet)} aria-label="Edit wallet">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted">Balance</p>
                    <p className="font-semibold text-foreground">
                      {formatMoney(totals.balanceMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted">Income</p>
                    <p className="font-semibold text-income">
                      {formatMoney(totals.incomeMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted">Expenses</p>
                    <p className="font-semibold text-expense">
                      {formatMoney(totals.expenseMinor, wallet.currency, settings.locale)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    if (window.confirm("Archive this wallet?")) {
                      void onArchive(wallet.id);
                    }
                  }}
                >
                  Archive
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={WalletCards} title="Create a wallet to start tracking." />
      )}

      <BottomSheet open={creating} title="New wallet" onClose={() => setCreating(false)}>
        <WalletForm
          defaultCurrency={settings.currency}
          submitLabel="Create wallet"
          onSubmit={async (input) => {
            await onCreate(input);
            setCreating(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editing)} title="Edit wallet" onClose={() => setEditing(null)}>
        {editing ? (
          <WalletForm
            initial={editing}
            defaultCurrency={settings.currency}
            submitLabel="Update wallet"
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
