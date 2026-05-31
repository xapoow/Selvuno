import { ErrorScreen } from "./components/ErrorScreen";
import { App } from "./App";
import { getDictionary } from "./i18n";

const appPaths = new Set(["/", "/index.html"]);

export function AppRouter() {
  const t = getDictionary(typeof navigator === "undefined" ? "en-US" : navigator.language);

  if (!appPaths.has(window.location.pathname)) {
    return (
      <ErrorScreen
        kind="not-found"
        copy={t.errors}
        details={`Path: ${window.location.pathname}\nSearch: ${window.location.search || "-"}\nURL: ${window.location.href}`}
      />
    );
  }

  return <App />;
}
