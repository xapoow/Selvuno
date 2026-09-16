import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { LockScreen } from "./LockScreen";

describe("LockScreen", () => {
  it("shows an error for an invalid PIN and allows another attempt", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn().mockResolvedValue(false);
    render(<LockScreen t={getDictionary("en-US")} onUnlock={onUnlock} />);

    const pinField = screen.getByRole("button", { name: "PIN" });
    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole("button", { name: "1" }));
    }
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    expect(onUnlock).toHaveBeenCalledWith("1111");
    expect(await screen.findByText("Incorrect PIN. Try again.")).toBeInTheDocument();
    expect(pinField).toHaveTextContent("0");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
