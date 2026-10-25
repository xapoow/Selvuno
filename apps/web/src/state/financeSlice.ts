import { createEntityAdapter, createSlice, type UnknownAction } from "@reduxjs/toolkit";
import type {
  BackupSnapshot, Category, MonthlyBudget, RecurringTransaction, SavingsGoal,
  SavingsGoalContribution, Settings, SettingsUpdate, Transaction, TransactionTemplate,
  Wallet, WalletTransfer
} from "@myfinances/types";
import { financeResources, type FinanceSnapshot, type FinanceResource } from "../data/financeGateway";
import type { DataFailure } from "../data/dataError";
import { compareTransactionsNewestFirst } from "../lib/transactions";
import { financeCommands, loadFinance } from "./financeActions";
import { financePatchReceived, financeRefreshFailed } from "./financeEvents";

export const entityAdapters = {
  wallets: createEntityAdapter<Wallet>({ sortComparer: (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt) }),
  categories: createEntityAdapter<Category>({ sortComparer: (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) }),
  transactions: createEntityAdapter<Transaction>({ sortComparer: compareTransactionsNewestFirst }),
  transactionTemplates: createEntityAdapter<TransactionTemplate>(),
  budgets: createEntityAdapter<MonthlyBudget>(),
  recurringTransactions: createEntityAdapter<RecurringTransaction>(),
  savingsGoals: createEntityAdapter<SavingsGoal>(),
  savingsGoalContributions: createEntityAdapter<SavingsGoalContribution>(),
  walletTransfers: createEntityAdapter<WalletTransfer>(),
  backupSnapshots: createEntityAdapter<BackupSnapshot>({ sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt) })
};

export interface CommandStatus {
  pendingRequestIds: string[];
  error: DataFailure | null;
  latestRequestId?: string;
}

const initialState = {
  settings: null as Settings | null,
  wallets: entityAdapters.wallets.getInitialState(),
  categories: entityAdapters.categories.getInitialState(),
  transactions: entityAdapters.transactions.getInitialState(),
  transactionTemplates: entityAdapters.transactionTemplates.getInitialState(),
  budgets: entityAdapters.budgets.getInitialState(),
  recurringTransactions: entityAdapters.recurringTransactions.getInitialState(),
  savingsGoals: entityAdapters.savingsGoals.getInitialState(),
  savingsGoalContributions: entityAdapters.savingsGoalContributions.getInitialState(),
  walletTransfers: entityAdapters.walletTransfers.getInitialState(),
  backupSnapshots: entityAdapters.backupSnapshots.getInitialState(),
  status: "idle" as "idle" | "loading" | "ready" | "failed",
  loadError: null as DataFailure | null,
  refreshError: null as DataFailure | null,
  staleResources: [] as FinanceResource[],
  commands: {} as Record<string, CommandStatus>,
  optimisticSettings: {} as Record<string, SettingsUpdate>
};

export type FinanceState = typeof initialState;

function applyPatch(state: FinanceState, patch: Partial<FinanceSnapshot>) {
  if (patch.settings) state.settings = patch.settings;
  // Explicit calls keep entity types checked, without hiding casts in a generic reducer.
  if (patch.wallets) entityAdapters.wallets.setAll(state.wallets, patch.wallets);
  if (patch.categories) entityAdapters.categories.setAll(state.categories, patch.categories);
  if (patch.transactions) entityAdapters.transactions.setAll(state.transactions, patch.transactions);
  if (patch.transactionTemplates) entityAdapters.transactionTemplates.setAll(state.transactionTemplates, patch.transactionTemplates);
  if (patch.budgets) entityAdapters.budgets.setAll(state.budgets, patch.budgets);
  if (patch.recurringTransactions) entityAdapters.recurringTransactions.setAll(state.recurringTransactions, patch.recurringTransactions);
  if (patch.savingsGoals) entityAdapters.savingsGoals.setAll(state.savingsGoals, patch.savingsGoals);
  if (patch.savingsGoalContributions) entityAdapters.savingsGoalContributions.setAll(state.savingsGoalContributions, patch.savingsGoalContributions);
  if (patch.walletTransfers) entityAdapters.walletTransfers.setAll(state.walletTransfers, patch.walletTransfers);
  if (patch.backupSnapshots) entityAdapters.backupSnapshots.setAll(state.backupSnapshots, patch.backupSnapshots);
  state.staleResources = state.staleResources.filter((resource) => patch[resource] === undefined);
  if (!state.staleResources.length) state.refreshError = null;
}

interface CommandLifecycleAction extends UnknownAction {
  meta: { requestId: string; requestStatus: "pending" | "fulfilled" | "rejected" };
  payload?: DataFailure;
  error?: { message?: string };
}

function isCommandLifecycle(action: UnknownAction): action is CommandLifecycleAction {
  return action.type.startsWith("finance/commands/") &&
    /\/(pending|fulfilled|rejected)$/.test(action.type);
}

const slice = createSlice({
  name: "finance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFinance.pending, (state) => { state.status = "loading"; state.loadError = null; })
      .addCase(loadFinance.fulfilled, (state, action) => {
        applyPatch(state, action.payload);
        state.status = "ready";
      })
      .addCase(loadFinance.rejected, (state, action) => {
        const error = action.payload ?? { code: "load_error", message: action.error.message ?? "Unable to load data.", retryable: true };
        if (state.settings) {
          state.status = "ready";
          state.refreshError = error;
          state.staleResources = [...financeResources];
        } else {
          state.status = "failed";
          state.loadError = error;
        }
      })
      .addCase(financePatchReceived, (state, action) => { applyPatch(state, action.payload); })
      .addCase(financeRefreshFailed, (state, action) => {
        state.refreshError = action.payload.failure;
        state.staleResources = [...new Set([...state.staleResources, ...action.payload.resources])];
      })
      .addCase(financeCommands.updateSettings.pending, (state, action) => {
        state.optimisticSettings[action.meta.requestId] = action.meta.arg;
      })
      .addCase(financeCommands.updateSettings.fulfilled, (state, action) => {
        delete state.optimisticSettings[action.meta.requestId];
      })
      .addCase(financeCommands.updateSettings.rejected, (state, action) => {
        delete state.optimisticSettings[action.meta.requestId];
      })
      .addMatcher(isCommandLifecycle, (state, action) => {
        const command = action.type.split("/")[2];
        const status: CommandStatus = state.commands[command] ?? { pendingRequestIds: [], error: null };
        if (action.meta.requestStatus === "pending") {
          status.pendingRequestIds.push(action.meta.requestId);
          status.latestRequestId = action.meta.requestId;
          status.error = null;
        } else {
          status.pendingRequestIds = status.pendingRequestIds.filter((id) => id !== action.meta.requestId);
          if (action.meta.requestStatus === "rejected" && status.latestRequestId === action.meta.requestId) {
            status.error = action.payload ?? { code: "command_error", message: action.error?.message ?? "Unable to save data.", retryable: false };
          } else if (action.meta.requestStatus === "fulfilled" && status.latestRequestId === action.meta.requestId) {
            status.error = null;
          }
        }
        state.commands[command] = status;
      });
  }
});

export const financeReducer = slice.reducer;
