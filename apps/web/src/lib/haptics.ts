export type HapticKind = "selection" | "success" | "error";

export const HAPTIC_PATTERNS: Record<HapticKind, readonly number[]> = {
  selection: [8],
  success: [12, 45, 18],
  error: [22, 55, 22]
};
const MIN_INTERVAL_MS = 150;

/** Browsers can acknowledge a request without physical vibration; never assume success. */
export function createHapticsController() {
  let lastAttempt: number | null = null;
  let activeUntil = 0;
  const supported = () => {
    try { return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"; }
    catch { return false; }
  };
  return {
    isSupported: supported,
    play(kind: HapticKind, enabled: boolean): boolean {
      if (!enabled || !supported() || typeof document === "undefined" || document.visibilityState !== "visible") return false;
      try {
        if (navigator.userActivation?.hasBeenActive === false) return false;
        const now = performance.now();
        if (lastAttempt !== null && now - lastAttempt < MIN_INTERVAL_MS) return false;
        lastAttempt = now;
        const pattern = HAPTIC_PATTERNS[kind];
        const accepted = navigator.vibrate([...pattern]);
        activeUntil = accepted ? now + pattern.reduce((sum, duration) => sum + duration, 0) : 0;
        return accepted;
      } catch { return false; }
    },
    cancel() {
      const wasActive = activeUntil > performance.now();
      activeUntil = 0;
      if (!wasActive || !supported()) return;
      try { navigator.vibrate(0); } catch { /* Haptics must never interrupt an app action. */ }
    }
  };
}

export const haptics = createHapticsController();
