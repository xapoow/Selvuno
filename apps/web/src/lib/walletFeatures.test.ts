import { describe, expect, it } from "vitest";
import { settingsSchema, walletSchema, type Transaction } from "@selvuno/types";
import {
  filterTransactionsForTotals,
  getIncludedWalletIds,
  shouldHideWalletAmounts
} from "./walletFeatures";

const now = "2026-09-10T12:00:00.000Z";
const wallet = walletSchema.parse({
  id: "11111111-1111-4111-8111-111111111111",
  userId: null,
  name: "Private",
  currency: "USD",
  initialBalanceMinor: 0,
  excludeFromTotals: true,
  hideBalance: true,
  color: "#207a6f",
  icon: "wallet-cards",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  syncStatus: "local"
});
const settings = settingsSchema.parse({
  id: "default",
  locale: "en-US",
  currency: "USD",
  dateFormat: "medium",
  timeZone: "UTC",
  theme: "dark",
  colorTheme: "sage",
  activeWalletId: "all",
  advancedWalletsEnabled: true,
  createdAt: now,
  updatedAt: now
});

describe("advanced wallet controls", () => {
  it("keeps excluded wallets out of combined statistics only while enabled", () => {
    expect(getIncludedWalletIds([wallet], true).has(wallet.id)).toBe(false);
    expect(getIncludedWalletIds([wallet], false).has(wallet.id)).toBe(true);
  });

  it("filters transactions using the included wallet set", () => {
    const transaction = {
      walletId: wallet.id
    } as Transaction;
    expect(filterTransactionsForTotals([transaction], new Set())).toEqual([]);
    expect(filterTransactionsForTotals([transaction], new Set([wallet.id]))).toEqual([
      transaction
    ]);
  });

  it("masks a single wallet only while advanced controls are enabled", () => {
    expect(shouldHideWalletAmounts(settings, wallet)).toBe(true);
    expect(
      shouldHideWalletAmounts({ ...settings, advancedWalletsEnabled: false }, wallet)
    ).toBe(false);
  });
});
