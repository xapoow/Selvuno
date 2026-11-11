import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  Wallet,
  WalletView
} from "@selvuno/types";
import { formatMoney, minorToDecimal } from "@selvuno/utils";
import { Bookmark, Download, Filter, ReceiptText, Tags, Trash2, X } from "lucide-react";
import { FinancialCalendar } from "../components/FinancialCalendar";
import { HistoryFilterForm } from "../components/HistoryFilterForm";
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
import type { HistoryMode } from "../lib/routes";
import { EXPORT_PREFIX } from "../lib/brand";
import { convertMinorToBaseCurrency, useExchangeRates, type ExchangeRateTable } from "../lib/exchangeRates";
import { advancedHistoryFilterCount, defaultHistoryFilters, equalHistoryFilters, filterHistoryTransactions, hasHistoryFilters, readHistoryAmountRange, type HistoryFilters, type HistorySort } from "../lib/historyFilters";
import { useSavedHistoryFilters } from "../state/useSavedHistoryFilters";
import { createCsv, downloadCsv } from "../lib/csv";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import type { TransactionSubmission } from "../lib/transactionAttachments";
import { compareTransactionsNewestFirst, compareTransactionsOldestFirst } from "../lib/transactions";

interface HistoryViewProps {
  mode?: HistoryMode;
  onModeChange?: (mode: HistoryMode) => void;
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

export function HistoryView({
  mode: routedMode,
  onModeChange,
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
  const [filters, setFilters] = useState(() => defaultHistoryFilters(displayCurrency));
  const { type: typeFilter, query: searchQuery, sort: sortBy } = filters;
  const setTypeFilter = (type: HistoryFilters["type"]) => setFilters((current) => ({ ...current, type }));
  const setSearchQuery = (query: string) => setFilters((current) => ({ ...current, query }));
  const setSortBy = (sort: HistorySort) => setFilters((current) => ({ ...current, sort }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const presets = useSavedHistoryFilters();
  const advancedCount = advancedHistoryFilterCount(filters);
  const [localMode, setLocalMode] = useState<HistoryMode>("list");
  const viewMode = routedMode ?? localMode;
  const setViewMode = (next: HistoryMode) => { if (onModeChange) onModeChange(next); else setLocalMode(next); };
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
  const range = readHistoryAmountRange(filters);
  const moneyRange = (amount: number) => formatMoney(amount, filters.currency, settings.locale, calendarSettings.hideAmounts);
  const amountSummary = range.minimum !== null && range.maximum !== null
    ? `${moneyRange(range.minimum)} — ${moneyRange(range.maximum)}`
    : range.minimum !== null ? `≥ ${moneyRange(range.minimum)}` : range.maximum !== null ? `≤ ${moneyRange(range.maximum)}` : "";

  const amountFiltered = Boolean(filters.minimum.trim() || filters.maximum.trim());
  const suppliedRates = exchangeRates?.base.toUpperCase() === filters.currency ? exchangeRates : undefined;
  const amountNeedsRates = amountFiltered && transactions.some((item) =>
    !item.deletedAt && (activeWalletId === "all" || item.walletId === activeWalletId) && item.currency.toUpperCase() !== filters.currency
  );
  const filterRatesQuery = useExchangeRates(filters.currency, amountNeedsRates && !suppliedRates);
  const amountRates = filterRatesQuery.data && (!suppliedRates || filterRatesQuery.data.cachedAt > suppliedRates.cachedAt)
    ? filterRatesQuery.data : suppliedRates;
  const filtered = useMemo(() => filterHistoryTransactions({
    transactions, filters, activeWalletId, categories, wallets, locale: settings.locale, t, rates: amountRates
  }), [transactions, filters, activeWalletId, categories, wallets, settings.locale, t, amountRates]);
  const visibleTransactions = filtered.transactions;
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
    downloadCsv(`${EXPORT_PREFIX}-${new Date().toISOString().slice(0, 10)}.csv`, createCsv(rows));
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
            <Button type="button" variant="secondary" size="small" onClick={onOpenTrash}>
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
          maxLength={240}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <div className={viewMode !== "calendar" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid gap-3"}>
          <Button type="button" variant="secondary" className="h-11 self-end" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4" />{t.historyFilters.title}
            {advancedCount ? <span className="rounded-full bg-surface px-2 py-0.5 text-xs">{advancedCount}</span> : null}
          </Button>
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
        {advancedCount ? <div className="flex flex-wrap items-center gap-2" aria-label={t.historyFilters.active}>
          {filters.categoryIds.slice(0, 3).map((id) => {
            const category = categories.find((item) => item.id === id);
            const label = category ? getCategoryName(category.name, t) : t.historyFilters.unavailableCategory;
            return <button key={id} type="button" aria-label={`${t.historyFilters.removeCategory}: ${label}`}
              onClick={() => setFilters((current) => ({ ...current, categoryIds: current.categoryIds.filter((value) => value !== id) }))}
              className="app-focus app-control inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted"><span className="truncate">{label}</span><X className="h-3 w-3 shrink-0" /></button>;
          })}
          {filters.categoryIds.length > 3 ? <button type="button" className="app-focus rounded-full px-2 text-xs text-muted" onClick={() => setFiltersOpen(true)}>+{filters.categoryIds.length - 3}</button> : null}
          {filters.attachments !== "all" ? <button type="button" className="app-focus app-control inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted" aria-label={t.historyFilters.clearAttachments}
            onClick={() => setFilters((current) => ({ ...current, attachments: "all" }))}>{filters.attachments === "with" ? t.historyFilters.withAttachments : t.historyFilters.withoutAttachments}<X className="h-3 w-3" /></button> : null}
          {amountSummary ? <button type="button" className="app-focus app-control inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted" aria-label={t.historyFilters.clearAmount}
            onClick={() => setFilters((current) => ({ ...current, minimum: "", maximum: "" }))}>{amountSummary}<X className="h-3 w-3" /></button> : null}
        </div> : null}
        {presets.saved.length ? <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar" role="group" aria-label={t.historyFilters.saved}>
          {presets.saved.map((item) => <button key={item.id} type="button" title={item.name} aria-pressed={equalHistoryFilters(filters, item.filters)} onClick={() => setFilters(item.filters)}
            className={`app-focus inline-flex max-w-48 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${equalHistoryFilters(filters, item.filters) ? "app-selected-control border-line text-foreground" : "border-line text-muted"}`}>
            <Bookmark className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{item.name}</span>
          </button>)}
        </div> : null}
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <p role="status" aria-live="polite">{t.historyFilters.resultCount.replace("{count}", String(displayTransactions.length))}</p>
          {hasHistoryFilters(filters) ? <button type="button" className="app-focus rounded-lg px-2 py-1 font-semibold text-accent" onClick={() => setFilters(defaultHistoryFilters(displayCurrency))}>{t.historyFilters.reset}</button> : null}
        </div>
        {filtered.missingRates ? <div role="status" className="rounded-xl bg-warning/10 p-3 text-xs leading-5 text-muted">
          <p>{(filterRatesQuery.isFetching ? t.historyFilters.ratesLoading : t.historyFilters.ratesMissing).replace("{count}", String(filtered.missingRates)).replace("{currency}", filters.currency)}</p>
          {!filterRatesQuery.isFetching ? <Button type="button" variant="ghost" size="small" className="mt-1" onClick={() => { void filterRatesQuery.refetch(); }}>{t.common.reload}</Button> : null}
        </div> : null}
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
      <BottomSheet open={filtersOpen} title={t.historyFilters.title} closeLabel={t.common.close} onClose={() => setFiltersOpen(false)}>
        <HistoryFilterForm initial={filters} categories={categories} currencies={[displayCurrency, settings.currency, ...wallets.map((wallet) => wallet.currency)]}
          saved={presets.saved} locale={settings.locale} t={t}
          onApply={(next) => { setFilters(next); setFiltersOpen(false); }}
          onSave={(name, savedFilters) => presets.save([...presets.saved, { id: crypto.randomUUID(), name, filters: savedFilters }])}
          onDeleteSaved={(id) => presets.save(presets.saved.filter((item) => item.id !== id))}
        />
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
