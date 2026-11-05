import { useLayoutEffect } from "react";
import { ErrorScreen } from "./components/ErrorScreen";
import { App } from "./App";
import { getDictionary } from "./i18n";
import { startRouteSync, useAppStore } from "./state/appStore";

export function AppRouter() {
  useLayoutEffect(startRouteSync, []);
  const route = useAppStore((state) => state.route);
  const t = getDictionary(typeof navigator === "undefined" ? "en-US" : navigator.language);

  if (!route.path) {
    return (
      <ErrorScreen
        kind="not-found"
        copy={t.errors}
        primaryAction={{ label: t.errors.actions.goHome, onClick: () => useAppStore.getState().navigate("/") }}
        details={`Path: ${window.location.pathname}\nSearch: ${window.location.search || "-"}\nURL: ${window.location.href}`}
      />
    );
  }

  return <App />;
}
