import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHapticsController, HAPTIC_PATTERNS } from "./haptics";

let now = 1000;
let vibrate = vi.fn<(pattern: number | number[]) => boolean>();
beforeEach(() => {
  now = 1000;
  vibrate = vi.fn().mockReturnValue(true);
  vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: true } });
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(performance, "now").mockImplementation(() => now);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("haptic feedback safety", () => {
  it("does nothing while disabled, including cancellation", () => {
    const feedback = createHapticsController();
    expect(feedback.play("success", false)).toBe(false);
    feedback.cancel();
    expect(vibrate).not.toHaveBeenCalled();
  });
  it.each(["selection", "success", "error"] as const)("sends the brief %s pattern", (kind) => {
    const feedback = createHapticsController();
    expect(feedback.play(kind, true)).toBe(true);
    expect(vibrate).toHaveBeenCalledExactlyOnceWith(HAPTIC_PATTERNS[kind]);
  });
  it("silently ignores unsupported devices", () => {
    vi.stubGlobal("navigator", {});
    const feedback = createHapticsController();
    expect(feedback.isSupported()).toBe(false);
    expect(feedback.play("selection", true)).toBe(false);
    expect(() => feedback.cancel()).not.toThrow();
  });
  it("does not fire in a hidden tab or before user interaction", () => {
    const feedback = createHapticsController();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    expect(feedback.play("success", true)).toBe(false);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: false } });
    expect(feedback.play("error", true)).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });
  it("throttles feedback across different kinds instead of stacking it", () => {
    const feedback = createHapticsController();
    expect(feedback.play("selection", true)).toBe(true);
    now += 50;
    expect(feedback.play("success", true)).toBe(false);
    now += 100;
    expect(feedback.play("error", true)).toBe(true);
    expect(vibrate).toHaveBeenCalledTimes(2);
  });
  it("cancels active feedback once and leaves completed patterns alone", () => {
    const feedback = createHapticsController();
    feedback.play("error", true);
    feedback.cancel();
    feedback.cancel();
    expect(vibrate.mock.calls).toEqual([[HAPTIC_PATTERNS.error], [0]]);
    now += 200;
    feedback.play("selection", true);
    now += 20;
    feedback.cancel();
    expect(vibrate).toHaveBeenCalledTimes(3);
  });
  it("handles rejected and throwing browser implementations without breaking actions", () => {
    const feedback = createHapticsController();
    vibrate.mockReturnValueOnce(false);
    expect(feedback.play("success", true)).toBe(false);
    now += 200;
    vibrate.mockImplementation(() => { throw new Error("blocked"); });
    expect(feedback.play("error", true)).toBe(false);
    expect(() => feedback.cancel()).not.toThrow();
  });
});
