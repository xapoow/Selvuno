import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { haptics } from "../lib/haptics";
import { useHapticFeedback } from "./useHapticFeedback";

afterEach(() => vi.restoreAllMocks());
describe("haptics callback lifecycle", () => {
  it("uses the latest setting even in a callback captured by an earlier async action", () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const { result, rerender } = renderHook(({ enabled }) => useHapticFeedback(enabled), { initialProps: { enabled: true } });
    const captured = result.current;
    rerender({ enabled: false });
    act(() => { captured("error"); });
    expect(play).toHaveBeenCalledWith("error", false);
  });
  it("does not produce delayed feedback after its screen has unmounted", () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const { result, unmount } = renderHook(() => useHapticFeedback(true));
    const captured = result.current;
    unmount();
    expect(captured("error")).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
});
