import { useCallback, useEffect, useRef, useState } from "react";
import type { TransactionDraft } from "../db/models";
import { draftRepository, meaningfulDraft } from "../repositories/draftRepository";

export type DraftContent = Omit<TransactionDraft, "id" | "updatedAt">;
const signature = (value: DraftContent) => JSON.stringify({ fields: value.fields, files: value.files.map((file) => [file.name, file.type, file.lastModified, file.blob.size]) });
export function useTransactionDraft(id: string | null, enabled: boolean, value: DraftContent, apply: (draft: TransactionDraft) => boolean) {
  const [pending, setPending] = useState<TransactionDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const latest = useRef(value); latest.current = value;
  const applyRef = useRef(apply); applyRef.current = apply;
  const session = useRef({ mounted: false, ready: false, blocked: true, skip: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTimer = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  const flush = useCallback(async () => {
    const current = session.current;
    if (!id || !enabled || !current.ready || current.blocked || current.skip) return;
    const content = latest.current;
    const savedSignature = signature(content);
    try {
      await draftRepository.save({ id, updatedAt: new Date().toISOString(), ...content });
      if (current.mounted && signature(latest.current) === savedSignature) setStatus(meaningfulDraft(content) ? "saved" : "idle");
    } catch { if (current.mounted) setStatus("error"); }
  }, [id, enabled]);
  useEffect(() => {
    const current = { mounted: true, ready: false, blocked: true, skip: false };
    session.current = current; setLoaded(false); setPending(null); setStatus("idle");
    if (id && enabled) void draftRepository.read(id).then((draft) => {
      if (!current.mounted) return;
      current.ready = true; current.blocked = Boolean(draft); setPending(draft); setLoaded(true);
    }).catch(() => { if (current.mounted) { current.blocked = true; setLoaded(true); setStatus("error"); } });
    const onHide = () => { if (document.visibilityState !== "visible") { cancelTimer(); void flush(); } };
    const onLeave = () => { cancelTimer(); void flush(); };
    document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", onLeave);
    return () => {
      cancelTimer(); void flush(); current.mounted = false;
      document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onLeave);
    };
  }, [id, enabled, flush]);
  const contentSignature = signature(value);
  useEffect(() => {
    cancelTimer();
    if (!id || !enabled || !loaded || pending || session.current.blocked) return;
    if (!meaningfulDraft(value)) { session.current.skip = false; void flush(); return; }
    session.current.skip = false; setStatus("saving");
    timer.current = setTimeout(() => { timer.current = null; void flush(); }, 400);
    return cancelTimer;
  }, [id, enabled, loaded, pending, contentSignature, flush]);
  return {
    pending: enabled ? pending : null, status: enabled ? status : "idle",
    resume() {
      if (!pending || !applyRef.current(pending)) { setStatus("error"); return false; }
      session.current.blocked = false; setPending(null); return true;
    },
    async discard() {
      if (!id) return;
      cancelTimer();
      try { await draftRepository.remove(id); session.current.blocked = false; session.current.ready = true; setPending(null); setStatus("idle"); }
      catch { setStatus("error"); }
    },
    async saved() {
      if (!id || !enabled) return;
      cancelTimer(); session.current.skip = true;
      try { await draftRepository.remove(id); if (session.current.mounted) setStatus("idle"); }
      catch { if (session.current.mounted) setStatus("error"); }
    }
  };
}
