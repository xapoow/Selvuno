import { describe, expect, it } from "vitest";
import { historyPath, isPlainNavigation, parseAppRoute, routeHref, routeViews, settingsPath, walletPath } from "./routes";

const parse = (href: string) => parseAppRoute(new URL(href, "https://example.test"));
const wallet = "10000000-0000-4000-8000-000000000001";

describe("route definitions", () => {
  it.each(Object.entries(routeViews))("resolves %s to %s", (path, view) => {
    expect(parse(path)).toMatchObject({ path, view, href: path });
  });
  it.each([["/index.html", "/"], ["/dashboard/", "/"], ["/settings/general/", "/settings"], ["/history/calendar/", "/history/calendar"]])("normalizes %s", (input, expected) => {
    expect(parse(input).href).toBe(expected);
  });
  it("keeps a validated wallet only on supported screens and drops other parameters", () => {
    expect(parse(`/history/calendar?wallet=${wallet}&note=private&amount=123`).href).toBe(`/history/calendar?wallet=${wallet}`);
    expect(parse("/analytics?wallet=all").walletId).toBe("all");
    expect(parse("/history?wallet=invalid").href).toBe("/history");
    expect(parse(`/settings/privacy?wallet=${wallet}`).walletId).toBeNull();
    expect(routeHref("/wallets/goals", wallet)).toBe("/wallets/goals");
  });
  it.each(["/missing", "/settings/debug", "/settings/nonexistent", "/__proto__", "/constructor", "/history/calendar/extra"])("does not accept unknown paths: %s", (path) => {
    expect(parse(path).path).toBeNull();
  });
  it("generates typed section paths", () => {
    expect(settingsPath("general")).toBe("/settings");
    expect(settingsPath("privacy")).toBe("/settings/privacy");
    expect(walletPath("goals")).toBe("/wallets/goals");
    expect(walletPath("wallets")).toBe("/wallets");
    expect(historyPath("calendar")).toBe("/history/calendar");
  });
  it("only intercepts unmodified primary link clicks", () => {
    const event = { button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    expect(isPlainNavigation(event)).toBe(true);
    for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey", "defaultPrevented"]) expect(isPlainNavigation({ ...event, [modifier]: true })).toBe(false);
    expect(isPlainNavigation({ ...event, button: 1 })).toBe(false);
  });
});
