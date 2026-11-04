import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface BottomSheetProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onExitComplete?: () => void;
  closeLabel?: string;
  dismissible?: boolean;
}

let scrollLocks = 0;
let savedOverflow: { body: string; root: string } | null = null;

function lockPageScroll() {
  if (scrollLocks === 0) {
    savedOverflow = { body: document.body.style.overflow, root: document.documentElement.style.overflow };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  scrollLocks += 1;
  return () => {
    scrollLocks -= 1;
    if (scrollLocks === 0 && savedOverflow) {
      document.body.style.overflow = savedOverflow.body;
      document.documentElement.style.overflow = savedOverflow.root;
      savedOverflow = null;
    }
  };
}

export function BottomSheet({ open, title, children, onClose, onExitComplete, closeLabel = "Close", dismissible = true }: BottomSheetProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockPageScroll();
    return () => {
      unlock();
      if (previousFocus?.isConnected && (scrollLocks === 0 || previousFocus.closest('[aria-modal="true"]'))) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    dialogRef.current.scrollTop = 0;
    dialogRef.current.focus({ preventScroll: true });
  }, [open, title]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      const topDialog = Array.from(document.querySelectorAll('[aria-modal="true"]')).at(-1);
      if (!dialog || topDialog !== dialog || event.defaultPrevented) return;
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )).filter((element) => !element.closest('[hidden], [aria-hidden="true"]') && element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || (event.shiftKey && (document.activeElement === first || document.activeElement === dialog))) {
          event.preventDefault();
          (last ?? dialog).focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismissible]);

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[150] grid items-end bg-black/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" aria-hidden="true" onClick={() => { if (dismissible) onClose(); }} />
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="app-surface gpu-layer relative mx-auto max-h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl p-4 outline-none"
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel} disabled={!dismissible}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {children}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
