import { useCallback, useEffect, useState } from "react";
import { FileText, HardDrive, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import type { Dictionary } from "../i18n";
import { financeDb } from "../db/database";
import { clearRestoreHistory, formatBytes, readStorageInfo } from "../lib/storageInfo";
import { transactionAttachmentRepository } from "../repositories/transactionAttachmentRepository";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";

export function StoragePanel({ t, locale, onChange }: { t: Dictionary; locale: string; onChange?: () => void }) {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof readStorageInfo>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [denied, setDenied] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [target, setTarget] = useState<{ kind: "file"; id: string; transactionId: string; name: string } | { kind: "drafts" | "history" } | null>(null);
  const refresh = useCallback(async () => {
    setBusy(true); setError(false);
    try { setInfo(await readStorageInfo()); } catch { setError(true); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const title = target?.kind === "file" ? t.safety.deleteFile : target?.kind === "drafts" ? t.safety.clearDrafts : t.safety.clearHistory;
  const hint = target?.kind === "file" ? t.safety.deleteFileHint : target?.kind === "drafts" ? t.safety.clearDraftsHint : t.safety.clearHistoryHint;
  useEffect(() => { setActionError(false); }, [target]);

  return <div className="grid gap-4">
    <div className="app-surface grid gap-4 rounded-2xl p-4">
      <div className="flex items-start gap-3"><HardDrive className="mt-1 h-5 w-5 shrink-0 text-accent" /><p className="flex-1 text-sm leading-6 text-muted">{t.safety.storageHint}</p><Button variant="ghost" size="icon" disabled={busy} aria-label={t.safety.refresh} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /></Button></div>
      {error ? <p role="alert" className="text-sm text-expense">{t.safety.loadError}</p> : null}
      {!info && busy ? <p role="status" className="text-sm text-muted">{t.safety.preparing}</p> : null}
      {info ? <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          [t.safety.used, formatBytes(info.estimate?.usage, locale)], [t.safety.quota, formatBytes(info.estimate?.quota, locale)],
          [t.safety.operations, info.transactions], [t.safety.wallets, info.wallets],
          [t.safety.receiptSpace, `${info.files.length} · ${formatBytes(info.fileBytes, locale)}`],
          [t.safety.snapshotSpace, `${info.snapshots} · ${formatBytes(info.snapshotBytes, locale)}`],
          [t.safety.draftSpace, `${info.draftCount} · ${formatBytes(info.draftBytes, locale)}`]
        ].map(([label, value]) => <div key={label} className="app-control rounded-xl p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd></div>)}
      </dl> : null}
      <div className="border-t border-line pt-3"><p className="text-xs text-muted">{t.safety.lastExport}</p><p className="mt-1 text-sm text-foreground">{info?.lastExport ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(info.lastExport)) : t.safety.noExport}</p><p className="mt-1 text-xs text-muted">{t.safety.exportDateHint}</p></div>
    </div>
    <div className="app-surface grid gap-3 rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />{t.safety.persistence}</h3>
      <p className="text-sm text-muted">{info?.persistent === true ? t.safety.protected : info?.persistent === false ? t.safety.unprotected : t.safety.unsupported}</p>
      <p className="text-xs leading-5 text-muted">{t.safety.persistenceHint}</p>
      <Button variant="secondary" disabled={busy || info?.persistent === true || typeof navigator.storage?.persist !== "function"} onClick={async () => {
        setBusy(true); setDenied(false);
        try { setDenied(!await navigator.storage.persist()); } catch { setDenied(true); }
        finally { await refresh(); }
      }}>{t.safety.requestProtection}</Button>
      {denied ? <p role="status" className="text-xs text-muted">{t.safety.persistenceDenied}</p> : null}
    </div>
    <div className="app-surface grid gap-3 rounded-2xl p-4">
      <p className="text-xs leading-5 text-muted">{t.safety.filesHint}</p>
      {info?.files.slice(0, 100).map((file) => <div key={file.id} className="app-control flex min-w-0 items-center gap-3 rounded-xl p-3"><FileText className="h-4 w-4 shrink-0 text-muted" /><span className="min-w-0 flex-1"><span className="block truncate text-sm">{file.name}</span><span className="text-xs text-muted">{formatBytes(file.size, locale)}</span></span><Button variant="ghost" size="icon" disabled={busy} aria-label={`${t.safety.deleteFile}: ${file.name}`} onClick={() => setTarget({ kind: "file", id: file.id, transactionId: file.transactionId, name: file.name })}><Trash2 className="h-4 w-4 text-expense" /></Button></div>)}
      {info && !info.files.length ? <p className="text-sm text-muted">{t.safety.emptyFiles}</p> : null}
      <Button variant="secondary" disabled={busy || !info?.draftCount} onClick={() => setTarget({ kind: "drafts" })}>{t.safety.clearDrafts}</Button>
      <Button variant="secondary" disabled={busy || !info?.snapshots} onClick={() => setTarget({ kind: "history" })}>{t.safety.clearHistory}</Button>
    </div>
    <BottomSheet open={Boolean(target)} title={title} closeLabel={t.common.close} dismissible={!busy} onClose={() => setTarget(null)}>
      <p className="text-sm leading-6 text-muted">{hint}</p>
      {target?.kind === "file" ? <p className="mt-3 break-all text-sm font-semibold">{target.name}</p> : null}
      {actionError ? <p role="alert" className="mt-3 text-sm text-expense">{t.safety.actionError}</p> : null}
      <Button variant="danger" className="mt-4 w-full" disabled={busy} onClick={async () => {
        if (!target) return;
        setBusy(true); setError(false);
        try {
          if (target.kind === "file") await transactionAttachmentRepository.removeFile(target.id);
          else if (target.kind === "drafts") await financeDb.transactionDrafts.clear();
          else await clearRestoreHistory();
          onChange?.(); setTarget(null);
        } catch { setActionError(true); }
        finally { await refresh(); }
      }}>{t.safety.delete}</Button>
    </BottomSheet>
  </div>;
}
