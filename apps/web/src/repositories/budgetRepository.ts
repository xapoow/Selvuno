import type { BudgetMonth, MonthlyBudget, MonthlyBudgetInput } from "@myfinances/types";
import { monthlyBudgetInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface BudgetRepository {
  listBudgets(month?: BudgetMonth): Promise<MonthlyBudget[]>;
  setBudget(input: MonthlyBudgetInput): Promise<MonthlyBudget | null>;
}

export const budgetRepository: BudgetRepository = {
  async listBudgets(month) {
    const budgets = month
      ? await financeDb.budgets.where("month").equals(month).toArray()
      : await financeDb.budgets.toArray();
    return budgets
      .filter((budget) => !budget.deletedAt)
      .sort((left, right) => left.categoryId.localeCompare(right.categoryId));
  },

  async setBudget(input) {
    const normalizedInput = {
      ...input,
      currency: input.currency.toUpperCase()
    };
    const parsed = monthlyBudgetInputSchema.parse(normalizedInput);
    const current = await financeDb.budgets
      .where("[categoryId+month]")
      .equals([parsed.categoryId, parsed.month])
      .first();
    const now = nowIso();

    if (parsed.amountMinor === 0) {
      if (current && !current.deletedAt) {
        await financeDb.budgets.put({
          ...current,
          deletedAt: now,
          updatedAt: now,
          syncStatus: "pending"
        });
      }
      return null;
    }

    const budget: MonthlyBudget = current
      ? {
          ...current,
          amountMinor: parsed.amountMinor,
          currency: parsed.currency,
          deletedAt: null,
          updatedAt: now,
          syncStatus: "pending"
        }
      : {
          ...createEntityBase(),
          categoryId: parsed.categoryId,
          month: parsed.month,
          amountMinor: parsed.amountMinor,
          currency: parsed.currency
        };
    await financeDb.budgets.put(budget);
    return budget;
  }
};
