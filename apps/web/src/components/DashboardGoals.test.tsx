import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { savingsGoalSchema, savingsGoalContributionSchema } from "@myfinances/types";
import { getDictionary } from "../i18n";
import { testSettings, testWallet } from "../test/fixtures";
import { DashboardGoals } from "./DashboardGoals";

const goal = savingsGoalSchema.parse({ ...testWallet, id: "70000000-0000-4000-8000-000000000001", walletId: testWallet.id, name: "Laptop", color: "#207a6f", targetAmountMinor: 100000 });
const contribution = savingsGoalContributionSchema.parse({ ...testWallet, id: "80000000-0000-4000-8000-000000000001", goalId: goal.id, amountMinor: 25000, contributionDate: testWallet.createdAt });
const t = getDictionary("en-US");

describe("home goals", () => {
  it("shows progress in the goal's own currency and opens goals", async () => {
    const onOpen = vi.fn();
    render(<DashboardGoals goals={[goal]} contributions={[contribution, { ...contribution, deletedAt: testWallet.createdAt }]} wallets={[testWallet]} settings={testSettings} activeWalletId="all" t={t} onOpen={onOpen} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("$250.00 / $1,000.00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: t.homeLayout.openGoals }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
  it("hides both amounts and progress when privacy is on", () => {
    render(<DashboardGoals goals={[goal]} contributions={[contribution]} wallets={[testWallet]} settings={{ ...testSettings, hideAmounts: true }} activeWalletId="all" t={t} onOpen={vi.fn()} />);
    expect(screen.queryByText(/250/)).not.toBeInTheDocument();
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });
  it("filters other wallets, deleted goals and archived wallets", () => {
    render(<DashboardGoals goals={[goal, { ...goal, id: "other", deletedAt: testWallet.createdAt }]} contributions={[]} wallets={[testWallet]} settings={testSettings} activeWalletId="other-wallet" t={t} onOpen={vi.fn()} />);
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
    expect(screen.getByText(t.goals.empty)).toBeInTheDocument();
  });
});
