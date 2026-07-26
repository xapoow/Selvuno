import type { FinanceBackup, FinanceBackupV2 } from "@myfinances/types";
import { backupSchema } from "@myfinances/types";
import { financeDb, nowIso, seedLocalData } from "../db/database";

export interface BackupRepository {
  exportBackup(): Promise<FinanceBackupV2>;
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
      version: 2,
      exportedAt: nowIso(),
      wallets: await financeDb.wallets.toArray(),
      categories: await financeDb.categories.toArray(),
      transactions: await financeDb.transactions.toArray(),
      budgets: await financeDb.budgets.toArray(),
      settings
    }) as FinanceBackupV2;
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
        financeDb.budgets
      ],
      async () => {
        await financeDb.wallets.clear();
        await financeDb.categories.clear();
        await financeDb.transactions.clear();
        await financeDb.settings.clear();
        await financeDb.budgets.clear();
        await financeDb.wallets.bulkPut(parsed.wallets);
        await financeDb.categories.bulkPut(parsed.categories);
        await financeDb.transactions.bulkPut(parsed.transactions);
        if (parsed.version === 2) {
          await financeDb.budgets.bulkPut(parsed.budgets);
        }
        await financeDb.settings.put(parsed.settings);
      }
    );
    return parsed;
  }
};
