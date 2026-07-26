import { describe, expect, it } from "vitest";
import type { Transaction, Wallet, WalletTransfer } from "@myfinances/types";
import { calculateTransactionTotals, calculateWalletTotals } from "./totals";

const base = {
  userId: null,
  createdAt: "2026-05-31T00:00:00.000Z",
  updatedAt: "2026-05-31T00:00:00.000Z",
  deletedAt: null,
  syncStatus: "local" as const,
  categoryId: "11111111-1111-4111-8111-111111111111",
  currency: "USD",
  note: "",
  tags: [],
  transactionDate: "2026-05-31T00:00:00.000Z"
};

const transactions: Transaction[] = [
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000001",
    walletId: "22222222-2222-4222-8222-222222222222",
    type: "income",
    amountMinor: 10000
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000002",
    walletId: "22222222-2222-4222-8222-222222222222",
    type: "expense",
    amountMinor: 3000
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000003",
    walletId: "33333333-3333-4333-8333-333333333333",
    type: "expense",
    amountMinor: 1500
  }
];

describe("transaction totals", () => {
  it("calculates totals for all wallets", () => {
    expect(calculateTransactionTotals(transactions, "all")).toEqual({
      incomeMinor: 10000,
      expenseMinor: 4500,
      balanceMinor: 5500
    });
  });

  it("calculates totals for a selected wallet", () => {
    expect(calculateTransactionTotals(transactions, "22222222-2222-4222-8222-222222222222")).toEqual({
      incomeMinor: 10000,
      expenseMinor: 3000,
      balanceMinor: 7000
    });
  });

  it("adds initial balance and transfers without changing income or expenses", () => {
    const wallet: Wallet = {
      ...base,
      id: "22222222-2222-4222-8222-222222222222",
      name: "Main",
      initialBalanceMinor: 2500,
      archivedAt: null
    };
    const transfers: WalletTransfer[] = [
      {
        ...base,
        id: "00000000-0000-4000-8000-000000000004",
        fromWalletId: wallet.id,
        toWalletId: "33333333-3333-4333-8333-333333333333",
        fromAmountMinor: 1000,
        toAmountMinor: 1000,
        fromCurrency: "USD",
        toCurrency: "USD",
        transferDate: base.transactionDate
      },
      {
        ...base,
        id: "00000000-0000-4000-8000-000000000005",
        fromWalletId: "33333333-3333-4333-8333-333333333333",
        toWalletId: wallet.id,
        fromAmountMinor: 700,
        toAmountMinor: 700,
        fromCurrency: "USD",
        toCurrency: "USD",
        transferDate: base.transactionDate
      }
    ];

    expect(calculateWalletTotals(wallet, transactions, transfers)).toEqual({
      incomeMinor: 10000,
      expenseMinor: 3000,
      initialBalanceMinor: 2500,
      transferInMinor: 700,
      transferOutMinor: 1000,
      balanceMinor: 9200
    });
  });
});
