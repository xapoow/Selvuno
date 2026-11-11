import type {
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  SavingsGoalContribution,
  Settings,
  Transaction
} from "@selvuno/types";
import { getCategoryName, type Dictionary } from "../i18n";
import { calculateMonthlyBudgetProgress, getBudgetMonth } from "./budgets";
import { toCalendarDate } from "./dates";
import { getChangelogHistory, type ChangelogItem } from "./changelog";
import { getAppAnnouncements, type AppAnnouncement } from "./announcements";

export type AppNotificationTone = "update" | "info" | "warning" | "danger" | "success";
export type AppNotificationKind = "release" | "announcement" | "reminder";

export interface AppNotification {
  id: string;
  kind: AppNotificationKind;
  date?: string;
  tone: AppNotificationTone;
  title: string;
  body: string;
  paragraphs?: string[];
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
  announcements?: AppAnnouncement[];
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

export function formatNotificationDate(value: string, locale: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
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
  changelogItems,
  announcements = getAppAnnouncements(settings.locale)
}: NotificationInput): AppNotification[] {
  const changelogs = changelogItems ?? getChangelogHistory(settings.locale, t.updates.notes);
  const notifications: AppNotification[] = changelogs.map((item) => ({
    id: `update:${item.version}`,
    kind: "release",
    date: item.date,
    tone: "update",
    title: fillTemplate(t.notifications.updateTitle, { version: item.version }),
    body: item.notes[0] ?? t.notifications.updateBody,
    details: [
      { label: t.notifications.detailChanges, value: item.notes.map((note) => `• ${note}`).join("\n") }
    ]
  }));
  const today = toCalendarDate(now);
  for (const announcement of announcements) {
    if (announcement.publishedAt > today || (announcement.expiresAt && announcement.expiresAt < today)) continue;
    notifications.push({
      id: `announcement:${announcement.id}`,
      kind: "announcement",
      tone: "info",
      date: announcement.publishedAt,
      title: announcement.title,
      body: announcement.summary,
      paragraphs: announcement.paragraphs,
      details: []
    });
  }
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
      kind: "reminder",
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
      kind: "reminder",
      date: recurring.nextRunDate,
      tone: "info",
      title: t.notifications.recurringTitle,
      body: fillTemplate(t.notifications.recurringBody, {
        category,
        date: formatNotificationDate(recurring.nextRunDate, settings.locale)
      }),
      details: [
        { label: t.notifications.detailCategory, value: category },
        {
          label: t.notifications.detailDate,
          value: formatNotificationDate(recurring.nextRunDate, settings.locale)
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
        kind: "reminder",
        date: savingsGoalContributions.filter((item) => item.goalId === goal.id && !item.deletedAt)
          .map((item) => item.contributionDate.slice(0, 10)).sort().at(-1),
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
      kind: "reminder",
      date: goal.targetDate,
      tone: overdue ? "danger" : "warning",
      title: overdue ? t.notifications.goalOverdueTitle : t.notifications.goalDeadlineTitle,
      body: fillTemplate(
        overdue ? t.notifications.goalOverdueBody : t.notifications.goalDeadlineBody,
        {
          goal: goal.name,
          date: formatNotificationDate(goal.targetDate, settings.locale)
        }
      ),
      details: [
        { label: t.notifications.detailGoal, value: goal.name },
        {
          label: t.notifications.detailDate,
          value: formatNotificationDate(goal.targetDate, settings.locale)
        },
        {
          label: t.notifications.detailStatus,
          value: overdue ? t.notifications.statusOverdue : t.notifications.statusUpcoming
        }
      ]
    });
  }

  return [...new Map(notifications.map((notification) => [notification.id, notification])).values()]
    .sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
}
