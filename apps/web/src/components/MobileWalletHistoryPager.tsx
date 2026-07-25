import type { Category, Settings, Transaction, TransactionInput, Wallet, WalletView } from "@myfinances/types";
import { HistoryView } from "../views/HistoryView";
import { type Dictionary } from "../i18n";
import { useExchangeRates } from "../lib/exchangeRates";
import { MobileWalletPager } from "./MobileWalletPager";

interface MobileWalletHistoryPagerProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  allLabel: string;
  t: Dictionary;
  onChange: (value: WalletView) => void;
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function MobileWalletHistorySlide({
  walletView,
  wallets,
  categories,
  transactions,
  settings,
  t,
  onUpdate,
  onDelete
}: Omit<MobileWalletHistoryPagerProps, "activeWalletId" | "allLabel" | "onChange"> & {
  walletView: WalletView;
}) {
  const activeWallet = walletView === "all" ? undefined : wallets.find((wallet) => wallet.id === walletView);
  const displayCurrency = activeWallet?.currency ?? settings.currency;
  const conversionNeeded = transactions.some(
    (transaction) =>
      !transaction.deletedAt &&
      (walletView === "all" || transaction.walletId === walletView) &&
      transaction.currency.toUpperCase() !== displayCurrency
  );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);

  return (
    <HistoryView
      wallets={wallets}
      categories={categories}
      transactions={transactions}
      settings={settings}
      activeWalletId={walletView}
      displayCurrency={displayCurrency}
      exchangeRates={exchangeRates.data}
      t={t}
      showTitle={false}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}

export function MobileWalletHistoryPager({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  allLabel,
  t,
  onChange,
  onUpdate,
  onDelete
}: MobileWalletHistoryPagerProps) {
  return (
    <MobileWalletPager
      wallets={wallets}
      activeWalletId={activeWalletId}
      allLabel={allLabel}
      allCurrency={settings.currency}
      eyebrow={t.history.title}
      onChange={onChange}
    >
      {(option) => (
        <MobileWalletHistorySlide
          walletView={option.value}
          wallets={wallets}
          categories={categories}
          transactions={transactions}
          settings={settings}
          t={t}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </MobileWalletPager>
  );
}
