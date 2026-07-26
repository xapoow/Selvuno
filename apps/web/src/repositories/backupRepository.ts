import type { FinanceBackup, FinanceBackupV3 } from "@myfinances/types";
import { backupSchema } from "@myfinances/types";
import { financeDb, nowIso, seedLocalData } from "../db/database";

export interface BackupRepository {
  exportBackup(): Promise<FinanceBackupV3>;
  importBackup(backup: unknown): Promise<FinanceBackup>;
}

export const backupRepository: BackupRepository = {
  async exportBackup() {
    await seedLocalData();
    const settings = await financeDb.settings.get("default");
    if (!settings) {
      throw new Error("Settings not found.");
    }
    return backupSchema.parse({
      version: 3,
      exportedAt: nowIso(),
      wallets: await financeDb.wallets.toArray(),
      categories: await financeDb.categories.toArray(),
      transactions: await financeDb.transactions.toArray(),
      budgets: await financeDb.budgets.toArray(),
      recurringTransactions: await financeDb.recurringTransactions.toArray(),
      settings
    }) as FinanceBackupV3;
  },

  async importBackup(backup) {
    const parsed = backupSchema.parse(backup);
    await financeDb.transaction(
      "rw",
      [
        financeDb.wallets,
        financeDb.categories,
        financeDb.transactions,
        financeDb.settings,
        financeDb.budgets,
        financeDb.recurringTransactions
      ],
      async () => {
        await financeDb.wallets.clear();
        await financeDb.categories.clear();
        await financeDb.transactions.clear();
        await financeDb.settings.clear();
        await financeDb.budgets.clear();
        await financeDb.recurringTransactions.clear();
        await financeDb.wallets.bulkPut(parsed.wallets);
        await financeDb.categories.bulkPut(parsed.categories);
        await financeDb.transactions.bulkPut(parsed.transactions);
        if (parsed.version === 2 || parsed.version === 3) {
          await financeDb.budgets.bulkPut(parsed.budgets);
        }
        if (parsed.version === 3) {
          await financeDb.recurringTransactions.bulkPut(parsed.recurringTransactions);
        }
        await financeDb.settings.put(parsed.settings);
      }
    );
    return parsed;
  }
};
