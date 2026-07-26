import type {
  CalendarDate,
  RecurringTransaction,
  RecurringTransactionInput,
  Transaction
} from "@myfinances/types";
import { recurringTransactionInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";
import { fromDateInputValue, nextRecurringDate, toCalendarDate } from "../lib/dates";
import { normalizeTags } from "../lib/tags";

const MAX_OCCURRENCES_PER_RUN = 366;

export interface RecurringTransactionRepository {
  listRecurringTransactions(): Promise<RecurringTransaction[]>;
  createRecurringTransaction(input: RecurringTransactionInput): Promise<RecurringTransaction>;
  updateRecurringTransaction(
    id: string,
    input: Partial<RecurringTransactionInput>
  ): Promise<RecurringTransaction>;
  setRecurringTransactionPaused(id: string, paused: boolean): Promise<RecurringTransaction>;
  deleteRecurringTransaction(id: string): Promise<void>;
  materializeDueTransactions(today?: CalendarDate): Promise<number>;
}

async function normalizeInput(input: RecurringTransactionInput): Promise<RecurringTransactionInput> {
  const wallet = await financeDb.wallets.get(input.walletId);
  return recurringTransactionInputSchema.parse({
    ...input,
    currency: (wallet?.currency ?? input.currency).toUpperCase(),
    tags: normalizeTags(input.tags)
  });
}

export const recurringTransactionRepository: RecurringTransactionRepository = {
  async listRecurringTransactions() {
    const schedules = await financeDb.recurringTransactions.orderBy("nextRunDate").toArray();
    return schedules.filter((schedule) => !schedule.deletedAt);
  },

  async createRecurringTransaction(input) {
    const parsed = await normalizeInput(input);
    const schedule: RecurringTransaction = {
      ...createEntityBase(),
      ...parsed,
      tags: parsed.tags ?? [],
      nextRunDate: parsed.startDate,
      paused: false
    };
    await financeDb.recurringTransactions.add(schedule);
    return schedule;
  },

  async updateRecurringTransaction(id, input) {
    const current = await financeDb.recurringTransactions.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Recurring transaction not found.");
    }
    const parsed = await normalizeInput({
      walletId: input.walletId ?? current.walletId,
      categoryId: input.categoryId ?? current.categoryId,
      amountMinor: input.amountMinor ?? current.amountMinor,
      currency: input.currency ?? current.currency,
      type: input.type ?? current.type,
      note: Object.prototype.hasOwnProperty.call(input, "note")
        ? input.note
        : current.note,
      tags: Object.prototype.hasOwnProperty.call(input, "tags")
        ? input.tags
        : current.tags,
      frequency: input.frequency ?? current.frequency,
      startDate: input.startDate ?? current.startDate
    });
    const resetsSchedule =
      (input.startDate !== undefined && input.startDate !== current.startDate) ||
      (input.frequency !== undefined && input.frequency !== current.frequency);
    const next: RecurringTransaction = {
      ...current,
      ...parsed,
      tags: parsed.tags ?? [],
      nextRunDate: resetsSchedule ? parsed.startDate : current.nextRunDate,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    await financeDb.recurringTransactions.put(next);
    return next;
  },

  async setRecurringTransactionPaused(id, paused) {
    const current = await financeDb.recurringTransactions.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Recurring transaction not found.");
    }
    const next: RecurringTransaction = {
      ...current,
      paused,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    await financeDb.recurringTransactions.put(next);
    return next;
  },

  async deleteRecurringTransaction(id) {
    const current = await financeDb.recurringTransactions.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.recurringTransactions.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
  },

  async materializeDueTransactions(today = toCalendarDate(new Date())) {
    const schedules = await financeDb.recurringTransactions
      .where("nextRunDate")
      .belowOrEqual(today)
      .toArray();
    if (!schedules.length) {
      return 0;
    }

    return financeDb.transaction(
      "rw",
      [financeDb.recurringTransactions, financeDb.transactions, financeDb.wallets, financeDb.categories],
      async () => {
        const wallets = new Map((await financeDb.wallets.toArray()).map((wallet) => [wallet.id, wallet]));
        const categories = new Map((await financeDb.categories.toArray()).map((category) => [category.id, category]));
        let createdCount = 0;

        for (const schedule of schedules) {
          if (schedule.deletedAt || schedule.paused) {
            continue;
          }
          const wallet = wallets.get(schedule.walletId);
          const category = categories.get(schedule.categoryId);
          if (
            !wallet ||
            wallet.deletedAt ||
            wallet.archivedAt ||
            !category ||
            category.deletedAt ||
            category.type !== schedule.type
          ) {
            continue;
          }

          let occurrenceDate = schedule.nextRunDate;
          let processed = 0;
          while (occurrenceDate <= today && processed < MAX_OCCURRENCES_PER_RUN) {
            const existing = await financeDb.transactions
              .where("[recurringTransactionId+recurrenceDate]")
              .equals([schedule.id, occurrenceDate])
              .first();
            if (!existing) {
              const transaction: Transaction = {
                ...createEntityBase(),
                walletId: schedule.walletId,
                categoryId: schedule.categoryId,
                amountMinor: schedule.amountMinor,
                currency: wallet.currency.toUpperCase(),
                type: schedule.type,
                note: schedule.note,
                tags: normalizeTags(schedule.tags),
                transactionDate: fromDateInputValue(occurrenceDate),
                recurringTransactionId: schedule.id,
                recurrenceDate: occurrenceDate
              };
              await financeDb.transactions.add(transaction);
              createdCount += 1;
            }
            occurrenceDate = nextRecurringDate(occurrenceDate, schedule.startDate, schedule.frequency);
            processed += 1;
          }

          await financeDb.recurringTransactions.put({
            ...schedule,
            nextRunDate: occurrenceDate,
            updatedAt: nowIso(),
            syncStatus: "pending"
          });
        }

        return createdCount;
      }
    );
  }
};
