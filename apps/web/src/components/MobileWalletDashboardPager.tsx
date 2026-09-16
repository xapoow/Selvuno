import { useState } from "react";
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
import { MonobankWalletCarousel } from "./MonobankWalletCarousel";
import { getIncludedWalletIds } from "../lib/walletFeatures";

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
  onChange: (value: WalletView, direction?: number) => void;
  onAdd: () => void;
  onSetBudget: (input: MonthlyBudgetInput) => Promise<unknown>;
}

function MobileWalletDashboardSlide({
  walletView,
  direction = 1,
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
  direction?: number;
}) {
  const activeWallet = walletView === "all" ? undefined : wallets.find((wallet) => wallet.id === walletView);
  const displayCurrency = activeWallet?.currency ?? settings.currency;
  const includedWalletIds = getIncludedWalletIds(wallets, settings.advancedWalletsEnabled);
  const walletIsInCurrentStatistics = (walletId: string) =>
    walletView === "all" ? includedWalletIds.has(walletId) : walletId === walletView;
  const conversionNeeded =
    transactions.some(
      (transaction) =>
        !transaction.deletedAt &&
        walletIsInCurrentStatistics(transaction.walletId) &&
        transaction.currency.toUpperCase() !== displayCurrency
    ) ||
    wallets.some(
      (wallet) =>
        !wallet.deletedAt &&
        walletIsInCurrentStatistics(wallet.id) &&
        wallet.initialBalanceMinor !== 0 &&
        wallet.currency.toUpperCase() !== displayCurrency
    ) ||
    transfers.some(
      (transfer) =>
        !transfer.deletedAt &&
        ((walletIsInCurrentStatistics(transfer.fromWalletId) &&
          transfer.fromCurrency.toUpperCase() !== displayCurrency) ||
          (walletIsInCurrentStatistics(transfer.toWalletId) &&
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
      direction={direction}
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
  const [slideDirection, setSlideDirection] = useState(1);

  const handleWalletChange = (nextWalletId: WalletView, direction = 1) => {
    setSlideDirection(direction);
    onChange(nextWalletId, direction);
  };

  return (
    <div className="grid w-full min-w-0 max-w-full gap-6">
      <MonobankWalletCarousel
        wallets={wallets}
        activeWalletId={activeWalletId}
        transactions={transactions}
        transfers={transfers}
        settings={settings}
        t={t}
        onChange={handleWalletChange}
      />

      <MobileWalletDashboardSlide
        walletView={activeWalletId}
        direction={slideDirection}
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
    </div>
  );
}
