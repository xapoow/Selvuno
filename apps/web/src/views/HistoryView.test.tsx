import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { downloadCsv } from "../lib/csv";
import { defaultHistoryFilters, persistSavedHistoryFilters, readSavedHistoryFilters } from "../lib/historyFilters";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { HistoryView } from "./HistoryView";

vi.mock("../lib/csv", async (original) => ({ ...await original<typeof import("../lib/csv")>(), downloadCsv: vi.fn() }));
const t = getDictionary("en-US");
const transport = { ...testCategory, id: "20000000-0000-4000-8000-000000000002", name: "Transport" };
const salary = { ...testCategory, id: "20000000-0000-4000-8000-000000000003", name: "Salary", type: "income" as const };
const transactions = [
  { ...testTransaction, note: "Office receipt", attachmentCount: 1 },
  { ...testTransaction, id: "30000000-0000-4000-8000-000000000002", categoryId: transport.id, note: "Metro receipt", amountMinor: 2500, attachmentCount: 1 },
  { ...testTransaction, id: "30000000-0000-4000-8000-000000000003", note: "Weekend lunch", amountMinor: 5000 },
  { ...testTransaction, id: "30000000-0000-4000-8000-000000000004", categoryId: salary.id, note: "Paycheck", amountMinor: 90000, type: "income" as const }
];

function mount(extra = transactions) {
  const save = vi.fn().mockResolvedValue(undefined);
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <HistoryView wallets={[testWallet]} categories={[testCategory, transport, salary]} transactions={extra}
      settings={testSettings} activeWalletId="all" displayCurrency="USD" desktopTools t={t}
      exchangeRates={{ base: "USD", date: "2026-11-04", cachedAt: "2026-11-04T12:00:00Z", rates: {} }}
      onUpdate={save} onUpdateWithAttachments={save} onDelete={save} />
  </QueryClientProvider>);
}

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

describe("history advanced search", () => {
  it("applies categories, receipts and amounts to list, table and CSV, and clears everything", async () => {
    const user = userEvent.setup();
    const { container } = mount();
    await user.click(screen.getByRole("button", { name: t.historyFilters.title }));
    const dialog = screen.getByRole("dialog", { name: t.historyFilters.title });
    await user.click(within(dialog).getByRole("button", { name: "Groceries" }));
    await user.click(within(dialog).getByRole("button", { name: "Transport" }));
    await user.click(within(dialog).getByRole("button", { name: t.historyFilters.attachments }));
    await user.click(within(dialog).getByRole("option", { name: t.historyFilters.withAttachments }));
    await user.type(within(dialog).getByRole("textbox", { name: "From (USD)" }), "10");
    await user.type(within(dialog).getByRole("textbox", { name: "To (USD)" }), "30");
    await user.click(within(dialog).getByRole("button", { name: t.historyFilters.apply }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(within(container).getByText(/Office receipt/)).toBeInTheDocument();
    expect(within(container).getByText(/Metro receipt/)).toBeInTheDocument();
    expect(within(container).queryByText(/Weekend lunch/)).not.toBeInTheDocument();
    expect(within(container).queryByText(/Paycheck/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.history.viewTable }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).queryByText("Weekend lunch")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.history.exportCsv }));
    const csv = vi.mocked(downloadCsv).mock.calls[0][1];
    expect(csv).toContain("Office receipt");
    expect(csv).toContain("Metro receipt");
    expect(csv).not.toContain("Weekend lunch");
    await user.click(screen.getByRole("button", { name: t.historyFilters.reset }));
    expect(screen.getByText("Weekend lunch")).toBeInTheDocument();
    expect(screen.getByText("Paycheck")).toBeInTheDocument();
  });

  it("saves, reloads, applies and removes a filter set without changing the current search", async () => {
    const user = userEvent.setup();
    const first = mount();
    await user.type(screen.getByRole("textbox", { name: t.history.search }), "office");
    await user.click(screen.getByRole("button", { name: t.historyFilters.title }));
    let dialog = screen.getByRole("dialog", { name: t.historyFilters.title });
    await user.click(within(dialog).getByRole("button", { name: t.historyFilters.save }));
    await user.type(within(dialog).getByRole("textbox", { name: t.historyFilters.name }), "Office receipts");
    await user.click(within(dialog).getByRole("button", { name: t.historyFilters.saveApply }));
    expect(readSavedHistoryFilters()[0]).toMatchObject({ name: "Office receipts", filters: { query: "office", currency: "USD" } });
    first.unmount();
    const second = mount();
    expect(within(second.container).getByText(/Weekend lunch/)).toBeInTheDocument();
    await user.click(within(screen.getByRole("group", { name: t.historyFilters.saved })).getByRole("button", { name: "Office receipts" }));
    expect(within(second.container).queryByText(/Weekend lunch/)).not.toBeInTheDocument();
    expect(within(second.container).getByText(/Office receipt$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.historyFilters.title }));
    dialog = screen.getByRole("dialog", { name: t.historyFilters.title });
    await user.click(within(dialog).getByRole("button", { name: `${t.historyFilters.deleteSaved}: Office receipts` }));
    expect(readSavedHistoryFilters()).toHaveLength(0);
    expect(within(dialog).getByRole("textbox", { name: t.history.search })).toHaveValue("office");
  });

  it("warns about foreign-currency records excluded from an amount range without a rate", async () => {
    persistSavedHistoryFilters([{ id: testWallet.id, name: "Small amounts", filters: { ...defaultHistoryFilters("USD"), minimum: "10", maximum: "20" } }]);
    const user = userEvent.setup();
    const { container } = mount([...transactions, { ...testTransaction, id: "30000000-0000-4000-8000-000000000005", currency: "PLN", amountMinor: 5000, note: "Foreign payment" }]);
    await user.click(within(screen.getByRole("group", { name: t.historyFilters.saved })).getByRole("button", { name: "Small amounts" }));
    expect(within(container).queryByText(/Foreign payment/)).not.toBeInTheDocument();
    expect(screen.getByText(/Some transactions have no exchange rate for USD/)).toHaveTextContent("Excluded: 1.");
  });
});
