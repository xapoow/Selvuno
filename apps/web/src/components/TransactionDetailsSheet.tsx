import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Settings, Transaction, Wallet } from "@myfinances/types";
import { formatDate, formatSignedMoney } from "@myfinances/utils";
import { CalendarDays, FileText, Paperclip, Tag, WalletCards, X } from "lucide-react";
import type { TransactionAttachment } from "../db/models";
import { getCategoryName, type Dictionary } from "../i18n";
import { CategoryIcon } from "../lib/icons";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { transactionAttachmentRepository } from "../repositories/transactionAttachmentRepository";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";

interface TransactionDetailsSheetProps {
  open: boolean;
  transaction: Transaction | null;
  category?: Category;
  wallet?: Wallet;
  settings: Settings;
  t: Dictionary;
  displayAmountMinor?: number;
  displayCurrency?: string;
  conversionMissing?: boolean;
  onClose: () => void;
}

interface AttachmentPreview extends TransactionAttachment {
  url: string;
}

function formatFileSize(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function TransactionDetailsSheet({
  open,
  transaction,
  category,
  wallet,
  settings,
  t,
  displayAmountMinor,
  displayCurrency,
  conversionMissing,
  onClose
}: TransactionDetailsSheetProps) {
  const [attachments, setAttachments] = useState<TransactionAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewer, setViewer] = useState<AttachmentPreview | null>(null);

  useEffect(() => {
    if (!open || !transaction) {
      setAttachments([]);
      setViewer(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void transactionAttachmentRepository
      .listByTransaction(transaction.id)
      .then((items) => {
        if (!cancelled) setAttachments(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, transaction]);

  const previews = useMemo<AttachmentPreview[]>(
    () => attachments.map((attachment) => ({ ...attachment, url: URL.createObjectURL(attachment.blob) })),
    [attachments]
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews]
  );

  if (!transaction) return null;

  const amountMinor = displayAmountMinor ?? transaction.amountMinor;
  const currency = displayCurrency ?? transaction.currency;
  const hideAmount = shouldHideWalletAmounts(settings, wallet);
  const categoryName = getCategoryName(category?.name, t);
  const tags = Array.isArray(transaction.tags) ? transaction.tags : [];

  const viewerOverlay = viewer
    ? createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[210] grid grid-rows-[auto_minmax(0,1fr)] bg-black/90 text-white backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={viewer.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{viewer.name}</p>
                <p className="text-xs text-white/60">{formatFileSize(viewer.size)}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="border-white/15 bg-white/10 text-white"
                onClick={() => setViewer(null)}
                aria-label={t.common.close}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-0 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {viewer.mimeType === "application/pdf" ? (
                <iframe title={viewer.name} src={viewer.url} className="h-full w-full rounded-2xl bg-white" />
              ) : (
                <motion.img
                  src={viewer.url}
                  alt={viewer.name}
                  className="h-full w-full rounded-2xl object-contain"
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <>
      <BottomSheet open={open} title={t.transaction.detailsTitle} onClose={onClose}>
        <div className="grid gap-5">
          <section className="app-control relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full opacity-15 blur-3xl"
              style={{ backgroundColor: category?.color ?? "#676761" }}
            />
            <div className="relative flex items-start gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: category?.color ?? "#676761" }}
              >
                <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{categoryName}</p>
                <p className="mt-1 text-xs font-medium text-muted">
                  {transaction.type === "income" ? t.common.income : t.common.expense}
                </p>
              </div>
              <p className={`text-lg font-bold ${transaction.type === "income" ? "text-income" : "text-expense"}`}>
                {formatSignedMoney(amountMinor, currency, settings.locale, transaction.type, hideAmount)}
                {conversionMissing ? " *" : ""}
              </p>
            </div>
          </section>

          <dl className="grid gap-3 text-sm">
            <div className="grid grid-cols-[auto_1fr] items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted" />
              <div><dt className="text-xs text-muted">{t.common.date}</dt><dd className="mt-0.5 font-medium text-foreground">{formatDate(transaction.transactionDate, settings.locale, settings.dateFormat, settings.timeZone)}</dd></div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-start gap-3">
              <WalletCards className="mt-0.5 h-4 w-4 text-muted" />
              <div><dt className="text-xs text-muted">{t.common.wallet}</dt><dd className="mt-0.5 font-medium text-foreground">{wallet?.name ?? "—"}</dd></div>
            </div>
            {transaction.note ? (
              <div className="app-control rounded-xl p-3">
                <dt className="text-xs text-muted">{t.common.note}</dt>
                <dd className="mt-1 whitespace-pre-wrap leading-6 text-foreground">{transaction.note}</dd>
              </div>
            ) : null}
            {tags.length ? (
              <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                <Tag className="mt-1 h-4 w-4 text-muted" />
                <dd className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => <span key={tag} className="app-control rounded-full px-2.5 py-1 text-xs font-medium text-muted">#{tag}</span>)}
                </dd>
              </div>
            ) : null}
          </dl>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-accent" /><h3 className="text-sm font-semibold text-foreground">{t.transaction.attachments}</h3></div>
              {previews.length ? <span className="text-xs font-semibold text-muted">{previews.length}</span> : null}
            </div>
            {loading ? (
              <div className="app-control h-28 animate-pulse rounded-2xl" />
            ) : previews.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {previews.map((preview) => (
                  <button key={preview.id} type="button" className="app-control app-focus group overflow-hidden rounded-2xl text-left" onClick={() => setViewer(preview)} aria-label={`${t.transaction.openAttachment}: ${preview.name}`}>
                    <span className="block aspect-[4/3] overflow-hidden bg-elevated">
                      {preview.mimeType === "application/pdf" ? <span className="grid h-full place-items-center bg-gradient-to-br from-expense/20 to-elevated text-expense"><FileText className="h-8 w-8" /></span> : <img src={preview.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                    </span>
                    <span className="block p-2.5"><span className="block truncate text-xs font-semibold text-foreground">{preview.name}</span><span className="mt-0.5 block text-[11px] text-muted">{formatFileSize(preview.size)}</span></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="app-control grid min-h-24 place-items-center rounded-2xl px-4 text-center text-sm text-muted">{t.transaction.noAttachments}</div>
            )}
          </section>
        </div>
      </BottomSheet>
      {viewerOverlay}
    </>
  );
}
