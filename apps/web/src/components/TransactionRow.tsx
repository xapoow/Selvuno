import type { Category, Settings, Transaction, Wallet } from "@myfinances/types";
import { Edit3, Trash2 } from "lucide-react";
import { formatDate, formatSignedMoney } from "@myfinances/utils";
import { CategoryIcon } from "../lib/icons";
import { Button } from "./ui/Button";
import { getCategoryName, type Dictionary } from "../i18n";

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  wallet?: Wallet;
  settings: Settings;
  t?: Dictionary;
  displayAmountMinor?: number;
  displayCurrency?: string;
  conversionMissing?: boolean;
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
  onEdit,
  onDelete
}: TransactionRowProps) {
  const amountClass = transaction.type === "income" ? "text-income" : "text-expense";
  const categoryName = t ? getCategoryName(category?.name, t) : category?.name ?? "Uncategorized";
  const amountMinor = displayAmountMinor ?? transaction.amountMinor;
  const currency = displayCurrency ?? transaction.currency;
  const tags = Array.isArray(transaction.tags) ? transaction.tags : [];

  return (
    <article className="app-surface grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-app p-3">
      <span
        className="grid h-11 w-11 place-items-center rounded-app text-white"
        style={{ backgroundColor: category?.color ?? "#676761" }}
      >
        <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {categoryName}
          </h3>
          {wallet ? <span className="truncate text-xs text-muted">{wallet.name}</span> : null}
        </div>
        <p className="truncate text-xs text-muted">
          {formatDate(transaction.transactionDate, settings.locale, settings.dateFormat, settings.timeZone)}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </p>
        {tags.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="app-control rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium text-muted">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid justify-items-end gap-2">
        <p className={`text-sm font-semibold ${amountClass}`}>
          {formatSignedMoney(
            amountMinor,
            currency,
            settings.locale,
            transaction.type
          )}
          {conversionMissing ? " *" : ""}
        </p>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)} aria-label={t?.common.edit ?? "Edit"}>
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-expense"
                onClick={() => onDelete(transaction)}
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
