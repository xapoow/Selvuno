import { useCallback, useEffect, useRef, useState } from "react";
import {
  hasPinCredential,
  readPrivacyConfig,
  removePinCredential,
  savePinCredential,
  verifyPinCredential,
  writePrivacyConfig,
  type AutoLockMinutes,
  type PrivacyConfig
} from "../lib/privacy";

export interface PrivacyLockController {
  pinEnabled: boolean;
  locked: boolean;
  config: PrivacyConfig;
  enablePin: (pin: string) => Promise<void>;
  changePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  disablePin: (currentPin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lockNow: () => void;
  setAutoLockMinutes: (minutes: AutoLockMinutes) => void;
}

export function usePrivacyLock(): PrivacyLockController {
  const initialPinEnabled = useRef(hasPinCredential());
  const [pinEnabled, setPinEnabled] = useState(initialPinEnabled.current);
  const [locked, setLocked] = useState(initialPinEnabled.current);
  const [config, setConfig] = useState(readPrivacyConfig);
  const lastActivityAt = useRef(Date.now());

  const recordActivity = useCallback(() => {
    if (!locked) {
      lastActivityAt.current = Date.now();
    }
  }, [locked]);

  useEffect(() => {
    if (!pinEnabled || locked || config.autoLockMinutes === 0) {
      return;
    }
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    for (const eventName of events) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }
    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityAt.current;
      if (elapsed >= config.autoLockMinutes * 60_000) {
        setLocked(true);
      }
    };
    const interval = window.setInterval(checkInactivity, 5_000);
    document.addEventListener("visibilitychange", checkInactivity);
    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, recordActivity);
      }
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkInactivity);
    };
  }, [config.autoLockMinutes, locked, pinEnabled, recordActivity]);

  return {
    pinEnabled,
    locked,
    config,
    async enablePin(pin) {
      await savePinCredential(pin);
      setPinEnabled(true);
      setLocked(false);
      lastActivityAt.current = Date.now();
    },
    async changePin(currentPin, nextPin) {
      if (!(await verifyPinCredential(currentPin))) {
        return false;
      }
      await savePinCredential(nextPin);
      lastActivityAt.current = Date.now();
      return true;
    },
    async disablePin(currentPin) {
      if (!(await verifyPinCredential(currentPin))) {
        return false;
      }
      removePinCredential();
      setConfig(readPrivacyConfig());
      setPinEnabled(false);
      setLocked(false);
      return true;
    },
    async unlock(pin) {
      const valid = await verifyPinCredential(pin);
      if (valid) {
        setLocked(false);
        lastActivityAt.current = Date.now();
      }
      return valid;
    },
    lockNow() {
      if (pinEnabled) {
        setLocked(true);
      }
    },
    setAutoLockMinutes(minutes) {
      const next = { autoLockMinutes: minutes };
      writePrivacyConfig(next);
      setConfig(next);
      lastActivityAt.current = Date.now();
    }
  };
}
