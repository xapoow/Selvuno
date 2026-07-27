import { describe, expect, it } from "vitest";
import type { Category, MonthlyBudget, Transaction } from "@myfinances/types";
import {
  calculateMonthlyBudgetProgress,
  getBudgetMonth,
  offsetBudgetMonth
} from "./budgets";

const base = {
  userId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  deletedAt: null,
  syncStatus: "local" as const
};

const category: Category = {
  ...base,
  id: "11111111-1111-4111-8111-111111111111",
  name: "Groceries",
  color: "#207a6f",
  icon: "shopping-basket",
  type: "expense",
  sortOrder: 0
};

const budget: MonthlyBudget = {
  ...base,
  id: "22222222-2222-4222-8222-222222222222",
  categoryId: category.id,
  month: "2026-07",
  amountMinor: 10000,
  currency: "USD"
};

const transaction: Transaction = {
  ...base,
  id: "33333333-3333-4333-8333-333333333333",
  walletId: "44444444-4444-4444-8444-444444444444",
  categoryId: category.id,
  amountMinor: 4000,
  currency: "USD",
  type: "expense",
  tags: [],
  transactionDate: "2026-07-15T12:00:00.000Z"
};

describe("monthly budget calculations", () => {
  it("handles month navigation across years", () => {
    expect(offsetBudgetMonth("2026-01", -1)).toBe("2025-12");
    expect(offsetBudgetMonth("2026-12", 1)).toBe("2027-01");
    expect(getBudgetMonth(new Date("2026-07-31T23:30:00.000Z"), "Europe/Warsaw")).toBe("2026-08");
  });

  it("calculates spending and remaining category budget", () => {
    const progress = calculateMonthlyBudgetProgress({
      month: "2026-07",
      timeZone: "UTC",
      currency: "USD",
      categories: [category],
      budgets: [budget],
      transactions: [transaction]
    });

    expect(progress).toMatchObject({
      limitMinor: 10000,
      spentMinor: 4000,
      remainingMinor: 6000,
      percentage: 40,
      missingConversions: false
    });
    expect(progress.categories[0]).toMatchObject({
      limitMinor: 10000,
      spentMinor: 4000,
      percentage: 40
    });
  });

  it("flags expenses that cannot be converted", () => {
    const progress = calculateMonthlyBudgetProgress({
      month: "2026-07",
      timeZone: "UTC",
      currency: "USD",
      categories: [category],
      budgets: [budget],
      transactions: [{ ...transaction, currency: "EUR" }]
    });

    expect(progress.spentMinor).toBe(0);
    expect(progress.missingConversions).toBe(true);
  });
});
