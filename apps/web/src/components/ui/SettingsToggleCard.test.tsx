import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsToggleCard } from "./SettingsToggleCard";

describe("SettingsToggleCard", () => {
  it("prevents repeated changes while a setting is being saved", async () => {
    const user = userEvent.setup();
    let finishSaving: (() => void) | undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSaving = resolve;
        })
    );

    render(
      <SettingsToggleCard
        checked={false}
        icon={<span>icon</span>}
        label="Smart setting"
        hint="Optional behavior"
        onChange={onChange}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Smart setting" });
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledTimes(1);

    finishSaving?.();
    await waitFor(() => expect(toggle).toBeEnabled());
  });

  it("recovers its control after a failed save", async () => {
    const user = userEvent.setup();
    render(
      <SettingsToggleCard
        checked
        icon={<span>icon</span>}
        label="Smart setting"
        hint="Optional behavior"
        onChange={vi.fn().mockRejectedValue(new Error("offline"))}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Smart setting" });
    await user.click(toggle);

    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});
