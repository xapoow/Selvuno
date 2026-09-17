import { useState } from "react";
import type {
  Category,
  RecurringTransaction,
  RecurringTransactionInput,
  Settings,
  Transaction,
  TransactionInput,
  TransactionTemplate,
  TransactionTemplateInput,
  Wallet
} from "@myfinances/types";
import { LayoutTemplate, WalletCards } from "lucide-react";
import { RecurringTransactionsPanel } from "../components/RecurringTransactionsPanel";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionTemplateManager } from "../components/TransactionTemplateManager";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import type { Dictionary } from "../i18n";

interface AddTransactionViewProps {
  wallets: Wallet[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  transactions: Transaction[];
  templates: TransactionTemplate[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCreateTemplate: (input: TransactionTemplateInput) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onCreateRecurring: (input: RecurringTransactionInput) => Promise<void>;
  onUpdateRecurring: (id: string, input: RecurringTransactionInput) => Promise<void>;
  onSetRecurringPaused: (id: string, paused: boolean) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
}

export function AddTransactionView({
  wallets,
  categories,
  recurringTransactions,
  transactions,
  templates,
  settings,
  t,
  onSubmit,
  onCreateTemplate,
  onDeleteTemplate,
  onCreateRecurring,
  onUpdateRecurring,
  onSetRecurringPaused,
  onDeleteRecurring
}: AddTransactionViewProps) {
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [templatesOpen, setTemplatesOpen] = useState(false);
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
              <div className="flex flex-wrap items-center gap-2">
                {settings.quickTemplatesEnabled ? (
                  <Button variant="secondary" size="small" onClick={() => setTemplatesOpen(true)}>
                    <LayoutTemplate className="h-4 w-4" />
                    {t.transaction.manageTemplates}
                  </Button>
                ) : null}
                <span className="app-control rounded-full px-3 py-1.5 text-xs font-semibold text-muted">
                  {activeWallet.name} · {activeWallet.currency}
                </span>
              </div>
            </div>
            <div className="app-surface rounded-2xl p-3 sm:p-5">
              <TransactionForm
                wallets={wallets}
                categories={categories}
                settings={settings}
                t={t}
                activeWalletId={settings.activeWalletId}
                lockWalletToActive
                recentTransactions={transactions.filter(
                  (transaction) => transaction.walletId === activeWallet.id
                )}
                templates={templates.filter((template) => template.walletId === activeWallet.id)}
                submitLabel={t.transaction.save}
                onSubmit={onSubmit}
              />
            </div>
            <BottomSheet
              open={templatesOpen}
              title={t.transaction.manageTemplates}
              onClose={() => setTemplatesOpen(false)}
            >
              <TransactionTemplateManager
                wallet={activeWallet}
                categories={categories}
                templates={templates}
                settings={settings}
                t={t}
                onCreate={onCreateTemplate}
                onDelete={onDeleteTemplate}
              />
            </BottomSheet>
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
