import { create } from "zustand";
import type { WalletView } from "@myfinances/types";
import { parseAppRoute, routeHref, supportsWallet, viewPaths, type AppPath, type AppRoute, type AppView } from "../lib/routes";

export type { AppView } from "../lib/routes";

interface NavigationOptions { replace?: boolean; walletId?: WalletView | null }
const historyKey = "myfinances:navigation";
interface NavigationEntry { previous: string | null }
function currentRoute(): AppRoute {
  return typeof window === "undefined" ? { path: "/", view: "dashboard", walletId: null, href: "/" } : parseAppRoute(window.location);
}

interface AppStore {
  route: AppRoute;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  navigate: (path: AppPath, options?: NavigationOptions) => void;
  setRouteWallet: (walletId: WalletView) => void;
  backTo: (fallback: AppPath) => void;
}

export const useAppStore = create<AppStore>((set, get) => {
  const route = currentRoute();
  return {
    route,
    activeView: route.view,
    setActiveView: (view) => get().navigate(viewPaths[view]),
    navigate: (path, options = {}) => {
      const previous = get().route;
      const walletId = options.walletId === undefined ? previous.walletId : options.walletId;
      const href = routeHref(path, walletId);
      if (typeof window !== "undefined") {
        if (window.location.pathname + window.location.search + window.location.hash !== href) {
          const entry: NavigationEntry = { previous: options.replace ? window.history.state?.[historyKey]?.previous ?? null : previous.href };
          window.history[options.replace ? "replaceState" : "pushState"]({ ...window.history.state, [historyKey]: entry }, "", href);
        }
      }
      const next = parseAppRoute({ pathname: path, search: href.includes("?") ? href.slice(href.indexOf("?")) : "" });
      set({ route: next, activeView: next.view });
    },
    setRouteWallet: (walletId) => {
      const route = get().route;
      if (route.path && supportsWallet(route.view)) get().navigate(route.path, { walletId, replace: true });
    },
    backTo: (fallback) => {
      const previous = typeof window === "undefined" ? null : window.history.state?.[historyKey]?.previous;
      if (typeof previous === "string" && previous.split("?")[0] === fallback) window.history.back();
      else get().navigate(fallback, { replace: true });
    }
  };
});

/** One listener owned by AppRouter; safe to mount twice under StrictMode. */
export function startRouteSync(): () => void {
  const sync = () => {
    const route = currentRoute();
    const href = window.location.pathname + window.location.search + window.location.hash;
    if (route.path && href !== route.href) window.history.replaceState(window.history.state, "", route.href);
    useAppStore.setState({ route, activeView: route.view });
  };
  sync();
  window.addEventListener("popstate", sync);
  return () => window.removeEventListener("popstate", sync);
}
