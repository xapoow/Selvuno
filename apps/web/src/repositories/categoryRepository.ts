import type { Category, CategoryInput, TransactionType } from "@myfinances/types";
import { categoryInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface CategoryRepository {
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  listCategories(type?: TransactionType): Promise<Category[]>;
}

export const categoryRepository: CategoryRepository = {
  async createCategory(input) {
    const parsed = categoryInputSchema.parse(input);
    const category: Category = {
      ...createEntityBase(),
      ...parsed
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
      [financeDb.categories, financeDb.recurringTransactions],
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
      [financeDb.categories, financeDb.recurringTransactions],
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
      }
    );
  },

  async listCategories(type) {
    const categories = await financeDb.categories.orderBy("name").toArray();
    return categories.filter((category) => {
      if (category.deletedAt) {
        return false;
      }
      return type ? category.type === type : true;
    });
  }
};
