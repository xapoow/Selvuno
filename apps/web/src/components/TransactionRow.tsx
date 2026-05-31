import type { Category, Settings, Transaction, Wallet } from "@myfinances/types";
import { Edit3, Trash2 } from "lucide-react";
import { formatDate, formatSignedMoney } from "@myfinances/utils";
import { CategoryIcon } from "../lib/icons";
import { Button } from "./ui/Button";

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  wallet?: Wallet;
  settings: Settings;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export function TransactionRow({
  transaction,
  category,
  wallet,
  settings,
  onEdit,
  onDelete
}: TransactionRowProps) {
  const amountClass = transaction.type === "income" ? "text-income" : "text-expense";

  return (
    <article className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-app border border-line bg-surface p-3">
      <span
        className="grid h-11 w-11 place-items-center rounded-app text-white"
        style={{ backgroundColor: category?.color ?? "#676761" }}
      >
        <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {category?.name ?? "Uncategorized"}
          </h3>
          {wallet ? <span className="truncate text-xs text-muted">{wallet.name}</span> : null}
        </div>
        <p className="truncate text-xs text-muted">
          {formatDate(transaction.transactionDate, settings.locale, settings.dateFormat, settings.timeZone)}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </p>
      </div>
      <div className="grid justify-items-end gap-2">
        <p className={`text-sm font-semibold ${amountClass}`}>
          {formatSignedMoney(
            transaction.amountMinor,
            transaction.currency,
            settings.locale,
            transaction.type
          )}
        </p>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)} aria-label="Edit">
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-expense"
                onClick={() => onDelete(transaction)}
                aria-label="Delete"
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
