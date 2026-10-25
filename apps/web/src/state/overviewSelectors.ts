import { createSelector } from "@reduxjs/toolkit";
import type { WalletView } from "@myfinances/types";
import { convertMinorToBaseCurrency } from "../lib/exchangeRateClient";
import { filterTransactionsForTotals, getIncludedWalletIds } from "../lib/walletFeatures";
import { buildSmartInsights } from "../lib/insights";
import { calculateCombinedWalletBalance } from "../lib/walletBalances";
import { calculateMonthlyBudgetProgress, getBudgetMonth } from "../lib/budgets";
import { getCategoryName, getDictionary } from "../i18n";
import {
  selectBudgets, selectCategories, selectSettings, selectTransactions, selectWallets, selectWalletTransfers
} from "./financeSelectors";
import type { RootState } from "./rootReducer";

export function makeSelectWalletOverview() {
  return createSelector(
    [selectWallets, selectTransactions, selectWalletTransfers, selectSettings, selectCategories, selectBudgets,
      (state: RootState) => state.exchangeRates.byBase,
      (_state: RootState, walletId: WalletView) => walletId,
      (_state: RootState, _walletId: WalletView, today: string) => today],
    (wallets, transactions, transfers, settings, categories, budgets, rates, walletId, today) => {
      const activeWallet = wallets.find((wallet) => wallet.id === walletId);
      const currency = activeWallet?.currency ?? settings?.currency ?? "USD";
      const exchangeRates = rates[currency]?.data;
      const includedIds = getIncludedWalletIds(wallets, settings?.advancedWalletsEnabled ?? false);
      const statisticsTransactions = filterTransactionsForTotals(transactions, includedIds);
      const visibleWallets = wallets.filter((wallet) => walletId === "all" ? includedIds.has(wallet.id) : wallet.id === walletId);
      const visibleIds = new Set(visibleWallets.map((wallet) => wallet.id));
      const displayTransactions = transactions
        .filter((item) => !item.deletedAt && visibleIds.has(item.walletId))
        .map((transaction) => {
          const converted = convertMinorToBaseCurrency(transaction.amountMinor, transaction.currency, currency, exchangeRates);
          return {
            transaction, amountMinor: converted ?? transaction.amountMinor,
            currency: converted === null ? transaction.currency : currency, conversionMissing: converted === null
          };
        });
      const { balanceMinor, conversionMissing: missingBalanceConversion } = calculateCombinedWalletBalance(
        visibleWallets, transactions, transfers, visibleIds, currency, exchangeRates
      );
      const totals = displayTransactions.reduce((sum, item) => {
        if (!item.conversionMissing) {
          if (item.transaction.type === "income") sum.incomeMinor += item.amountMinor;
          else sum.expenseMinor += item.amountMinor;
        }
        return sum;
      }, { balanceMinor, incomeMinor: 0, expenseMinor: 0 });
      const t = getDictionary(settings?.locale ?? "en-US");
      const categoryTotals = (type: "expense" | "income") => {
        const amounts = new Map<string, number>();
        for (const item of displayTransactions) {
          if (!item.conversionMissing && item.transaction.type === type) {
            amounts.set(item.transaction.categoryId, (amounts.get(item.transaction.categoryId) ?? 0) + item.amountMinor);
          }
        }
        return categories.filter((category) => !category.deletedAt && category.type === type)
          .map((category) => ({ id: category.id, name: getCategoryName(category.name, t), color: category.color, value: amounts.get(category.id) ?? 0 }))
          .filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
      };
      const smartInsights = settings?.smartInsightsEnabled ? buildSmartInsights({
        transactions: displayTransactions.filter((item) => !item.conversionMissing)
          .map((item) => ({ ...item.transaction, amountMinor: item.amountMinor })),
        now: new Date(today), timeZone: settings.timeZone
      }) : [];
      const currentBudgetMonth = getBudgetMonth(new Date(today), settings?.timeZone ?? "UTC");
      const budgetConversionNeeded = statisticsTransactions.some((item) => item.type === "expense" && item.currency !== settings?.currency) ||
        budgets.some((budget) => budget.currency !== settings?.currency);
      const budgetProgress = calculateMonthlyBudgetProgress({
        month: currentBudgetMonth, timeZone: settings?.timeZone ?? "UTC", currency: settings?.currency ?? "USD",
        categories, budgets, transactions: statisticsTransactions, exchangeRates: rates[settings?.currency ?? "USD"]?.data
      });
      return {
        displayTransactions, recentTransactions: displayTransactions.slice(0, 4), totals,
        statisticsTransactions, budgetConversionNeeded, currentBudgetMonth, budgetProgress, smartInsights,
        expenseCategories: categoryTotals("expense"), incomeCategories: categoryTotals("income"),
        hasMissingRates: missingBalanceConversion || displayTransactions.some((item) => item.conversionMissing),
        hasCurrencyConversion: visibleWallets.some((wallet) => wallet.currency !== currency) ||
          displayTransactions.some((item) => item.transaction.currency !== currency)
      };
    }
  );
}
