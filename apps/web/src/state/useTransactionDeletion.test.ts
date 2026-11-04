import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE_UNDO_DURATION, useTransactionDeletion } from "./useTransactionDeletion";

function actions() {
  return {
    deleteTransactions: vi.fn(async (ids: string[]) => ids.map((id) => ({ id, deletedAt: "2026-11-04T12:00:00Z" }))),
    restoreTransactions: vi.fn().mockResolvedValue(undefined)
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("transaction deletion undo", () => {
  it("combines rapid deletions and restores the entire batch once", async () => {
    const mutations = actions();
    const { result } = renderHook(() => useTransactionDeletion(mutations));
    await act(async () => {
      await result.current.deleteOne("one");
      await result.current.deleteMany(["two", "three"]);
    });
    expect(result.current.count).toBe(3);
    await act(async () => { await result.current.undo(); });
    expect(mutations.restoreTransactions).toHaveBeenCalledWith([
      { id: "one", deletedAt: "2026-11-04T12:00:00Z" },
      { id: "two", deletedAt: "2026-11-04T12:00:00Z" },
      { id: "three", deletedAt: "2026-11-04T12:00:00Z" }
    ]);
    expect(result.current.count).toBe(0);
  });

  it("expires the quick action after ten seconds without restoring or deleting anything else", async () => {
    const mutations = actions();
    const { result } = renderHook(() => useTransactionDeletion(mutations));
    await act(async () => { await result.current.deleteOne("one"); });
    act(() => vi.advanceTimersByTime(DELETE_UNDO_DURATION - 1));
    expect(result.current.count).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.count).toBe(0);
    expect(mutations.deleteTransactions).toHaveBeenCalledTimes(1);
    expect(mutations.restoreTransactions).not.toHaveBeenCalled();
  });

  it("pauses expiry while interacting and while the page is hidden", async () => {
    const { result } = renderHook(() => useTransactionDeletion(actions()));
    await act(async () => { await result.current.deleteOne("one"); });
    act(() => result.current.setPaused(true));
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.count).toBe(1);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => { result.current.setPaused(false); document.dispatchEvent(new Event("visibilitychange")); });
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.count).toBe(1);
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(DELETE_UNDO_DURATION));
    expect(result.current.count).toBe(0);
  });

  it("keeps failed undo available for retry", async () => {
    const mutations = actions();
    mutations.restoreTransactions.mockRejectedValueOnce(new Error("Storage unavailable"));
    const { result } = renderHook(() => useTransactionDeletion(mutations));
    await act(async () => { await result.current.deleteOne("one"); });
    await act(async () => { await result.current.undo(); });
    expect(result.current.failed).toBe(true);
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.count).toBe(1);
    await act(async () => { await result.current.undo(); });
    expect(result.current.failed).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("preserves new deletions that arrive during undo and blocks double submission", async () => {
    const mutations = actions();
    let finish!: () => void;
    mutations.restoreTransactions.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useTransactionDeletion(mutations));
    await act(async () => { await result.current.deleteOne("one"); });
    let restoring!: Promise<void>;
    act(() => { restoring = result.current.undo(); void result.current.undo(); });
    await act(async () => { await result.current.deleteOne("two"); });
    await act(async () => { finish(); await restoring; });
    expect(mutations.restoreTransactions).toHaveBeenCalledOnce();
    expect(result.current.count).toBe(1);
    await act(async () => { await result.current.undo(); });
    expect(mutations.restoreTransactions).toHaveBeenLastCalledWith([{ id: "two", deletedAt: "2026-11-04T12:00:00Z" }]);
  });

  it("does not offer undo when the deletion failed", async () => {
    const mutations = actions();
    mutations.deleteTransactions.mockRejectedValueOnce(new Error("Write failed"));
    const { result } = renderHook(() => useTransactionDeletion(mutations));
    await act(async () => { await expect(result.current.deleteOne("one")).rejects.toThrow("Write failed"); });
    expect(result.current.count).toBe(0);
  });
});
