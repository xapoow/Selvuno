import type { Category, Settings, Transaction, Wallet } from "@selvuno/types";
import { Edit3, Paperclip, Trash2 } from "lucide-react";
import { formatDate, formatSignedMoney } from "@selvuno/utils";
import { CategoryIcon } from "../lib/icons";
import { Button } from "./ui/Button";
import { getCategoryName, type Dictionary } from "../i18n";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  wallet?: Wallet;
  settings: Settings;
  t?: Dictionary;
  displayAmountMinor?: number;
  displayCurrency?: string;
  conversionMissing?: boolean;
  onOpen?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export function TransactionRow({
  transaction,
  category,
  wallet,
  settings,
  t,
  displayAmountMinor,
  displayCurrency,
  conversionMissing,
  onOpen,
  onEdit,
  onDelete
}: TransactionRowProps) {
  const amountClass = transaction.type === "income" ? "text-income" : "text-expense";
  const categoryName = t ? getCategoryName(category?.name, t) : category?.name ?? "Uncategorized";
  const amountMinor = displayAmountMinor ?? transaction.amountMinor;
  const currency = displayCurrency ?? transaction.currency;
  const tags = Array.isArray(transaction.tags) ? transaction.tags : [];
  const hideAmount = shouldHideWalletAmounts(settings, wallet);

  return (
    <article
      className={`app-surface grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-2xl p-3.5 transition-all ${onOpen ? "app-focus cursor-pointer hover:bg-elevated/70" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={() => onOpen?.(transaction)}
      onKeyDown={(event) => {
        if (onOpen && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen(transaction);
        }
      }}
    >
      <span
        className="grid h-11 w-11 place-items-center rounded-control text-white shadow-sm"
        style={{ backgroundColor: category?.color ?? "#676761" }}
      >
        <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {categoryName}
          </h3>
          {wallet ? <span className="truncate text-xs font-medium text-muted">{wallet.name}</span> : null}
        </div>
        <p className="truncate text-xs text-muted">
          {formatDate(transaction.transactionDate, settings.locale, settings.dateFormat, settings.timeZone)}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </p>
        {tags.length || transaction.attachmentCount ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="app-control rounded-full px-2 py-0.5 text-[11px] font-medium text-muted">
                #{tag}
              </span>
            ))}
            {transaction.attachmentCount ? (
              <span className="app-control inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted">
                <Paperclip className="h-3 w-3" />
                {transaction.attachmentCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="grid justify-items-end gap-2">
        <p className={`text-sm font-semibold ${amountClass}`}>
          {formatSignedMoney(
            amountMinor,
            currency,
            settings.locale,
            transaction.type,
            hideAmount
          )}
          {conversionMissing ? " *" : ""}
        </p>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => { event.stopPropagation(); onEdit(transaction); }} aria-label={t?.common.edit ?? "Edit"}>
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-expense"
                onClick={(event) => { event.stopPropagation(); onDelete(transaction); }}
                aria-label={t?.common.delete ?? "Delete"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
