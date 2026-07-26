import { describe, expect, it } from "vitest";
import {
  buildAnalyticsTrendBuckets,
  calculatePercentageChange,
  calendarDateInTimeZone,
  calendarDateIsInRange,
  resolveAnalyticsPeriod
} from "./analytics";

const input = {
  now: new Date("2026-07-26T10:00:00.000Z"),
  timeZone: "Europe/Warsaw",
  customFrom: "2026-07-05" as const,
  customTo: "2026-07-10" as const
};

describe("analytics periods", () => {
  it("resolves calendar week and previous week", () => {
    expect(resolveAnalyticsPeriod({ ...input, preset: "week" })).toEqual({
      current: { from: "2026-07-20", to: "2026-07-26" },
      previous: { from: "2026-07-13", to: "2026-07-19" }
    });
  });

  it("compares elapsed month and year with equivalent previous dates", () => {
    expect(resolveAnalyticsPeriod({ ...input, preset: "month" })).toEqual({
      current: { from: "2026-07-01", to: "2026-07-26" },
      previous: { from: "2026-06-01", to: "2026-06-26" }
    });
    expect(resolveAnalyticsPeriod({ ...input, preset: "year" })).toEqual({
      current: { from: "2026-01-01", to: "2026-07-26" },
      previous: { from: "2025-01-01", to: "2025-07-26" }
    });
  });

  it("normalizes a custom range and compares the same number of days", () => {
    expect(
      resolveAnalyticsPeriod({
        ...input,
        preset: "custom",
        customFrom: "2026-07-10",
        customTo: "2026-07-05"
      })
    ).toEqual({
      current: { from: "2026-07-05", to: "2026-07-10" },
      previous: { from: "2026-06-29", to: "2026-07-04" }
    });
  });

  it("calculates percentage changes without inventing a baseline", () => {
    expect(calculatePercentageChange(118, 100)).toBe(18);
    expect(calculatePercentageChange(75, 100)).toBe(-25);
    expect(calculatePercentageChange(0, 0)).toBe(0);
    expect(calculatePercentageChange(100, 0)).toBeNull();
  });

  it("groups short ranges by day and long ranges by month", () => {
    expect(
      buildAnalyticsTrendBuckets({ from: "2026-07-20", to: "2026-07-26" }, "en-US")
    ).toHaveLength(7);
    const yearBuckets = buildAnalyticsTrendBuckets(
      { from: "2026-01-01", to: "2026-12-31" },
      "en-US"
    );
    expect(yearBuckets).toHaveLength(12);
    expect(yearBuckets[0]).toMatchObject({ key: "2026-01", granularity: "month" });
  });

  it("uses the configured timezone when classifying transactions", () => {
    expect(calendarDateInTimeZone(new Date("2026-07-31T22:30:00.000Z"), "Europe/Warsaw")).toBe(
      "2026-08-01"
    );
    expect(
      calendarDateIsInRange("2026-08-01", { from: "2026-08-01", to: "2026-08-31" })
    ).toBe(true);
  });
});
