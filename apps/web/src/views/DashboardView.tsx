import type { Category, Settings, Transaction, Wallet, WalletView } from "@myfinances/types";
import { BarChart3, PlusCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { filterTransactionsByWallet, formatMoney } from "@myfinances/utils";
import { TransactionRow } from "../components/TransactionRow";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { StatPanel } from "../components/ui/StatPanel";
import { getCategoryName, type Dictionary } from "../i18n";
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
  const categoryTotals = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({
      id: category.id,
      name: getCategoryName(category.name, t),
      color: category.color,
      value: displayTransactions
        .filter(
          (item) =>
            item.transaction.type === "expense" &&
            item.transaction.categoryId === category.id &&
            !item.conversionMissing
        )
        .reduce((sum, item) => sum + item.amountMinor, 0)
    }))
    .filter((item) => item.value > 0)
    .slice(0, 6);

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

      <Section title={t.dashboard.spending}>
        {categoryTotals.length ? (
          <div className="app-surface grid gap-4 rounded-app p-4 sm:grid-cols-[180px_1fr]">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    isAnimationActive={false}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), displayCurrency, settings.locale)}
                    contentStyle={{
                      borderRadius: 8,
                      border: 0,
                      background: "rgb(var(--color-surface) / 0.94)",
                      boxShadow: "0 12px 30px rgb(0 0 0 / 0.12)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid content-center gap-2">
              {categoryTotals.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(item.value, displayCurrency, settings.locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={BarChart3} title={t.dashboard.emptyChart} />
        )}
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
  );
}
