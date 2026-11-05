import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary, type SettingsTab } from "../i18n";
import { settingsPath, type RoutableSettingsTab } from "../lib/routes";
import { startRouteSync, useAppStore } from "../state/appStore";
import { testSettings } from "../test/fixtures";
import { SettingsView } from "./SettingsView";

const t = getDictionary("en-US");

function Fixture({ onOpenTrash, deletedCount = 0, activeTab, onTabChange }: { onOpenTrash?: () => void; deletedCount?: number; activeTab?: SettingsTab; onTabChange?: (tab: SettingsTab) => void } = {}) {
  const save = vi.fn().mockResolvedValue(undefined);
  return (
    <div style={{ transform: "translateZ(0)", overflow: "hidden", height: 100 }}>
      <SettingsView
        activeTab={activeTab} onTabChange={onTabChange}
        settings={testSettings} categories={[]} backupSnapshots={[]} t={t}
        privacy={{
          pinEnabled: false, locked: false, config: { autoLockMinutes: 0 },
          enablePin: save, changePin: vi.fn(), disablePin: vi.fn(), unlock: vi.fn(),
          lockNow: vi.fn(), setAutoLockMinutes: vi.fn()
        }}
        onUpdateSettings={save} onCreateCategory={save} onUpdateCategory={save}
        onDeleteCategory={save} onReorderCategories={save} onReplaceCategory={save}
        onExportBackup={save} onImportBackup={save} onRestoreBackupSnapshot={save}
        onDeleteBackupSnapshot={save}
        onOpenTrash={onOpenTrash} deletedCount={deletedCount}
      />
    </div>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("mobile settings navigation", () => {
  it("keeps URL changes deferred until the menu closes and restores the section with browser Back", async () => {
    window.history.replaceState({}, "", "/settings/privacy");
    const stop = startRouteSync();
    const previousScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = vi.fn();
    function RoutedSettings() {
      const route = useAppStore((state) => state.route);
      return <Fixture activeTab={route.path === "/settings" ? "general" : route.path?.slice("/settings/".length) as RoutableSettingsTab}
        onTabChange={(tab) => { if (tab !== "debug") useAppStore.getState().navigate(settingsPath(tab)); }} />;
    }
    try {
      const user = userEvent.setup();
      render(<RoutedSettings />);
      await user.click(screen.getByRole("button", { name: `${t.settings.section}: ${t.settings.tabs.privacy}` }));
      const menu = screen.getByRole("dialog", { name: t.settings.section });
      await user.click(within(menu).getByRole("button", { name: t.settings.tabs.appearance }));
      expect(window.location.pathname).toBe("/settings/privacy");
      await waitFor(() => expect(window.location.pathname).toBe("/settings/appearance"));
      expect(screen.getByRole("heading", { name: t.homeLayout.title })).toBeInTheDocument();
      window.history.back();
      await waitFor(() => expect(screen.getByRole("button", { name: `${t.settings.section}: ${t.settings.tabs.privacy}` })).toBeInTheDocument());
      expect(window.location.pathname).toBe("/settings/privacy");
    } finally {
      stop();
      window.history.replaceState({}, "", "/");
      HTMLElement.prototype.scrollIntoView = previousScroll;
    }
  });
  it("offers a permanent Trash entry in general settings", async () => {
    const user = userEvent.setup();
    const openTrash = vi.fn();
    render(<Fixture onOpenTrash={openTrash} deletedCount={3} />);
    const entry = screen.getByRole("button", { name: t.undo.openTrash });
    expect(within(entry).getByText("3")).toBeInTheDocument();
    await user.click(entry);
    expect(openTrash).toHaveBeenCalledOnce();
  });

  it("opens outside clipped parents without scrolling and switches sections only after exit", async () => {
    const scrollIntoView = vi.fn();
    const previousScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    try {
      const user = userEvent.setup();
      const { container } = render(<Fixture />);
      const trigger = screen.getByRole("button", { name: `${t.settings.section}: ${t.settings.tabs.general}` });
      await user.click(trigger);
      const dialog = screen.getByRole("dialog", { name: t.settings.section });
      expect(within(container).queryByRole("dialog")).not.toBeInTheDocument();
      expect(dialog.parentElement?.parentElement).toBe(document.body);
      expect(dialog).toHaveFocus();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(document.body.style.overflow).toBe("hidden");

      await user.click(within(dialog).getByRole("button", { name: t.settings.tabs.privacy }));
      expect(trigger).toHaveAttribute("aria-label", `${t.settings.section}: ${t.settings.tabs.general}`);
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      expect(trigger).toHaveAttribute("aria-label", `${t.settings.section}: ${t.settings.tabs.privacy}`);
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
      expect(document.body.style.overflow).not.toBe("hidden");
    } finally {
      HTMLElement.prototype.scrollIntoView = previousScrollIntoView;
    }
  });

  it("dismisses with Escape without changing the section and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: `${t.settings.section}: ${t.settings.tabs.general}` });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
