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
      <div className="max-w-md">
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
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-foreground">{t.transaction.addTitle}</h2>
            <div className="app-surface rounded-app p-4">
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
