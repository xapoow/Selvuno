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
  const options = [
    { value: "all" as WalletView, name: allLabel, currency: settings.currency },
    ...wallets.map((wallet) => ({
      value: wallet.id as WalletView,
      name: wallet.name,
      currency: wallet.currency
    }))
  ];
  const activeIndex = options.findIndex((opt) => opt.value === activeWalletId);
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeOption = options[resolvedIndex] ?? options[0];

  function handleSelectIndex(index: number) {
    if (index >= 0 && index < options.length && index !== resolvedIndex) {
      onChange(options[index].value);
    }
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const swipeThreshold = 50;
    const velocityThreshold = 350;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      if (resolvedIndex < options.length - 1) {
        handleSelectIndex(resolvedIndex + 1);
      }
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      if (resolvedIndex > 0) {
        handleSelectIndex(resolvedIndex - 1);
      }
    }
  }

  return (
    <div className="relative">
      {/* Persistent sticky mobile header: MyFinances • Бюджет */}
      <header className="app-chrome sticky top-0 z-30 -mx-4 -mt-4 mb-4 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">MyFinances</span>
          <span className="text-xs text-muted/40">•</span>
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {t.budget.monthPlan}
          </span>
        </div>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Wallet selector">
          {options.map((option, idx) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-label={option.name}
              aria-selected={idx === resolvedIndex}
              onClick={() => handleSelectIndex(idx)}
              className="p-1"
            >
              <span
                className={
                  idx === resolvedIndex
                    ? "block h-1.5 w-5 rounded-full bg-accent transition-all duration-200"
                    : "block h-1.5 w-1.5 rounded-full bg-muted/30 transition-all duration-200"
                }
              />
            </button>
          ))}
        </div>
      </header>

      {/* Full-page swipeable carousel container */}
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
    </div>
  );
}
