import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { haptics } from "../lib/haptics";
import { LockScreen } from "./LockScreen";

afterEach(() => vi.restoreAllMocks());

describe("LockScreen", () => {
  it("only requests error feedback after an incorrect PIN, not on individual digits", async () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const onUnlock = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(<LockScreen t={getDictionary("en-US")} onUnlock={onUnlock} hapticsEnabled />);
    for (let index = 0; index < 6; index += 1) await user.click(screen.getByRole("button", { name: "1" }));
    expect(play).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    await screen.findByText("Incorrect PIN. Try again.");
    expect(play).toHaveBeenCalledExactlyOnceWith("error", true);
  });

  it("does not request error feedback for a valid PIN", async () => {
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const user = userEvent.setup();
    render(<LockScreen t={getDictionary("en-US")} onUnlock={vi.fn().mockResolvedValue(true)} hapticsEnabled />);
    for (let index = 0; index < 6; index += 1) await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    expect(play).not.toHaveBeenCalled();
  });
  it("shows an error for an invalid PIN and allows another attempt", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn().mockResolvedValue(false);
    render(<LockScreen t={getDictionary("en-US")} onUnlock={onUnlock} />);

    const pinField = screen.getByRole("button", { name: "PIN" });
    for (let index = 0; index < 6; index += 1) {
      await user.click(screen.getByRole("button", { name: "1" }));
    }
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    expect(onUnlock).toHaveBeenCalledWith("111111");
    expect(await screen.findByText("Incorrect PIN. Try again.")).toBeInTheDocument();
    expect(pinField).toHaveTextContent("0");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
