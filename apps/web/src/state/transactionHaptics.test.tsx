import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { haptics } from "../lib/haptics";
import { queryKeys } from "../lib/queryKeys";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { transactionRepository } from "../repositories/transactionRepository";
import { transactionAttachmentRepository } from "../repositories/transactionAttachmentRepository";
import { useFinanceMutations } from "./useFinanceQueries";

const input = { walletId: testWallet.id, categoryId: testCategory.id, type: "expense" as const, amountMinor: 1250, currency: "USD", transactionDate: testTransaction.transactionDate };
function fixture(enabled = true) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(queryKeys.settings, { ...testSettings, hapticsEnabled: enabled });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useFinanceMutations(), { wrapper }) };
}
beforeEach(async () => {
  await resetDatabaseForTests();
  await financeDb.settings.put(testSettings);
  await financeDb.wallets.put(testWallet);
  await financeDb.categories.put(testCategory);
  await financeDb.transactions.put(testTransaction);
});
afterEach(() => vi.restoreAllMocks());

describe("transaction success feedback", () => {
  it.each(["add", "addFiles", "edit", "editFiles"])("emits exactly one success after %s completes", async (mode) => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const { result } = fixture();
    await act(async () => {
      if (mode === "add") await result.current.addTransaction.mutateAsync(input);
      else if (mode === "addFiles") await result.current.addTransactionWithAttachments.mutateAsync({ input, newFiles: [], removedAttachmentIds: [] });
      else if (mode === "edit") await result.current.updateTransaction.mutateAsync({ id: testTransaction.id, input: { amountMinor: 500 } });
      else await result.current.updateTransactionWithAttachments.mutateAsync({ id: testTransaction.id, submission: { input, newFiles: [], removedAttachmentIds: [] } });
    });
    expect(play).toHaveBeenCalledExactlyOnceWith("success", true);
  });
  it("does not emit success when attachment persistence fails", async () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    vi.spyOn(transactionAttachmentRepository, "applyChanges").mockRejectedValue(new Error("file storage full"));
    const { result } = fixture();
    await act(async () => {
      await expect(result.current.addTransactionWithAttachments.mutateAsync({ input, newFiles: [new File(["receipt"], "receipt.jpg", { type: "image/jpeg" })], removedAttachmentIds: [] })).rejects.toThrow("file storage full");
    });
    expect(play).not.toHaveBeenCalled();
  });
  it("waits for persistence and respects opt-out while saving", async () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    let finish!: (transaction: typeof testTransaction) => void;
    vi.spyOn(transactionRepository, "addTransaction").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const { client, result } = fixture();
    let saving!: Promise<unknown>;
    act(() => { saving = result.current.addTransaction.mutateAsync(input); });
    await act(async () => { await Promise.resolve(); });
    expect(play).not.toHaveBeenCalled();
    client.setQueryData(queryKeys.settings, { ...testSettings, hapticsEnabled: false });
    await act(async () => { finish(testTransaction); await saving; });
    expect(play).toHaveBeenCalledExactlyOnceWith("success", false);
  });
});
