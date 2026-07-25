import type { Category, Settings, Transaction, Wallet, WalletView } from "@myfinances/types";
import { DashboardView } from "../views/DashboardView";
import { type Dictionary } from "../i18n";
import { useExchangeRates } from "../lib/exchangeRates";
import { MobileWalletPager } from "./MobileWalletPager";

interface MobileWalletDashboardPagerProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  allLabel: string;
  t: Dictionary;
  onChange: (value: WalletView) => void;
  onAdd: () => void;
}

function MobileWalletDashboardSlide({
  walletView,
  wallets,
  categories,
  transactions,
  settings,
  t,
  onAdd
}: Omit<MobileWalletDashboardPagerProps, "activeWalletId" | "allLabel" | "onChange"> & {
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
    <DashboardView
      wallets={wallets}
      categories={categories}
      transactions={transactions}
      settings={settings}
      activeWalletId={walletView}
      displayCurrency={displayCurrency}
      exchangeRates={exchangeRates.data}
      isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
      hasExchangeRateError={exchangeRates.isError && conversionNeeded}
      t={t}
      onAdd={onAdd}
    />
  );
}

export function MobileWalletDashboardPager({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  allLabel,
  t,
  onChange,
  onAdd
}: MobileWalletDashboardPagerProps) {
  return (
    <MobileWalletPager
      wallets={wallets}
      activeWalletId={activeWalletId}
      allLabel={allLabel}
      allCurrency={settings.currency}
      swipeHint={t.wallets.swipeHint}
      onChange={onChange}
    >
      {(option) => (
        <MobileWalletDashboardSlide
          walletView={option.value}
          wallets={wallets}
          categories={categories}
          transactions={transactions}
          settings={settings}
          t={t}
          onAdd={onAdd}
        />
      )}
    </MobileWalletPager>
  );
}
