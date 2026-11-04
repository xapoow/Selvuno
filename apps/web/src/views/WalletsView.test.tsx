import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { testSettings, testWallet } from "../test/fixtures";
import { WalletsView } from "./WalletsView";

const secondWallet = { ...testWallet, id: "10000000-0000-4000-8000-000000000002", name: "Savings" };
const actions = {
  onCreate: vi.fn(), onUpdate: vi.fn(), onArchive: vi.fn(), onRestore: vi.fn()
};

describe("wallet list rendering", () => {
  it("keeps the sheet open while a reconciliation is being saved", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const onReconcile = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const t = getDictionary("en-US");
    render(<WalletsView {...actions} wallets={[testWallet]} archivedWallets={[]} transactions={[]} transfers={[]}
      settings={testSettings} t={t} onReconcile={onReconcile} />);
    await user.click(screen.getByRole("button", { name: t.reconciliation.action }));
    const dialog = screen.getByRole("dialog", { name: t.reconciliation.title });
    await user.type(within(dialog).getByRole("textbox", { name: "Actual balance (USD)" }), "0");
    await user.click(within(dialog).getByRole("button", { name: t.reconciliation.confirmMatch }));
    expect(within(dialog).getByRole("button", { name: t.common.close })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    await act(async () => { finish(); });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("opens reconciliation for the chosen wallet and saves a matching zero balance", async () => {
    const user = userEvent.setup();
    const onReconcile = vi.fn().mockResolvedValue(undefined);
    const t = getDictionary("en-US");
    render(<WalletsView {...actions} wallets={[testWallet]} archivedWallets={[]} transactions={[]} transfers={[]}
      settings={testSettings} t={t} onReconcile={onReconcile} />);
    await user.click(screen.getByRole("button", { name: t.reconciliation.action }));
    const dialog = screen.getByRole("dialog", { name: t.reconciliation.title });
    await user.type(within(dialog).getByRole("textbox", { name: "Actual balance (USD)" }), "0");
    await user.click(within(dialog).getByRole("button", { name: t.reconciliation.confirmMatch }));
    expect(onReconcile).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ walletId: testWallet.id, expectedBalanceMinor: 0, actualBalanceMinor: 0 }));
  });

  it.each([
    { name: "one wallet", wallets: [testWallet], activeWalletId: "all", onReorder: vi.fn() },
    { name: "a list without reordering", wallets: [testWallet, secondWallet], activeWalletId: "all", onReorder: undefined },
    { name: "one selected wallet", wallets: [testWallet, secondWallet], activeWalletId: testWallet.id, onReorder: vi.fn() },
    { name: "a reorderable list", wallets: [testWallet, secondWallet], activeWalletId: "all", onReorder: vi.fn() }
  ])("opens $name without crashing", ({ wallets, activeWalletId, onReorder }) => {
    render(
      <StrictMode>
        <WalletsView {...actions} wallets={wallets} archivedWallets={[]} transactions={[]} transfers={[]}
          settings={testSettings} t={getDictionary("en-US")} activeWalletId={activeWalletId} onReorder={onReorder} />
      </StrictMode>
    );
    expect(screen.getByRole("heading", { name: "Everyday" })).toBeInTheDocument();
    if (activeWalletId === testWallet.id) {
      expect(screen.queryByRole("heading", { name: "Savings" })).not.toBeInTheDocument();
    }
  });
});
