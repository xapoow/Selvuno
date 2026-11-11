import type { TransactionType } from "@selvuno/types";
import {
  addCalendarDays,
  calendarDateInTimeZone,
  calendarDateIsInRange,
  calculatePercentageChange,
  resolveAnalyticsPeriod
} from "./analytics";

export interface InsightTransaction {
  type: TransactionType;
  amountMinor: number;
  categoryId: string;
  transactionDate: string;
  recurringTransactionId?: string;
}

export type SmartInsight =
  | { kind: "spending-up"; percentage: number }
  | { kind: "spending-down"; percentage: number }
  | { kind: "largest-category"; categoryId: string; share: number }
  | { kind: "recurring-share"; share: number }
  | { kind: "expense-count"; count: number }
  | { kind: "no-spend-streak"; days: number };

export function buildSmartInsights({
  transactions,
  now,
  timeZone
}: {
  transactions: InsightTransaction[];
  now: Date;
  timeZone: string;
}): SmartInsight[] {
  const today = calendarDateInTimeZone(now, timeZone);
  const period = resolveAnalyticsPeriod({
    preset: "month",
    now,
    timeZone,
    customFrom: today,
    customTo: today
  });
  const datedTransactions = transactions.map((transaction) => ({
    ...transaction,
    calendarDate: calendarDateInTimeZone(new Date(transaction.transactionDate), timeZone)
  }));
  const currentExpenses = datedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      calendarDateIsInRange(transaction.calendarDate, period.current)
  );
  const previousExpenses = datedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      calendarDateIsInRange(transaction.calendarDate, period.previous)
  );
  const currentExpenseMinor = currentExpenses.reduce(
    (sum, transaction) => sum + transaction.amountMinor,
    0
  );
  const previousExpenseMinor = previousExpenses.reduce(
    (sum, transaction) => sum + transaction.amountMinor,
    0
  );
  const currentIncomeMinor = datedTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        calendarDateIsInRange(transaction.calendarDate, period.current)
    )
    .reduce((sum, transaction) => sum + transaction.amountMinor, 0);
  const insights: SmartInsight[] = [];
  const spendingChange = calculatePercentageChange(currentExpenseMinor, previousExpenseMinor);

  if (spendingChange !== null && Math.abs(spendingChange) >= 10) {
    insights.push(
      spendingChange > 0
        ? { kind: "spending-up", percentage: spendingChange }
        : { kind: "spending-down", percentage: Math.abs(spendingChange) }
    );
  }

  if (currentExpenseMinor > 0) {
    const totalsByCategory = new Map<string, number>();
    currentExpenses.forEach((transaction) =>
      totalsByCategory.set(
        transaction.categoryId,
        (totalsByCategory.get(transaction.categoryId) ?? 0) + transaction.amountMinor
      )
    );
    const largest = [...totalsByCategory.entries()].sort((left, right) => right[1] - left[1])[0];
    if (largest) {
      insights.push({
        kind: "largest-category",
        categoryId: largest[0],
        share: Math.round((largest[1] / currentExpenseMinor) * 100)
      });
    }
  }

  const recurringExpenseMinor = currentExpenses
    .filter((transaction) => Boolean(transaction.recurringTransactionId))
    .reduce((sum, transaction) => sum + transaction.amountMinor, 0);
  if (recurringExpenseMinor > 0 && currentIncomeMinor > 0) {
    insights.push({
      kind: "recurring-share",
      share: Math.round((recurringExpenseMinor / currentIncomeMinor) * 100)
    });
  }

  const lastSevenDaysFrom = addCalendarDays(today, -6);
  const recentExpenseCount = datedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      transaction.calendarDate >= lastSevenDaysFrom &&
      transaction.calendarDate <= today
  ).length;
  if (recentExpenseCount >= 3) {
    insights.push({ kind: "expense-count", count: recentExpenseCount });
  }

  const latestExpenseDate = datedTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.calendarDate <= today
    )
    .map((transaction) => transaction.calendarDate)
    .sort()
    .at(-1);
  const noSpendDays = latestExpenseDate
    ? Math.round(
        (Date.parse(`${today}T12:00:00Z`) -
          Date.parse(`${latestExpenseDate}T12:00:00Z`)) /
          86_400_000
      )
    : 0;
  if (noSpendDays >= 3) {
    insights.push({ kind: "no-spend-streak", days: noSpendDays });
  }

  return insights.slice(0, 3);
}
