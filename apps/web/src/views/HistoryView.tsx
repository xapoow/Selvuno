import { useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  TransactionType,
  Wallet,
  WalletView
} from "@myfinances/types";
import { ReceiptText } from "lucide-react";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionRow } from "../components/TransactionRow";
import { BottomSheet } from "../components/ui/BottomSheet";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";
import { getCategoryName, type Dictionary } from "../i18n";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "../lib/exchangeRates";

interface HistoryViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  displayCurrency: string;
  exchangeRates?: ExchangeRateTable;
  t: Dictionary;
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type TypeFilter = TransactionType | "all";
type HistorySort =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "category-asc"
  | "category-desc"
  | "wallet-asc"
  | "wallet-desc";

export function HistoryView({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  displayCurrency,
  exchangeRates,
  t,
  onUpdate,
  onDelete
}: HistoryViewProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<HistorySort>("date-desc");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const visibleTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (transaction.deletedAt) {
          return false;
        }
        if (activeWalletId !== "all" && transaction.walletId !== activeWalletId) {
          return false;
        }
        if (typeFilter !== "all" && transaction.type !== typeFilter) {
          return false;
        }
        if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
          return false;
        }
        return true;
      }),
    [activeWalletId, categoryFilter, transactions, typeFilter]
  );
  const displayTransactions = useMemo(() => {
    const collator = new Intl.Collator(settings.locale, { numeric: true, sensitivity: "base" });
    const byNewest = (left: Transaction, right: Transaction) =>
      Date.parse(right.transactionDate) - Date.parse(left.transactionDate);
    const getCategoryLabel = (transaction: Transaction) =>
      getCategoryName(categories.find((category) => category.id === transaction.categoryId)?.name, t);
    const getWalletLabel = (transaction: Transaction) =>
      wallets.find((wallet) => wallet.id === transaction.walletId)?.name ?? "";

    return visibleTransactions
      .map((transaction) => {
        const convertedAmountMinor = convertMinorToBaseCurrency(
          transaction.amountMinor,
          transaction.currency,
          displayCurrency,
          exchangeRates
        );
        return {
          transaction,
          amountMinor: convertedAmountMinor ?? transaction.amountMinor,
          currency: convertedAmountMinor === null ? transaction.currency : displayCurrency,
          conversionMissing: convertedAmountMinor === null && transaction.currency.toUpperCase() !== displayCurrency
        };
      })
      .sort((left, right) => {
        if (sortBy === "date-desc") {
          return byNewest(left.transaction, right.transaction);
        }
        if (sortBy === "date-asc") {
          return byNewest(right.transaction, left.transaction);
        }
        if (sortBy === "amount-desc") {
          return right.amountMinor - left.amountMinor || byNewest(left.transaction, right.transaction);
        }
        if (sortBy === "amount-asc") {
          return left.amountMinor - right.amountMinor || byNewest(left.transaction, right.transaction);
        }
        if (sortBy === "category-asc") {
          return (
            collator.compare(getCategoryLabel(left.transaction), getCategoryLabel(right.transaction)) ||
            byNewest(left.transaction, right.transaction)
          );
        }
        if (sortBy === "category-desc") {
          return (
            collator.compare(getCategoryLabel(right.transaction), getCategoryLabel(left.transaction)) ||
            byNewest(left.transaction, right.transaction)
          );
        }
        if (sortBy === "wallet-asc") {
          return (
            collator.compare(getWalletLabel(left.transaction), getWalletLabel(right.transaction)) ||
            byNewest(left.transaction, right.transaction)
          );
        }
        return (
          collator.compare(getWalletLabel(right.transaction), getWalletLabel(left.transaction)) ||
          byNewest(left.transaction, right.transaction)
        );
      });
  }, [categories, displayCurrency, exchangeRates, settings.locale, sortBy, t, visibleTransactions, wallets]);

  async function handleDelete(transaction: Transaction) {
    if (window.confirm(t.history.confirmDelete)) {
      await onDelete(transaction.id);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.history.title}</h2>
      </div>
      <div className="grid gap-3 rounded-app border border-line bg-surface p-3">
        <SegmentedControl
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: t.common.all },
            { value: "expense", label: t.common.expense },
            { value: "income", label: t.common.income }
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField label={t.common.category} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">{t.history.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.name, t)}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.history.sort} value={sortBy} onChange={(event) => setSortBy(event.target.value as HistorySort)}>
            <option value="date-desc">{t.history.sortOptions.dateDesc}</option>
            <option value="date-asc">{t.history.sortOptions.dateAsc}</option>
            <option value="amount-desc">{t.history.sortOptions.amountDesc}</option>
            <option value="amount-asc">{t.history.sortOptions.amountAsc}</option>
            <option value="category-asc">{t.history.sortOptions.categoryAsc}</option>
            <option value="category-desc">{t.history.sortOptions.categoryDesc}</option>
            <option value="wallet-asc">{t.history.sortOptions.walletAsc}</option>
            <option value="wallet-desc">{t.history.sortOptions.walletDesc}</option>
          </SelectField>
        </div>
      </div>
      {displayTransactions.length ? (
        <div className="grid gap-2">
          {displayTransactions.map((item) => (
            <TransactionRow
              key={item.transaction.id}
              transaction={item.transaction}
              category={categories.find((category) => category.id === item.transaction.categoryId)}
              wallet={wallets.find((wallet) => wallet.id === item.transaction.walletId)}
              settings={settings}
              displayAmountMinor={item.amountMinor}
              displayCurrency={item.currency}
              conversionMissing={item.conversionMissing}
              t={t}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={ReceiptText} title={t.history.empty} />
      )}

      <BottomSheet open={Boolean(editing)} title={t.transaction.editTitle} onClose={() => setEditing(null)}>
        {editing ? (
          <TransactionForm
            wallets={wallets}
            categories={categories}
            settings={settings}
            t={t}
            activeWalletId={activeWalletId}
            initial={editing}
            submitLabel={t.transaction.update}
            onSubmit={async (input) => {
              await onUpdate(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
