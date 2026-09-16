import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SelectField } from "./SelectField";

describe("SelectField", () => {
  it("closes its option list when keyboard focus leaves the field", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SelectField label="Currency" defaultValue="USD">
          <option value="USD">US Dollar</option>
          <option value="EUR">Euro</option>
        </SelectField>
        <button type="button">Outside</button>
      </div>
    );

    const selectButton = screen.getByRole("button", { name: "Currency" });
    await user.click(selectButton);
    expect(screen.getByRole("listbox", { name: "Currency" })).toBeInTheDocument();

    fireEvent.blur(selectButton, {
      relatedTarget: screen.getByRole("button", { name: "Outside" })
    });

    await waitFor(() =>
      expect(screen.queryByRole("listbox", { name: "Currency" })).not.toBeInTheDocument()
    );
  });
});
