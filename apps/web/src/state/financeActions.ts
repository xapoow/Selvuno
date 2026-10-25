import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Settings } from "@myfinances/types";
import {
  commandResources, financeResources, financeSnapshotSchema,
  type FinanceCommand, type FinanceCommandInputs, type FinanceCommandResults,
  type FinanceSnapshot
} from "../data/financeGateway";
import { toDataFailure, type DataFailure } from "../data/dataError";
import { financePatchReceived, financeRefreshFailed } from "./financeEvents";
import type { AppServices } from "./services";
import type { RootState } from "./rootReducer";

export interface FinanceThunkConfig {
  state: RootState;
  extra: AppServices;
  rejectValue: DataFailure;
}

export const loadFinance = createAsyncThunk<FinanceSnapshot, { force?: boolean } | undefined, FinanceThunkConfig>(
  "finance/load",
  async (_options, api) => {
    try {
      return await api.extra.runExclusive(async () => {
        api.signal.throwIfAborted();
        await api.extra.finance.initialize({ signal: api.signal });
        return financeSnapshotSchema.parse(await api.extra.finance.read(financeResources, { signal: api.signal }));
      });
    } catch (error) {
      return api.rejectWithValue(toDataFailure(error));
    }
  },
  {
    condition: (options, api) => {
      const { status } = api.getState().finance;
      return status !== "loading" && (options?.force || status !== "ready");
    }
  }
);

function createCommand<K extends FinanceCommand>(command: K) {
  return createAsyncThunk<FinanceCommandResults[K], FinanceCommandInputs[K], FinanceThunkConfig>(
    `finance/commands/${command}`,
    async (input, api) => {
      try {
        return await api.extra.runExclusive(async () => {
          api.signal.throwIfAborted();
          const result = await api.extra.finance.execute(command, input, {
            signal: api.signal,
            requestId: api.requestId
          });
          if (command === "updateSettings") {
            api.dispatch(financePatchReceived({ settings: result as Settings }));
          }
          const resources = commandResources[command];
          if (resources.length) {
            try {
              const patch = await api.extra.finance.read(resources, { signal: api.signal });
              api.dispatch(financePatchReceived(patch));
            } catch (error) {
              // The write already succeeded. Do not tell the caller to retry it and
              // risk creating a second transaction. Expose a separate refresh error.
              api.dispatch(financeRefreshFailed({ failure: toDataFailure(error), resources }));
            }
          }
          return result;
        });
      } catch (error) {
        return api.rejectWithValue(toDataFailure(error));
      }
    }
  );
}

export const financeCommands = {
  addTransaction: createCommand("addTransaction"),
  addTransactionWithAttachments: createCommand("addTransactionWithAttachments"),
  updateTransaction: createCommand("updateTransaction"),
  updateTransactionWithAttachments: createCommand("updateTransactionWithAttachments"),
  deleteTransaction: createCommand("deleteTransaction"),
  createTransactionTemplate: createCommand("createTransactionTemplate"),
  deleteTransactionTemplate: createCommand("deleteTransactionTemplate"),
  createWallet: createCommand("createWallet"),
  updateWallet: createCommand("updateWallet"),
  archiveWallet: createCommand("archiveWallet"),
  restoreWallet: createCommand("restoreWallet"),
  reorderWallets: createCommand("reorderWallets"),
  createWalletTransfer: createCommand("createWalletTransfer"),
  deleteWalletTransfer: createCommand("deleteWalletTransfer"),
  createCategory: createCommand("createCategory"),
  updateCategory: createCommand("updateCategory"),
  deleteCategory: createCommand("deleteCategory"),
  reorderCategories: createCommand("reorderCategories"),
  replaceCategory: createCommand("replaceCategory"),
  setBudget: createCommand("setBudget"),
  createRecurringTransaction: createCommand("createRecurringTransaction"),
  updateRecurringTransaction: createCommand("updateRecurringTransaction"),
  setRecurringTransactionPaused: createCommand("setRecurringTransactionPaused"),
  deleteRecurringTransaction: createCommand("deleteRecurringTransaction"),
  createSavingsGoal: createCommand("createSavingsGoal"),
  updateSavingsGoal: createCommand("updateSavingsGoal"),
  deleteSavingsGoal: createCommand("deleteSavingsGoal"),
  addSavingsGoalContribution: createCommand("addSavingsGoalContribution"),
  deleteSavingsGoalContribution: createCommand("deleteSavingsGoalContribution"),
  updateSettings: createCommand("updateSettings"),
  exportBackup: createCommand("exportBackup"),
  importBackup: createCommand("importBackup"),
  createBackupSnapshot: createCommand("createBackupSnapshot"),
  restoreBackupSnapshot: createCommand("restoreBackupSnapshot"),
  deleteBackupSnapshot: createCommand("deleteBackupSnapshot")
};
