import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  TransactionType,
  Wallet,
  WalletView
} from "@myfinances/types";
import { minorToDecimal } from "@myfinances/utils";
import { Download, ReceiptText, Tags, Trash2 } from "lucide-react";
import { FinancialCalendar } from "../components/FinancialCalendar";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionDetailsSheet } from "../components/TransactionDetailsSheet";
import { TransactionRow } from "../components/TransactionRow";
import { TransactionTable } from "../components/TransactionTable";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";
import { TextField } from "../components/ui/TextField";
import { getCategoryName, type Dictionary } from "../i18n";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "../lib/exchangeRates";
import { createCsv, downloadCsv } from "../lib/csv";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import type { TransactionSubmission } from "../lib/transactionAttachments";
import { compareTransactionsNewestFirst, compareTransactionsOldestFirst } from "../lib/transactions";

interface HistoryViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  displayCurrency: string;
  exchangeRates?: ExchangeRateTable;
  t: Dictionary;
  showTitle?: boolean;
  desktopTools?: boolean;
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  onUpdateWithAttachments: (id: string, submission: TransactionSubmission) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteMany?: (ids: string[]) => Promise<void>;
  onOpenTrash?: () => void;
  deletedCount?: number;
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
  showTitle = true,
  desktopTools = false,
  onUpdate,
  onUpdateWithAttachments,
  onDelete,
  onDeleteMany,
  onOpenTrash,
  deletedCount = 0
}: HistoryViewProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<HistorySort>("date-desc");
  const [viewMode, setViewMode] = useState<"list" | "table" | "calendar">("list");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [details, setDetails] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkActionError, setBulkActionError] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const activeWallet =
    activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === activeWalletId);
  const calendarContainsHiddenWallet =
    settings.advancedWalletsEnabled &&
    (activeWalletId === "all"
      ? wallets.some((wallet) => wallet.hideBalance)
      : Boolean(activeWallet?.hideBalance));
  const calendarSettings = {
    ...settings,
    hideAmounts: settings.hideAmounts || calendarContainsHiddenWallet
  };

  const visibleTransactions = useMemo(
    () => {
      const searchTerms = searchQuery
        .toLocaleLowerCase(settings.locale)
        .split(/[\s,;]+/)
        .map((term) => term.trim().replace(/^#+/, ""))
        .filter(Boolean);

      return transactions.filter((transaction) => {
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
        if (searchTerms.length) {
          const category = categories.find((item) => item.id === transaction.categoryId);
          const wallet = wallets.find((item) => item.id === transaction.walletId);
          const tags = Array.isArray(transaction.tags) ? transaction.tags : [];
          const searchable = [
            transaction.note,
            category?.name,
            getCategoryName(category?.name, t),
            wallet?.name,
            ...tags,
            ...tags.map((tag) => `#${tag}`)
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(settings.locale);

          if (!searchTerms.every((term) => searchable.includes(term))) {
            return false;
          }
        }
        return true;
      });
    },
    [activeWalletId, categories, categoryFilter, searchQuery, settings.locale, t, transactions, typeFilter, wallets]
  );
  const convertedTransactions = useMemo(
    () =>
      visibleTransactions.map((transaction) => {
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
      }),
    [displayCurrency, exchangeRates, visibleTransactions]
  );
  const displayTransactions = useMemo(() => {
    const collator = new Intl.Collator(settings.locale, { numeric: true, sensitivity: "base" });
    const byNewest = compareTransactionsNewestFirst;
    const getCategoryLabel = (transaction: Transaction) =>
      getCategoryName(categories.find((category) => category.id === transaction.categoryId)?.name, t);
    const getWalletLabel = (transaction: Transaction) =>
      wallets.find((wallet) => wallet.id === transaction.walletId)?.name ?? "";

    return [...convertedTransactions]
      .sort((left, right) => {
        if (sortBy === "date-desc") {
          return byNewest(left.transaction, right.transaction);
        }
        if (sortBy === "date-asc") {
          return compareTransactionsOldestFirst(left.transaction, right.transaction);
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
  }, [categories, convertedTransactions, settings.locale, sortBy, t, wallets]);
  const selectedTransactions = useMemo(
    () =>
      displayTransactions
        .map((item) => item.transaction)
        .filter((transaction) => selectedIds.has(transaction.id)),
    [displayTransactions, selectedIds]
  );
  const selectedTypes = new Set(selectedTransactions.map((transaction) => transaction.type));
  const selectedType = selectedTypes.size === 1 ? selectedTransactions[0]?.type : undefined;
  const selectedSignature = selectedTransactions
    .map((transaction) => transaction.id)
    .sort()
    .join("|");
  const bulkCategories = useMemo(
    () =>
      selectedType
        ? categories.filter((category) => !category.deletedAt && category.type === selectedType)
        : [],
    [categories, selectedType]
  );

  useEffect(() => {
    const displayedIds = new Set(displayTransactions.map((item) => item.transaction.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => displayedIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [displayTransactions]);

  useEffect(() => {
    setBulkCategoryId("");
  }, [selectedSignature]);

  async function handleDelete(transaction: Transaction) {
    setBulkActionError("");
    try {
      await onDelete(transaction.id);
    } catch {
      setBulkActionError(t.transaction.deleteError);
    }
  }

  function exportVisibleTransactions() {
    const rows: Array<Array<string | number>> = [
      [
        t.history.csvDate,
        t.history.csvType,
        t.history.csvAmount,
        t.history.csvCurrency,
        t.history.csvCategory,
        t.history.csvWallet,
        t.history.csvNote,
        t.history.csvTags
      ],
      ...displayTransactions.map(({ transaction }) => [
        transaction.transactionDate,
        transaction.type === "expense" ? t.common.expense : t.common.income,
        minorToDecimal(transaction.amountMinor, transaction.currency),
        transaction.currency,
        getCategoryName(
          categories.find((category) => category.id === transaction.categoryId)?.name,
          t
        ),
        wallets.find((wallet) => wallet.id === transaction.walletId)?.name ?? "",
        transaction.note ?? "",
        transaction.tags.join(", ")
      ])
    ];
    downloadCsv(`myfinances-${new Date().toISOString().slice(0, 10)}.csv`, createCsv(rows));
  }

  async function applyBulkCategory() {
    if (!bulkCategoryId || !selectedTransactions.length || !selectedType) {
      return;
    }
    setBulkActionError("");
    try {
      await Promise.all(
        selectedTransactions.map((transaction) =>
          onUpdate(transaction.id, { categoryId: bulkCategoryId })
        )
      );
      setSelectedIds(new Set());
    } catch {
      setBulkActionError(t.transaction.saveError);
    }
  }

  async function deleteSelectedTransactions() {
    if (!selectedTransactions.length || bulkDeleting) {
      return;
    }
    setBulkActionError("");
    setBulkDeleting(true);
    try {
      const ids = selectedTransactions.map((transaction) => transaction.id);
      if (onDeleteMany) await onDeleteMany(ids);
      else await Promise.all(ids.map(onDelete));
      setSelectedIds(new Set());
    } catch {
      setBulkActionError(t.transaction.deleteError);
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showTitle ? (
          <h2 className="text-xl font-semibold text-foreground">{t.history.title}</h2>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenTrash ? (
            <Button type="button" variant="ghost" size="small" onClick={onOpenTrash}>
              <Trash2 className="h-4 w-4" />
              {t.undo.trash}{deletedCount ? ` (${deletedCount})` : ""}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="small"
            className={desktopTools ? "hidden md:inline-flex" : "hidden"}
            disabled={!displayTransactions.length}
            onClick={exportVisibleTransactions}
          >
            <Download className="h-4 w-4" />
            {t.history.exportCsv}
          </Button>
          <div className={desktopTools ? "w-full md:min-w-[270px]" : "w-full"}>
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "list", label: t.history.viewList },
                ...(desktopTools ? [{ value: "table" as const, label: t.history.viewTable }] : []),
                { value: "calendar", label: t.history.viewCalendar }
              ]}
            />
          </div>
        </div>
      </div>
      <div className="app-surface grid gap-3 rounded-2xl p-3">
        <SegmentedControl
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: t.common.all },
            { value: "expense", label: t.common.expense },
            { value: "income", label: t.common.income }
          ]}
        />
        <TextField
          label={t.history.search}
          value={searchQuery}
          placeholder={t.history.searchPlaceholder}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <div className={viewMode !== "calendar" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid gap-3"}>
          <SelectField label={t.common.category} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">{t.history.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.name, t)}
              </option>
            ))}
          </SelectField>
          {viewMode !== "calendar" ? (
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
          ) : null}
        </div>
      </div>
      {viewMode === "table" && selectedTransactions.length ? (
        <div className="app-surface grid gap-3 rounded-2xl p-3 lg:grid-cols-[auto_minmax(220px,1fr)_auto_auto] lg:items-end">
          <p className="self-center text-sm font-semibold text-foreground">
            {t.history.selected.replace("{count}", String(selectedTransactions.length))}
          </p>
          {selectedType ? (
            <SelectField
              label={t.history.bulkCategory}
              value={bulkCategoryId}
              onChange={(event) => setBulkCategoryId(event.target.value)}
            >
              <option value="">{t.history.chooseBulkCategory}</option>
              {bulkCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryName(category.name, t)}
                </option>
              ))}
            </SelectField>
          ) : (
            <p className="self-center text-xs leading-5 text-muted">{t.history.mixedTypesHint}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={bulkDeleting || !selectedType || !bulkCategoryId}
            onClick={() => void applyBulkCategory()}
          >
            <Tags className="h-4 w-4" />
            {t.history.applyCategory}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="small"
            onClick={() => void deleteSelectedTransactions()}
            disabled={bulkDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {t.history.deleteSelected}
          </Button>
        </div>
      ) : null}
      {bulkActionError ? <p role="alert" className="text-sm font-medium text-expense">{bulkActionError}</p> : null}
      {viewMode === "calendar" ? (
        <FinancialCalendar
          wallets={wallets}
          categories={categories}
          items={convertedTransactions}
          settings={calendarSettings}
          displayCurrency={displayCurrency}
          t={t}
          onOpen={setDetails}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      ) : viewMode === "table" && displayTransactions.length ? (
        <TransactionTable
          items={displayTransactions}
          categories={categories}
          wallets={wallets}
          settings={settings}
          t={t}
          selectedIds={selectedIds}
          onToggle={(id) =>
            setSelectedIds((current) => {
              const next = new Set(current);
              if (next.has(id)) {
                next.delete(id);
              } else {
                next.add(id);
              }
              return next;
            })
          }
          onToggleAll={() =>
            setSelectedIds((current) => {
              const allSelected = displayTransactions.every((item) =>
                current.has(item.transaction.id)
              );
              return allSelected
                ? new Set()
                : new Set(displayTransactions.map((item) => item.transaction.id));
            })
          }
          onEdit={setEditing}
          onOpen={setDetails}
        />
      ) : displayTransactions.length ? (
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
              onOpen={setDetails}
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
            settings={{
              ...settings,
              hideAmounts: shouldHideWalletAmounts(
                settings,
                wallets.find((wallet) => wallet.id === editing.walletId)
              )
            }}
            t={t}
            activeWalletId={activeWalletId}
            initial={editing}
            submitLabel={t.transaction.update}
            onSubmit={async (submission) => {
              await onUpdateWithAttachments(editing.id, submission);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>
      <TransactionDetailsSheet
        open={Boolean(details)}
        transaction={transactions.find((transaction) => transaction.id === details?.id) ?? details}
        category={categories.find((category) => category.id === details?.categoryId)}
        wallet={wallets.find((wallet) => wallet.id === details?.walletId)}
        wallets={wallets}
        categories={categories}
        settings={settings}
        t={t}
        displayAmountMinor={displayTransactions.find((item) => item.transaction.id === details?.id)?.amountMinor}
        displayCurrency={displayTransactions.find((item) => item.transaction.id === details?.id)?.currency}
        conversionMissing={displayTransactions.find((item) => item.transaction.id === details?.id)?.conversionMissing}
        onClose={() => setDetails(null)}
        onUpdate={onUpdateWithAttachments}
        onDelete={onDelete}
      />
    </div>
  );
}
