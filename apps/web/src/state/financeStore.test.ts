import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { createLocalFinanceGateway } from "../data/localFinanceGateway";
import { createAppStore, type AppStore } from "./appStore";
import { financeCommands, loadFinance } from "./financeActions";
import { selectFinanceData, selectSettings, selectTransactions, selectWallets } from "./financeSelectors";
import { makeSelectWalletOverview } from "./overviewSelectors";
import { makeSelectHistory } from "./historySelectors";

describe("finance store", () => {
  let store: AppStore;
  beforeEach(async () => {
    await resetDatabaseForTests();
    store = createAppStore({ finance: createLocalFinanceGateway(), automaticBackups: false });
  });
  afterEach(() => { store.dispose(); vi.restoreAllMocks(); });

  async function bootstrap() {
    await store.dispatch(loadFinance()).unwrap();
    const state = store.getState();
    return { wallet: selectWallets(state)[0], category: selectFinanceData(state).categories.find((category) => category.type === "expense")! };
  }

  it("loads existing IndexedDB data into normalized state and deduplicates initialization", async () => {
    const initialize = vi.spyOn(store.services.finance, "initialize");
    await Promise.all([store.dispatch(loadFinance()), store.dispatch(loadFinance())]);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(store.getState().finance.status).toBe("ready");
    expect(selectWallets(store.getState())[0].id).toBe(store.getState().finance.wallets.ids[0]);
    expect(selectSettings(store.getState())).toMatchObject({ onboardingCompleted: false });
  });

  it("serializes overlapping changes and updates state before command promises resolve", async () => {
    await bootstrap();
    const first = store.dispatch(financeCommands.updateSettings({ currency: "EUR" }));
    const second = store.dispatch(financeCommands.updateSettings({ hideAmounts: true }));
    expect(selectSettings(store.getState())).toMatchObject({ currency: "EUR", hideAmounts: true });
    await Promise.all([first.unwrap(), second.unwrap()]);
    expect(store.getState().finance.settings).toMatchObject({ currency: "EUR", hideAmounts: true });
    expect(store.getState().finance.optimisticSettings).toEqual({});
    expect(await financeDb.settings.get("default")).toMatchObject({ currency: "EUR", hideAmounts: true });
  });

  it("rolls back a rejected optimistic setting without losing the next change", async () => {
    await bootstrap();
    vi.spyOn(store.services.finance, "execute").mockRejectedValueOnce(new Error("Save failed"));
    const first = store.dispatch(financeCommands.updateSettings({ currency: "EUR" }));
    const second = store.dispatch(financeCommands.updateSettings({ hideAmounts: true }));
    await expect(first.unwrap()).rejects.toMatchObject({ message: "Save failed" });
    await second.unwrap();
    expect(selectSettings(store.getState())).toMatchObject({ currency: "USD", hideAmounts: true });
    expect(store.getState().finance.commands.updateSettings.error).toBeNull();
  });

  it("preserves data after a failed background read and allows refreshing it", async () => {
    await bootstrap();
    const initialIds = store.getState().finance.wallets.ids;
    vi.spyOn(store.services.finance, "read").mockRejectedValueOnce(new Error("Offline"));
    await store.dispatch(loadFinance({ force: true }));
    expect(store.getState().finance.status).toBe("ready");
    expect(store.getState().finance.wallets.ids).toEqual(initialIds);
    expect(store.getState().finance.refreshError?.message).toBe("Offline");
    await store.dispatch(loadFinance({ force: true })).unwrap();
    expect(store.getState().finance.refreshError).toBeNull();
  });

  it("does not report a persisted write as failed if its following refresh fails", async () => {
    await bootstrap();
    vi.spyOn(store.services.finance, "read").mockRejectedValueOnce(new Error("Read failed"));
    const created = await store.dispatch(financeCommands.createWallet({ name: "Travel", currency: "EUR" })).unwrap();
    expect(created.name).toBe("Travel");
    expect(store.getState().finance.commands.createWallet.error).toBeNull();
    expect(store.getState().finance.refreshError?.message).toBe("Read failed");
    await store.dispatch(loadFinance({ force: true })).unwrap();
    expect(selectWallets(store.getState()).filter((wallet) => wallet.name === "Travel")).toHaveLength(1);
  });

  it("keeps attachment bytes out of state and atomically rejects invalid attachments", async () => {
    const { wallet, category } = await bootstrap();
    const input = {
      walletId: wallet.id, categoryId: category.id, type: "expense" as const,
      amountMinor: 1299, currency: wallet.currency, transactionDate: "2026-10-25T12:00:00.000Z"
    };
    await expect(store.dispatch(financeCommands.addTransactionWithAttachments({
      input, newFiles: [new File(["bad"], "invalid.txt", { type: "text/plain" })], removedAttachmentIds: []
    })).unwrap()).rejects.toMatchObject({ message: "Invalid attachment." });
    expect(await financeDb.transactions.count()).toBe(0);

    const transaction = await store.dispatch(financeCommands.addTransactionWithAttachments({
      input, newFiles: [new File(["receipt"], "receipt.pdf", { type: "application/pdf" })], removedAttachmentIds: []
    })).unwrap();
    expect(selectTransactions(store.getState())[0].attachmentCount).toBe(1);
    expect(await store.services.finance.listAttachments(transaction.id)).toHaveLength(1);
    expect(JSON.stringify(store.getState())).not.toContain("receipt.pdf");
  });

  it("retains a refresh warning until the stale resources have actually been reloaded", async () => {
    await bootstrap();
    vi.spyOn(store.services.finance, "read").mockRejectedValueOnce(new Error("Wallets unavailable"));
    await store.dispatch(financeCommands.createWallet({ name: "Travel", currency: "EUR" })).unwrap();
    await store.dispatch(financeCommands.createCategory({ name: "Other", type: "expense", color: "#207a6f", icon: "sparkles" })).unwrap();
    expect(store.getState().finance.staleResources).toContain("wallets");
    expect(store.getState().finance.refreshError?.message).toBe("Wallets unavailable");
    await store.dispatch(loadFinance({ force: true })).unwrap();
    expect(store.getState().finance.staleResources).toEqual([]);
  });

  it("does not persist a queued command that was cancelled before it started", async () => {
    await bootstrap();
    let release!: () => void;
    const blocker = store.services.runExclusive(() => new Promise<void>((resolve) => { release = resolve; }));
    await Promise.resolve();
    const pending = store.dispatch(financeCommands.createWallet({ name: "Cancelled", currency: "USD" }));
    pending.abort();
    release();
    await blocker;
    await expect(pending.unwrap()).rejects.toMatchObject({ name: "AbortError" });
    await store.services.runExclusive(async () => undefined);
    expect(await financeDb.wallets.filter((wallet) => wallet.name === "Cancelled").count()).toBe(0);
  });

  it("uses shared selectors for converted balances, recent order and history filters", async () => {
    const { wallet, category } = await bootstrap();
    const secondWallet = await store.dispatch(financeCommands.createWallet({ name: "Euro", currency: "EUR", initialBalanceMinor: 20000 })).unwrap();
    await store.dispatch(financeCommands.updateWallet({ id: wallet.id, input: { initialBalanceMinor: 10000 } })).unwrap();
    const newer = await store.dispatch(financeCommands.addTransaction({
      walletId: wallet.id, categoryId: category.id, type: "expense", amountMinor: 1000,
      currency: wallet.currency, transactionDate: "2026-10-25T12:00:00.000Z", note: "Coffee"
    })).unwrap();
    await store.dispatch(financeCommands.addTransaction({
      walletId: secondWallet.id, categoryId: category.id, type: "expense", amountMinor: 2000,
      currency: "EUR", transactionDate: "2026-10-20T12:00:00.000Z"
    })).unwrap();
    const { loadExchangeRates } = await import("./exchangeRatesSlice");
    store.dispatch(loadExchangeRates.fulfilled({ base: "USD", date: "2026-10-25", cachedAt: new Date().toISOString(), rates: { EUR: 0.5 } }, "rates", "USD"));
    const overview = makeSelectWalletOverview()(store.getState(), "all", "2026-10-25T12:00:00.000Z");
    expect(overview.totals.balanceMinor).toBe(45000);
    expect(overview.recentTransactions[0].transaction.id).toBe(newer.id);
    const history = makeSelectHistory()(store.getState(), {
      walletId: "all", type: "expense", categoryId: "all", search: "coffee", sort: "date-desc", currency: "USD"
    });
    expect(history.displayTransactions.map((item) => item.transaction.id)).toEqual([newer.id]);
  });

  it("refreshes every dependent entity after a category merge", async () => {
    const { wallet, category } = await bootstrap();
    const target = await store.dispatch(financeCommands.createCategory({ name: "Merged", type: "expense", color: "#207a6f", icon: "sparkles" })).unwrap();
    await store.dispatch(financeCommands.addTransaction({
      walletId: wallet.id, categoryId: category.id, type: "expense", amountMinor: 500,
      currency: wallet.currency, transactionDate: "2026-10-25T12:00:00.000Z"
    })).unwrap();
    await store.dispatch(financeCommands.replaceCategory({ sourceId: category.id, targetId: target.id, deleteSource: true })).unwrap();
    expect(selectTransactions(store.getState())[0].categoryId).toBe(target.id);
    expect(selectFinanceData(store.getState()).categories.some((item) => item.id === category.id)).toBe(false);
  });

  it("creates automatic backups from effects without a backup loop", async () => {
    store.dispose();
    store = createAppStore({ finance: createLocalFinanceGateway(), backupDelayMs: 5 });
    await bootstrap();
    const execute = vi.spyOn(store.services.finance, "execute");
    await store.dispatch(financeCommands.updateSettings({ onboardingCompleted: true })).unwrap();
    await vi.waitFor(() => expect(store.getState().finance.backupSnapshots.ids).toHaveLength(1));
    expect(execute.mock.calls.filter(([command]) => command === "createBackupSnapshot")).toHaveLength(1);
  });
});
