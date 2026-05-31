import type { FinanceBackup } from "@myfinances/types";
import { backupSchema } from "@myfinances/types";
import { financeDb, nowIso, seedLocalData } from "../db/database";

export interface BackupRepository {
  exportBackup(): Promise<FinanceBackup>;
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
      version: 1,
      exportedAt: nowIso(),
      wallets: await financeDb.wallets.toArray(),
      categories: await financeDb.categories.toArray(),
      transactions: await financeDb.transactions.toArray(),
      settings
    });
  },

  async importBackup(backup) {
    const parsed = backupSchema.parse(backup);
    await financeDb.transaction("rw", financeDb.wallets, financeDb.categories, financeDb.transactions, financeDb.settings, async () => {
      await financeDb.wallets.clear();
      await financeDb.categories.clear();
      await financeDb.transactions.clear();
      await financeDb.settings.clear();
      await financeDb.wallets.bulkPut(parsed.wallets);
      await financeDb.categories.bulkPut(parsed.categories);
      await financeDb.transactions.bulkPut(parsed.transactions);
      await financeDb.settings.put(parsed.settings);
    });
    return parsed;
  }
};
