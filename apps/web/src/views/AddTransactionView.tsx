import { useState } from "react";
import type {
  Category,
  RecurringTransaction,
  RecurringTransactionInput,
  Settings,
  TransactionInput,
  Wallet
} from "@myfinances/types";
import { WalletCards } from "lucide-react";
import { RecurringTransactionsPanel } from "../components/RecurringTransactionsPanel";
import { TransactionForm } from "../components/TransactionForm";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import type { Dictionary } from "../i18n";

interface AddTransactionViewProps {
  wallets: Wallet[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCreateRecurring: (input: RecurringTransactionInput) => Promise<void>;
  onUpdateRecurring: (id: string, input: RecurringTransactionInput) => Promise<void>;
  onSetRecurringPaused: (id: string, paused: boolean) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
}

export function AddTransactionView({
  wallets,
  categories,
  recurringTransactions,
  settings,
  t,
  onSubmit,
  onCreateRecurring,
  onUpdateRecurring,
  onSetRecurringPaused,
  onDeleteRecurring
}: AddTransactionViewProps) {
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const activeWallet = settings.activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === settings.activeWalletId);

  return (
    <div className="grid gap-5">
      <div className="mx-auto w-full max-w-lg">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "single", label: t.recurring.tabSingle },
            { value: "recurring", label: t.recurring.tabRecurring }
          ]}
        />
      </div>
      {activeWallet ? (
        mode === "single" ? (
          <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{t.transaction.addTitle}</h2>
                <p className="mt-1 text-sm text-muted">{t.transaction.quickHint}</p>
              </div>
              <span className="app-control rounded-full px-3 py-1.5 text-xs font-semibold text-muted">
                {activeWallet.name} · {activeWallet.currency}
              </span>
            </div>
            <div className="app-surface rounded-app p-3 sm:p-5">
              <TransactionForm
                wallets={wallets}
                categories={categories}
                settings={settings}
                t={t}
                activeWalletId={settings.activeWalletId}
                lockWalletToActive
                submitLabel={t.transaction.save}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        ) : (
          <RecurringTransactionsPanel
            wallet={activeWallet}
            categories={categories}
            recurringTransactions={recurringTransactions}
            settings={settings}
            t={t}
            onCreate={onCreateRecurring}
            onUpdate={onUpdateRecurring}
            onSetPaused={onSetRecurringPaused}
            onDelete={onDeleteRecurring}
          />
        )
      ) : (
        <EmptyState icon={WalletCards} title={wallets.length ? t.transaction.selectWalletFirst : t.wallets.createEmpty} />
      )}
    </div>
  );
}
