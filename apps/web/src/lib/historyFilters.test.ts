import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@selvuno/types";
import { getDictionary } from "../i18n";
import { testCategory, testTransaction, testWallet } from "../test/fixtures";
import { defaultHistoryFilters, equalHistoryFilters, filterHistoryTransactions, HISTORY_FILTER_STORAGE_KEY, persistSavedHistoryFilters, readHistoryAmountRange, readSavedHistoryFilters, type HistoryFilters } from "./historyFilters";

const secondCategory = { ...testCategory, id: "20000000-0000-4000-8000-000000000002", name: "Transport" };
const secondWallet = { ...testWallet, id: "10000000-0000-4000-8000-000000000002", currency: "PLN" };
const first = { ...testTransaction, note: "Office lunch", tags: ["work"], attachmentCount: 1 };
const second = { ...testTransaction, id: "30000000-0000-4000-8000-000000000002", categoryId: secondCategory.id, walletId: secondWallet.id, currency: "PLN", amountMinor: 5000, attachmentCount: 0 };
function filter(filters: Partial<HistoryFilters> = {}, transactions: Transaction[] = [first, second], rates = { base: "USD", date: "2026-11-04", cachedAt: "2026-11-04T12:00:00Z", rates: { PLN: 4 } }) {
  return filterHistoryTransactions({ transactions, filters: { ...defaultHistoryFilters("USD"), ...filters }, activeWalletId: "all", categories: [testCategory, secondCategory], wallets: [testWallet, secondWallet], locale: "ru-RU", t: getDictionary("ru-RU"), rates });
}

beforeEach(() => localStorage.clear());

describe("history filter matching", () => {
  it("combines multiple categories with inclusive converted amount bounds", () => {
    const result = filter({ categoryIds: [testCategory.id, secondCategory.id], minimum: "12.50", maximum: "12,50" });
    expect(result.transactions.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(filter({ minimum: "13" }).transactions).toHaveLength(0);
  });

  it("combines localized search, tags, type and attachment presence without including deleted records", () => {
    expect(filter({ query: "#work продукты", type: "expense", attachments: "with" }).transactions).toEqual([first]);
    expect(filter({ attachments: "without" }).transactions).toEqual([second]);
    expect(filter({}, [first, { ...second, deletedAt: "2026-11-04T12:00:00Z" }]).transactions).toEqual([first]);
    expect(filter({ type: "income" }).transactions).toHaveLength(0);
  });

  it("does not compare raw amounts from different currencies when a rate is missing", () => {
    const result = filterHistoryTransactions({ transactions: [first, second], filters: { ...defaultHistoryFilters("USD"), minimum: "10", maximum: "20" },
      activeWalletId: "all", categories: [testCategory, secondCategory], wallets: [testWallet, secondWallet], locale: "en-US", t: getDictionary("en-US") });
    expect(result.transactions).toEqual([first]);
    expect(result.missingRates).toBe(1);
  });

  it("keeps the selected wallet scope and preserves unavailable category selections", () => {
    const result = filterHistoryTransactions({ transactions: [first, second], filters: defaultHistoryFilters("USD"), activeWalletId: testWallet.id,
      categories: [testCategory, secondCategory], wallets: [testWallet, secondWallet], locale: "en-US", t: getDictionary("en-US") });
    expect(result.transactions).toEqual([first]);
    expect(filter({ categoryIds: ["20000000-0000-4000-8000-000000000099"] }).transactions).toHaveLength(0);
  });

  it("validates non-negative ranges with currency-specific precision", () => {
    for (const changes of [{ minimum: "-1" }, { minimum: "20", maximum: "10" }, { minimum: "1.234" }, { maximum: "five" }, { currency: "JPY", minimum: "1.5" }]) {
      expect(readHistoryAmountRange({ ...defaultHistoryFilters("USD"), ...changes }).valid).toBe(false);
    }
    expect(readHistoryAmountRange({ ...defaultHistoryFilters("JPY"), minimum: "0", maximum: "20" })).toEqual({ minimum: 0, maximum: 20, valid: true });
  });
});

describe("saved history filters", () => {
  it("persists the amount currency and ignores category ordering when checking equality", () => {
    const filters = { ...defaultHistoryFilters("PLN"), query: "work", minimum: "100", categoryIds: [testCategory.id, secondCategory.id] };
    persistSavedHistoryFilters([{ id: testWallet.id, name: "Work receipts", filters }]);
    expect(readSavedHistoryFilters()[0].filters).toEqual(filters);
    expect(equalHistoryFilters(filters, { ...filters, categoryIds: [...filters.categoryIds].reverse() })).toBe(true);
    expect(equalHistoryFilters(filters, { ...filters, currency: "USD" })).toBe(false);
  });

  it("recovers valid saved entries from corrupted storage without broadening missing categories", () => {
    const valid = { id: testWallet.id, name: "Saved", filters: { ...defaultHistoryFilters("USD"), categoryIds: [testCategory.id] } };
    localStorage.setItem(HISTORY_FILTER_STORAGE_KEY, JSON.stringify([valid, { ...valid, id: secondWallet.id, filters: { ...valid.filters, minimum: "invalid" } }, { name: "Bad" }]));
    expect(readSavedHistoryFilters()).toEqual([valid]);
    localStorage.setItem(HISTORY_FILTER_STORAGE_KEY, "not json");
    expect(readSavedHistoryFilters()).toEqual([]);
  });

  it("reports write failures instead of pretending to save", () => {
    const original = JSON.stringify([{ id: testWallet.id, name: "Original", filters: defaultHistoryFilters("USD") }]);
    localStorage.setItem(HISTORY_FILTER_STORAGE_KEY, original);
    const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    try {
      expect(() => persistSavedHistoryFilters([])).toThrow("Quota exceeded");
      expect(localStorage.getItem(HISTORY_FILTER_STORAGE_KEY)).toBe(original);
    } finally { fail.mockRestore(); }
  });
});
