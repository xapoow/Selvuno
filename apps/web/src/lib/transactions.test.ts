import { describe, expect, it } from "vitest";
import type { Transaction } from "@selvuno/types";
import { compareTransactionsNewestFirst, compareTransactionsOldestFirst } from "./transactions";

function transaction(id: string, transactionDate: string, createdAt = transactionDate): Transaction {
  return {
    id,
    userId: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    syncStatus: "local",
    walletId: "10000000-0000-4000-8000-000000000001",
    categoryId: "20000000-0000-4000-8000-000000000001",
    amountMinor: 100,
    currency: "USD",
    type: "expense",
    tags: [],
    transactionDate
  };
}

describe("transaction ordering", () => {
  it("sorts recent operations from newest to oldest", () => {
    const older = transaction("30000000-0000-4000-8000-000000000001", "2026-09-10T09:00:00.000Z");
    const newer = transaction("30000000-0000-4000-8000-000000000002", "2026-09-12T09:00:00.000Z");
    expect([older, newer].sort(compareTransactionsNewestFirst).map((item) => item.id)).toEqual([newer.id, older.id]);
    expect([newer, older].sort(compareTransactionsOldestFirst).map((item) => item.id)).toEqual([older.id, newer.id]);
  });

  it("uses creation time to keep same-date operations deterministic", () => {
    const first = transaction("30000000-0000-4000-8000-000000000001", "2026-09-12T09:00:00.000Z", "2026-09-12T09:01:00.000Z");
    const second = transaction("30000000-0000-4000-8000-000000000002", "2026-09-12T09:00:00.000Z", "2026-09-12T09:02:00.000Z");
    expect([first, second].sort(compareTransactionsNewestFirst).map((item) => item.id)).toEqual([second.id, first.id]);
  });
});
