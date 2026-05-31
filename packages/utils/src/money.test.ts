import { describe, expect, it } from "vitest";
import { formatMoney, parseAmountToMinor } from "./money";

describe("money helpers", () => {
  it("parses decimal amounts into minor units", () => {
    expect(parseAmountToMinor("12.34", "USD")).toBe(1234);
    expect(parseAmountToMinor("12,34", "PLN")).toBe(1234);
  });

  it("respects zero decimal currencies", () => {
    expect(parseAmountToMinor("1200", "JPY")).toBe(1200);
    expect(() => parseAmountToMinor("12.34", "JPY")).toThrow();
  });

  it("formats money using locale and currency", () => {
    expect(formatMoney(1234, "USD", "en-US")).toContain("12.34");
  });
});
