import type { Transaction, WalletView } from "@myfinances/types";

export interface TransactionTotals {
  incomeMinor: number;
  expenseMinor: number;
  balanceMinor: number;
}

export function filterTransactionsByWallet(
  transactions: Transaction[],
  walletId: WalletView
): Transaction[] {
  return walletId === "all"
    ? transactions
    : transactions.filter((transaction) => transaction.walletId === walletId);
}

export function calculateTransactionTotals(
  transactions: Transaction[],
  walletId: WalletView = "all"
): TransactionTotals {
  return filterTransactionsByWallet(transactions, walletId)
    .filter((transaction) => !transaction.deletedAt)
    .reduce<TransactionTotals>(
      (totals, transaction) => {
        if (transaction.type === "income") {
          totals.incomeMinor += transaction.amountMinor;
          totals.balanceMinor += transaction.amountMinor;
        } else {
          totals.expenseMinor += transaction.amountMinor;
          totals.balanceMinor -= transaction.amountMinor;
        }
        return totals;
      },
      { incomeMinor: 0, expenseMinor: 0, balanceMinor: 0 }
    );
}
