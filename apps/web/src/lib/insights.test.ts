import { describe, expect, it } from "vitest";
import { buildSmartInsights, type InsightTransaction } from "./insights";

const transaction = (
  type: "expense" | "income",
  amountMinor: number,
  categoryId: string,
  transactionDate: string,
  recurringTransactionId?: string
): InsightTransaction => ({
  type,
  amountMinor,
  categoryId,
  transactionDate,
  recurringTransactionId
});

describe("smart insights", () => {
  it("compares the current month with the same elapsed part of the previous month", () => {
    const insights = buildSmartInsights({
      now: new Date("2026-09-11T12:00:00.000Z"),
      timeZone: "UTC",
      transactions: [
        transaction("expense", 12000, "food", "2026-09-05T12:00:00.000Z"),
        transaction("expense", 6000, "food", "2026-08-05T12:00:00.000Z")
      ]
    });

    expect(insights).toContainEqual({ kind: "spending-up", percentage: 100 });
    expect(insights).toContainEqual({ kind: "largest-category", categoryId: "food", share: 100 });
  });

  it("reports recurring share and recent expense activity", () => {
    const insights = buildSmartInsights({
      now: new Date("2026-09-11T12:00:00.000Z"),
      timeZone: "UTC",
      transactions: [
        transaction("income", 100000, "salary", "2026-09-01T12:00:00.000Z"),
        transaction("expense", 10000, "subscriptions", "2026-09-06T12:00:00.000Z", "recurring"),
        transaction("expense", 1000, "food", "2026-09-08T12:00:00.000Z"),
        transaction("expense", 1000, "food", "2026-09-10T12:00:00.000Z")
      ]
    });

    expect(insights).toContainEqual({ kind: "recurring-share", share: 10 });
    expect(insights).toContainEqual({ kind: "expense-count", count: 3 });
  });

  it("recognizes a no-spend streak", () => {
    const insights = buildSmartInsights({
      now: new Date("2026-09-11T12:00:00.000Z"),
      timeZone: "UTC",
      transactions: [transaction("expense", 1000, "food", "2026-09-08T12:00:00.000Z")]
    });

    expect(insights).toContainEqual({ kind: "no-spend-streak", days: 3 });
  });
});
