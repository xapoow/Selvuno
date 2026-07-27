import type { FinanceBackup, FinanceBackupV6 } from "@myfinances/types";
import { backupSchema } from "@myfinances/types";
import { financeDb, nowIso, seedLocalData } from "../db/database";

export interface BackupRepository {
  exportBackup(): Promise<FinanceBackupV6>;
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
      version: 6,
      exportedAt: nowIso(),
      wallets: await financeDb.wallets.toArray(),
      categories: await financeDb.categories.toArray(),
      transactions: await financeDb.transactions.toArray(),
      budgets: await financeDb.budgets.toArray(),
      recurringTransactions: await financeDb.recurringTransactions.toArray(),
      savingsGoals: await financeDb.savingsGoals.toArray(),
      savingsGoalContributions: await financeDb.savingsGoalContributions.toArray(),
      walletTransfers: await financeDb.walletTransfers.toArray(),
      settings
    }) as FinanceBackupV6;
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
        financeDb.recurringTransactions,
        financeDb.savingsGoals,
        financeDb.savingsGoalContributions,
        financeDb.walletTransfers
      ],
      async () => {
        await financeDb.wallets.clear();
        await financeDb.categories.clear();
        await financeDb.transactions.clear();
        await financeDb.settings.clear();
        await financeDb.budgets.clear();
        await financeDb.recurringTransactions.clear();
        await financeDb.savingsGoals.clear();
        await financeDb.savingsGoalContributions.clear();
        await financeDb.walletTransfers.clear();
        await financeDb.wallets.bulkPut(
          parsed.wallets.map((wallet) => ({
            ...wallet,
            initialBalanceMinor: wallet.initialBalanceMinor ?? 0
          }))
        );
        await financeDb.categories.bulkPut(parsed.categories);
        await financeDb.transactions.bulkPut(parsed.transactions);
        if (
          parsed.version === 2 ||
          parsed.version === 3 ||
          parsed.version === 4 ||
          parsed.version === 5 ||
          parsed.version === 6
        ) {
          await financeDb.budgets.bulkPut(parsed.budgets);
        }
        if (
          parsed.version === 3 ||
          parsed.version === 4 ||
          parsed.version === 5 ||
          parsed.version === 6
        ) {
          await financeDb.recurringTransactions.bulkPut(parsed.recurringTransactions);
        }
        if (parsed.version === 4 || parsed.version === 5 || parsed.version === 6) {
          await financeDb.savingsGoals.bulkPut(parsed.savingsGoals);
          await financeDb.savingsGoalContributions.bulkPut(parsed.savingsGoalContributions);
        }
        if (parsed.version === 5 || parsed.version === 6) {
          await financeDb.walletTransfers.bulkPut(parsed.walletTransfers);
        }
        await financeDb.settings.put(parsed.settings);
      }
    );
    return parsed;
  }
};
