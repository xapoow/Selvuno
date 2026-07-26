import type {
  SavingsGoal,
  SavingsGoalContribution,
  SavingsGoalContributionInput,
  SavingsGoalInput
} from "@myfinances/types";
import {
  savingsGoalContributionInputSchema,
  savingsGoalInputSchema
} from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface SavingsGoalRepository {
  listGoals(): Promise<SavingsGoal[]>;
  listContributions(): Promise<SavingsGoalContribution[]>;
  createGoal(input: SavingsGoalInput): Promise<SavingsGoal>;
  updateGoal(id: string, input: Partial<SavingsGoalInput>): Promise<SavingsGoal>;
  deleteGoal(id: string): Promise<void>;
  addContribution(input: SavingsGoalContributionInput): Promise<SavingsGoalContribution>;
  deleteContribution(id: string): Promise<void>;
}

async function normalizeGoalInput(input: SavingsGoalInput): Promise<SavingsGoalInput> {
  const wallet = await financeDb.wallets.get(input.walletId);
  if (!wallet || wallet.deletedAt || wallet.archivedAt) {
    throw new Error("Wallet not found.");
  }
  return savingsGoalInputSchema.parse({
    ...input,
    name: input.name.trim(),
    currency: wallet.currency.toUpperCase()
  });
}

export const savingsGoalRepository: SavingsGoalRepository = {
  async listGoals() {
    const goals = await financeDb.savingsGoals.orderBy("updatedAt").reverse().toArray();
    return goals.filter((goal) => !goal.deletedAt);
  },

  async listContributions() {
    const contributions = await financeDb.savingsGoalContributions
      .orderBy("contributionDate")
      .reverse()
      .toArray();
    return contributions.filter((contribution) => !contribution.deletedAt);
  },

  async createGoal(input) {
    const parsed = await normalizeGoalInput(input);
    const goal: SavingsGoal = {
      ...createEntityBase(),
      ...parsed
    };
    await financeDb.savingsGoals.add(goal);
    return goal;
  },

  async updateGoal(id, input) {
    const current = await financeDb.savingsGoals.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Savings goal not found.");
    }
    const parsed = await normalizeGoalInput({
      walletId: input.walletId ?? current.walletId,
      name: input.name ?? current.name,
      targetAmountMinor: input.targetAmountMinor ?? current.targetAmountMinor,
      currency: input.currency ?? current.currency,
      targetDate: Object.prototype.hasOwnProperty.call(input, "targetDate")
        ? input.targetDate
        : current.targetDate,
      color: input.color ?? current.color
    });
    const next: SavingsGoal = {
      ...current,
      ...parsed,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    await financeDb.savingsGoals.put(next);
    return next;
  },

  async deleteGoal(id) {
    const current = await financeDb.savingsGoals.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.transaction(
      "rw",
      [financeDb.savingsGoals, financeDb.savingsGoalContributions],
      async () => {
        await financeDb.savingsGoals.put({
          ...current,
          deletedAt: now,
          updatedAt: now,
          syncStatus: "pending"
        });
        const contributions = await financeDb.savingsGoalContributions
          .where("goalId")
          .equals(id)
          .toArray();
        await Promise.all(
          contributions.map((contribution) =>
            financeDb.savingsGoalContributions.put({
              ...contribution,
              deletedAt: contribution.deletedAt ?? now,
              updatedAt: now,
              syncStatus: "pending"
            })
          )
        );
      }
    );
  },

  async addContribution(input) {
    const parsed = savingsGoalContributionInputSchema.parse(input);
    const goal = await financeDb.savingsGoals.get(parsed.goalId);
    if (!goal || goal.deletedAt) {
      throw new Error("Savings goal not found.");
    }
    const contribution: SavingsGoalContribution = {
      ...createEntityBase(),
      ...parsed,
      note: parsed.note?.trim() || undefined
    };
    await financeDb.savingsGoalContributions.add(contribution);
    await financeDb.savingsGoals.update(goal.id, {
      updatedAt: contribution.createdAt,
      syncStatus: "pending"
    });
    return contribution;
  },

  async deleteContribution(id) {
    const current = await financeDb.savingsGoalContributions.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.savingsGoalContributions.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
    await financeDb.savingsGoals.update(current.goalId, {
      updatedAt: now,
      syncStatus: "pending"
    });
  }
};
