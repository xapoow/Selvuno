import type { WalletView } from "@selvuno/types";
import type { SettingsTab } from "../i18n";

export type AppView = "dashboard" | "add" | "history" | "wallets" | "settings";
export type DashboardPage = "overview" | "analytics" | "budget";
export type HistoryMode = "list" | "table" | "calendar";
export type WalletTab = "wallets" | "transfers" | "goals";
export type AddMode = "single" | "recurring";
export type RoutableSettingsTab = Exclude<SettingsTab, "debug">;

export const routeViews = {
  "/": "dashboard", "/analytics": "dashboard", "/budget": "dashboard",
  "/history": "history", "/history/table": "history", "/history/calendar": "history",
  "/add": "add", "/add/recurring": "add",
  "/wallets": "wallets", "/wallets/transfers": "wallets", "/wallets/goals": "wallets",
  "/settings": "settings", "/settings/appearance": "settings", "/settings/automation": "settings",
  "/settings/features": "settings", "/settings/privacy": "settings", "/settings/categories": "settings",
  "/settings/backup": "settings", "/settings/storage": "settings", "/settings/sync": "settings"
} as const satisfies Record<string, AppView>;
export type AppPath = keyof typeof routeViews;
export const viewPaths: Record<AppView, AppPath> = {
  dashboard: "/", history: "/history", add: "/add", wallets: "/wallets", settings: "/settings"
};
export interface AppRoute {
  path: AppPath | null;
  view: AppView;
  walletId: WalletView | null;
  href: string;
}

export function isAppPath(path: string): path is AppPath {
  return Object.prototype.hasOwnProperty.call(routeViews, path);
}
export function isPlainNavigation(event: { defaultPrevented: boolean; button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
export function supportsWallet(view: AppView): boolean {
  return view === "dashboard" || view === "history" || view === "add";
}
export function routeHref(path: AppPath, walletId: WalletView | null = null): string {
  return walletId && supportsWallet(routeViews[path]) ? `${path}?wallet=${encodeURIComponent(walletId)}` : path;
}
export function parseAppRoute(location: Pick<Location, "pathname" | "search">): AppRoute {
  let path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/index.html" || path === "/dashboard") path = "/";
  if (path === "/settings/general") path = "/settings";
  if (!isAppPath(path)) return { path: null, view: "dashboard", walletId: null, href: location.pathname + location.search };
  const wallet = new URLSearchParams(location.search).get("wallet");
  const walletId = wallet && supportsWallet(routeViews[path]) && (wallet === "all" || /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(wallet)) ? wallet.toLowerCase() : null;
  return { path, view: routeViews[path], walletId, href: routeHref(path, walletId) };
}
export function settingsPath(tab: RoutableSettingsTab): AppPath {
  return tab === "general" ? "/settings" : `/settings/${tab}`;
}
export function walletPath(tab: WalletTab): AppPath {
  return tab === "wallets" ? "/wallets" : `/wallets/${tab}`;
}
export function historyPath(mode: HistoryMode): AppPath {
  return mode === "list" ? "/history" : `/history/${mode}`;
}
