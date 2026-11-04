import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { TransactionTrash } from "./TransactionTrash";

const t = getDictionary("en-US");
const deletedAt = "2026-11-04T12:00:00.000Z";
function props() {
  return {
    open: true, transactions: [{ ...testTransaction, deletedAt }], wallets: [testWallet], categories: [testCategory],
    settings: { ...testSettings, hideAmounts: true }, t, loading: false, loadError: false,
    onClose: vi.fn(), onRetry: vi.fn(), onRestore: vi.fn().mockResolvedValue(undefined)
  };
}

describe("TransactionTrash", () => {
  it("respects hidden amounts and keeps restore failures visible for retry", async () => {
    const user = userEvent.setup();
    const input = props();
    input.onRestore.mockRejectedValueOnce(new Error("Storage unavailable"));
    render(<TransactionTrash {...input} />);
    expect(screen.queryByText(/12[.,]50/)).not.toBeInTheDocument();
    const restore = screen.getByRole("button", { name: "Restore: Groceries" });
    await user.click(restore);
    expect(await screen.findByRole("alert")).toHaveTextContent(t.undo.restoreError);
    expect(input.onClose).not.toHaveBeenCalled();
    await user.click(restore);
    expect(input.onRestore).toHaveBeenLastCalledWith([{ id: testTransaction.id, deletedAt }]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("restores all displayed records with one batch request", async () => {
    const user = userEvent.setup();
    const input = props();
    const second = { ...testTransaction, id: "30000000-0000-4000-8000-000000000002", deletedAt };
    input.transactions.push(second);
    render(<TransactionTrash {...input} />);
    await user.click(screen.getByRole("button", { name: t.undo.restoreAll }));
    expect(input.onRestore).toHaveBeenCalledExactlyOnceWith([
      { id: testTransaction.id, deletedAt }, { id: second.id, deletedAt }
    ]);
  });
});
