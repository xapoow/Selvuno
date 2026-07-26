import { useEffect, useMemo, useState } from "react";
import type {
  BudgetMonth,
  Category,
  MonthlyBudget,
  MonthlyBudgetInput,
  Settings,
  Transaction
} from "@myfinances/types";
import { formatMoney, minorToDecimal, parseAmountToMinor } from "@myfinances/utils";
import { ArrowLeft, ChevronLeft, ChevronRight, CircleAlert, PiggyBank } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import {
  calculateMonthlyBudgetProgress,
  formatBudgetMonth,
  offsetBudgetMonth
} from "../lib/budgets";
import type { ExchangeRateTable } from "../lib/exchangeRates";
import { CategoryIcon } from "../lib/icons";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { StatPanel } from "./ui/StatPanel";

interface BudgetPlanViewProps {
  initialMonth: BudgetMonth;
  categories: Category[];
  budgets: MonthlyBudget[];
  transactions: Transaction[];
  settings: Settings;
  exchangeRates?: ExchangeRateTable;
  t: Dictionary;
  onSetBudget: (input: MonthlyBudgetInput) => Promise<unknown>;
  onBack: () => void;
}

export function BudgetPlanView({
  initialMonth,
  categories,
  budgets,
  transactions,
  settings,
  exchangeRates,
  t,
  onSetBudget,
  onBack
}: BudgetPlanViewProps) {
  const [month, setMonth] = useState<BudgetMonth>(initialMonth);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const progress = useMemo(
    () =>
      calculateMonthlyBudgetProgress({
        month,
        timeZone: settings.timeZone,
        currency: settings.currency,
        categories,
        budgets,
        transactions,
        exchangeRates
      }),
    [budgets, categories, exchangeRates, month, settings.currency, settings.timeZone, transactions]
  );
  const expenseCategories = progress.categories;
  const monthLabel = formatBudgetMonth(month, settings.locale);
  const progressPercent = Math.min(progress.percentage, 100);
  const progressTone =
    progress.percentage >= 100
      ? "rgb(var(--color-expense))"
      : progress.percentage >= 80
        ? "rgb(var(--color-warning))"
        : "rgb(var(--color-accent))";

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        progress.categories.map((item) => [
          item.category.id,
          item.limitMinor > 0 ? String(minorToDecimal(item.limitMinor, settings.currency)) : ""
        ])
      )
    );
    setSaved(false);
    setError("");
  }, [month, budgets, settings.currency]);

  async function saveBudget() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await Promise.all(
        expenseCategories.map((item) => {
          const rawValue = (drafts[item.category.id] ?? "").trim();
          const normalizedValue = rawValue.replace(",", ".");
          const amountMinor =
            !normalizedValue || Number(normalizedValue) === 0
              ? 0
              : parseAmountToMinor(normalizedValue, settings.currency);
          return onSetBudget({
            categoryId: item.category.id,
            month,
            amountMinor,
            currency: settings.currency
          });
        })
      );
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.budget.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="app-control app-focus grid h-10 w-10 place-items-center rounded-app text-muted outline-none hover:text-foreground"
            aria-label={t.budget.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t.budget.title}</p>
            <h2 className="text-2xl font-semibold text-foreground">{t.budget.monthPlan}</h2>
          </div>
        </div>
        <div className="app-control flex items-center gap-1 rounded-app p-1">
          <button
            type="button"
            className="app-focus grid h-9 w-9 place-items-center rounded-[6px] text-muted outline-none hover:text-foreground"
            aria-label={t.budget.previousMonth}
            onClick={() => setMonth((current) => offsetBudgetMonth(current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-40 px-2 text-center text-sm font-semibold capitalize text-foreground">{monthLabel}</span>
          <button
            type="button"
            className="app-focus grid h-9 w-9 place-items-center rounded-[6px] text-muted outline-none hover:text-foreground"
            aria-label={t.budget.nextMonth}
            onClick={() => setMonth((current) => offsetBudgetMonth(current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPanel
          label={t.budget.planned}
          value={formatMoney(progress.limitMinor, settings.currency, settings.locale)}
          icon={PiggyBank}
        />
        <StatPanel
          label={t.budget.spent}
          value={formatMoney(progress.spentMinor, settings.currency, settings.locale)}
          tone="expense"
        />
        <StatPanel
          label={progress.remainingMinor < 0 ? t.budget.overBy : t.budget.remaining}
          value={formatMoney(Math.abs(progress.remainingMinor), settings.currency, settings.locale)}
          tone={progress.remainingMinor < 0 ? "expense" : "default"}
        />
      </div>

      {progress.limitMinor > 0 ? (
        <div className="app-surface grid gap-2 rounded-app p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-muted">{t.budget.monthPlan}</span>
            <span className="font-semibold" style={{ color: progressTone }}>
              {progress.percentage}%
            </span>
          </div>
          <span className="h-2.5 overflow-hidden rounded-full bg-elevated">
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: progressTone }}
            />
          </span>
        </div>
      ) : null}

      {progress.missingConversions ? (
        <div className="app-control flex items-center gap-2 rounded-app px-3 py-2 text-sm text-warning">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {t.budget.missingRates}
        </div>
      ) : null}

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold uppercase text-muted">{t.budget.categoryLimits}</h3>
        {expenseCategories.length ? (
          <div className="grid gap-2">
            {expenseCategories.map((item) => {
              const percentage = Math.min(item.percentage, 100);
              const tone =
                item.percentage >= 100
                  ? "rgb(var(--color-expense))"
                  : item.percentage >= 80
                    ? "rgb(var(--color-warning))"
                    : item.category.color;
              return (
                <article
                  key={item.category.id}
                  className="app-surface grid gap-3 rounded-app p-3 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-app text-white"
                      style={{ backgroundColor: item.category.color }}
                    >
                      <CategoryIcon name={item.category.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {getCategoryName(item.category.name, t)}
                        </span>
                        <span className="text-xs font-medium text-muted">
                          {formatMoney(item.spentMinor, settings.currency, settings.locale)}
                        </span>
                      </div>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-elevated">
                        <span
                          className="block h-full rounded-full transition-[width] duration-300"
                          style={{ width: `${percentage}%`, backgroundColor: tone }}
                        />
                      </span>
                    </div>
                  </div>
                  <label className="grid gap-1.5 text-xs font-medium text-muted">
                    <span>{t.budget.limit}</span>
                    <span className="app-field app-focus grid h-11 grid-cols-[1fr_auto] items-center rounded-app px-3">
                      <input
                        value={drafts[item.category.id] ?? ""}
                        onChange={(event) => {
                          setDrafts((current) => ({ ...current, [item.category.id]: event.target.value }));
                          setSaved(false);
                        }}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`${t.budget.limit}: ${getCategoryName(item.category.name, t)}`}
                        className="min-w-0 bg-transparent text-base text-foreground outline-none"
                      />
                      <span className="text-xs font-semibold text-muted">{settings.currency}</span>
                    </span>
                  </label>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={PiggyBank} title={t.budget.noExpenseCategories} />
        )}
      </section>

      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveBudget} disabled={saving || !expenseCategories.length}>
          {t.budget.save}
        </Button>
        {saved ? <span className="text-sm font-medium text-income">{t.budget.saved}</span> : null}
      </div>
    </div>
  );
}
