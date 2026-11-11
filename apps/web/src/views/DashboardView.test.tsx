import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import type { Settings } from "@selvuno/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { testSettings, testWallet } from "../test/fixtures";
import { DashboardView } from "./DashboardView";
import { normalizeDashboardLayout } from "../lib/dashboardLayout";

afterEach(() => vi.restoreAllMocks());

describe("dashboard balance adjustments", () => {
  it("includes and converts reconciliation balances without creating income or expenses", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const t = getDictionary("en-US");
    const wallet = { ...testWallet, currency: "PLN", balanceReconciliations: [{
      id: "50000000-0000-4000-8000-000000000001", createdAt: "2026-11-04T12:00:00.000Z", currency: "PLN",
      expectedBalanceMinor: 0, actualBalanceMinor: 5000, adjustmentMinor: 5000
    }] };
    render(<QueryClientProvider client={new QueryClient()}><DashboardView
      wallets={[wallet]} categories={[]} transactions={[]} transfers={[]} budgets={[]} settings={testSettings}
      activeWalletId="all" displayCurrency="USD" showBalanceStat t={t}
      exchangeRates={{ base: "USD", date: "2026-11-04", cachedAt: "2026-11-04T12:00:00.000Z", rates: { PLN: 4 } }}
      isUpdatingExchangeRates={false} hasExchangeRateError={false} onAdd={vi.fn()}
      onSetBudget={vi.fn()} onUpdateTransaction={vi.fn()} onDeleteTransaction={vi.fn()}
    /></QueryClientProvider>);
    const stat = (label: string) => screen.getAllByText(label).find((element) => element.tagName === "P")!.parentElement!.parentElement!;
    expect(within(stat(t.common.balance)).getByText("$12.50")).toBeInTheDocument();
    expect(within(stat(t.common.income)).getByText("$0.00")).toBeInTheDocument();
    expect(within(stat(t.common.expenses)).getByText("$0.00")).toBeInTheDocument();
  });
});

function HomeFixture({ settings = testSettings }: { settings?: Settings }) {
  return <QueryClientProvider client={new QueryClient()}><DashboardView
    wallets={[testWallet]} categories={[]} transactions={[]} transfers={[]} budgets={[]} settings={settings}
    activeWalletId="all" displayCurrency="USD" t={getDictionary("en-US")}
    isUpdatingExchangeRates={false} hasExchangeRateError={false} onAdd={vi.fn()}
    onSetBudget={vi.fn()} onUpdateTransaction={vi.fn()} onDeleteTransaction={vi.fn()}
  /></QueryClientProvider>;
}

describe("custom dashboard rendering", () => {
  it("preserves the default blocks and renders custom visibility and order", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { container, rerender } = render(<HomeFixture />);
    const order = () => Array.from(container.querySelectorAll("[data-dashboard-block]")).map((item) => item.getAttribute("data-dashboard-block"));
    expect(order()).toEqual(["summary", "budget", "cashFlow", "recent"]);
    rerender(<HomeFixture settings={{ ...testSettings, dashboardLayout: { order: ["recent", "summary", "goals", "cashFlow", "budget", "insights"], hidden: ["budget", "cashFlow"] } }} />);
    expect(order()).toEqual(["recent", "summary", "goals"]);
  });
  it("allows hiding all blocks without deleting data or forcing a block back on", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const layout = normalizeDashboardLayout();
    const { container } = render(<HomeFixture settings={{ ...testSettings, dashboardLayout: { ...layout, hidden: layout.order } }} />);
    expect(container.querySelector("[data-dashboard-block]")).toBeNull();
    expect(screen.getByText(getDictionary("en-US").homeLayout.empty)).toBeInTheDocument();
  });
});
