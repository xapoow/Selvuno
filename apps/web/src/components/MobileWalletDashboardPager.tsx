import type {
  Category,
  MonthlyBudget,
  MonthlyBudgetInput,
  Settings,
  Transaction,
  Wallet,
  WalletTransfer,
  WalletView
} from "@myfinances/types";
import { DashboardView } from "../views/DashboardView";
import { type Dictionary } from "../i18n";
import { useExchangeRates } from "../lib/exchangeRates";
import { MobileWalletPager } from "./MobileWalletPager";

interface MobileWalletDashboardPagerProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  budgets: MonthlyBudget[];
  settings: Settings;
  activeWalletId: WalletView;
  allLabel: string;
  t: Dictionary;
  onChange: (value: WalletView) => void;
  onAdd: () => void;
  onSetBudget: (input: MonthlyBudgetInput) => Promise<unknown>;
}

function MobileWalletDashboardSlide({
  walletView,
  wallets,
  categories,
  transactions,
  transfers,
  budgets,
  settings,
  t,
  onAdd,
  onSetBudget
}: Omit<MobileWalletDashboardPagerProps, "activeWalletId" | "allLabel" | "onChange"> & {
  walletView: WalletView;
}) {
  const activeWallet = walletView === "all" ? undefined : wallets.find((wallet) => wallet.id === walletView);
  const displayCurrency = activeWallet?.currency ?? settings.currency;
  const conversionNeeded =
    transactions.some(
      (transaction) =>
        !transaction.deletedAt &&
        (walletView === "all" || transaction.walletId === walletView) &&
        transaction.currency.toUpperCase() !== displayCurrency
    ) ||
    wallets.some(
      (wallet) =>
        !wallet.deletedAt &&
        (walletView === "all" || wallet.id === walletView) &&
        wallet.initialBalanceMinor !== 0 &&
        wallet.currency.toUpperCase() !== displayCurrency
    ) ||
    transfers.some(
      (transfer) =>
        !transfer.deletedAt &&
        (((walletView === "all" || transfer.fromWalletId === walletView) &&
          transfer.fromCurrency.toUpperCase() !== displayCurrency) ||
          ((walletView === "all" || transfer.toWalletId === walletView) &&
            transfer.toCurrency.toUpperCase() !== displayCurrency))
    );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);

  return (
    <DashboardView
      wallets={wallets}
      categories={categories}
      transactions={transactions}
      transfers={transfers}
      budgets={budgets}
      settings={settings}
      activeWalletId={walletView}
      displayCurrency={displayCurrency}
      exchangeRates={exchangeRates.data}
      isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
      hasExchangeRateError={exchangeRates.isError && conversionNeeded}
      t={t}
      onAdd={onAdd}
      onSetBudget={onSetBudget}
    />
  );
}

export function MobileWalletDashboardPager({
  wallets,
  categories,
  transactions,
  transfers,
  budgets,
  settings,
  activeWalletId,
  allLabel,
  t,
  onChange,
  onAdd,
  onSetBudget
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
          transfers={transfers}
          budgets={budgets}
          settings={settings}
          t={t}
          onAdd={onAdd}
          onSetBudget={onSetBudget}
        />
      )}
    </MobileWalletPager>
  );
}
