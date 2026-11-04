import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Settings, SettingsUpdate } from "@myfinances/types";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { normalizeDashboardLayout } from "../lib/dashboardLayout";
import { testSettings } from "../test/fixtures";
import { HomeLayoutSettings } from "./HomeLayoutSettings";

const t = getDictionary("en-US");
function Fixture({ save, initial = testSettings }: { save: (update: SettingsUpdate) => Promise<void>; initial?: Settings }) {
  const [settings, setSettings] = useState(initial);
  return <HomeLayoutSettings settings={settings} t={t} onUpdateSettings={async (update) => { await save(update); setSettings((previous) => ({ ...previous, ...update })); }} />;
}

describe("home customization controls", () => {
  it("hides blocks and explicitly enables goals and observations", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<Fixture save={save} />);
    await user.click(screen.getByRole("switch", { name: t.homeLayout.blocks.budget.title }));
    expect(save).toHaveBeenLastCalledWith({ dashboardLayout: { ...normalizeDashboardLayout(), hidden: ["goals", "budget"] } });
    await user.click(screen.getByRole("switch", { name: t.homeLayout.blocks.goals.title }));
    expect(screen.getByRole("switch", { name: t.homeLayout.blocks.goals.title })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch", { name: t.homeLayout.blocks.insights.title }));
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ smartInsightsEnabled: true }));
    expect(screen.getByRole("switch", { name: t.homeLayout.blocks.insights.title })).toHaveAttribute("aria-checked", "true");
  });
  it("supports arrows, keyboard reordering and reset without disabling other features", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<Fixture save={save} initial={{ ...testSettings, smartInsightsEnabled: true }} />);
    await user.click(screen.getByRole("button", { name: `${t.homeLayout.up}: ${t.homeLayout.blocks.budget.title}` }));
    expect(save.mock.calls.at(-1)?.[0].dashboardLayout.order[0]).toBe("budget");
    screen.getByRole("button", { name: `${t.homeLayout.drag}: ${t.homeLayout.blocks.budget.title}` }).focus();
    await user.keyboard("{ArrowDown}");
    expect(save.mock.calls.at(-1)?.[0].dashboardLayout.order[0]).toBe("summary");
    await user.click(screen.getByRole("switch", { name: t.homeLayout.blocks.goals.title }));
    await user.click(screen.getByRole("button", { name: t.homeLayout.reset }));
    expect(save).toHaveBeenLastCalledWith({ dashboardLayout: normalizeDashboardLayout() });
    expect(screen.getByRole("switch", { name: t.homeLayout.blocks.goals.title })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: t.homeLayout.blocks.insights.title })).toHaveAttribute("aria-checked", "true");
  });
  it("restores the previous layout and reports failed persistence", async () => {
    const save = vi.fn().mockRejectedValue(new Error("storage full"));
    render(<Fixture save={save} />);
    await userEvent.click(screen.getByRole("switch", { name: t.homeLayout.blocks.budget.title }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(t.homeLayout.saveError));
    expect(screen.getByRole("switch", { name: t.homeLayout.blocks.budget.title })).toHaveAttribute("aria-checked", "true");
  });
});
