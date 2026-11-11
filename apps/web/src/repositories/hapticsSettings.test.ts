import { beforeEach, describe, expect, it } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { testSettings } from "../test/fixtures";
import { backupRepository } from "./backupRepository";
import { settingsRepository } from "./settingsRepository";

beforeEach(async () => { await resetDatabaseForTests(); });
describe("haptics preference persistence", () => {
  it("defaults to off for new users and repairs old settings without changing their preferences", async () => {
    expect((await settingsRepository.getSettings()).hapticsEnabled).toBe(false);
    const { hapticsEnabled: _oldMissingFlag, ...legacy } = testSettings;
    await financeDb.settings.put({ ...legacy, colorTheme: "rose" } as typeof testSettings);
    expect(await settingsRepository.getSettings()).toMatchObject({ hapticsEnabled: false, colorTheme: "rose", locale: testSettings.locale });
  });
  it("retains opt-in after reopening and in backup restoration", async () => {
    await settingsRepository.updateSettings({ hapticsEnabled: true });
    financeDb.close();
    await financeDb.open();
    expect((await settingsRepository.getSettings()).hapticsEnabled).toBe(true);
    const backup = await backupRepository.exportBackup();
    expect(backup.settings.hapticsEnabled).toBe(true);
    await settingsRepository.updateSettings({ hapticsEnabled: false });
    await backupRepository.importBackup(backup);
    expect((await settingsRepository.getSettings()).hapticsEnabled).toBe(true);
  });
  it("does not silently opt in when an older backup is imported", async () => {
    const backup = await backupRepository.exportBackup();
    const { hapticsEnabled: _oldMissingFlag, ...legacy } = backup.settings;
    await backupRepository.importBackup({ ...backup, settings: legacy });
    expect((await settingsRepository.getSettings()).hapticsEnabled).toBe(false);
  });
});
