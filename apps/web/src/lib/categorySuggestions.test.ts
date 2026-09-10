import { describe, expect, it } from "vitest";
import type { Transaction } from "@myfinances/types";
import { suggestCategoryId } from "./categorySuggestions";

const base: Transaction = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: null,
  walletId: "22222222-2222-4222-8222-222222222222",
  categoryId: "33333333-3333-4333-8333-333333333333",
  amountMinor: 550,
  currency: "USD",
  type: "expense",
  note: "Morning coffee",
  tags: ["cafe"],
  transactionDate: "2026-09-01T08:00:00.000Z",
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  deletedAt: null,
  syncStatus: "local"
};

describe("category suggestions", () => {
  it("learns from matching notes and tags", () => {
    expect(suggestCategoryId("coffee", "expense", [base])).toBe(base.categoryId);
    expect(suggestCategoryId("cafe", "expense", [base])).toBe(base.categoryId);
  });

  it("does not mix transaction types or use deleted history", () => {
    expect(suggestCategoryId("coffee", "income", [base])).toBeNull();
    expect(suggestCategoryId("coffee", "expense", [{ ...base, deletedAt: base.updatedAt }])).toBeNull();
  });

  it("requires a meaningful text match", () => {
    expect(suggestCategoryId("taxi", "expense", [base])).toBeNull();
    expect(suggestCategoryId(" ", "expense", [base])).toBeNull();
  });
});
