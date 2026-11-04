import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { transactionAttachmentRepository } from "../repositories/transactionAttachmentRepository";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { HistoryView } from "../views/HistoryView";
import { DashboardView } from "../views/DashboardView";
import { TransactionDetailsSheet } from "./TransactionDetailsSheet";

vi.mock("../repositories/transactionAttachmentRepository", () => ({
  transactionAttachmentRepository: { listByTransaction: vi.fn() }
}));

function detailsProps() {
  return {
    open: true, transaction: testTransaction, category: testCategory, wallet: testWallet,
    wallets: [testWallet], categories: [testCategory], settings: testSettings, t: getDictionary("en-US"),
    onClose: vi.fn(), onUpdate: vi.fn().mockResolvedValue(undefined), onDelete: vi.fn().mockResolvedValue(undefined)
  };
}

describe("transaction detail actions", () => {
  beforeEach(() => {
    vi.mocked(transactionAttachmentRepository.listByTransaction).mockReset().mockResolvedValue([]);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it.each(["home", "history"] as const)("edits an operation opened from %s", async (page) => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const common = {
      wallets: [testWallet], categories: [testCategory], transactions: [testTransaction], settings: testSettings,
      activeWalletId: "all" as const, displayCurrency: "USD", t: getDictionary("en-US")
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}>{page === "home" ? (
      <DashboardView {...common} transfers={[]} budgets={[]} isUpdatingExchangeRates={false} hasExchangeRateError={false}
        onAdd={vi.fn()} onSetBudget={vi.fn()} onUpdateTransaction={onUpdate} onDeleteTransaction={vi.fn()} />
    ) : (
      <HistoryView {...common} onUpdate={vi.fn()} onUpdateWithAttachments={onUpdate} onDelete={vi.fn()} />
    )}</QueryClientProvider>);

    await user.click(screen.getByRole("button", { name: /Groceries Everyday.*Receipt for groceries/ }));
    const details = screen.getByRole("dialog", { name: "Transaction details" });
    await user.click(within(details).getByRole("button", { name: "Edit" }));
    const editing = screen.getByRole("dialog", { name: "Edit transaction" });
    const amount = within(editing).getByRole("textbox", { name: "Amount (USD)" });
    await user.clear(amount);
    await user.type(amount, "25");
    await user.click(within(editing).getByRole("button", { name: "Update transaction" }));

    expect(onUpdate).toHaveBeenCalledWith(testTransaction.id, expect.objectContaining({ input: expect.objectContaining({ amountMinor: 2500 }) }));
  });

  it("asks for deletion inside the sheet, supports cancelling and keeps failed deletions open", async () => {
    const user = userEvent.setup();
    const props = detailsProps();
    props.onDelete.mockRejectedValueOnce(new Error("Storage unavailable"));
    render(<TransactionDetailsSheet {...props} />);
    const dialog = screen.getByRole("dialog", { name: "Transaction details" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(props.onDelete).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("heading", { name: "Delete this transaction?" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(props.onDelete).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Unable to delete");
    expect(props.onClose).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(props.onDelete).toHaveBeenLastCalledWith(testTransaction.id);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("reports an attachment loading failure without an unhandled rejection", async () => {
    vi.mocked(transactionAttachmentRepository.listByTransaction).mockRejectedValueOnce(new Error("Read failed"));
    render(<TransactionDetailsSheet {...detailsProps()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load attachments");
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
  });
});
