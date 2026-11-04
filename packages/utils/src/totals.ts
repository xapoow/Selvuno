import type { Transaction, Wallet, WalletTransfer, WalletView } from "@myfinances/types";

export interface TransactionTotals {
  incomeMinor: number;
  expenseMinor: number;
  balanceMinor: number;
}

export interface WalletTotals extends TransactionTotals {
  initialBalanceMinor: number;
  transferInMinor: number;
  transferOutMinor: number;
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

export function calculateWalletTotals(
  wallet: Wallet,
  transactions: Transaction[],
  transfers: WalletTransfer[]
): WalletTotals {
  const transactionTotals = calculateTransactionTotals(transactions, wallet.id);
  const transferTotals = transfers
    .filter((transfer) => !transfer.deletedAt)
    .reduce(
      (totals, transfer) => {
        if (transfer.fromWalletId === wallet.id) {
          totals.transferOutMinor += transfer.fromAmountMinor;
        }
        if (transfer.toWalletId === wallet.id) {
          totals.transferInMinor += transfer.toAmountMinor;
        }
        return totals;
      },
      { transferInMinor: 0, transferOutMinor: 0 }
    );
  const initialBalanceMinor = wallet.initialBalanceMinor ?? 0;

  return {
    ...transactionTotals,
    ...transferTotals,
    initialBalanceMinor,
    balanceMinor:
      initialBalanceMinor +
      calculateWalletAdjustmentTotal(wallet) +
      transactionTotals.balanceMinor +
      transferTotals.transferInMinor -
      transferTotals.transferOutMinor
  };
}

export function calculateWalletAdjustmentTotal(wallet: Wallet): number {
  return (wallet.balanceReconciliations ?? []).reduce((total, item) => total + item.adjustmentMinor, 0);
}
