import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./state/appStore";
import { getDictionary } from "./i18n";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { AppRouter } from "./AppRouter";

vi.mock("./App", () => ({ App: () => {
  const route = useAppStore((state) => state.route);
  const navigate = useAppStore((state) => state.setActiveView);
  return <><output data-testid="route">{route.path}</output><HeaderNavigation activeView={route.view} labels={getDictionary("en-US").nav} onChange={navigate} walletId={route.walletId} /></>;
} }));
afterEach(() => { window.history.replaceState({}, "", "/"); vi.restoreAllMocks(); });

describe("application routing", () => {
  it("opens a nested URL and handles Back/Forward in StrictMode", async () => {
    window.history.replaceState({}, "", "/wallets/goals");
    render(<StrictMode><AppRouter /></StrictMode>);
    expect(screen.getByTestId("route")).toHaveTextContent("/wallets/goals");
    await userEvent.click(screen.getByRole("link", { name: "History" }));
    expect(window.location.pathname).toBe("/history");
    window.history.back();
    await waitFor(() => expect(screen.getByTestId("route")).toHaveTextContent("/wallets/goals"));
    window.history.forward();
    await waitFor(() => expect(screen.getByTestId("route")).toHaveTextContent("/history"));
  });
  it("shows 404 on unknown URLs and recovers without a reload", async () => {
    window.history.replaceState({}, "", "/not-real");
    render(<AppRouter />);
    expect(screen.queryByTestId("route")).not.toBeInTheDocument();
    const t = getDictionary(navigator.language);
    await userEvent.click(screen.getByRole("button", { name: t.errors.actions.goHome }));
    expect(window.location.pathname).toBe("/");
    expect(screen.getByTestId("route")).toHaveTextContent("/");
  });
  it("renders real links with wallet context and leaves modified clicks to the browser", () => {
    window.history.replaceState({}, "", "/?wallet=all");
    render(<AppRouter />);
    const link = screen.getByRole("link", { name: "History" });
    expect(link).toHaveAttribute("href", "/history?wallet=all");
    // Cancel the browser default *after* React's handler, to avoid a jsdom navigation.
    const prevent = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("click", prevent);
    try { fireEvent.click(link, { ctrlKey: true }); } finally { document.removeEventListener("click", prevent); }
    expect(window.location.pathname).toBe("/");
    expect(within(screen.getByRole("navigation")).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });
});
