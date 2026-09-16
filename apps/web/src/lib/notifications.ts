import type {
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  SavingsGoalContribution,
  Settings,
  Transaction
} from "@myfinances/types";
import { appVersion, getCategoryName, type Dictionary } from "../i18n";
import { calculateMonthlyBudgetProgress, getBudgetMonth } from "./budgets";
import { toCalendarDate } from "./dates";
import { getChangelogHistory, type ChangelogItem } from "./changelog";

export type AppNotificationTone = "update" | "info" | "warning" | "danger" | "success";

export interface AppNotification {
  id: string;
  tone: AppNotificationTone;
  title: string;
  body: string;
  details: Array<{
    label: string;
    value: string;
  }>;
}

interface NotificationInput {
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  savingsGoalContributions: SavingsGoalContribution[];
  t: Dictionary;
  now?: Date;
  changelogItems?: ChangelogItem[];
}

function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

function daysFromToday(value: string, today: string): number {
  const targetDate = new Date(`${value}T12:00:00Z`);
  const todayDate = new Date(`${today}T12:00:00Z`);
  return Math.round((targetDate.getTime() - todayDate.getTime()) / 86_400_000);
}

function formatCalendarDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T12:00:00Z`));
}

export function buildAppNotifications({
  settings,
  categories,
  transactions,
  budgets,
  recurringTransactions,
  savingsGoals,
  savingsGoalContributions,
  t,
  now = new Date(),
  changelogItems
}: NotificationInput): AppNotification[] {
  const changelogs = changelogItems ?? getChangelogHistory(settings.locale, t.updates.notes);
  const notifications: AppNotification[] = changelogs.map((item) => ({
    id: `update:${item.version}`,
    tone: "update",
    title: fillTemplate(t.notifications.updateTitle, { version: item.version }),
    body: item.version === appVersion ? t.notifications.updateBody : fillTemplate(t.notifications.updateTitle, { version: item.version }),
    details: [
      { label: t.notifications.detailVersion, value: item.version },
      { label: t.notifications.detailChanges, value: item.notes.map((note) => `• ${note}`).join("\n") }
    ]
  }));
  const today = toCalendarDate(now);
  const currentMonth = getBudgetMonth(now, settings.timeZone);
  const budgetProgress = calculateMonthlyBudgetProgress({
    month: currentMonth,
    timeZone: settings.timeZone,
    currency: settings.currency,
    categories,
    budgets,
    transactions
  });

  for (const item of budgetProgress.categories) {
    if (item.limitMinor <= 0 || item.percentage < 80) {
      continue;
    }
    const exceeded = item.percentage >= 100;
    const category = getCategoryName(item.category.name, t);
    notifications.push({
      id: `budget:${currentMonth}:${item.category.id}:${exceeded ? "exceeded" : "near"}`,
      tone: exceeded ? "danger" : "warning",
      title: exceeded ? t.notifications.budgetExceededTitle : t.notifications.budgetNearTitle,
      body: fillTemplate(
        exceeded ? t.notifications.budgetExceededBody : t.notifications.budgetNearBody,
        { category, percentage: item.percentage }
      ),
      details: [
        { label: t.notifications.detailCategory, value: category },
        { label: t.notifications.detailUsage, value: `${item.percentage}%` },
        { label: t.notifications.detailPeriod, value: currentMonth }
      ]
    });
  }

  for (const recurring of recurringTransactions) {
    if (recurring.deletedAt || recurring.paused) {
      continue;
    }
    const daysUntilRun = daysFromToday(recurring.nextRunDate, today);
    if (daysUntilRun < 0 || daysUntilRun > 3) {
      continue;
    }
    const category = getCategoryName(
      categories.find((item) => item.id === recurring.categoryId)?.name,
      t
    );
    notifications.push({
      id: `recurring:${recurring.id}:${recurring.nextRunDate}`,
      tone: "info",
      title: t.notifications.recurringTitle,
      body: fillTemplate(t.notifications.recurringBody, {
        category,
        date: formatCalendarDate(recurring.nextRunDate, settings.locale)
      }),
      details: [
        { label: t.notifications.detailCategory, value: category },
        {
          label: t.notifications.detailDate,
          value: formatCalendarDate(recurring.nextRunDate, settings.locale)
        }
      ]
    });
  }

  const savedByGoal = new Map<string, number>();
  for (const contribution of savingsGoalContributions) {
    if (!contribution.deletedAt) {
      savedByGoal.set(
        contribution.goalId,
        (savedByGoal.get(contribution.goalId) ?? 0) + contribution.amountMinor
      );
    }
  }

  for (const goal of savingsGoals) {
    if (goal.deletedAt) {
      continue;
    }
    if ((savedByGoal.get(goal.id) ?? 0) >= goal.targetAmountMinor) {
      notifications.push({
        id: `goal:${goal.id}:completed`,
        tone: "success",
        title: t.notifications.goalCompletedTitle,
        body: fillTemplate(t.notifications.goalCompletedBody, { goal: goal.name }),
        details: [
          { label: t.notifications.detailGoal, value: goal.name },
          { label: t.notifications.detailStatus, value: t.notifications.statusCompleted }
        ]
      });
      continue;
    }
    if (!goal.targetDate) {
      continue;
    }
    const daysUntilDeadline = daysFromToday(goal.targetDate, today);
    if (daysUntilDeadline > 7) {
      continue;
    }
    const overdue = daysUntilDeadline < 0;
    notifications.push({
      id: `goal:${goal.id}:${overdue ? "overdue" : goal.targetDate}`,
      tone: overdue ? "danger" : "warning",
      title: overdue ? t.notifications.goalOverdueTitle : t.notifications.goalDeadlineTitle,
      body: fillTemplate(
        overdue ? t.notifications.goalOverdueBody : t.notifications.goalDeadlineBody,
        {
          goal: goal.name,
          date: formatCalendarDate(goal.targetDate, settings.locale)
        }
      ),
      details: [
        { label: t.notifications.detailGoal, value: goal.name },
        {
          label: t.notifications.detailDate,
          value: formatCalendarDate(goal.targetDate, settings.locale)
        },
        {
          label: t.notifications.detailStatus,
          value: overdue ? t.notifications.statusOverdue : t.notifications.statusUpcoming
        }
      ]
    });
  }

  return notifications;
}
