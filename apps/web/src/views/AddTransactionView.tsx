import type { Category, Settings, TransactionInput, Wallet } from "@myfinances/types";
import { WalletCards } from "lucide-react";
import { TransactionForm } from "../components/TransactionForm";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";

interface AddTransactionViewProps {
  wallets: Wallet[];
  categories: Category[];
  settings: Settings;
  t: Dictionary;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export function AddTransactionView({ wallets, categories, settings, t, onSubmit }: AddTransactionViewProps) {
  const activeWallet = settings.activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === settings.activeWalletId);

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.transaction.addTitle}</h2>
      </div>
      {activeWallet ? (
        <div className="rounded-app border border-line bg-surface p-4">
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
      ) : (
        <EmptyState icon={WalletCards} title={wallets.length ? t.transaction.selectWalletFirst : t.wallets.createEmpty} />
      )}
    </div>
  );
}
