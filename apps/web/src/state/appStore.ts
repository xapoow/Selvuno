import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { FinanceGateway } from "../data/financeGateway";
import { exchangeRateClient } from "../lib/exchangeRateClient";
import { financeCommands, loadFinance } from "./financeActions";
import { rootReducer, type RootState } from "./rootReducer";
import { createOperationQueue, type AppServices, type ExchangeRateClient } from "./services";
export type { AppView } from "./uiSlice";

export interface AppStoreOptions {
  finance: FinanceGateway;
  exchangeRates?: ExchangeRateClient;
  automaticBackups?: boolean;
  backupDelayMs?: number;
}

export function createAppStore(options: AppStoreOptions) {
  const services: AppServices = {
    finance: options.finance,
    exchangeRates: options.exchangeRates ?? exchangeRateClient,
    runExclusive: createOperationQueue()
  };
  const listener = createListenerMiddleware<RootState>();
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      thunk: { extraArgument: services }
    }).prepend(listener.middleware),
    devTools: import.meta.env.DEV ? {
      // Uploads are transient thunk arguments, never entity state.
      actionSanitizer: (action) => {
        if (!action.type.startsWith("finance/commands/")) return action;
        const { meta } = action as typeof action & { meta?: Record<string, unknown> };
        return { ...action, payload: "[command result]", meta: meta ? { ...meta, arg: "[command input]" } : undefined };
      }
    } : false
  });

  if (options.automaticBackups !== false) {
    const mutationCompleted = isAnyOf(
      ...Object.entries(financeCommands)
        .filter(([name]) => !["exportBackup", "createBackupSnapshot", "deleteBackupSnapshot"].includes(name))
        .map(([, command]) => command.fulfilled),
      loadFinance.fulfilled
    );
    listener.startListening({
      matcher: mutationCompleted,
      effect: async (_action, api) => {
        api.cancelActiveListeners();
        if (!api.getState().finance.settings?.onboardingCompleted) return;
        await api.delay(options.backupDelayMs ?? 2200);
        await store.dispatch(financeCommands.createBackupSnapshot()).unwrap().catch(() => undefined);
      }
    });
  }
  return Object.assign(store, { services, dispose: () => listener.clearListeners() });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore["dispatch"];
