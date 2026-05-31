import { ErrorScreen } from "./components/ErrorScreen";
import { App } from "./App";

const appPaths = new Set(["/", "/index.html"]);

export function AppRouter() {
  if (!appPaths.has(window.location.pathname)) {
    return (
      <ErrorScreen
        kind="not-found"
        details={`Path: ${window.location.pathname}\nSearch: ${window.location.search || "-"}\nURL: ${window.location.href}`}
      />
    );
  }

  return <App />;
}
