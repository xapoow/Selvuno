import type { Transaction, TransactionFilter, TransactionInput } from "@myfinances/types";
import { transactionFilterSchema, transactionInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface TransactionRepository {
  addTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  listTransactions(filter?: Partial<TransactionFilter>): Promise<Transaction[]>;
}

export const transactionRepository: TransactionRepository = {
  async addTransaction(input) {
    const parsed = transactionInputSchema.parse({
      ...input,
      currency: input.currency.toUpperCase()
    });
    const transaction: Transaction = {
      ...createEntityBase(),
      ...parsed
    };
    await financeDb.transactions.add(transaction);
    return transaction;
  },

  async updateTransaction(id, input) {
    const current = await financeDb.transactions.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Transaction not found.");
    }
    const next: Transaction = {
      ...current,
      ...input,
      currency: input.currency?.toUpperCase() ?? current.currency,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    transactionInputSchema.parse({
      walletId: next.walletId,
      categoryId: next.categoryId,
      amountMinor: next.amountMinor,
      currency: next.currency,
      type: next.type,
      note: next.note,
      transactionDate: next.transactionDate
    });
    await financeDb.transactions.put(next);
    return next;
  },

  async deleteTransaction(id) {
    const current = await financeDb.transactions.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.transactions.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
  },

  async listTransactions(filter) {
    const parsed = transactionFilterSchema.parse({
      walletId: "all",
      type: "all",
      categoryId: "all",
      includeDeleted: false,
      ...filter
    });
    const transactions = await financeDb.transactions.orderBy("transactionDate").reverse().toArray();
    return transactions.filter((transaction) => {
      if (!parsed.includeDeleted && transaction.deletedAt) {
        return false;
      }
      if (parsed.walletId !== "all" && transaction.walletId !== parsed.walletId) {
        return false;
      }
      if (parsed.type !== "all" && transaction.type !== parsed.type) {
        return false;
      }
      if (parsed.categoryId !== "all" && transaction.categoryId !== parsed.categoryId) {
        return false;
      }
      if (parsed.from && transaction.transactionDate < parsed.from) {
        return false;
      }
      if (parsed.to && transaction.transactionDate > parsed.to) {
        return false;
      }
      return true;
    });
  }
};
