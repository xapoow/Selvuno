import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { testSettings, testWallet } from "../test/fixtures";
import { WalletsView } from "./WalletsView";

const secondWallet = { ...testWallet, id: "10000000-0000-4000-8000-000000000002", name: "Savings" };
const actions = {
  onCreate: vi.fn(), onUpdate: vi.fn(), onArchive: vi.fn(), onRestore: vi.fn()
};

describe("wallet list rendering", () => {
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
