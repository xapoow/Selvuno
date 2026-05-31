import type { Settings, SettingsUpdate } from "@myfinances/types";
import { settingsUpdateSchema } from "@myfinances/types";
import { financeDb, nowIso, seedLocalData } from "../db/database";

export interface SettingsRepository {
  getSettings(): Promise<Settings>;
  updateSettings(update: SettingsUpdate): Promise<Settings>;
}

export const settingsRepository: SettingsRepository = {
  async getSettings() {
    await seedLocalData();
    const settings = await financeDb.settings.get("default");
    if (!settings) {
      throw new Error("Settings not found.");
    }
    return settings;
  },

  async updateSettings(update) {
    const current = await this.getSettings();
    const normalizedUpdate: SettingsUpdate = { ...update };
    if (update.currency) {
      normalizedUpdate.currency = update.currency.toUpperCase();
    }
    const parsed = settingsUpdateSchema.parse(normalizedUpdate);
    const next: Settings = {
      ...current,
      ...parsed,
      updatedAt: nowIso()
    };
    await financeDb.settings.put(next);
    return next;
  }
};
