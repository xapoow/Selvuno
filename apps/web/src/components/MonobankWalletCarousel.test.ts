import { describe, expect, it } from "vitest";
import { clampCarouselWidth, getCarouselGeometry } from "./MonobankWalletCarousel";

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
});
