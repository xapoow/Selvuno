import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateWalletTotals } from "@selvuno/utils";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { getDictionary } from "../i18n";
import { queryKeys } from "../lib/queryKeys";
import { transactionRepository } from "../repositories/transactionRepository";
import { useFinanceMutations } from "../state/useFinanceQueries";
import { useTransactionDeletion } from "../state/useTransactionDeletion";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { HistoryView } from "../views/HistoryView";
import { TransactionTrash } from "./TransactionTrash";
import { TransactionUndoNotice } from "./TransactionUndoNotice";

const t = getDictionary("en-US");

function Fixture() {
  const active = useQuery({ queryKey: queryKeys.transactions, queryFn: () => transactionRepository.listTransactions() });
  const trash = useQuery({ queryKey: queryKeys.deletedTransactions, queryFn: () => transactionRepository.listDeletedTransactions() });
  const mutations = useFinanceMutations();
  const deletion = useTransactionDeletion({ deleteTransactions: mutations.deleteTransactions.mutateAsync, restoreTransactions: mutations.restoreTransactions.mutateAsync });
  const [open, setOpen] = useState(false);
  const transactions = active.data ?? [];
  const save = vi.fn().mockResolvedValue(undefined);
  return <>
    <output aria-label="Balance">{calculateWalletTotals(testWallet, transactions, []).balanceMinor}</output>
    <HistoryView wallets={[testWallet]} categories={[testCategory]} transactions={transactions}
      settings={testSettings} t={t} activeWalletId="all" displayCurrency="USD" desktopTools
      onDelete={deletion.deleteOne} onDeleteMany={deletion.deleteMany} onUpdate={save} onUpdateWithAttachments={save}
      onOpenTrash={() => { deletion.dismiss(); setOpen(true); }} deletedCount={trash.data?.length ?? 0}
    />
    <TransactionUndoNotice deletion={deletion} t={t} onOpenTrash={() => setOpen(true)} />
    <TransactionTrash open={open} onClose={() => setOpen(false)} transactions={trash.data ?? []}
      wallets={[testWallet]} categories={[testCategory]} settings={testSettings} t={t}
      loading={trash.isLoading} loadError={trash.isError} onRetry={() => { void trash.refetch(); }}
      onRestore={mutations.restoreTransactions.mutateAsync}
    />
  </>;
}

beforeEach(async () => {
  await resetDatabaseForTests();
  await financeDb.wallets.put(testWallet);
  await financeDb.categories.put(testCategory);
  await financeDb.transactions.put(testTransaction);
});
afterEach(() => vi.restoreAllMocks());

describe("transaction deletion workflow", () => {
  it("deletes without a system prompt, updates the balance, undoes and restores from Trash", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><Fixture /></QueryClientProvider>);
    await screen.findByText("Receipt for groceries", { exact: false });
    expect(screen.getByLabelText("Balance")).toHaveTextContent("-1250");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const notice = await screen.findByRole("complementary", { name: t.undo.title });
    await waitFor(() => expect(screen.getByLabelText("Balance")).toHaveTextContent("0"));
    expect(confirm).not.toHaveBeenCalled();
    await user.click(within(notice).getByRole("button", { name: t.undo.action }));
    await waitFor(() => expect(screen.getByLabelText("Balance")).toHaveTextContent("-1250"));

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByRole("button", { name: "Trash (1)" });
    await user.click(screen.getByRole("button", { name: "Trash (1)" }));
    const dialog = screen.getByRole("dialog", { name: t.undo.trash });
    await user.click(within(dialog).getByRole("button", { name: "Restore: Groceries" }));
    await waitFor(() => expect(screen.getByLabelText("Balance")).toHaveTextContent("-1250"));
    expect(await within(dialog).findByText(t.undo.empty)).toBeInTheDocument();
  });

  it("undoes a bulk table deletion as one action", async () => {
    await financeDb.transactions.add({ ...testTransaction, id: "30000000-0000-4000-8000-000000000002", note: "Second purchase" });
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><Fixture /></QueryClientProvider>);
    await screen.findByText("Second purchase", { exact: false });
    await user.click(screen.getByRole("button", { name: t.history.viewTable }));
    await user.click(screen.getByRole("checkbox", { name: t.history.selectAll }));
    await user.click(screen.getByRole("button", { name: t.history.deleteSelected }));
    const notice = await screen.findByRole("complementary", { name: t.undo.title });
    expect(within(notice).getByRole("status")).toHaveTextContent("Transactions deleted: 2");
    await waitFor(() => expect(screen.getByLabelText("Balance")).toHaveTextContent("0"));
    await user.click(within(notice).getByRole("button", { name: t.undo.action }));
    await waitFor(() => expect(screen.getByLabelText("Balance")).toHaveTextContent("-2500"));
    expect(await transactionRepository.listTransactions()).toHaveLength(2);
  });
});
