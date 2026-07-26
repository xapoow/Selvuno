import type { BudgetMonth, Category, MonthlyBudget, Transaction } from "@myfinances/types";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "./exchangeRates";

export interface CategoryBudgetProgress {
  category: Category;
  budget?: MonthlyBudget;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentage: number;
}

export interface MonthlyBudgetProgress {
  categories: CategoryBudgetProgress[];
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentage: number;
  missingConversions: boolean;
}

export function getBudgetMonth(date: Date, timeZone: string): BudgetMonth {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}` as BudgetMonth;
}

export function offsetBudgetMonth(month: BudgetMonth, offset: number): BudgetMonth {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}` as BudgetMonth;
}

export function formatBudgetMonth(month: BudgetMonth, locale: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1))
  );
}

export function calculateMonthlyBudgetProgress({
  month,
  timeZone,
  currency,
  categories,
  budgets,
  transactions,
  exchangeRates
}: {
  month: BudgetMonth;
  timeZone: string;
  currency: string;
  categories: Category[];
  budgets: MonthlyBudget[];
  transactions: Transaction[];
  exchangeRates?: ExchangeRateTable;
}): MonthlyBudgetProgress {
  const expenseCategories = categories.filter((category) => category.type === "expense" && !category.deletedAt);
  const budgetByCategory = new Map(
    budgets.filter((budget) => budget.month === month && !budget.deletedAt).map((budget) => [budget.categoryId, budget])
  );
  const spentByCategory = new Map<string, number>();
  let missingConversions = false;

  transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        !transaction.deletedAt &&
        getBudgetMonth(new Date(transaction.transactionDate), timeZone) === month
    )
    .forEach((transaction) => {
      const converted = convertMinorToBaseCurrency(
        transaction.amountMinor,
        transaction.currency,
        currency,
        exchangeRates
      );
      if (converted === null) {
        missingConversions = true;
        return;
      }
      spentByCategory.set(transaction.categoryId, (spentByCategory.get(transaction.categoryId) ?? 0) + converted);
    });

  const categoryProgress = expenseCategories.map((category): CategoryBudgetProgress => {
    const budget = budgetByCategory.get(category.id);
    const convertedLimit = budget
      ? convertMinorToBaseCurrency(budget.amountMinor, budget.currency, currency, exchangeRates)
      : 0;
    if (budget && convertedLimit === null) {
      missingConversions = true;
    }
    const limitMinor = convertedLimit ?? 0;
    const spentMinor = spentByCategory.get(category.id) ?? 0;
    return {
      category,
      budget,
      limitMinor,
      spentMinor,
      remainingMinor: limitMinor - spentMinor,
      percentage: limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 100) : 0
    };
  });
  const budgetedCategories = categoryProgress.filter((item) => item.limitMinor > 0);
  const limitMinor = budgetedCategories.reduce((sum, item) => sum + item.limitMinor, 0);
  const spentMinor = budgetedCategories.reduce((sum, item) => sum + item.spentMinor, 0);

  return {
    categories: categoryProgress,
    limitMinor,
    spentMinor,
    remainingMinor: limitMinor - spentMinor,
    percentage: limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 100) : 0,
    missingConversions
  };
}
