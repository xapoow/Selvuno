import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { getDictionary } from "../i18n";
import { testCategory, testSettings, testWallet } from "../test/fixtures";
import { TransactionForm } from "./TransactionForm";

const t = getDictionary("en-US");
const fields = { type: "expense" as const, walletId: testWallet.id, currency: "USD", categoryId: testCategory.id, amount: "42", date: "2026-11-11", note: "Unfinished", tagsInput: "receipt" };
beforeEach(async () => { await resetDatabaseForTests(); await financeDb.settings.put(testSettings); });
function Form({ submit = vi.fn().mockResolvedValue(undefined), enabled = true }: { submit?: () => Promise<void>; enabled?: boolean }) {
  return <TransactionForm settings={{ ...testSettings, draftsEnabled: enabled }} wallets={[testWallet]} categories={[testCategory]} activeWalletId={testWallet.id} t={t} submitLabel="Save operation" onSubmit={submit} />;
}
describe("draft recovery UX", () => {
  it("offers a draft without applying or overwriting it, then clears it only after a successful save", async () => {
    await financeDb.transactionDrafts.put({ id: `new-entry:${testWallet.id}`, updatedAt: new Date().toISOString(), fields, files: [] });
    const submit = vi.fn().mockRejectedValueOnce(new Error("storage full")).mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { unmount } = render(<Form submit={submit} />);
    await screen.findByText(t.safety.foundDraft);
    expect(screen.getByRole("textbox", { name: "Amount (USD)" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save operation" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: t.safety.resume }));
    expect(screen.getByRole("textbox", { name: "Amount (USD)" })).toHaveValue("42");
    await user.click(screen.getByRole("button", { name: "Save operation" }));
    await screen.findByText("storage full");
    expect(await financeDb.transactionDrafts.count()).toBe(1);
    await user.click(screen.getByRole("button", { name: "Save operation" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Amount (USD)" })).toHaveValue(""));
    unmount();
    await waitFor(async () => expect(await financeDb.transactionDrafts.count()).toBe(0));
  });
  it("flushes changes when leaving the form and can recover them on return", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Form />);
    await user.type(screen.getByRole("textbox", { name: "Amount (USD)" }), "18+2");
    await waitFor(() => expect(screen.getByText(t.safety.draftSaved)).toBeInTheDocument());
    unmount();
    render(<Form />);
    await screen.findByText(t.safety.foundDraft);
    await user.click(screen.getByRole("button", { name: t.safety.resume }));
    expect(screen.getByRole("textbox", { name: "Amount (USD)" })).toHaveValue("18+2");
  });
  it("does not offer or write drafts when disabled", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Form enabled={false} />);
    await user.type(screen.getByRole("textbox", { name: "Amount (USD)" }), "15");
    unmount();
    expect(await financeDb.transactionDrafts.count()).toBe(0);
  });
});
