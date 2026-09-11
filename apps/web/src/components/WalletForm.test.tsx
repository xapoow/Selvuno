import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { WalletForm } from "./WalletForm";

describe("WalletForm advanced controls", () => {
  it("keeps advanced fields hidden until the feature is enabled", () => {
    const { rerender } = render(
      <WalletForm
        defaultCurrency="USD"
        t={getDictionary("en-US")}
        submitLabel="Create"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Credit" })).not.toBeInTheDocument();

    rerender(
      <WalletForm
        defaultCurrency="USD"
        advancedWalletsEnabled
        t={getDictionary("en-US")}
        submitLabel="Create"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Credit" })).toBeInTheDocument();
  });

  it("submits credit and per-wallet options explicitly", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <WalletForm
        defaultCurrency="USD"
        advancedWalletsEnabled
        t={getDictionary("en-US")}
        submitLabel="Create"
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText("Name"), "Credit card");
    await user.click(screen.getByRole("button", { name: "Credit" }));
    await user.clear(screen.getByLabelText("Credit limit (USD)"));
    await user.type(screen.getByLabelText("Credit limit (USD)"), "1500");
    await user.click(screen.getByRole("switch", { name: "Exclude from totals" }));
    await user.click(screen.getByRole("switch", { name: "Hide this wallet's balance" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Credit card",
        kind: "credit",
        creditLimitMinor: 150000,
        excludeFromTotals: true,
        hideBalance: true
      })
    );
  });
});
