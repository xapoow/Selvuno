import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type {
  Category,
  DashboardBlockId,
  SavingsGoal,
  SavingsGoalContribution,
  MonthlyBudget,
  MonthlyBudgetInput,
  Settings,
  Transaction,
  Wallet,
  WalletTransfer,
  WalletView
} from "@myfinances/types";
import { BarChart3, PlusCircle } from "lucide-react";
import { calculateWalletAdjustmentTotal, filterTransactionsByWallet, formatMoney } from "@myfinances/utils";
import {
  AnalyticsView,
  type AnalyticsCategoryItem
} from "../components/AnalyticsView";
import { DashboardGoals } from "../components/DashboardGoals";
import { dashboardRows } from "../lib/dashboardLayout";
import { BudgetOverviewCard } from "../components/BudgetOverviewCard";
import { SmartInsightsCard } from "../components/SmartInsightsCard";
import { BudgetPlanView } from "../components/BudgetPlanView";
import { TransactionRow } from "../components/TransactionRow";
import { TransactionDetailsSheet } from "../components/TransactionDetailsSheet";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { StatPanel } from "../components/ui/StatPanel";
import { getCategoryName, type Dictionary } from "../i18n";
import { cn } from "../lib/cn";
import { calculateMonthlyBudgetProgress, formatBudgetMonth, getBudgetMonth } from "../lib/budgets";
import { convertMinorToBaseCurrency, type ExchangeRateTable, useExchangeRates } from "../lib/exchangeRates";
import { getTimeGreeting } from "../lib/greetings";
import { buildSmartInsights } from "../lib/insights";
import {
  filterTransactionsForTotals,
  getIncludedWalletIds,
  shouldHideWalletAmounts
} from "../lib/walletFeatures";
import { compareTransactionsNewestFirst } from "../lib/transactions";
import type { TransactionSubmission } from "../lib/transactionAttachments";
import type { DashboardPage } from "../lib/routes";

interface DashboardViewProps {
  page?: DashboardPage;
  onPageChange?: (page: DashboardPage) => void;
  onBack?: () => void;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  budgets: MonthlyBudget[];
  goals?: SavingsGoal[];
  contributions?: SavingsGoalContribution[];
  onOpenGoals?: () => void;
  settings: Settings;
  activeWalletId: WalletView;
  displayCurrency: string;
  exchangeRates?: ExchangeRateTable;
  isUpdatingExchangeRates: boolean;
  hasExchangeRateError: boolean;
  showBalanceStat?: boolean;
  direction?: number;
  t: Dictionary;
  onAdd: () => void;
  onSetBudget: (input: MonthlyBudgetInput) => Promise<unknown>;
  onUpdateTransaction: (id: string, submission: TransactionSubmission) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export function DashboardView({
  page: routedPage,
  onPageChange,
  onBack,
  wallets,
  categories,
  transactions,
  transfers,
  budgets,
  goals = [],
  contributions = [],
  onOpenGoals = () => undefined,
  settings,
  activeWalletId,
  displayCurrency,
  exchangeRates,
  isUpdatingExchangeRates,
  hasExchangeRateError,
  showBalanceStat = false,
  direction = 1,
  t,
  onAdd,
  onSetBudget,
  onUpdateTransaction,
  onDeleteTransaction
}: DashboardViewProps) {
  const [localPage, setLocalPage] = useState<DashboardPage>("overview");
  const page = routedPage ?? localPage;
  const analyticsOpen = page === "analytics";
  const budgetOpen = page === "budget";
  const setPage = (next: DashboardPage) => { if (onPageChange) onPageChange(next); else setLocalPage(next); };
  const back = () => { if (onBack) onBack(); else setPage("overview"); };
  const [chartType, setChartType] = useState<"expense" | "income">("expense");
  const [details, setDetails] = useState<Transaction | null>(null);
  const advancedWalletsEnabled = settings.advancedWalletsEnabled;
  const includedWalletIds = useMemo(
    () =>
      getIncludedWalletIds(wallets, advancedWalletsEnabled),
    [advancedWalletsEnabled, wallets]
  );
  const statisticsTransactions = useMemo(
    () =>
      filterTransactionsForTotals(transactions, includedWalletIds),
    [includedWalletIds, transactions]
  );
  const activeWallet =
    activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === activeWalletId);
  const hideAmounts = shouldHideWalletAmounts(settings, activeWallet);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [analyticsOpen, budgetOpen]);

  const budgetConversionNeeded =
    statisticsTransactions.some(
      (transaction) =>
        !transaction.deletedAt &&
        transaction.type === "expense" &&
        transaction.currency.toUpperCase() !== settings.currency
    ) || budgets.some((budget) => !budget.deletedAt && budget.currency.toUpperCase() !== settings.currency);
  const budgetExchangeRates = useExchangeRates(settings.currency, budgetConversionNeeded);
  const currentBudgetMonth = getBudgetMonth(new Date(), settings.timeZone);
  const budgetProgress = calculateMonthlyBudgetProgress({
    month: currentBudgetMonth,
    timeZone: settings.timeZone,
    currency: settings.currency,
    categories,
    budgets,
    transactions: statisticsTransactions,
    exchangeRates: budgetExchangeRates.data
  });
  const sourceTransactions =
    activeWalletId === "all" ? statisticsTransactions : transactions;
  const visibleTransactions = filterTransactionsByWallet(sourceTransactions, activeWalletId).filter(
    (transaction) => !transaction.deletedAt
  );
  const displayTransactions = [...visibleTransactions].sort(compareTransactionsNewestFirst).map((transaction) => {
    const convertedAmountMinor = convertMinorToBaseCurrency(
      transaction.amountMinor,
      transaction.currency,
      displayCurrency,
      exchangeRates
    );
    return {
      transaction,
      amountMinor: convertedAmountMinor ?? transaction.amountMinor,
      currency: convertedAmountMinor === null ? transaction.currency : displayCurrency,
      conversionMissing: convertedAmountMinor === null && transaction.currency.toUpperCase() !== displayCurrency
    };
  });
  const visibleWallets =
    activeWalletId === "all"
      ? wallets.filter((wallet) => includedWalletIds.has(wallet.id))
      : wallets.filter((wallet) => wallet.id === activeWalletId);
  const visibleWalletIds = new Set(visibleWallets.map((wallet) => wallet.id));
  const rawBalanceAdjustments: Array<{
    amountMinor: number;
    currency: string;
    direction: -1 | 1;
  }> = [
    ...visibleWallets
      .filter((wallet) => !wallet.deletedAt && (wallet.initialBalanceMinor + calculateWalletAdjustmentTotal(wallet)) !== 0)
      .map((wallet) => ({
        amountMinor: wallet.initialBalanceMinor + calculateWalletAdjustmentTotal(wallet),
        currency: wallet.currency,
        direction: 1 as const
      })),
    ...transfers
      .filter(
        (transfer) =>
          !transfer.deletedAt &&
          (visibleWalletIds.has(transfer.fromWalletId) ||
            visibleWalletIds.has(transfer.toWalletId))
      )
      .flatMap((transfer): Array<{
        amountMinor: number;
        currency: string;
        direction: -1 | 1;
      }> => {
        const adjustments: Array<{
          amountMinor: number;
          currency: string;
          direction: -1 | 1;
        }> = [];
        if (visibleWalletIds.has(transfer.fromWalletId)) {
          adjustments.push({
            amountMinor: transfer.fromAmountMinor,
            currency: transfer.fromCurrency,
            direction: -1 as const
          });
        }
        if (visibleWalletIds.has(transfer.toWalletId)) {
          adjustments.push({
            amountMinor: transfer.toAmountMinor,
            currency: transfer.toCurrency,
            direction: 1 as const
          });
        }
        return adjustments;
      })
  ];
  const normalizedBalanceAdjustments = rawBalanceAdjustments.map((adjustment) => {
    const convertedAmountMinor = convertMinorToBaseCurrency(
      adjustment.amountMinor,
      adjustment.currency,
      displayCurrency,
      exchangeRates
    );
    return {
      ...adjustment,
      convertedAmountMinor,
      conversionMissing:
        convertedAmountMinor === null && adjustment.currency.toUpperCase() !== displayCurrency
    };
  });
  const hasMissingRates =
    displayTransactions.some((transaction) => transaction.conversionMissing) ||
    normalizedBalanceAdjustments.some((adjustment) => adjustment.conversionMissing);
  const totals = displayTransactions.reduce(
    (result, item) => {
      if (item.conversionMissing) {
        return result;
      }
      if (item.transaction.type === "income") {
        result.incomeMinor += item.amountMinor;
        result.balanceMinor += item.amountMinor;
      } else {
        result.expenseMinor += item.amountMinor;
        result.balanceMinor -= item.amountMinor;
      }
      return result;
    },
    { incomeMinor: 0, expenseMinor: 0, balanceMinor: 0 }
  );
  normalizedBalanceAdjustments.forEach((adjustment) => {
    if (!adjustment.conversionMissing && adjustment.convertedAmountMinor !== null) {
      totals.balanceMinor += adjustment.direction * adjustment.convertedAmountMinor;
    }
  });
  const recentTransactions = displayTransactions.slice(0, 4);
  const smartInsights = settings.smartInsightsEnabled
    ? buildSmartInsights({
        transactions: displayTransactions
          .filter((item) => !item.conversionMissing)
          .map((item) => ({
            type: item.transaction.type,
            amountMinor: item.amountMinor,
            categoryId: item.transaction.categoryId,
            transactionDate: item.transaction.transactionDate,
            recurringTransactionId: item.transaction.recurringTransactionId
          })),
        now: new Date(),
        timeZone: settings.timeZone
      })
    : [];
  const greeting = getTimeGreeting(new Date(), settings.timeZone, t);
  const hasCurrencyConversion =
    displayTransactions.some(
      (item) => item.transaction.currency.toUpperCase() !== displayCurrency
    ) ||
    normalizedBalanceAdjustments.some(
      (item) => item.currency.toUpperCase() !== displayCurrency
    );
  const buildCategoryTotals = (type: "expense" | "income"): AnalyticsCategoryItem[] =>
    categories
      .filter((category) => category.type === type)
      .map((category) => ({
        id: category.id,
        name: getCategoryName(category.name, t),
        color: category.color,
        value: displayTransactions
          .filter(
            (item) =>
              item.transaction.type === type &&
              item.transaction.categoryId === category.id &&
              !item.conversionMissing
          )
          .reduce((sum, item) => sum + item.amountMinor, 0)
      }))
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value);
  const expenseCategories = buildCategoryTotals("expense");
  const incomeCategories = buildCategoryTotals("income");
  const categoryTotals = chartType === "expense" ? expenseCategories : incomeCategories;
  const summaryCategories = categoryTotals.slice(0, 6);
  const chartTotal = summaryCategories.reduce((sum, item) => sum + item.value, 0);
  let accumulatedShare = 0;
  const donutGradient = summaryCategories.length
    ? `conic-gradient(${summaryCategories
        .map((item) => {
          const start = accumulatedShare;
          accumulatedShare += (item.value / chartTotal) * 100;
          return `${item.color} ${start}% ${accumulatedShare}%`;
        })
        .join(", ")})`
    : "rgb(var(--color-elevated))";
  if (budgetOpen) {
    return (
      <BudgetPlanView
        initialMonth={currentBudgetMonth}
        categories={categories}
        budgets={budgets}
        transactions={statisticsTransactions}
        settings={settings}
        exchangeRates={budgetExchangeRates.data}
        t={t}
        onSetBudget={onSetBudget}
        onBack={back}
      />
    );
  }

  if (analyticsOpen) {
    return (
      <AnalyticsView
        wallets={wallets}
        categories={categories}
        transactions={transactions}
        settings={settings}
        initialWalletId={activeWalletId}
        t={t}
        onBack={back}
      />
    );
  }

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.045,
        delayChildren: 0.01
      }
    }
  };

  const staggerItem = {
    hidden: (dir: number) => ({
      opacity: 0,
      x: (dir || 1) * 22,
      y: 6
    }),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 380,
        damping: 32,
        mass: 0.7
      }
    }
  };

  const blocks: Record<DashboardBlockId, ReactNode> = {
    summary: (
      <div className="grid gap-3">
        {showBalanceStat ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatPanel label={t.common.balance} value={formatMoney(totals.balanceMinor, displayCurrency, settings.locale, hideAmounts)} />
            <StatPanel
              label={t.common.income}
              value={formatMoney(totals.incomeMinor, displayCurrency, settings.locale, hideAmounts)}
              tone="income"
            />
            <StatPanel
              label={t.common.expenses}
              value={formatMoney(totals.expenseMinor, displayCurrency, settings.locale, hideAmounts)}
              tone="expense"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatPanel
              label={t.common.income}
              value={formatMoney(totals.incomeMinor, displayCurrency, settings.locale, hideAmounts)}
              tone="income"
            />
            <StatPanel
              label={t.common.expenses}
              value={formatMoney(totals.expenseMinor, displayCurrency, settings.locale, hideAmounts)}
              tone="expense"
            />
          </div>
        )}
      </div>
    ),
    budget: (
      <BudgetOverviewCard
        currency={settings.currency}
        locale={settings.locale}
        hideAmounts={hideAmounts}
        monthLabel={formatBudgetMonth(currentBudgetMonth, settings.locale)}
        progress={budgetProgress}
        t={t}
        onOpen={() => setPage("budget")}
      />
    ),
    insights: <SmartInsightsCard insights={smartInsights} categories={categories} t={t} />,
    cashFlow: (
      <Section title={t.dashboard.cashFlow}>
        <div className="app-surface grid min-h-[286px] gap-4 rounded-2xl p-4 sm:p-5">
          <div className="app-control grid w-full max-w-sm grid-cols-2 justify-self-center rounded-xl p-1">
            {(["expense", "income"] as const).map((type) => {
              const hasData = (type === "expense" ? expenseCategories : incomeCategories).length > 0;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!hasData}
                  onClick={() => setChartType(type)}
                  className={cn(
                    "app-focus h-9 rounded-lg text-xs font-semibold text-muted outline-none disabled:cursor-not-allowed disabled:opacity-40",
                    chartType === type && "app-selected-control text-foreground"
                  )}
                >
                  {type === "expense" ? t.common.expenses : t.common.income}
                </button>
              );
            })}
          </div>

          {categoryTotals.length ? (
            <div className="grid items-center gap-4 sm:grid-cols-[210px_1fr]">
              <button
                type="button"
                onClick={() => setPage("analytics")}
                className="app-focus relative h-48 rounded-full outline-none active:scale-[0.98]"
                aria-label={t.dashboard.openAnalytics}
              >
                <span
                  className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_16px_34px_rgb(0_0_0/0.18)]"
                  style={{ background: donutGradient }}
                >
                  <span className="absolute inset-7 rounded-full bg-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]" />
                  <span className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {chartType === "expense" ? t.common.expenses : t.common.income}
                    </span>
                    <span className="mt-1 text-lg font-semibold text-foreground">
                      {formatMoney(chartTotal, displayCurrency, settings.locale, hideAmounts)}
                    </span>
                  </span>
                </span>
              </button>
              <div className="grid content-center gap-3">
                {summaryCategories.map((item) => {
                  const percentage = chartTotal ? Math.round((item.value / chartTotal) * 100) : 0;
                  return (
                    <div key={item.id} className="grid gap-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-muted">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-semibold text-foreground">{percentage}%</span>
                      </div>
                      <span className="h-1.5 overflow-hidden rounded-full bg-elevated">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: item.color }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[188px] place-items-center text-center">
              <div className="grid justify-items-center gap-3">
                <span className="app-control grid h-10 w-10 place-items-center rounded-xl text-muted">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <p className="max-w-56 text-sm font-medium text-muted">{t.dashboard.emptyChart}</p>
              </div>
            </div>
          )}
        </div>
      </Section>
    ),
    recent: (
      <Section title={t.dashboard.recent}>
        {recentTransactions.length ? (
          <div className="grid content-start gap-2">
            {recentTransactions.map((item) => (
              <TransactionRow
                key={item.transaction.id}
                transaction={item.transaction}
                category={categories.find((category) => category.id === item.transaction.categoryId)}
                wallet={wallets.find((wallet) => wallet.id === item.transaction.walletId)}
                settings={{ ...settings, hideAmounts }}
                displayAmountMinor={item.amountMinor}
                displayCurrency={item.currency}
                conversionMissing={item.conversionMissing}
                t={t}
                onOpen={setDetails}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PlusCircle}
            title={t.dashboard.emptyTransactions}
            className="min-h-[286px]"
            action={
              <button type="button" onClick={onAdd} className="text-sm font-semibold text-accent">
                {t.dashboard.addTransaction}
              </button>
            }
          />
        )}
      </Section>
    ),
    goals: <DashboardGoals goals={goals} contributions={contributions} wallets={wallets} activeWalletId={activeWalletId} settings={settings} t={t} onOpen={onOpenGoals} />
  };
  const rows = dashboardRows(settings);

  return (
    <motion.div key={activeWalletId} custom={direction} variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6">
      <motion.div custom={direction} variants={staggerItem}>
        <p className="text-xl font-semibold text-foreground">{greeting}</p>
        {hasCurrencyConversion ? (
          <p className="mt-1 text-sm text-muted">
            {isUpdatingExchangeRates
              ? t.dashboard.exchangeRatesLoading
              : hasExchangeRateError || hasMissingRates
                ? t.dashboard.exchangeRatesUnavailable
                : `${t.dashboard.convertedTo} ${displayCurrency}`}
          </p>
        ) : null}
      </motion.div>

      {rows.map((row) => (
        <motion.div key={row.join("-")} custom={direction} variants={staggerItem}
          className={cn("grid min-w-0 items-start gap-6", row.length === 2 && (
            row[0] === "cashFlow" ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]" : "lg:grid-cols-[minmax(330px,0.85fr)_minmax(0,1.15fr)]"
          ))}>
          {row.map((id) => <div key={id} data-dashboard-block={id} className="min-w-0">{blocks[id]}</div>)}
        </motion.div>
      ))}
      {!rows.length ? <p className="app-surface rounded-2xl p-4 text-sm leading-6 text-muted">{t.homeLayout.empty}</p> : null}
      <TransactionDetailsSheet
        open={Boolean(details)}
        transaction={transactions.find((transaction) => transaction.id === details?.id) ?? details}
        category={categories.find((category) => category.id === details?.categoryId)}
        wallet={wallets.find((wallet) => wallet.id === details?.walletId)}
        wallets={wallets}
        categories={categories}
        settings={{ ...settings, hideAmounts }}
        t={t}
        displayAmountMinor={displayTransactions.find((item) => item.transaction.id === details?.id)?.amountMinor}
        displayCurrency={displayTransactions.find((item) => item.transaction.id === details?.id)?.currency}
        conversionMissing={displayTransactions.find((item) => item.transaction.id === details?.id)?.conversionMissing}
        onClose={() => setDetails(null)}
        onUpdate={onUpdateTransaction}
        onDelete={onDeleteTransaction}
      />
    </motion.div>
  );
}
