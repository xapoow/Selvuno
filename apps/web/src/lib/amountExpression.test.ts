import { describe, expect, it } from "vitest";
import { evaluateAmountExpression, setAmountOperator } from "./amountExpression";

describe("amount operator buttons", () => {
  it("replaces the pending operation instead of stacking operators", () => {
    let amount = "125";
    for (const operator of ["*", "-", "+", "/"] as const) {
      amount = setAmountOperator(amount, operator);
      expect(amount).toBe(`125 ${operator} `);
    }
    expect(setAmountOperator("20 + 5 * - ", "+")).toBe("20 + 5 + ");
  });

  it("only appends a new operation after an operand", () => {
    expect(setAmountOperator("12,50", "+")).toBe("12,50 + ");
    expect(setAmountOperator("(12 + 5)", "*")).toBe("(12 + 5) * ");
    expect(setAmountOperator("12.", "+")).toBe("12. + ");
    expect(setAmountOperator("20 + 5", "-")).toBe("20 + 5 - ");
  });

  it("does not start a chain of operations without a number", () => {
    for (const input of ["", " ", "* - +", "12 + ("]) {
      expect(setAmountOperator(input, "+")).toBe(input);
    }
  });
});

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
