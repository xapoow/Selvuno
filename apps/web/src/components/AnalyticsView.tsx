import { useEffect, useMemo, useState } from "react";
import type {
  CalendarDate,
  Category,
  Settings,
  Transaction,
  TransactionType,
  Wallet,
  WalletView
} from "@myfinances/types";
import { formatMoney } from "@myfinances/utils";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  Hash,
  Layers3,
  TrendingUp
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getCategoryName, type Dictionary } from "../i18n";
import {
  buildAnalyticsTrendBuckets,
  calculatePercentageChange,
  calendarDateInTimeZone,
  calendarDateIsInRange,
  formatAnalyticsDateRange,
  resolveAnalyticsPeriod,
  type AnalyticsPeriodPreset
} from "../lib/analytics";
import { cn } from "../lib/cn";
import { convertMinorToBaseCurrency, useExchangeRates } from "../lib/exchangeRates";
import { getIncludedWalletIds, shouldHideWalletAmounts } from "../lib/walletFeatures";
import { DatePicker } from "./ui/DatePicker";
import { SegmentedControl } from "./ui/SegmentedControl";
import { SelectField } from "./ui/SelectField";
import { StatPanel } from "./ui/StatPanel";

export interface AnalyticsCategoryItem {
  id: string;
  name: string;
  color: string;
  value: number;
}

interface AnalyticsTrendItem {
  label: string;
  value: number;
}

interface AnalyticsViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  initialWalletId: WalletView;
  t: Dictionary;
  onBack: () => void;
}

function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

export function AnalyticsView({
  wallets,
  categories,
  transactions,
  settings,
  initialWalletId,
  t,
  onBack
}: AnalyticsViewProps) {
  const now = useMemo(() => new Date(), []);
  const initialPeriod = useMemo(
    () =>
      resolveAnalyticsPeriod({
        preset: "month",
        now,
        timeZone: settings.timeZone,
        customFrom: calendarDateInTimeZone(now, settings.timeZone),
        customTo: calendarDateInTimeZone(now, settings.timeZone)
      }),
    [now, settings.timeZone]
  );
  const [type, setType] = useState<TransactionType>("expense");
  const [walletId, setWalletId] = useState<WalletView>(initialWalletId);
  const [categoryId, setCategoryId] = useState("all");
  const [periodPreset, setPeriodPreset] = useState<AnalyticsPeriodPreset>("month");
  const [customFrom, setCustomFrom] = useState<CalendarDate>(initialPeriod.current.from);
  const [customTo, setCustomTo] = useState<CalendarDate>(initialPeriod.current.to);

  const selectedWallet =
    walletId === "all" ? undefined : wallets.find((wallet) => wallet.id === walletId);
  const currency = selectedWallet?.currency ?? settings.currency;
  const includedWalletIds = useMemo(
    () => getIncludedWalletIds(wallets, settings.advancedWalletsEnabled),
    [settings.advancedWalletsEnabled, wallets]
  );
  const hideAmounts = shouldHideWalletAmounts(settings, selectedWallet);
  const typeCategories = useMemo(
    () => categories.filter((category) => !category.deletedAt && category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (
      categoryId !== "all" &&
      !typeCategories.some((category) => category.id === categoryId)
    ) {
      setCategoryId("all");
    }
  }, [categoryId, typeCategories]);

  const walletTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          !transaction.deletedAt &&
          (walletId === "all"
            ? includedWalletIds.has(transaction.walletId)
            : transaction.walletId === walletId)
      ),
    [includedWalletIds, transactions, walletId]
  );
  const conversionNeeded = walletTransactions.some(
    (transaction) => transaction.currency.toUpperCase() !== currency
  );
  const exchangeRates = useExchangeRates(currency, conversionNeeded);
  const period = useMemo(
    () =>
      resolveAnalyticsPeriod({
        preset: periodPreset,
        now,
        timeZone: settings.timeZone,
        customFrom,
        customTo
      }),
    [customFrom, customTo, now, periodPreset, settings.timeZone]
  );

  const valuedTransactions = useMemo(
    () =>
      walletTransactions
        .filter(
          (transaction) =>
            transaction.type === type &&
            (categoryId === "all" || transaction.categoryId === categoryId)
        )
        .map((transaction) => {
          const amountMinor = convertMinorToBaseCurrency(
            transaction.amountMinor,
            transaction.currency,
            currency,
            exchangeRates.data
          );
          return {
            transaction,
            amountMinor,
            calendarDate: calendarDateInTimeZone(
              new Date(transaction.transactionDate),
              settings.timeZone
            )
          };
        }),
    [
      categoryId,
      currency,
      exchangeRates.data,
      settings.timeZone,
      type,
      walletTransactions
    ]
  );
  const missingConversions = valuedTransactions.some((item) => item.amountMinor === null);
  const currentTransactions = valuedTransactions.filter(
    (item) =>
      item.amountMinor !== null && calendarDateIsInRange(item.calendarDate, period.current)
  );
  const previousTransactions = valuedTransactions.filter(
    (item) =>
      item.amountMinor !== null && calendarDateIsInRange(item.calendarDate, period.previous)
  );
  const currentTotal = currentTransactions.reduce(
    (sum, item) => sum + (item.amountMinor ?? 0),
    0
  );
  const previousTotal = previousTransactions.reduce(
    (sum, item) => sum + (item.amountMinor ?? 0),
    0
  );
  const average = currentTransactions.length
    ? Math.round(currentTotal / currentTransactions.length)
    : 0;
  const change = calculatePercentageChange(currentTotal, previousTotal);
  const changeIsPositive =
    change !== null && change !== 0 && (type === "income" ? change > 0 : change < 0);

  const categoryData = useMemo(
    () =>
      typeCategories
        .filter((category) => categoryId === "all" || category.id === categoryId)
        .map(
          (category): AnalyticsCategoryItem => ({
            id: category.id,
            name: getCategoryName(category.name, t),
            color: category.color,
            value: currentTransactions
              .filter((item) => item.transaction.categoryId === category.id)
              .reduce((sum, item) => sum + (item.amountMinor ?? 0), 0)
          })
        )
        .filter((item) => item.value > 0)
        .sort((left, right) => right.value - left.value),
    [categoryId, currentTransactions, t, typeCategories]
  );
  const topCategory = categoryData[0];
  const trendBuckets = useMemo(
    () => buildAnalyticsTrendBuckets(period.current, settings.locale),
    [period.current, settings.locale]
  );
  const trendData: AnalyticsTrendItem[] = trendBuckets.map((bucket) => ({
    label: bucket.label,
    value: currentTransactions
      .filter((item) => {
        const key =
          bucket.granularity === "day"
            ? item.calendarDate
            : item.calendarDate.slice(0, 7);
        return key === bucket.key;
      })
      .reduce((sum, item) => sum + (item.amountMinor ?? 0), 0)
  }));
  const rangeLabel = formatAnalyticsDateRange(period.current, settings.locale);
  const previousRangeLabel = formatAnalyticsDateRange(period.previous, settings.locale);
  const insight =
    change === null
      ? t.analytics.noComparison
      : change === 0
        ? fillTemplate(t.analytics.unchanged, {
            type: type === "expense" ? t.common.expenses : t.common.income
          })
        : fillTemplate(
            type === "expense"
              ? change > 0
                ? t.analytics.expenseIncreased
                : t.analytics.expenseDecreased
              : change > 0
                ? t.analytics.incomeIncreased
                : t.analytics.incomeDecreased,
            { percentage: Math.abs(change) }
          );
  const chartColor =
    type === "expense" ? "rgb(var(--color-expense))" : "rgb(var(--color-income))";
  const gradientId = `analytics-${type}-gradient`;
  const compactMoney = useMemo(
    () =>
      new Intl.NumberFormat(settings.locale, {
        notation: "compact",
        maximumFractionDigits: 1
      }),
    [settings.locale]
  );

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="app-control app-focus grid h-10 w-10 place-items-center rounded-xl text-muted hover:text-foreground"
            aria-label={t.dashboard.backToOverview}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t.dashboard.analyticsEyebrow}
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              {t.dashboard.analyticsTitle}
            </h2>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: "expense", label: t.common.expenses },
              { value: "income", label: t.common.income }
            ]}
          />
        </div>
      </div>

      <section className="app-surface grid gap-4 rounded-2xl p-4 sm:p-5">
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.analytics.period}
          </p>
          <SegmentedControl
            value={periodPreset}
            onChange={setPeriodPreset}
            options={[
              { value: "week", label: t.analytics.week },
              { value: "month", label: t.analytics.month },
              { value: "year", label: t.analytics.year },
              { value: "custom", label: t.analytics.custom }
            ]}
          />
        </div>

        {periodPreset === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker
              label={t.analytics.dateFrom}
              value={customFrom}
              locale={settings.locale}
              previousMonthLabel={t.common.previousMonth}
              nextMonthLabel={t.common.nextMonth}
              todayLabel={t.common.today}
              onChange={(value) => setCustomFrom(value as CalendarDate)}
            />
            <DatePicker
              label={t.analytics.dateTo}
              value={customTo}
              locale={settings.locale}
              previousMonthLabel={t.common.previousMonth}
              nextMonthLabel={t.common.nextMonth}
              todayLabel={t.common.today}
              onChange={(value) => setCustomTo(value as CalendarDate)}
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label={t.common.wallet}
            value={walletId}
            onChange={(event) => setWalletId(event.target.value as WalletView)}
          >
            <option value="all">{t.wallets.allWallets}</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.common.category}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="all">{t.analytics.allCategories}</option>
            {typeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.name, t)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="app-control flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarRange className="h-4 w-4 text-accent" />
            {rangeLabel}
          </span>
          <span className="text-xs font-semibold text-muted">{currency}</span>
        </div>
        {missingConversions ? (
          <p className="text-sm font-medium text-warning">{t.analytics.missingRates}</p>
        ) : null}
      </section>

      <section
        className={cn(
          "app-control flex items-start gap-3 rounded-xl p-4",
          change !== null && change !== 0 && (changeIsPositive ? "text-income" : "text-expense")
        )}
      >
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-elevated">
          {change !== null && change < 0 ? (
            <ArrowDownRight className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{insight}</p>
          <p className="mt-1 text-xs text-muted">
            {t.analytics.comparedWithPrevious}: {previousRangeLabel}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatPanel
          label={t.analytics.currentPeriod}
          value={formatMoney(currentTotal, currency, settings.locale, hideAmounts)}
          tone={type}
          caption={rangeLabel}
          icon={TrendingUp}
        />
        <StatPanel
          label={t.analytics.previousPeriod}
          value={formatMoney(previousTotal, currency, settings.locale, hideAmounts)}
          caption={previousRangeLabel}
          icon={CalendarRange}
        />
        <StatPanel
          label={t.analytics.change}
          value={change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`}
          tone={
            change === null || change === 0
              ? "default"
              : changeIsPositive
                ? "income"
                : "expense"
          }
          caption={t.analytics.comparedWithPrevious}
          icon={change !== null && change < 0 ? ArrowDownRight : ArrowUpRight}
        />
        <StatPanel
          label={t.dashboard.averageTransaction}
          value={formatMoney(average, currency, settings.locale, hideAmounts)}
          caption={
            topCategory
              ? `${t.dashboard.topCategory}: ${topCategory.name}`
              : `${currentTransactions.length} ${t.dashboard.operations}`
          }
          icon={Hash}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="app-surface min-w-0 rounded-2xl p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t.dashboard.trend}</h3>
              <p className="mt-1 text-sm text-muted">{rangeLabel}</p>
            </div>
            <span className="app-control rounded-full px-3 py-1 text-xs font-semibold text-muted">
              {currentTransactions.length} {t.dashboard.operations}
            </span>
          </div>
          {currentTransactions.length ? (
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={trendData}
                  margin={{ left: -14, right: 4, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.42} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgb(var(--color-line) / 0.55)"
                    strokeDasharray="4 6"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                    tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tick={{ fill: "rgb(var(--color-muted))", fontSize: 11 }}
                    tickFormatter={(value) =>
                      hideAmounts ? "••••" : compactMoney.format(Number(value) / 100)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), currency, settings.locale, hideAmounts)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgb(var(--color-line))",
                      background: "rgb(var(--color-surface))",
                      boxShadow: "0 16px 38px rgb(0 0 0 / 0.2)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={3}
                    fill={`url(#${gradientId})`}
                    activeDot={{ r: 5, strokeWidth: 2, fill: chartColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-center text-sm text-muted">
              {t.dashboard.emptyChart}
            </div>
          )}
        </section>

        <section className="app-surface min-w-0 rounded-2xl p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">
              {t.dashboard.categoriesBreakdown}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {topCategory
                ? `${t.dashboard.topCategory}: ${topCategory.name}`
                : t.dashboard.categoryComparison}
            </p>
          </div>
          {categoryData.length ? (
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={categoryData.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 2, right: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={92}
                    tick={{ fill: "rgb(var(--color-muted))", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgb(var(--color-elevated) / 0.6)" }}
                    formatter={(value) => formatMoney(Number(value), currency, settings.locale, hideAmounts)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgb(var(--color-line))",
                      background: "rgb(var(--color-surface))"
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 7, 7, 0]} barSize={18}>
                    {categoryData.slice(0, 6).map((item) => (
                      <Cell key={item.id} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-center text-sm text-muted">
              {t.dashboard.emptyChart}
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="app-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent"
      >
        {t.dashboard.backToOverview}
        <ArrowUpRight className="h-4 w-4 rotate-[-90deg]" />
      </button>
    </div>
  );
}
