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

  it("accepts only numeric PIN values between 4 and 12 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456789012")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567890123")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
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
    await savePinCredential("4826");

    expect(hasPinCredential()).toBe(true);
    expect(localStorage.getItem("myfinances:privacy-credential:v1")).not.toContain("4826");
    await expect(verifyPinCredential("4826")).resolves.toBe(true);
    await expect(verifyPinCredential("4827")).resolves.toBe(false);

    removePinCredential();
    expect(hasPinCredential()).toBe(false);
  });
});
