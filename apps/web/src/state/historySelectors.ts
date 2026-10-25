import { createSelector } from "@reduxjs/toolkit";
import type { Transaction, TransactionType, WalletView } from "@myfinances/types";
import { getCategoryName, getDictionary } from "../i18n";
import { compareTransactionsNewestFirst, compareTransactionsOldestFirst } from "../lib/transactions";
import { convertMinorToBaseCurrency } from "../lib/exchangeRateClient";
import { selectCategories, selectSettings, selectTransactions, selectWallets } from "./financeSelectors";
import type { RootState } from "./rootReducer";

export type HistorySort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" |
  "category-asc" | "category-desc" | "wallet-asc" | "wallet-desc";
export interface HistoryFilters {
  walletId: WalletView;
  type: TransactionType | "all";
  categoryId: string;
  search: string;
  sort: HistorySort;
  currency: string;
}

export function makeSelectHistory() {
  return createSelector(
    [selectTransactions, selectCategories, selectWallets, selectSettings,
      (state: RootState) => state.exchangeRates.byBase,
      (_state: RootState, filters: HistoryFilters) => filters.walletId,
      (_state: RootState, filters: HistoryFilters) => filters.type,
      (_state: RootState, filters: HistoryFilters) => filters.categoryId,
      (_state: RootState, filters: HistoryFilters) => filters.search,
      (_state: RootState, filters: HistoryFilters) => filters.sort,
      (_state: RootState, filters: HistoryFilters) => filters.currency],
    (transactions, categories, wallets, settings, rates, walletId, type, categoryId, search, sort, currency) => {
      const locale = settings?.locale ?? "en-US";
      const t = getDictionary(locale);
      const categoryById = new Map(categories.map((category) => [category.id, category]));
      const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
      const categoryLabel = (item: Transaction) => getCategoryName(categoryById.get(item.categoryId)?.name, t);
      const walletLabel = (item: Transaction) => walletById.get(item.walletId)?.name ?? "";
      const searchTerms = search.toLocaleLowerCase(locale).split(/[\s,;]+/).map((term) => term.replace(/^#+/, "")).filter(Boolean);
      const convertedTransactions = transactions.filter((item) => {
        if (item.deletedAt || (walletId !== "all" && item.walletId !== walletId) ||
          (type !== "all" && item.type !== type) || (categoryId !== "all" && item.categoryId !== categoryId)) return false;
        const text = [item.note, categoryById.get(item.categoryId)?.name, categoryLabel(item), walletLabel(item), ...(item.tags ?? [])].join(" ").toLocaleLowerCase(locale);
        return searchTerms.every((term) => text.includes(term));
      }).map((transaction) => {
        const amount = convertMinorToBaseCurrency(transaction.amountMinor, transaction.currency, currency, rates[currency]?.data);
        return { transaction, amountMinor: amount ?? transaction.amountMinor, currency: amount === null ? transaction.currency : currency, conversionMissing: amount === null };
      });
      const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
      const displayTransactions = [...convertedTransactions].sort((left, right) => {
        const newest = () => compareTransactionsNewestFirst(left.transaction, right.transaction);
        switch (sort) {
          case "date-desc": return newest();
          case "date-asc": return compareTransactionsOldestFirst(left.transaction, right.transaction);
          case "amount-desc": return right.amountMinor - left.amountMinor || newest();
          case "amount-asc": return left.amountMinor - right.amountMinor || newest();
          case "category-asc": return collator.compare(categoryLabel(left.transaction), categoryLabel(right.transaction)) || newest();
          case "category-desc": return collator.compare(categoryLabel(right.transaction), categoryLabel(left.transaction)) || newest();
          case "wallet-asc": return collator.compare(walletLabel(left.transaction), walletLabel(right.transaction)) || newest();
          case "wallet-desc": return collator.compare(walletLabel(right.transaction), walletLabel(left.transaction)) || newest();
        }
      });
      return { convertedTransactions, displayTransactions };
    }
  );
}
