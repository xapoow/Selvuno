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
import { selectWalletContext } from "../state/financeSelectors";
import { useAppSelector } from "../state/hooks";

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
  const { displayCurrency, conversionNeeded } = useAppSelector(selectWalletContext);
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
