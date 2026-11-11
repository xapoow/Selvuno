import { describe, expect, it } from "vitest";
import { dashboardLayoutSchema, settingsSchema } from "@selvuno/types";
import { testSettings } from "../test/fixtures";
import { DASHBOARD_BLOCKS, dashboardRows, moveDashboardBlock, normalizeDashboardLayout } from "./dashboardLayout";

describe("home layout", () => {
  it("preserves the existing layout and keeps optional goals hidden for old settings", () => {
    expect(settingsSchema.parse(testSettings).dashboardLayout).toBeUndefined();
    expect(dashboardRows(testSettings)).toEqual([["summary"], ["budget"], ["cashFlow", "recent"]]);
    expect(normalizeDashboardLayout().hidden).toEqual(["goals"]);
  });
  it("normalizes incomplete layouts without losing blocks or enabling newly added optional ones", () => {
    expect(normalizeDashboardLayout({ order: ["recent", "recent"], hidden: ["budget", "budget"] })).toEqual({
      order: ["recent", "summary", "budget", "insights", "cashFlow", "goals"], hidden: ["budget", "goals"]
    });
  });
  it("respects visibility and the independent observations opt-in", () => {
    const dashboardLayout = { order: [...DASHBOARD_BLOCKS], hidden: [] };
    expect(dashboardRows({ dashboardLayout, smartInsightsEnabled: false }).flat()).not.toContain("insights");
    expect(dashboardRows({ dashboardLayout, smartInsightsEnabled: true }).flat()).toEqual(DASHBOARD_BLOCKS);
    expect(dashboardRows({ dashboardLayout: { ...dashboardLayout, hidden: [...DASHBOARD_BLOCKS] }, smartInsightsEnabled: true })).toEqual([]);
  });
  it("pairs only adjacent chart and recent blocks, including reversed order", () => {
    expect(dashboardRows({ dashboardLayout: { order: ["recent", "cashFlow", "budget"], hidden: ["summary", "insights", "goals"] }, smartInsightsEnabled: false })).toEqual([["recent", "cashFlow"], ["budget"]]);
    expect(dashboardRows({ dashboardLayout: { order: ["cashFlow", "budget", "recent"], hidden: ["summary", "insights", "goals"] }, smartInsightsEnabled: false })).toEqual([["cashFlow"], ["budget"], ["recent"]]);
  });
  it("moves blocks without changing visibility and handles boundaries", () => {
    const layout = normalizeDashboardLayout();
    expect(moveDashboardBlock(layout, "budget", -1)).toEqual({ ...layout, order: ["budget", "summary", "insights", "cashFlow", "recent", "goals"] });
    expect(moveDashboardBlock(layout, "summary", -1)).toBe(layout);
    expect(moveDashboardBlock(layout, "goals", 1)).toBe(layout);
  });
  it("rejects duplicate and unknown block ids before persistence", () => {
    expect(dashboardLayoutSchema.safeParse({ order: ["summary", "summary"], hidden: [] }).success).toBe(false);
    expect(dashboardLayoutSchema.safeParse({ order: ["unknown"], hidden: [] }).success).toBe(false);
    expect(dashboardLayoutSchema.safeParse({ order: [], hidden: ["budget", "budget"] }).success).toBe(false);
  });
});
