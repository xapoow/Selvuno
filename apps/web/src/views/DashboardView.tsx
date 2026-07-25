import { useState } from "react";
import type { Category, Settings, Transaction, Wallet, WalletView } from "@myfinances/types";
import { ArrowUpRight, PlusCircle } from "lucide-react";
import { filterTransactionsByWallet, formatMoney } from "@myfinances/utils";
import {
  AnalyticsView,
  type AnalyticsCategoryItem,
  type AnalyticsTrendItem
} from "../components/AnalyticsView";
import { TransactionRow } from "../components/TransactionRow";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { StatPanel } from "../components/ui/StatPanel";
import { getCategoryName, type Dictionary } from "../i18n";
import { cn } from "../lib/cn";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "../lib/exchangeRates";
import { getTimeGreeting } from "../lib/greetings";

interface DashboardViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  displayCurrency: string;
  exchangeRates?: ExchangeRateTable;
  isUpdatingExchangeRates: boolean;
  hasExchangeRateError: boolean;
  t: Dictionary;
  onAdd: () => void;
}

export function DashboardView({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  displayCurrency,
  exchangeRates,
  isUpdatingExchangeRates,
  hasExchangeRateError,
  t,
  onAdd
}: DashboardViewProps) {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [chartType, setChartType] = useState<"expense" | "income">("expense");
  const visibleTransactions = filterTransactionsByWallet(transactions, activeWalletId).filter(
    (transaction) => !transaction.deletedAt
  );
  const displayTransactions = visibleTransactions.map((transaction) => {
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
  const hasMissingRates = displayTransactions.some((transaction) => transaction.conversionMissing);
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
  const recentTransactions = displayTransactions.slice(0, 4);
  const greeting = getTimeGreeting(new Date(), settings.timeZone, t);
  const hasCurrencyConversion = displayTransactions.some(
    (item) => item.transaction.currency.toUpperCase() !== displayCurrency
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
  const trendData: AnalyticsTrendItem[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const values = displayTransactions.filter((item) => {
      const transactionDate = new Date(item.transaction.transactionDate);
      return !item.conversionMissing && transactionDate >= date && transactionDate < nextDate;
    });
    return {
      label: new Intl.DateTimeFormat(settings.locale, { weekday: "short" }).format(date),
      expense: values
        .filter((item) => item.transaction.type === "expense")
        .reduce((sum, item) => sum + item.amountMinor, 0),
      income: values
        .filter((item) => item.transaction.type === "income")
        .reduce((sum, item) => sum + item.amountMinor, 0)
    };
  });

  if (analyticsOpen) {
    return (
      <AnalyticsView
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        trendData={trendData}
        transactionCounts={{
          expense: displayTransactions.filter(
            (item) => !item.conversionMissing && item.transaction.type === "expense"
          ).length,
          income: displayTransactions.filter(
            (item) => !item.conversionMissing && item.transaction.type === "income"
          ).length
        }}
        currency={displayCurrency}
        locale={settings.locale}
        t={t}
        onBack={() => setAnalyticsOpen(false)}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div>
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
      </div>
      <section className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPanel label={t.common.balance} value={formatMoney(totals.balanceMinor, displayCurrency, settings.locale)} />
          <StatPanel
            label={t.common.income}
            value={formatMoney(totals.incomeMinor, displayCurrency, settings.locale)}
            tone="income"
          />
          <StatPanel
            label={t.common.expenses}
            value={formatMoney(totals.expenseMinor, displayCurrency, settings.locale)}
            tone="expense"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]">
        <Section
          title={t.dashboard.cashFlow}
          action={
            <button
              type="button"
              onClick={() => setAnalyticsOpen(true)}
              className="app-focus inline-flex items-center gap-1 text-xs font-semibold text-accent"
            >
              {t.dashboard.openAnalytics}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="app-surface grid min-h-[330px] gap-4 rounded-app p-4 sm:grid-cols-[210px_1fr] sm:p-5">
            <div className="grid content-start gap-4">
              <div className="app-control grid grid-cols-2 rounded-app p-1">
                {(["expense", "income"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setChartType(type)}
                    className={cn(
                      "app-focus h-9 rounded-[6px] text-xs font-semibold text-muted",
                      chartType === type && "app-selected-control text-foreground"
                    )}
                  >
                    {type === "expense" ? t.common.expenses : t.common.income}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsOpen(true)}
                className="app-focus relative h-48 rounded-full outline-none active:scale-[0.98]"
                aria-label={t.dashboard.openAnalytics}
              >
                {categoryTotals.length ? (
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
                        {formatMoney(chartTotal, displayCurrency, settings.locale)}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="grid h-full place-items-center px-4 text-center text-sm text-muted">
                    {t.dashboard.emptyChart}
                  </span>
                )}
              </button>
            </div>
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
        </Section>

        <Section title={t.dashboard.recent}>
          {recentTransactions.length ? (
            <div className="grid gap-2">
              {recentTransactions.map((item) => (
                <TransactionRow
                  key={item.transaction.id}
                  transaction={item.transaction}
                  category={categories.find((category) => category.id === item.transaction.categoryId)}
                  wallet={wallets.find((wallet) => wallet.id === item.transaction.walletId)}
                  settings={settings}
                  displayAmountMinor={item.amountMinor}
                  displayCurrency={item.currency}
                  conversionMissing={item.conversionMissing}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PlusCircle}
              title={t.dashboard.emptyTransactions}
              action={
                <button type="button" onClick={onAdd} className="text-sm font-semibold text-accent">
                  {t.dashboard.addTransaction}
                </button>
              }
            />
          )}
        </Section>
      </div>
    </div>
  );
}
