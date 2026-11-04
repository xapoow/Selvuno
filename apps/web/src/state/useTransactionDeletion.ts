import { useEffect, useRef, useState } from "react";
import type { DeletedTransactionRef } from "../repositories/transactionRepository";

export const DELETE_UNDO_DURATION = 10_000;

interface DeletionActions {
  deleteTransactions: (ids: string[]) => Promise<DeletedTransactionRef[]>;
  restoreTransactions: (deleted: DeletedTransactionRef[]) => Promise<void>;
}

function deletionKey(item: DeletedTransactionRef) {
  return `${item.id}:${item.deletedAt}`;
}

export function useTransactionDeletion(actions: DeletionActions) {
  const [pending, setPending] = useState<DeletedTransactionRef[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!pending.length) setPaused(false);
  }, [pending.length]);

  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!pending.length || busy || failed || paused || pageHidden) return;
    const timeout = window.setTimeout(() => setPending([]), DELETE_UNDO_DURATION);
    return () => window.clearTimeout(timeout);
  }, [pending, busy, failed, paused, pageHidden]);

  async function deleteMany(ids: string[]) {
    const deleted = await actions.deleteTransactions(ids);
    if (!deleted.length) return;
    setFailed(false);
    setPending((previous) => [...new Map([...previous, ...deleted].map((item) => [item.id, item])).values()]);
  }

  async function undo() {
    if (busyRef.current || !pending.length) return;
    busyRef.current = true;
    setBusy(true);
    setFailed(false);
    const batch = pending;
    try {
      await actions.restoreTransactions(batch);
      const restored = new Set(batch.map(deletionKey));
      setPending((current) => current.filter((item) => !restored.has(deletionKey(item))));
    } catch {
      setFailed(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function dismiss() {
    if (busyRef.current) return;
    setPending([]);
    setFailed(false);
    setPaused(false);
  }

  return {
    count: pending.length, busy, failed, undo, dismiss, setPaused,
    deleteMany,
    deleteOne: (id: string) => deleteMany([id])
  };
}
