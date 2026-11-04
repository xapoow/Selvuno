import { beforeEach, describe, expect, it } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { normalizeDashboardLayout } from "../lib/dashboardLayout";
import { backupRepository } from "./backupRepository";
import { settingsRepository } from "./settingsRepository";

beforeEach(async () => { await resetDatabaseForTests(); });
describe("home layout persistence", () => {
  it("persists in settings, backups and restore history", async () => {
    const layout = normalizeDashboardLayout();
    layout.order.reverse();
    layout.hidden = ["budget", "recent"];
    await settingsRepository.updateSettings({ dashboardLayout: layout });
    financeDb.close();
    await financeDb.open();
    expect((await settingsRepository.getSettings()).dashboardLayout).toEqual(layout);
    const backup = await backupRepository.exportBackup();
    expect(backup.settings.dashboardLayout).toEqual(layout);
    const snapshot = await backupRepository.createSnapshot("automatic");
    await settingsRepository.updateSettings({ dashboardLayout: normalizeDashboardLayout() });
    await backupRepository.restoreSnapshot(snapshot.id);
    expect((await settingsRepository.getSettings()).dashboardLayout).toEqual(layout);
    await backupRepository.importBackup(backup);
    expect((await settingsRepository.getSettings()).dashboardLayout).toEqual(layout);
  });
  it("does not require a layout when importing older backups", async () => {
    const backup = await backupRepository.exportBackup();
    delete backup.settings.dashboardLayout;
    await backupRepository.importBackup(backup);
    expect((await settingsRepository.getSettings()).dashboardLayout).toBeUndefined();
  });
});
