import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { PinCodeField, PinKeypad } from "./PinKeypad";

function KeypadFixture() {
  const [value, setValue] = useState("");
  return (
    <>
      <PinCodeField label="PIN" value={value} />
      <PinKeypad
        value={value}
        label="PIN keypad"
        deleteLabel="Delete last digit"
        maxLength={4}
        onChange={setValue}
      />
    </>
  );
}

describe("PinKeypad", () => {
  it("enters, limits and deletes digits without a text input", async () => {
    const user = userEvent.setup();
    render(<KeypadFixture />);

    for (const digit of ["4", "8", "2", "6"]) {
      await user.click(screen.getByRole("button", { name: digit }));
    }

    expect(screen.getByRole("button", { name: "PIN" })).toHaveTextContent("4");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Delete last digit" }));
    expect(screen.getByRole("button", { name: "PIN" })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "1" })).toBeEnabled();
  });
});
