import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { WalletBalanceChangedError } from "../lib/walletReconciliation";
import { testSettings, testTransaction, testWallet } from "../test/fixtures";
import { WalletReconciliationForm } from "./WalletReconciliationForm";

const t = getDictionary("en-US");
function props() {
  return { wallet: { ...testWallet, initialBalanceMinor: 10_000 }, transactions: [testTransaction], transfers: [], settings: testSettings, t, onSubmit: vi.fn().mockResolvedValue(undefined) };
}

describe("WalletReconciliationForm", () => {
  it("previews the difference and submits the exact actual and expected balances", async () => {
    const input = props();
    const user = userEvent.setup();
    render(<WalletReconciliationForm {...input} />);
    await user.type(screen.getByRole("textbox", { name: "Actual balance (USD)" }), "90.00");
    expect(screen.getByText("+$2.50")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: t.reconciliation.note }), "Checked bank");
    await user.click(screen.getByRole("button", { name: t.reconciliation.applyAdjustment }));
    expect(input.onSubmit).toHaveBeenCalledWith({ walletId: testWallet.id, currency: "USD", expectedBalanceMinor: 8750, actualBalanceMinor: 9000, note: "Checked bank" });
  });

  it("validates currency precision and supports negative and matching balances", async () => {
    const input = props();
    const user = userEvent.setup();
    render(<WalletReconciliationForm {...input} />);
    const field = screen.getByRole("textbox", { name: "Actual balance (USD)" });
    await user.type(field, "90.001");
    await user.click(screen.getByRole("button", { name: t.reconciliation.applyAdjustment }));
    expect(screen.getByRole("alert")).toHaveTextContent(t.reconciliation.invalidAmount);
    expect(input.onSubmit).not.toHaveBeenCalled();
    await user.clear(field);
    await user.type(field, "10");
    await user.click(screen.getByRole("button", { name: t.reconciliation.toggleSign }));
    expect(field).toHaveValue("-10");
    await user.clear(field);
    await user.type(field, "87.50");
    expect(screen.getByText(t.reconciliation.matched)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.reconciliation.confirmMatch }));
    expect(input.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ actualBalanceMinor: 8750, expectedBalanceMinor: 8750 }));
  });

  it("keeps stale balance failures visible and respects hidden amounts until explicitly revealed", async () => {
    const input = props();
    input.settings = { ...testSettings, hideAmounts: true };
    input.onSubmit.mockRejectedValueOnce(new WalletBalanceChangedError());
    const user = userEvent.setup();
    render(<WalletReconciliationForm {...input} />);
    expect(screen.queryByText("$87.50")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.settings.showAmounts }));
    expect(screen.getByText("$87.50")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Actual balance (USD)" }), "90");
    await user.click(screen.getByRole("button", { name: t.reconciliation.applyAdjustment }));
    expect(screen.getByRole("alert")).toHaveTextContent(t.reconciliation.balanceChanged);
    expect(screen.getByRole("button", { name: t.reconciliation.applyAdjustment })).toBeEnabled();
  });
});
