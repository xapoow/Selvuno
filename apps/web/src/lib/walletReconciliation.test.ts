import { describe, expect, it } from "vitest";
import { parseBalanceToMinor } from "./walletReconciliation";

describe("balance entry", () => {
  it("parses signed balances and zero without floating-point rounding", () => {
    expect(parseBalanceToMinor("1 234,56", "PLN")).toBe(123456);
    expect(parseBalanceToMinor("-0.29", "USD")).toBe(-29);
    expect(parseBalanceToMinor("0", "USD")).toBe(0);
    expect(parseBalanceToMinor("-0", "USD")).toBe(0);
    expect(parseBalanceToMinor("12.345", "BHD")).toBe(12345);
    expect(parseBalanceToMinor("-123", "JPY")).toBe(-123);
  });

  it("rejects expressions, excess precision, and unsafe balances", () => {
    for (const [amount, currency] of [["", "USD"], ["2 + 3", "USD"], ["1.234", "USD"], ["1.1", "JPY"], ["1,2,3", "PLN"], ["9007199254740992", "JPY"]]) {
      expect(() => parseBalanceToMinor(amount, currency)).toThrow();
    }
  });
});
