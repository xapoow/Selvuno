import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPrivacyData, savePinCredential } from "../lib/privacy";
import { usePrivacyLock } from "./usePrivacyLock";

describe("usePrivacyLock", () => {
  beforeEach(() => {
    clearPrivacyData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts unlocked and opt-in when no PIN exists", () => {
    const { result } = renderHook(() => usePrivacyLock());
    expect(result.current.pinEnabled).toBe(false);
    expect(result.current.locked).toBe(false);
    expect(result.current.config.autoLockMinutes).toBe(0);
  });

  it("locks after the selected period of inactivity", async () => {
    await savePinCredential("482601");
    vi.useFakeTimers();
    const { result } = renderHook(() => usePrivacyLock());

    expect(result.current.locked).toBe(true);
    await act(async () => {
      expect(await result.current.unlock("482601")).toBe(true);
    });
    act(() => result.current.setAutoLockMinutes(1));
    expect(result.current.locked).toBe(false);

    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.locked).toBe(true);
  });
});
