import { z } from "zod";
import type { Category, Transaction, Wallet, WalletView } from "@myfinances/types";
import { getCategoryName, type Dictionary } from "../i18n";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "./exchangeRates";
import { parseBalanceToMinor } from "./walletReconciliation";

export const historySortSchema = z.enum(["date-desc", "date-asc", "amount-desc", "amount-asc", "category-asc", "category-desc", "wallet-asc", "wallet-desc"]);
export type HistorySort = z.infer<typeof historySortSchema>;
export const historyFiltersSchema = z.object({
  query: z.string().max(240),
  type: z.enum(["all", "expense", "income"]),
  categoryIds: z.array(z.string().uuid()).max(500),
  attachments: z.enum(["all", "with", "without"]),
  minimum: z.string().max(48),
  maximum: z.string().max(48),
  currency: z.string().regex(/^[A-Z]{3}$/),
  sort: historySortSchema
});
export type HistoryFilters = z.infer<typeof historyFiltersSchema>;
export const savedHistoryFilterSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(48), filters: historyFiltersSchema });
export type SavedHistoryFilter = z.infer<typeof savedHistoryFilterSchema>;
export const HISTORY_FILTER_STORAGE_KEY = "myfinances:history-filters:v1";
export const MAX_SAVED_HISTORY_FILTERS = 20;

export function defaultHistoryFilters(currency: string): HistoryFilters {
  return { query: "", type: "all", categoryIds: [], attachments: "all", minimum: "", maximum: "", currency: currency.toUpperCase(), sort: "date-desc" };
}

export function readHistoryAmountRange(filters: HistoryFilters) {
  try {
    const minimum = filters.minimum.trim() ? parseBalanceToMinor(filters.minimum, filters.currency) : null;
    const maximum = filters.maximum.trim() ? parseBalanceToMinor(filters.maximum, filters.currency) : null;
    if ((minimum !== null && minimum < 0) || (maximum !== null && maximum < 0) ||
      (minimum !== null && maximum !== null && minimum > maximum)) throw new Error("Invalid range.");
    return { minimum, maximum, valid: true };
  } catch { return { minimum: null, maximum: null, valid: false }; }
}

export function advancedHistoryFilterCount(filters: HistoryFilters): number {
  return Number(filters.categoryIds.length > 0) + Number(filters.attachments !== "all") + Number(Boolean(filters.minimum.trim() || filters.maximum.trim()));
}

export function hasHistoryFilters(filters: HistoryFilters): boolean {
  return Boolean(filters.query.trim() || filters.type !== "all" || filters.sort !== "date-desc" || advancedHistoryFilterCount(filters));
}

export function equalHistoryFilters(left: HistoryFilters, right: HistoryFilters): boolean {
  const values = (item: HistoryFilters) => [item.query, item.type, [...item.categoryIds].sort(), item.attachments, item.minimum, item.maximum, item.currency, item.sort];
  return JSON.stringify(values(left)) === JSON.stringify(values(right));
}

export function readSavedHistoryFilters(): SavedHistoryFilter[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(HISTORY_FILTER_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const unique = new Map<string, SavedHistoryFilter>();
    for (const item of raw) {
      const parsed = savedHistoryFilterSchema.safeParse(item);
      if (parsed.success && readHistoryAmountRange(parsed.data.filters).valid) {
        unique.set(parsed.data.id, { ...parsed.data, filters: { ...parsed.data.filters, categoryIds: [...new Set(parsed.data.filters.categoryIds)] } });
      }
      if (unique.size === MAX_SAVED_HISTORY_FILTERS) break;
    }
    return [...unique.values()];
  } catch { return []; }
}

export function persistSavedHistoryFilters(items: SavedHistoryFilter[]) {
  if (items.length > MAX_SAVED_HISTORY_FILTERS) throw new Error("Saved filter limit reached.");
  const parsed = z.array(savedHistoryFilterSchema).parse(items);
  if (parsed.some((item) => !readHistoryAmountRange(item.filters).valid)) throw new Error("Invalid saved range.");
  localStorage.setItem(HISTORY_FILTER_STORAGE_KEY, JSON.stringify(parsed));
}

export function filterHistoryTransactions({ transactions, filters, activeWalletId, categories, wallets, locale, t, rates }: {
  transactions: Transaction[];
  filters: HistoryFilters;
  activeWalletId: WalletView;
  categories: Category[];
  wallets: Wallet[];
  locale: string;
  t: Dictionary;
  rates?: ExchangeRateTable;
}) {
  const range = readHistoryAmountRange(filters);
  const searchTerms = filters.query.toLocaleLowerCase(locale).split(/[\s,;]+/).map((term) => term.replace(/^#+/, "")).filter(Boolean);
  const categoryLabels = new Map(categories.map((category) => [category.id, `${category.name} ${getCategoryName(category.name, t)}`]));
  const walletLabels = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const categoryIds = new Set(filters.categoryIds);
  const amountFiltered = range.minimum !== null || range.maximum !== null;
  let missingRates = 0;
  const matches = transactions.filter((transaction) => {
    if (!range.valid || transaction.deletedAt || (activeWalletId !== "all" && transaction.walletId !== activeWalletId)) return false;
    if (filters.type !== "all" && transaction.type !== filters.type) return false;
    if (categoryIds.size && !categoryIds.has(transaction.categoryId)) return false;
    const hasAttachments = (transaction.attachmentCount ?? 0) > 0;
    if ((filters.attachments === "with" && !hasAttachments) || (filters.attachments === "without" && hasAttachments)) return false;
    if (searchTerms.length) {
      const text = [transaction.note, categoryLabels.get(transaction.categoryId) ?? getCategoryName(undefined, t), walletLabels.get(transaction.walletId), ...(Array.isArray(transaction.tags) ? transaction.tags : [])]
        .filter(Boolean).join(" ").toLocaleLowerCase(locale);
      if (!searchTerms.every((term) => text.includes(term))) return false;
    }
    if (amountFiltered) {
      const amount = convertMinorToBaseCurrency(transaction.amountMinor, transaction.currency, filters.currency, rates);
      if (amount === null) { missingRates += 1; return false; }
      if ((range.minimum !== null && amount < range.minimum) || (range.maximum !== null && amount > range.maximum)) return false;
    }
    return true;
  });
  return { transactions: matches, missingRates };
}
