import type { Category, Settings, TransactionInput, Wallet } from "@myfinances/types";
import { TransactionForm } from "../components/TransactionForm";

interface AddTransactionViewProps {
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function AddTransactionView({ wallets, categories, settings, onSubmit }: AddTransactionViewProps) {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Add transaction</h2>
      </div>
      <div className="rounded-app border border-line bg-surface p-4">
        <TransactionForm
          wallets={wallets}
          categories={categories}
          settings={settings}
          activeWalletId={settings.activeWalletId}
          submitLabel="Save transaction"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
