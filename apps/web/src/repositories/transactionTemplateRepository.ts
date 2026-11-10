import type { TransactionTemplate, TransactionTemplateInput } from "@selvuno/types";
import { transactionTemplateInputSchema } from "@selvuno/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";
import { normalizeTags } from "../lib/tags";

export interface TransactionTemplateRepository {
  listTemplates(): Promise<TransactionTemplate[]>;
  createTemplate(input: TransactionTemplateInput): Promise<TransactionTemplate>;
  deleteTemplate(id: string): Promise<void>;
}

export const transactionTemplateRepository: TransactionTemplateRepository = {
  async listTemplates() {
    return (await financeDb.transactionTemplates.toArray())
      .filter((template) => !template.deletedAt)
      .sort(
        (left, right) =>
          (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
          left.name.localeCompare(right.name)
      );
  },

  async createTemplate(input) {
    const [wallet, category] = await Promise.all([
      financeDb.wallets.get(input.walletId),
      financeDb.categories.get(input.categoryId)
    ]);
    if (!wallet || wallet.deletedAt || wallet.archivedAt) {
      throw new Error("Wallet not found.");
    }
    if (!category || category.deletedAt || category.type !== input.type) {
      throw new Error("Category not found.");
    }
    const parsed = transactionTemplateInputSchema.parse({
      ...input,
      currency: wallet.currency,
      tags: normalizeTags(input.tags)
    });
    const existing = await this.listTemplates();
    const template: TransactionTemplate = {
      ...createEntityBase(),
      ...parsed,
      tags: parsed.tags ?? [],
      sortOrder:
        existing.reduce((maximum, item) => Math.max(maximum, item.sortOrder ?? 0), -1) + 1
    };
    await financeDb.transactionTemplates.add(template);
    return template;
  },

  async deleteTemplate(id) {
    const current = await financeDb.transactionTemplates.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.transactionTemplates.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
  }
};
