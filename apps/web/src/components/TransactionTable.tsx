import type { Category, Settings, Transaction, Wallet } from "@selvuno/types";
import { formatDate, formatSignedMoney } from "@selvuno/utils";
import { Edit3 } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { Button } from "./ui/Button";

export interface TransactionTableItem {
  transaction: Transaction;
  amountMinor: number;
  currency: string;
  conversionMissing: boolean;
}

interface TransactionTableProps {
  items: TransactionTableItem[];
  categories: Category[];
  wallets: Wallet[];
  settings: Settings;
  t: Dictionary;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionTable({
  items,
  categories,
  wallets,
  settings,
  t,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
  onEdit
}: TransactionTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.transaction.id));

  return (
    <div className="app-surface overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-line/70 text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                aria-label={t.history.selectAll}
                onChange={onToggleAll}
                className="h-4 w-4 accent-[rgb(var(--color-accent))]"
              />
            </th>
            <th className="px-3 py-3">{t.common.date}</th>
            <th className="px-3 py-3">{t.common.category}</th>
            <th className="px-3 py-3">{t.common.wallet}</th>
            <th className="px-3 py-3">{t.common.note}</th>
            <th className="px-3 py-3 text-right">{t.transaction.amount}</th>
            <th className="w-14 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const { transaction } = item;
            const category = categories.find((value) => value.id === transaction.categoryId);
            const wallet = wallets.find((value) => value.id === transaction.walletId);
            const selected = selectedIds.has(transaction.id);
            return (
              <tr
                key={transaction.id}
                tabIndex={0}
                className={`cursor-pointer border-b border-line/45 transition-colors last:border-0 hover:bg-elevated/60 ${selected ? "bg-accent-soft/50" : ""}`}
                onClick={() => onOpen(transaction)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(transaction);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    aria-label={t.history.selectTransaction.replace(
                      "{category}",
                      getCategoryName(category?.name, t)
                    )}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => onToggle(transaction.id)}
                    className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">
                  {formatDate(
                    transaction.transactionDate,
                    settings.locale,
                    "short",
                    settings.timeZone
                  )}
                </td>
                <td className="max-w-44 truncate px-3 py-3 font-semibold text-foreground">
                  {getCategoryName(category?.name, t)}
                </td>
                <td className="max-w-36 truncate px-3 py-3 text-muted">{wallet?.name ?? "—"}</td>
                <td className="max-w-56 truncate px-3 py-3 text-muted">{transaction.note || "—"}</td>
                <td
                  className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${
                    transaction.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {formatSignedMoney(
                    item.amountMinor,
                    item.currency,
                    settings.locale,
                    transaction.type,
                    shouldHideWalletAmounts(settings, wallet)
                  )}
                  {item.conversionMissing ? " *" : ""}
                </td>
                <td className="px-3 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t.common.edit}
                    onClick={(event) => { event.stopPropagation(); onEdit(transaction); }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
