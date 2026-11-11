import type { BackupSnapshot, BackupSnapshotReason, FinanceBackup, FinanceBackupV8 } from "@selvuno/types";
import { backupSchema, backupSnapshotSchema } from "@selvuno/types";
import { createId, financeDb, nowIso, seedLocalData } from "../db/database";
import type { TransactionAttachment } from "../db/models";

const MAX_AUTOMATIC_BACKUPS = 12;
const BACKUP_SESSION_WINDOW_MS = 10 * 60 * 1000;
function dataTables() {
  return [financeDb.wallets, financeDb.categories, financeDb.transactions, financeDb.transactionTemplates,
    financeDb.settings, financeDb.budgets, financeDb.recurringTransactions, financeDb.savingsGoals,
    financeDb.savingsGoalContributions, financeDb.walletTransfers, financeDb.transactionAttachments];
}
async function readJsonBackup(): Promise<FinanceBackupV8> {
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
}
export async function captureFullBackup() {
  await seedLocalData();
  return financeDb.transaction("r", dataTables(), async () => ({
    data: await readJsonBackup(),
    attachments: await financeDb.transactionAttachments.toArray()
  }));
}
async function collectSnapshotFiles() {
  const snapshots = await financeDb.backupSnapshots.toArray();
  const retained = new Set(snapshots.flatMap((snapshot) => snapshot.attachmentIds ?? []));
  const ids = await financeDb.snapshotAttachments.toCollection().primaryKeys();
  await financeDb.snapshotAttachments.bulkDelete(ids.filter((id) => !retained.has(id)));
}
export interface BackupRepository {
  exportBackup(): Promise<FinanceBackupV8>;
  exportArchive(): Promise<Blob>;
  importBackup(backup: unknown): Promise<FinanceBackup>;
  createSnapshot(reason?: BackupSnapshotReason): Promise<BackupSnapshot>;
  listSnapshots(): Promise<BackupSnapshot[]>;
  restoreSnapshot(id: string): Promise<FinanceBackup>;
  deleteSnapshot(id: string): Promise<void>;
}
export const backupRepository: BackupRepository = {
  async exportBackup() {
    await seedLocalData();
    return financeDb.transaction("r", dataTables(), readJsonBackup);
  },
  async exportArchive() {
    const { createBackupArchive } = await import("../lib/backupArchive");
    return createBackupArchive(await captureFullBackup());
  },
  async importBackup(input) {
    const { normalizeBackupInput } = await import("../lib/backupArchive");
    // Validate every incoming record and file before taking a safety copy or modifying data.
    const incoming = normalizeBackupInput(input);
    const parsed = incoming.data;
    await this.createSnapshot("before-restore");
    await financeDb.transaction("rw", dataTables(), async () => {
      const ids = new Set(parsed.transactions.map((item) => item.id));
      // Legacy JSON has no file bytes. Preserve matching local receipts instead of losing them.
      const attachments: TransactionAttachment[] = incoming.attachments ??
        (await financeDb.transactionAttachments.toArray()).filter((item) => ids.has(item.transactionId));
      const counts = new Map<string, number>();
      attachments.forEach((item) => counts.set(item.transactionId, (counts.get(item.transactionId) ?? 0) + 1));
      for (const table of dataTables()) await table.clear();
      await financeDb.wallets.bulkPut(parsed.wallets);
      await financeDb.categories.bulkPut(parsed.categories);
      await financeDb.transactions.bulkPut(parsed.transactions.map((item) => {
        const count = counts.get(item.id) ?? 0;
        return count || item.attachmentCount !== undefined ? { ...item, attachmentCount: count } : item;
      }));
      if ("budgets" in parsed) await financeDb.budgets.bulkPut(parsed.budgets);
      if ("recurringTransactions" in parsed) await financeDb.recurringTransactions.bulkPut(parsed.recurringTransactions);
      if ("savingsGoals" in parsed) {
        await financeDb.savingsGoals.bulkPut(parsed.savingsGoals);
        await financeDb.savingsGoalContributions.bulkPut(parsed.savingsGoalContributions);
      }
      if ("walletTransfers" in parsed) await financeDb.walletTransfers.bulkPut(parsed.walletTransfers);
      if ("transactionTemplates" in parsed) await financeDb.transactionTemplates.bulkPut(parsed.transactionTemplates);
      await financeDb.transactionAttachments.bulkPut(attachments);
      await financeDb.settings.put(parsed.settings);
    });
    return parsed;
  },
  async createSnapshot(reason = "automatic") {
    await seedLocalData();
    return financeDb.transaction("rw", [...dataTables(), financeDb.backupSnapshots, financeDb.snapshotAttachments], async () => {
      const backup = await readJsonBackup();
      const files = await financeDb.transactionAttachments.toArray();
      const latest = await financeDb.backupSnapshots.orderBy("createdAt").last();
      const reuse = reason === "automatic" && latest?.reason === "automatic" &&
        Date.now() - Date.parse(latest.createdAt) < BACKUP_SESSION_WINDOW_MS;
      const snapshot = backupSnapshotSchema.parse({
        id: reuse && latest ? latest.id : createId(), createdAt: nowIso(), reason, backup,
        attachmentIds: files.map((file) => file.id)
      });
      await financeDb.snapshotAttachments.bulkPut(files);
      await financeDb.backupSnapshots.put(snapshot);
      const snapshots = await financeDb.backupSnapshots.orderBy("createdAt").toArray();
      await financeDb.backupSnapshots.bulkDelete(snapshots.slice(0, Math.max(0, snapshots.length - MAX_AUTOMATIC_BACKUPS)).map((item) => item.id));
      await collectSnapshotFiles();
      return snapshot;
    });
  },
  async listSnapshots() {
    return (await financeDb.backupSnapshots.orderBy("createdAt").reverse().toArray()).map((snapshot) => backupSnapshotSchema.parse(snapshot));
  },
  async restoreSnapshot(id) {
    const snapshot = await financeDb.backupSnapshots.get(id);
    if (!snapshot) throw new Error("snapshot-missing");
    if (!snapshot.attachmentIds) return this.importBackup(snapshot.backup);
    const files = await financeDb.snapshotAttachments.bulkGet(snapshot.attachmentIds);
    if (files.some((file) => !file)) throw new Error("archive-incomplete");
    return this.importBackup({ kind: "full-backup", data: snapshot.backup, attachments: files });
  },
  async deleteSnapshot(id) {
    await financeDb.transaction("rw", financeDb.backupSnapshots, financeDb.snapshotAttachments, async () => {
      await financeDb.backupSnapshots.delete(id);
      await collectSnapshotFiles();
    });
  }
};
