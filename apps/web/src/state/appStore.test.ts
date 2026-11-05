import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startRouteSync, useAppStore } from "./appStore";

let stop: (() => void) | undefined;
beforeEach(() => { window.history.replaceState({}, "", "/"); stop = startRouteSync(); });
afterEach(() => { stop?.(); vi.restoreAllMocks(); window.history.replaceState({}, "", "/"); });
const store = () => useAppStore.getState();

describe("URL/store synchronization", () => {
  it("loads a nested URL on startup without adding a history entry", () => {
    stop?.();
    window.history.replaceState({}, "", "/settings/privacy");
    const count = window.history.length;
    stop = startRouteSync();
    expect(store().route.path).toBe("/settings/privacy");
    expect(store().activeView).toBe("settings");
    expect(window.history.length).toBe(count);
  });
  it("navigates both ways between nested screens without duplicate entries", async () => {
    store().setActiveView("history");
    store().navigate("/history/calendar");
    const count = window.history.length;
    store().navigate("/history/calendar");
    expect(window.history.length).toBe(count);
    store().navigate("/settings/privacy");
    window.history.back();
    await waitFor(() => expect(store().route.path).toBe("/history/calendar"));
    expect(store().activeView).toBe("history");
    window.history.forward();
    await waitFor(() => expect(store().route.path).toBe("/settings/privacy"));
    expect(store().activeView).toBe("settings");
  });
  it("replaces wallet swipes, preserves context between screens, and restores it with Back", async () => {
    const wallet = "10000000-0000-4000-8000-000000000001";
    const count = window.history.length;
    store().setRouteWallet(wallet);
    expect(window.history.length).toBe(count);
    expect(window.location.search).toBe(`?wallet=${wallet}`);
    store().setActiveView("history");
    expect(window.location.href).toContain(`/history?wallet=${wallet}`);
    store().navigate("/settings/appearance");
    expect(window.location.search).toBe("");
    window.history.back();
    await waitFor(() => expect(store().route.path).toBe("/history"));
    expect(store().route.walletId).toBe(wallet);
  });
  it("returns from a Home subpage using Back or a safe direct-link fallback", async () => {
    store().setRouteWallet("all");
    store().navigate("/analytics");
    store().backTo("/");
    await waitFor(() => expect(store().route.path).toBe("/"));
    stop?.();
    window.history.replaceState({}, "", "/budget?wallet=all");
    stop = startRouteSync();
    const count = window.history.length;
    store().backTo("/");
    expect(window.location.pathname).toBe("/");
    expect(store().route.walletId).toBe("all");
    expect(window.history.length).toBe(count);
  });
  it("canonicalizes aliases and query parameters without pushes", () => {
    stop?.();
    window.history.replaceState({}, "", "/settings/general/?wallet=invalid#old");
    const count = window.history.length;
    stop = startRouteSync();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/settings");
    expect(window.history.length).toBe(count);
  });
  it("removes the listener when unmounted and does not register duplicate listeners on restart", () => {
    stop?.();
    window.history.replaceState({}, "", "/wallets/goals");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(store().route.path).toBe("/");
    stop = startRouteSync();
    expect(store().route.path).toBe("/wallets/goals");
    const pushed = vi.spyOn(window.history, "pushState");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(pushed).not.toHaveBeenCalled();
  });
});
