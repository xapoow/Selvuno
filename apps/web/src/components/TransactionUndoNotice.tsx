import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Undo2, X } from "lucide-react";
import type { Dictionary } from "../i18n";
import type { useTransactionDeletion } from "../state/useTransactionDeletion";
import { Button } from "./ui/Button";

export function TransactionUndoNotice({ deletion, t, onOpenTrash }: {
  deletion: ReturnType<typeof useTransactionDeletion>;
  t: Dictionary;
  onOpenTrash: () => void;
}) {
  const hovered = useRef(false);
  const focused = useRef(false);
  useEffect(() => {
    if (!deletion.count) {
      hovered.current = false;
      focused.current = false;
    }
  }, [deletion.count]);
  return createPortal(
    <AnimatePresence>
      {deletion.count ? (
        <motion.aside
          key="transaction-undo"
          aria-label={t.undo.title}
          className="app-surface fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[170] mx-auto grid max-w-lg gap-2 rounded-2xl border border-line/70 p-3 md:bottom-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onPointerEnter={() => { hovered.current = true; deletion.setPaused(true); }}
          onPointerLeave={() => { hovered.current = false; deletion.setPaused(focused.current); }}
          onFocusCapture={() => { focused.current = true; deletion.setPaused(true); }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              focused.current = false;
              deletion.setPaused(hovered.current);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-foreground" role="status" aria-live="polite">
              {deletion.count === 1 ? t.undo.deletedOne : t.undo.deletedMany.replace("{count}", String(deletion.count))}
            </p>
            <Button type="button" variant="secondary" size="small" disabled={deletion.busy} onClick={() => void deletion.undo()}>
              {deletion.busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              {t.undo.action}
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={deletion.busy} onClick={deletion.dismiss} aria-label={t.common.close}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {deletion.failed ? <p role="alert" className="text-xs leading-5 text-expense">{t.undo.restoreError}</p> : null}
          <p className="text-xs leading-5 text-muted">
            {t.undo.hint}{" "}
            <button type="button" disabled={deletion.busy} className="app-focus rounded font-semibold text-accent" onClick={() => { deletion.dismiss(); onOpenTrash(); }}>
              {t.undo.trash}
            </button>
          </p>
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
