import type { Category } from "@myfinances/types";
import {
  CalendarCheck2,
  CircleDollarSign,
  Repeat2,
  Sparkles,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import type { SmartInsight } from "../lib/insights";

interface SmartInsightsCardProps {
  insights: SmartInsight[];
  categories: Category[];
  t: Dictionary;
}

export function SmartInsightsCard({ insights, categories, t }: SmartInsightsCardProps) {
  return (
    <section className="app-surface grid gap-4 rounded-app p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t.insights.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">{t.insights.hint}</p>
        </div>
      </div>
      {insights.length ? (
        <div className="grid gap-2 md:grid-cols-3">
          {insights.map((insight) => {
            const presentation = getInsightPresentation(insight, categories, t);
            const Icon = presentation.icon;
            return (
              <article
                key={`${insight.kind}-${presentation.body}`}
                className="app-control flex items-start gap-3 rounded-app p-3"
              >
                <span className={`mt-0.5 ${presentation.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm leading-5 text-foreground">{presentation.body}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="app-control rounded-app p-4 text-center text-sm text-muted">
          {t.insights.empty}
        </p>
      )}
    </section>
  );
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

function getInsightPresentation(
  insight: SmartInsight,
  categories: Category[],
  t: Dictionary
) {
  switch (insight.kind) {
    case "spending-up":
      return {
        icon: TrendingUp,
        tone: "text-expense",
        body: fill(t.insights.spendingUp, { percentage: insight.percentage })
      };
    case "spending-down":
      return {
        icon: TrendingDown,
        tone: "text-income",
        body: fill(t.insights.spendingDown, { percentage: insight.percentage })
      };
    case "largest-category": {
      const category = categories.find((item) => item.id === insight.categoryId);
      return {
        icon: CircleDollarSign,
        tone: "text-accent",
        body: fill(t.insights.largestCategory, {
          category: getCategoryName(category?.name, t),
          percentage: insight.share
        })
      };
    }
    case "recurring-share":
      return {
        icon: Repeat2,
        tone: "text-accent",
        body: fill(t.insights.recurringShare, { percentage: insight.share })
      };
    case "expense-count":
      return {
        icon: CircleDollarSign,
        tone: "text-muted",
        body: fill(t.insights.expenseCount, { count: insight.count })
      };
    case "no-spend-streak":
      return {
        icon: CalendarCheck2,
        tone: "text-income",
        body: fill(t.insights.noSpendStreak, { days: insight.days })
      };
  }
}
