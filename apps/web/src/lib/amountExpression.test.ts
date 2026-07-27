import { describe, expect, it } from "vitest";
import { evaluateAmountExpression } from "./amountExpression";

describe("amount expression", () => {
  it("respects arithmetic precedence and parentheses", () => {
    expect(evaluateAmountExpression("12.50 + 4.20 * 2")).toBeCloseTo(20.9);
    expect(evaluateAmountExpression("(12,5 + 4,5) / 2")).toBeCloseTo(8.5);
  });

  it("supports unary operators", () => {
    expect(evaluateAmountExpression("20 + -5")).toBe(15);
  });

  it("rejects unsafe, invalid, and non-positive expressions", () => {
    expect(() => evaluateAmountExpression("10 / 0")).toThrow();
    expect(() => evaluateAmountExpression("Math.random()")).toThrow();
    expect(() => evaluateAmountExpression("5 - 5")).toThrow();
  });
});
