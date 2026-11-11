import type { Transaction } from "@selvuno/types";

function timestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function compareTransactionsNewestFirst(left: Transaction, right: Transaction): number {
  return (
    timestamp(right.transactionDate) - timestamp(left.transactionDate) ||
    timestamp(right.createdAt) - timestamp(left.createdAt) ||
    right.id.localeCompare(left.id)
  );
}

export function compareTransactionsOldestFirst(left: Transaction, right: Transaction): number {
  return -compareTransactionsNewestFirst(left, right);
}
