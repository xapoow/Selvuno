import { useCallback, useEffect, useRef } from "react";
import { haptics, type HapticKind } from "../lib/haptics";

export function useHapticFeedback(enabled: boolean) {
  const enabledRef = useRef(enabled);
  const mountedRef = useRef(true);
  enabledRef.current = enabled;
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  return useCallback((kind: HapticKind) => mountedRef.current && haptics.play(kind, enabledRef.current), []);
}
