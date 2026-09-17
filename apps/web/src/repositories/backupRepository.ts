import type {
  BackupSnapshot,
  BackupSnapshotReason,
  FinanceBackup,
  FinanceBackupV8
} from "@myfinances/types";
import { backupSchema, backupSnapshotSchema } from "@myfinances/types";
import { createId, financeDb, nowIso, seedLocalData } from "../db/database";

const MAX_AUTOMATIC_BACKUPS = 12;
const BACKUP_SESSION_WINDOW_MS = 10 * 60 * 1000;

export interface BackupRepository {
  exportBackup(): Promise<FinanceBackupV8>;
  importBackup(backup: unknown): Promise<FinanceBackup>;
  createSnapshot(reason?: BackupSnapshotReason): Promise<BackupSnapshot>;
  listSnapshots(): Promise<BackupSnapshot[]>;
  restoreSnapshot(id: string): Promise<FinanceBackup>;
  deleteSnapshot(id: string): Promise<void>;
}

export const backupRepository: BackupRepository = {
  async exportBackup() {
    await seedLocalData();
    const settings = await financeDb.settings.get("default");
    if (!settings) {
      throw new Error("Settings not found.");
    }
    return backupSchema.parse({
      version: 8,
      exportedAt: nowIso(),
      wallets: await financeDb.wallets.toArray(),
      categories: await financeDb.categories.toArray(),
      transactions: await financeDb.transactions.toArray(),
      transactionTemplates: await financeDb.transactionTemplates.toArray(),
      budgets: await financeDb.budgets.toArray(),
      recurringTransactions: await financeDb.recurringTransactions.toArray(),
      savingsGoals: await financeDb.savingsGoals.toArray(),
      savingsGoalContributions: await financeDb.savingsGoalContributions.toArray(),
      walletTransfers: await financeDb.walletTransfers.toArray(),
      settings
    }) as FinanceBackupV8;
  },

  async importBackup(backup) {
    const parsed = backupSchema.parse(backup);
    await financeDb.transaction(
      "rw",
      [
        financeDb.wallets,
        financeDb.categories,
        financeDb.transactions,
        financeDb.transactionTemplates,
        financeDb.settings,
        financeDb.budgets,
        financeDb.recurringTransactions,
        financeDb.savingsGoals,
        financeDb.savingsGoalContributions,
        financeDb.walletTransfers,
        financeDb.transactionAttachments
      ],
      async () => {
        await financeDb.wallets.clear();
        await financeDb.categories.clear();
        await financeDb.transactions.clear();
        await financeDb.transactionTemplates.clear();
        await financeDb.settings.clear();
        await financeDb.budgets.clear();
        await financeDb.recurringTransactions.clear();
        await financeDb.savingsGoals.clear();
        await financeDb.savingsGoalContributions.clear();
        await financeDb.walletTransfers.clear();
        await financeDb.transactionAttachments.clear();
        await financeDb.wallets.bulkPut(
          parsed.wallets.map((wallet) => ({
            ...wallet,
            initialBalanceMinor: wallet.initialBalanceMinor ?? 0,
            kind: wallet.kind ?? "cash",
            creditLimitMinor: wallet.creditLimitMinor ?? 0,
            excludeFromTotals: wallet.excludeFromTotals ?? false,
            hideBalance: wallet.hideBalance ?? false
          }))
        );
        await financeDb.categories.bulkPut(parsed.categories);
        await financeDb.transactions.bulkPut(parsed.transactions);
        if (
          parsed.version === 2 ||
          parsed.version === 3 ||
          parsed.version === 4 ||
          parsed.version === 5 ||
          parsed.version === 6 ||
          parsed.version === 7 ||
          parsed.version === 8
        ) {
          await financeDb.budgets.bulkPut(parsed.budgets);
        }
        if (
          parsed.version === 3 ||
          parsed.version === 4 ||
          parsed.version === 5 ||
          parsed.version === 6 ||
          parsed.version === 7 ||
          parsed.version === 8
        ) {
          await financeDb.recurringTransactions.bulkPut(parsed.recurringTransactions);
        }
        if (
          parsed.version === 4 ||
          parsed.version === 5 ||
          parsed.version === 6 ||
          parsed.version === 7 ||
          parsed.version === 8
        ) {
          await financeDb.savingsGoals.bulkPut(parsed.savingsGoals);
          await financeDb.savingsGoalContributions.bulkPut(parsed.savingsGoalContributions);
        }
        if (parsed.version === 5 || parsed.version === 6 || parsed.version === 7 || parsed.version === 8) {
          await financeDb.walletTransfers.bulkPut(parsed.walletTransfers);
        }
        if (parsed.version === 7 || parsed.version === 8) {
          await financeDb.transactionTemplates.bulkPut(parsed.transactionTemplates);
        }
        await financeDb.settings.put(parsed.settings);
      }
    );
    return parsed;
  },

  async createSnapshot(reason = "automatic") {
    const backup = await this.exportBackup();
    const latest = await financeDb.backupSnapshots.orderBy("createdAt").last();
    const canReuseLatest =
      reason === "automatic" &&
      latest?.reason === "automatic" &&
      Date.now() - Date.parse(latest.createdAt) < BACKUP_SESSION_WINDOW_MS;
    const snapshot = backupSnapshotSchema.parse({
      id: canReuseLatest && latest ? latest.id : createId(),
      createdAt: nowIso(),
      reason,
      backup
    });
    await financeDb.backupSnapshots.put(snapshot);

    const snapshots = await financeDb.backupSnapshots.orderBy("createdAt").toArray();
    if (snapshots.length > MAX_AUTOMATIC_BACKUPS) {
      await financeDb.backupSnapshots.bulkDelete(
        snapshots.slice(0, snapshots.length - MAX_AUTOMATIC_BACKUPS).map((item) => item.id)
      );
    }
    return snapshot;
  },

  async listSnapshots() {
    return (await financeDb.backupSnapshots.orderBy("createdAt").reverse().toArray()).map(
      (snapshot) => backupSnapshotSchema.parse(snapshot)
    );
  },

  async restoreSnapshot(id) {
    const snapshot = await financeDb.backupSnapshots.get(id);
    if (!snapshot) {
      throw new Error("Backup snapshot not found.");
    }
    await this.createSnapshot("before-restore");
    return this.importBackup(snapshot.backup);
  },

  async deleteSnapshot(id) {
    await financeDb.backupSnapshots.delete(id);
  }
};
