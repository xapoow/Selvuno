import type { Category, CategoryInput, TransactionType } from "@selvuno/types";
import { categoryInputSchema } from "@selvuno/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface CategoryRepository {
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  reorderCategories(type: TransactionType, orderedIds: string[]): Promise<void>;
  replaceCategory(sourceId: string, targetId: string, deleteSource: boolean): Promise<void>;
  listCategories(type?: TransactionType): Promise<Category[]>;
}

export const categoryRepository: CategoryRepository = {
  async createCategory(input) {
    const parsed = categoryInputSchema.parse(input);
    const sameType = await financeDb.categories.where("type").equals(parsed.type).toArray();
    const category: Category = {
      ...createEntityBase(),
      ...parsed,
      sortOrder: sameType.reduce((maximum, item) => Math.max(maximum, item.sortOrder ?? 0), -1) + 1
    };
    await financeDb.categories.add(category);
    return category;
  },

  async updateCategory(id, input) {
    const current = await financeDb.categories.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Category not found.");
    }
    const next: Category = {
      ...current,
      ...input,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    categoryInputSchema.parse({
      name: next.name,
      color: next.color,
      icon: next.icon,
      type: next.type
    });
    await financeDb.transaction(
      "rw",
      [financeDb.categories, financeDb.recurringTransactions, financeDb.transactionTemplates],
      async () => {
        await financeDb.categories.put(next);
        if (next.type !== current.type) {
          const recurringTransactions = await financeDb.recurringTransactions.where("categoryId").equals(id).toArray();
          await Promise.all(
            recurringTransactions.map((schedule) =>
              financeDb.recurringTransactions.put({
                ...schedule,
                type: next.type,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            )
          );
          await financeDb.transactionTemplates
            .where("categoryId")
            .equals(id)
            .modify({ type: next.type, updatedAt: next.updatedAt, syncStatus: "pending" });
        }
      }
    );
    return next;
  },

  async deleteCategory(id) {
    const current = await financeDb.categories.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.transaction(
      "rw",
      [financeDb.categories, financeDb.recurringTransactions, financeDb.transactionTemplates],
      async () => {
        await financeDb.categories.put({
          ...current,
          deletedAt: now,
          updatedAt: now,
          syncStatus: "pending"
        });
        const recurringTransactions = await financeDb.recurringTransactions.where("categoryId").equals(id).toArray();
        await Promise.all(
          recurringTransactions.map((schedule) =>
            financeDb.recurringTransactions.put({
              ...schedule,
              paused: true,
              updatedAt: now,
              syncStatus: "pending"
            })
          )
        );
        await financeDb.transactionTemplates
          .where("categoryId")
          .equals(id)
          .modify({ deletedAt: now, updatedAt: now, syncStatus: "pending" });
      }
    );
  },

  async reorderCategories(type, orderedIds) {
    const activeCategories = (await financeDb.categories.where("type").equals(type).toArray()).filter(
      (category) => !category.deletedAt
    );
    const activeIds = new Set(activeCategories.map((category) => category.id));
    if (
      orderedIds.length !== activeCategories.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !activeIds.has(id))
    ) {
      throw new Error("Category order does not match the active category list.");
    }

    const now = nowIso();
    await financeDb.transaction("rw", financeDb.categories, async () => {
      await Promise.all(
        orderedIds.map(async (id, sortOrder) => {
          const category = await financeDb.categories.get(id);
          if (category) {
            await financeDb.categories.put({
              ...category,
              sortOrder,
              updatedAt: now,
              syncStatus: "pending"
            });
          }
        })
      );
    });
  },

  async replaceCategory(sourceId, targetId, deleteSource) {
    if (sourceId === targetId) {
      throw new Error("Choose two different categories.");
    }
    const [source, target] = await Promise.all([
      financeDb.categories.get(sourceId),
      financeDb.categories.get(targetId)
    ]);
    if (!source || source.deletedAt || !target || target.deletedAt) {
      throw new Error("Category not found.");
    }
    if (source.type !== target.type) {
      throw new Error("Categories must have the same type.");
    }

    const now = nowIso();
    await financeDb.transaction(
      "rw",
      [
        financeDb.categories,
        financeDb.transactions,
        financeDb.recurringTransactions,
        financeDb.budgets,
        financeDb.transactionTemplates
      ],
      async () => {
        await financeDb.transactions
          .where("categoryId")
          .equals(sourceId)
          .modify({ categoryId: targetId, updatedAt: now, syncStatus: "pending" });
        await financeDb.recurringTransactions
          .where("categoryId")
          .equals(sourceId)
          .modify({ categoryId: targetId, updatedAt: now, syncStatus: "pending" });
        await financeDb.transactionTemplates
          .where("categoryId")
          .equals(sourceId)
          .modify({ categoryId: targetId, updatedAt: now, syncStatus: "pending" });

        const sourceBudgets = await financeDb.budgets.where("categoryId").equals(sourceId).toArray();
        for (const sourceBudget of sourceBudgets) {
          const targetBudget = await financeDb.budgets
            .where("[categoryId+month]")
            .equals([targetId, sourceBudget.month])
            .and((budget) => !budget.deletedAt)
            .first();
          if (targetBudget && !sourceBudget.deletedAt) {
            await financeDb.budgets.put({
              ...targetBudget,
              amountMinor: targetBudget.amountMinor + sourceBudget.amountMinor,
              updatedAt: now,
              syncStatus: "pending"
            });
            await financeDb.budgets.put({
              ...sourceBudget,
              deletedAt: now,
              updatedAt: now,
              syncStatus: "pending"
            });
          } else {
            await financeDb.budgets.put({
              ...sourceBudget,
              categoryId: targetId,
              updatedAt: now,
              syncStatus: "pending"
            });
          }
        }

        if (deleteSource) {
          await financeDb.categories.put({
            ...source,
            deletedAt: now,
            updatedAt: now,
            syncStatus: "pending"
          });
        }
      }
    );
  },

  async listCategories(type) {
    const categories = await financeDb.categories.toArray();
    return categories
      .filter((category) => {
        if (category.deletedAt) {
          return false;
        }
        return type ? category.type === type : true;
      })
      .sort(
        (left, right) =>
          (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
          left.name.localeCompare(right.name)
      );
  }
};
