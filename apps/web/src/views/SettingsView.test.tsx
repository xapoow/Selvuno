import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { backupSchema } from "@selvuno/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary, type SettingsTab } from "../i18n";
import { settingsPath, type RoutableSettingsTab } from "../lib/routes";
import { startRouteSync, useAppStore } from "../state/appStore";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { createBackupArchive } from "../lib/backupArchive";
import { SettingsView } from "./SettingsView";

const t = getDictionary("en-US");

function Fixture({ onOpenTrash, deletedCount = 0, activeTab, onTabChange, overrides }: { onOpenTrash?: () => void; deletedCount?: number; activeTab?: SettingsTab; onTabChange?: (tab: SettingsTab) => void; overrides?: Partial<Parameters<typeof SettingsView>[0]> } = {}) {
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
        {...overrides}
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

describe("backup review UX", () => {
  const backup = backupSchema.parse({ version: 8, exportedAt: "2026-11-11T10:00:00.000Z", settings: testSettings,
    wallets: [testWallet], categories: [testCategory], transactions: [testTransaction], budgets: [], recurringTransactions: [],
    savingsGoals: [], savingsGoalContributions: [], walletTransfers: [], transactionTemplates: [] });

  it("previews a validated archive without restoring it until explicit confirmation", async () => {
    const blob = new Blob(["receipt"], { type: "image/jpeg" });
    const archive = await createBackupArchive({ data: backup, attachments: [{ id: "file-1", transactionId: testTransaction.id,
      name: "receipt.jpg", size: blob.size, mimeType: blob.type, blob, createdAt: testTransaction.createdAt }] });
    const restore = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { container } = render(<Fixture activeTab="backup" overrides={{ onImportBackup: restore }} />);
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, new File([archive], "backup.zip", { type: "application/zip" }));
    const dialog = await screen.findByRole("dialog", { name: t.safety.preview });
    expect(within(dialog).getByText(t.safety.overview)).toBeInTheDocument();
    expect(restore).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: t.safety.confirm }));
    await waitFor(() => expect(restore).toHaveBeenCalledOnce());
    expect(restore.mock.calls[0][0]).toMatchObject({ kind: "full-backup", attachments: [{ name: "receipt.jpg" }] });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("warns about legacy JSON and preserves the preview after a failed restore for retry", async () => {
    const restore = vi.fn().mockRejectedValueOnce(new Error("archive-incomplete")).mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { container } = render(<Fixture activeTab="backup" overrides={{ onImportBackup: restore }} />);
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, new File([JSON.stringify(backup)], "old.json", { type: "application/json" }));
    const dialog = await screen.findByRole("dialog", { name: t.safety.preview });
    expect(within(dialog).getByText(t.safety.legacy)).toBeInTheDocument();
    expect(restore).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: t.safety.confirm }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(t.safety["archive-incomplete"]);
    await user.click(within(dialog).getByRole("button", { name: t.safety.confirm }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(restore).toHaveBeenCalledTimes(2);
    expect(restore.mock.calls[1][0]).toEqual(backup);
  });

  it("rejects invalid files without opening a restore confirmation", async () => {
    const restore = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Fixture activeTab="backup" overrides={{ onImportBackup: restore }} />);
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, new File(["broken"], "broken.json", { type: "application/json" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(restore).not.toHaveBeenCalled();
  });

  it("also requires a preview confirmation for local restore points", async () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Fixture activeTab="backup" overrides={{ onRestoreBackupSnapshot: restore, backupSnapshots: [{
      id: "40000000-0000-4000-8000-000000000001", reason: "automatic", createdAt: backup.exportedAt, backup, attachmentIds: []
    }] }} />);
    await user.click(screen.getByRole("button", { name: t.settings.restoreBackup }));
    expect(restore).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog", { name: t.safety.preview })).getByRole("button", { name: t.safety.confirm }));
    expect(restore).toHaveBeenCalledWith("40000000-0000-4000-8000-000000000001");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
