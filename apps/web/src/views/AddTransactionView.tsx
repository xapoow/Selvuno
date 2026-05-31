import type { Category, Settings, TransactionInput, Wallet } from "@myfinances/types";
import { TransactionForm } from "../components/TransactionForm";
import type { Dictionary } from "../i18n";

interface AddTransactionViewProps {
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function AddTransactionView({ wallets, categories, settings, t, onSubmit }: AddTransactionViewProps) {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.transaction.addTitle}</h2>
      </div>
      <div className="rounded-app border border-line bg-surface p-4">
        <TransactionForm
          wallets={wallets}
          categories={categories}
          settings={settings}
          t={t}
          activeWalletId={settings.activeWalletId}
          submitLabel={t.transaction.save}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
