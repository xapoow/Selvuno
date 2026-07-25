import { useMemo, useState } from "react";
import type { TransactionType } from "@myfinances/types";
import { formatMoney } from "@myfinances/utils";
import { ArrowLeft, ArrowUpRight, Hash, Layers3, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Dictionary } from "../i18n";
import { cn } from "../lib/cn";
import { SegmentedControl } from "./ui/SegmentedControl";
import { StatPanel } from "./ui/StatPanel";

export interface AnalyticsCategoryItem {
  id: string;
  name: string;
  color: string;
  value: number;
}

export interface AnalyticsTrendItem {
  label: string;
  expense: number;
  income: number;
}

interface AnalyticsViewProps {
  expenseCategories: AnalyticsCategoryItem[];
  incomeCategories: AnalyticsCategoryItem[];
  trendData: AnalyticsTrendItem[];
  transactionCounts: Record<TransactionType, number>;
  currency: string;
  locale: string;
  t: Dictionary;
  onBack: () => void;
}

export function AnalyticsView({
  expenseCategories,
  incomeCategories,
  trendData,
  transactionCounts,
  currency,
  locale,
  t,
  onBack
}: AnalyticsViewProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const categoryData = type === "expense" ? expenseCategories : incomeCategories;
  const transactionCount = transactionCounts[type];
  const total = categoryData.reduce((sum, item) => sum + item.value, 0);
  const average = transactionCount ? total / transactionCount : 0;
  const topCategory = categoryData[0];
  const chartColor = type === "expense" ? "rgb(var(--color-expense))" : "rgb(var(--color-income))";
  const gradientId = `analytics-${type}-gradient`;
  const compactMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1
      }),
    [locale]
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="app-control app-focus grid h-10 w-10 place-items-center rounded-app text-muted hover:text-foreground"
            aria-label={t.dashboard.backToOverview}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t.dashboard.analyticsEyebrow}
            </p>
            <h2 className="text-2xl font-semibold text-foreground">{t.dashboard.analyticsTitle}</h2>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPanel
          label={type === "expense" ? t.common.expenses : t.common.income}
          value={formatMoney(total, currency, locale)}
          tone={type}
          icon={TrendingUp}
        />
        <StatPanel
          label={t.dashboard.averageTransaction}
          value={formatMoney(Math.round(average), currency, locale)}
          icon={Hash}
        />
        <StatPanel
          label={t.dashboard.topCategory}
          value={topCategory?.name ?? "—"}
          caption={topCategory ? formatMoney(topCategory.value, currency, locale) : undefined}
          icon={Layers3}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="app-surface rounded-app p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t.dashboard.trend}</h3>
              <p className="mt-1 text-sm text-muted">{t.dashboard.lastSevenDays}</p>
            </div>
            <span className="app-control rounded-full px-3 py-1 text-xs font-semibold text-muted">
              {transactionCount} {t.dashboard.operations}
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -14, right: 4, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.42} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--color-line) / 0.55)" strokeDasharray="4 6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tick={{ fill: "rgb(var(--color-muted))", fontSize: 11 }}
                  tickFormatter={(value) => compactMoney.format(Number(value) / 100)}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value), currency, locale)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid rgb(var(--color-line))",
                    background: "rgb(var(--color-surface))",
                    boxShadow: "0 16px 38px rgb(0 0 0 / 0.2)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={type}
                  stroke={chartColor}
                  strokeWidth={3}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 5, strokeWidth: 2, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="app-surface rounded-app p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">{t.dashboard.categoriesBreakdown}</h3>
            <p className="mt-1 text-sm text-muted">{t.dashboard.categoryComparison}</p>
          </div>
          {categoryData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ left: 2, right: 8 }}>
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
                    formatter={(value) => formatMoney(Number(value), currency, locale)}
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
            <div className="grid h-72 place-items-center text-center text-sm text-muted">{t.dashboard.emptyChart}</div>
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
