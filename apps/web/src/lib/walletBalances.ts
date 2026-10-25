import type { Transaction, Wallet, WalletTransfer } from "@myfinances/types";
import { calculateWalletTotals } from "@myfinances/utils";
import { convertMinorToBaseCurrency, type ExchangeRateTable } from "./exchangeRateClient";

export function calculateCombinedWalletBalance(
  wallets: Wallet[],
  transactions: Transaction[],
  transfers: WalletTransfer[],
  includedWalletIds: Set<string>,
  baseCurrency: string,
  exchangeRates?: ExchangeRateTable
): { balanceMinor: number; conversionMissing: boolean } {
  return wallets
    .filter((wallet) => !wallet.deletedAt && includedWalletIds.has(wallet.id))
    .reduce<{ balanceMinor: number; conversionMissing: boolean }>(
      (result, wallet) => {
        const totals = calculateWalletTotals(wallet, transactions, transfers);
        const converted = convertMinorToBaseCurrency(
          totals.balanceMinor,
          wallet.currency,
          baseCurrency,
          exchangeRates
        );
        if (converted === null) {
          result.conversionMissing = true;
        } else {
          result.balanceMinor += converted;
        }
        return result;
      },
      { balanceMinor: 0, conversionMissing: false }
    );
}
