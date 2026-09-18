import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPrivacyData,
  hasPinCredential,
  isValidPin,
  readPrivacyConfig,
  removePinCredential,
  savePinCredential,
  verifyPinCredential,
  writePrivacyConfig
} from "./privacy";

describe("privacy preferences", () => {
  beforeEach(() => {
    clearPrivacyData();
  });

  it("accepts only an exact six-digit PIN", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
  });

  it("uses opt-in defaults and persists a supported auto-lock interval", () => {
    expect(hasPinCredential()).toBe(false);
    expect(readPrivacyConfig()).toEqual({ autoLockMinutes: 0 });

    writePrivacyConfig({ autoLockMinutes: 15 });
    expect(readPrivacyConfig()).toEqual({ autoLockMinutes: 15 });
  });

  it("falls back safely when stored privacy configuration is invalid", () => {
    localStorage.setItem("myfinances:privacy-config:v1", JSON.stringify({ autoLockMinutes: 99 }));
    expect(readPrivacyConfig()).toEqual({ autoLockMinutes: 0 });
  });

  it("stores a derived credential and verifies the PIN locally", async () => {
    await savePinCredential("482601");

    expect(hasPinCredential()).toBe(true);
    expect(localStorage.getItem("myfinances:privacy-credential:v1")).not.toContain("482601");
    await expect(verifyPinCredential("482601")).resolves.toBe(true);
    await expect(verifyPinCredential("482602")).resolves.toBe(false);

    removePinCredential();
    expect(hasPinCredential()).toBe(false);
  });
});
