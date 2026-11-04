import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { defaultHistoryFilters } from "../lib/historyFilters";
import { testCategory } from "../test/fixtures";
import { HistoryFilterForm } from "./HistoryFilterForm";

const t = getDictionary("en-US");
function props() {
  return { initial: defaultHistoryFilters("USD"), categories: [testCategory], currencies: ["USD"], saved: [], locale: "en-US", t,
    onApply: vi.fn(), onSave: vi.fn(), onDeleteSaved: vi.fn() };
}

describe("HistoryFilterForm", () => {
  it("does not apply an inverted range until it is corrected", async () => {
    const input = props();
    const user = userEvent.setup();
    render(<HistoryFilterForm {...input} />);
    await user.type(screen.getByRole("textbox", { name: "From (USD)" }), "20");
    await user.type(screen.getByRole("textbox", { name: "To (USD)" }), "10");
    await user.click(screen.getByRole("button", { name: t.historyFilters.apply }));
    expect(screen.getByRole("alert")).toHaveTextContent(t.historyFilters.invalidRange);
    expect(input.onApply).not.toHaveBeenCalled();
    await user.clear(screen.getByRole("textbox", { name: "To (USD)" }));
    await user.type(screen.getByRole("textbox", { name: "To (USD)" }), "30");
    await user.click(screen.getByRole("button", { name: t.historyFilters.apply }));
    expect(input.onApply).toHaveBeenCalledWith(expect.objectContaining({ minimum: "20", maximum: "30", currency: "USD" }));
  });

  it("keeps the draft and current search unchanged on a save failure and allows retry", async () => {
    const input = props();
    input.onSave.mockImplementationOnce(() => { throw new Error("Storage full"); });
    const user = userEvent.setup();
    render(<HistoryFilterForm {...input} />);
    await user.click(screen.getByRole("button", { name: "Groceries" }));
    await user.click(screen.getByRole("button", { name: t.historyFilters.save }));
    await user.type(screen.getByRole("textbox", { name: t.historyFilters.name }), "Work");
    await user.click(screen.getByRole("button", { name: t.historyFilters.saveApply }));
    expect(screen.getByRole("alert")).toHaveTextContent(t.historyFilters.storageError);
    expect(input.onApply).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Groceries" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: t.historyFilters.saveApply }));
    expect(input.onSave).toHaveBeenLastCalledWith("Work", expect.objectContaining({ categoryIds: [testCategory.id] }));
    expect(input.onApply).toHaveBeenCalledOnce();
  });
});
