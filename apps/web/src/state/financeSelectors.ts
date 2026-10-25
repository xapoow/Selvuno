import { createSelector } from "@reduxjs/toolkit";
import { entityAdapters } from "./financeSlice";
import type { RootState } from "./rootReducer";
import { getIncludedWalletIds } from "../lib/walletFeatures";
import { calculateCombinedWalletBalance } from "../lib/walletBalances";

const selectFinance = (state: RootState) => state.finance;
export const selectSettings = createSelector(
  [(state: RootState) => state.finance.settings, (state: RootState) => state.finance.optimisticSettings],
  (settings, pending) => settings
    ? Object.assign({}, settings, ...Object.values(pending))
    : null
);
const walletSelectors = entityAdapters.wallets.getSelectors((state: RootState) => state.finance.wallets);
export const selectWallets = createSelector(walletSelectors.selectAll, (wallets) => wallets.filter((wallet) => !wallet.deletedAt && !wallet.archivedAt));
export const selectArchivedWallets = createSelector(walletSelectors.selectAll, (wallets) => wallets.filter((wallet) => !wallet.deletedAt && Boolean(wallet.archivedAt)));
export const selectCategories = entityAdapters.categories.getSelectors((state: RootState) => state.finance.categories).selectAll;
export const selectTransactions = entityAdapters.transactions.getSelectors((state: RootState) => state.finance.transactions).selectAll;
export const selectTransactionTemplates = entityAdapters.transactionTemplates.getSelectors((state: RootState) => state.finance.transactionTemplates).selectAll;
export const selectBudgets = entityAdapters.budgets.getSelectors((state: RootState) => state.finance.budgets).selectAll;
export const selectRecurringTransactions = entityAdapters.recurringTransactions.getSelectors((state: RootState) => state.finance.recurringTransactions).selectAll;
export const selectSavingsGoals = entityAdapters.savingsGoals.getSelectors((state: RootState) => state.finance.savingsGoals).selectAll;
export const selectSavingsGoalContributions = entityAdapters.savingsGoalContributions.getSelectors((state: RootState) => state.finance.savingsGoalContributions).selectAll;
export const selectWalletTransfers = entityAdapters.walletTransfers.getSelectors((state: RootState) => state.finance.walletTransfers).selectAll;
export const selectBackupSnapshots = entityAdapters.backupSnapshots.getSelectors((state: RootState) => state.finance.backupSnapshots).selectAll;

export const selectCombinedWalletBalance = createSelector(
  [selectWallets, selectTransactions, selectWalletTransfers, selectSettings, (state: RootState) => state.exchangeRates.byBase],
  (wallets, transactions, transfers, settings, rates) => calculateCombinedWalletBalance(
    wallets, transactions, transfers, getIncludedWalletIds(wallets, settings?.advancedWalletsEnabled ?? false),
    settings?.currency ?? "USD", rates[settings?.currency ?? "USD"]?.data
  )
);

export const selectWalletContext = createSelector(
  [selectSettings, selectWallets, selectTransactions, selectWalletTransfers],
  (settings, wallets, transactions, transfers) => {
    const selectedId = settings?.activeWalletId ?? "all";
    const activeWallet = wallets.find((wallet) => wallet.id === selectedId);
    const activeWalletId = activeWallet?.id ?? "all";
    const displayCurrency = activeWallet?.currency ?? settings?.currency ?? "USD";
    const includedIds = getIncludedWalletIds(wallets, settings?.advancedWalletsEnabled ?? false);
    const includes = (walletId: string) => activeWalletId === "all" ? includedIds.has(walletId) : walletId === activeWalletId;
    const conversionNeeded = transactions.some((item) => !item.deletedAt && includes(item.walletId) && item.currency.toUpperCase() !== displayCurrency) ||
      wallets.some((wallet) => !wallet.deletedAt && includes(wallet.id) && wallet.initialBalanceMinor !== 0 && wallet.currency.toUpperCase() !== displayCurrency) ||
      transfers.some((item) => !item.deletedAt && (
        (includes(item.fromWalletId) && item.fromCurrency.toUpperCase() !== displayCurrency) ||
        (includes(item.toWalletId) && item.toCurrency.toUpperCase() !== displayCurrency)
      ));
    return { activeWalletId, activeWallet, displayCurrency, conversionNeeded };
  }
);

export const selectFinanceData = createSelector(
  [selectSettings, selectWallets, selectArchivedWallets, selectCategories, selectTransactions,
    selectTransactionTemplates, selectBudgets, selectRecurringTransactions, selectSavingsGoals,
    selectSavingsGoalContributions, selectWalletTransfers, selectBackupSnapshots, selectFinance],
  (settings, wallets, archivedWallets, categories, transactions, transactionTemplates, budgets,
    recurringTransactions, savingsGoals, savingsGoalContributions, walletTransfers, backupSnapshots, finance) => ({
    settings, wallets, archivedWallets, categories, transactions, transactionTemplates, budgets,
    recurringTransactions, savingsGoals, savingsGoalContributions, walletTransfers, backupSnapshots,
    isLoading: !settings && (finance.status === "idle" || finance.status === "loading"),
    isRefreshing: finance.status === "loading",
    error: finance.loadError,
    refreshError: finance.refreshError
  })
);
