import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsToggleCard } from "./SettingsToggleCard";

describe("SettingsToggleCard", () => {
  it("keeps the thumb inside the track in both states", () => {
    const { rerender } = render(
      <SettingsToggleCard
        checked={false}
        icon={<span />}
        label="Setting"
        hint="Hint"
        onChange={vi.fn()}
      />
    );

    const getThumb = () => screen.getByRole("switch").querySelector("span > span");
    expect(getThumb()).toHaveClass("left-0.5", "translate-x-0");
    expect(getThumb()).not.toHaveClass("translate-x-6");

    rerender(
      <SettingsToggleCard
        checked
        icon={<span />}
        label="Setting"
        hint="Hint"
        onChange={vi.fn()}
      />
    );

    expect(getThumb()).toHaveClass("left-0.5", "translate-x-6");
  });

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
