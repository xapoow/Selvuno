import { describe, expect, it } from "vitest";
import { convertMinorBetweenCurrencies, formatMoney, formatSignedMoney, parseAmountToMinor } from "./money";

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

  it("masks money without leaking its sign or currency", () => {
    expect(formatMoney(1234, "USD", "en-US", true)).toBe("••••");
    expect(formatSignedMoney(1234, "USD", "en-US", "expense", true)).toBe("••••");
  });

  it("converts minor amounts between currencies", () => {
    expect(convertMinorBetweenCurrencies(1000, "USD", "EUR", 0.9)).toBe(900);
    expect(convertMinorBetweenCurrencies(1000, "USD", "USD", 0.9)).toBe(1000);
  });
});
