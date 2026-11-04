import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet viewport overlay", () => {
  it("escapes transformed and clipped parents, locks scrolling, and restores it on unmount", () => {
    const previousOverflow = document.body.style.overflow;
    const { container, unmount } = render(
      <div style={{ transform: "translateZ(0)", overflow: "hidden", height: 100 }}>
        <BottomSheet open title="Transaction details" onClose={vi.fn()}><p>Receipt</p></BottomSheet>
      </div>
    );
    const dialog = screen.getByRole("dialog", { name: "Transaction details" });
    expect(within(container).queryByRole("dialog")).not.toBeInTheDocument();
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it("closes with Escape and returns focus to the button that opened it", async () => {
    function Fixture() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open details</button>
        <BottomSheet open={open} title="Details" onClose={() => setOpen(false)}>Content</BottomSheet></>;
    }
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open details" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Details" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
