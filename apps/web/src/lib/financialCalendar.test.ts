import { describe, expect, it } from "vitest";
import {
  createFinancialCalendarDate,
  getFinancialCalendarMonth,
  shiftFinancialCalendarMonth
} from "./financialCalendar";

describe("financial calendar", () => {
  it("builds a Monday-first month layout", () => {
    expect(getFinancialCalendarMonth("2026-08")).toEqual({
      year: 2026,
      monthIndex: 7,
      daysInMonth: 31,
      leadingEmptyDays: 5
    });
  });

  it("moves across year boundaries", () => {
    expect(shiftFinancialCalendarMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftFinancialCalendarMonth("2026-01", -1)).toBe("2025-12");
  });

  it("creates zero-padded dates and rejects days outside the month", () => {
    expect(createFinancialCalendarDate("2026-02", 4)).toBe("2026-02-04");
    expect(() => createFinancialCalendarDate("2026-02", 29)).toThrow();
  });
});
