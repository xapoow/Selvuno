import { describe, expect, it } from "vitest";
import type { Wallet } from "@myfinances/types";
import { calculateCombinedWalletBalance, clampCarouselWidth, getCarouselGeometry } from "./MonobankWalletCarousel";

function wallet(id: string, currency: string, initialBalanceMinor: number): Wallet {
  return {
    id,
    userId: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    deletedAt: null,
    syncStatus: "local",
    name: currency,
    currency,
    initialBalanceMinor,
    kind: "cash",
    creditLimitMinor: 0,
    excludeFromTotals: false,
    hideBalance: false,
    color: "#207a6f",
    icon: "wallet-cards",
    archivedAt: null,
    sortOrder: 0
  };
}

describe("MonobankWalletCarousel geometry", () => {
  it("caps a runaway measurement to the mobile viewport", () => {
    expect(clampCarouselWidth(1600, 598)).toBe(566);
    expect(clampCarouselWidth(1200, 390)).toBe(358);
  });

  it("keeps cards proportional and the track explicitly sized", () => {
    const geometry = getCarouselGeometry(358, 3);

    expect(geometry).toEqual({
      peek: 18,
      cardWidth: 322,
      step: 336,
      trackWidth: 994
    });
    expect(geometry.cardWidth / 1.586).toBeLessThan(210);
  });

  it("uses the entire container when there is only one card", () => {
    expect(getCarouselGeometry(358, 1)).toEqual({
      peek: 0,
      cardWidth: 358,
      step: 372,
      trackWidth: 358
    });
  });

  it("converts wallet balances before calculating the combined balance", () => {
    const usd = wallet("10000000-0000-4000-8000-000000000001", "USD", 10_000);
    const pln = wallet("10000000-0000-4000-8000-000000000002", "PLN", 40_000);

    expect(
      calculateCombinedWalletBalance(
        [usd, pln],
        [],
        [],
        new Set([usd.id, pln.id]),
        "USD",
        {
          base: "USD",
          date: "2026-09-19",
          cachedAt: "2026-09-19T00:00:00.000Z",
          rates: { PLN: 4 }
        }
      )
    ).toEqual({ balanceMinor: 20_000, conversionMissing: false });
  });
});
