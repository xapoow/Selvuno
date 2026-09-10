import type { Settings, Transaction, Wallet } from "@myfinances/types";

export function getIncludedWalletIds(
  wallets: Wallet[],
  advancedWalletsEnabled: boolean
): Set<string> {
  return new Set(
    wallets
      .filter((wallet) => !advancedWalletsEnabled || !wallet.excludeFromTotals)
      .map((wallet) => wallet.id)
  );
}

export function filterTransactionsForTotals(
  transactions: Transaction[],
  includedWalletIds: ReadonlySet<string>
): Transaction[] {
  return transactions.filter((transaction) => includedWalletIds.has(transaction.walletId));
}

export function shouldHideWalletAmounts(settings: Settings, wallet?: Wallet): boolean {
  return settings.hideAmounts ||
    Boolean(settings.advancedWalletsEnabled && wallet?.hideBalance);
}
