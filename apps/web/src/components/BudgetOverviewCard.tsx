import { formatMoney } from "@myfinances/utils";
import { ArrowUpRight, PiggyBank } from "lucide-react";
import type { Dictionary } from "../i18n";
import type { MonthlyBudgetProgress } from "../lib/budgets";

interface BudgetOverviewCardProps {
  currency: string;
  locale: string;
  monthLabel: string;
  progress: MonthlyBudgetProgress;
  t: Dictionary;
  onOpen: () => void;
}

export function BudgetOverviewCard({
  currency,
  locale,
  monthLabel,
  progress,
  t,
  onOpen
}: BudgetOverviewCardProps) {
  const configured = progress.limitMinor > 0;
  const progressPercent = Math.min(progress.percentage, 100);
  const tone =
    progress.percentage >= 100
      ? "rgb(var(--color-expense))"
      : progress.percentage >= 80
        ? "rgb(var(--color-warning))"
        : "rgb(var(--color-accent))";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="app-surface app-focus group grid w-full gap-4 rounded-app p-4 text-left outline-none active:scale-[0.995] sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="app-control grid h-11 w-11 shrink-0 place-items-center rounded-app text-accent">
          <PiggyBank className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{monthLabel}</span>
          <span className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
            {t.budget.monthPlan}
            <ArrowUpRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="mt-1 block text-sm text-muted">
            {configured
              ? `${t.budget.spent}: ${formatMoney(progress.spentMinor, currency, locale)}`
              : t.budget.description}
          </span>
        </span>
      </span>

      {configured ? (
        <span className="grid min-w-0 gap-2 sm:w-72">
          <span className="flex items-end justify-between gap-3">
            <span>
              <span className="block text-xs font-medium text-muted">{t.budget.remaining}</span>
              <span className="mt-0.5 block text-lg font-semibold text-foreground">
                {formatMoney(Math.max(progress.remainingMinor, 0), currency, locale)}
              </span>
            </span>
            <span className="text-sm font-semibold" style={{ color: tone }}>
              {progress.percentage}%
            </span>
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-elevated">
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: tone }}
            />
          </span>
        </span>
      ) : (
        <span className="app-control justify-self-start rounded-full px-3 py-1.5 text-xs font-semibold text-accent sm:justify-self-end">
          {t.budget.configure}
        </span>
      )}
    </button>
  );
}
