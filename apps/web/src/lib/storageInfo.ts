import { financeDb } from "../db/database";

export const LAST_EXPORT_KEY = "selvuno:last-full-export:v1";
export function markArchivePrepared() { try { localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString()); } catch { /* Export still works without preferences storage. */ } }
export async function readStorageInfo() {
  const [files, retained, drafts, snapshots, transactions, wallets] = await Promise.all([
    financeDb.transactionAttachments.toArray(), financeDb.snapshotAttachments.toArray(), financeDb.transactionDrafts.toArray(),
    financeDb.backupSnapshots.count(), financeDb.transactions.count(), financeDb.wallets.count()
  ]);
  let estimate: StorageEstimate | undefined;
  let persistent: boolean | undefined;
  try { estimate = await navigator.storage?.estimate?.(); } catch { /* Optional browser API. */ }
  try { persistent = await navigator.storage?.persisted?.(); } catch { /* Optional browser API. */ }
  let lastExport: string | null = null;
  try { lastExport = localStorage.getItem(LAST_EXPORT_KEY); } catch { /* Optional preference. */ }
  return {
    files: files.sort((a, b) => b.size - a.size), fileBytes: files.reduce((sum, file) => sum + file.size, 0),
    snapshotBytes: retained.reduce((sum, file) => sum + file.size, 0),
    draftBytes: drafts.reduce((sum, draft) => sum + (Array.isArray(draft.files) ? draft.files.reduce((part, file) => part + (Number.isFinite(file?.blob?.size) ? file.blob.size : 0), 0) : 0), 0),
    draftCount: drafts.length, snapshots, transactions, wallets, estimate, persistent,
    lastExport: lastExport && Number.isFinite(Date.parse(lastExport)) ? lastExport : null
  };
}
export function formatBytes(bytes: number | undefined, locale: string) {
  if (bytes === undefined || !Number.isFinite(bytes)) return "—";
  const unit = bytes >= 1024 ** 3 ? "GB" : bytes >= 1024 ** 2 ? "MB" : bytes >= 1024 ? "KB" : "B";
  const factor = { GB: 1024 ** 3, MB: 1024 ** 2, KB: 1024, B: 1 }[unit];
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / factor)} ${unit}`;
}
export async function clearRestoreHistory() {
  await financeDb.transaction("rw", financeDb.backupSnapshots, financeDb.snapshotAttachments, async () => {
    await financeDb.backupSnapshots.clear();
    await financeDb.snapshotAttachments.clear();
  });
}
