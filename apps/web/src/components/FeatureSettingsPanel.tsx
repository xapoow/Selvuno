import type { Settings, SettingsUpdate } from "@selvuno/types";
import { BrainCircuit, WalletCards } from "lucide-react";
import type { Dictionary } from "../i18n";
import { SettingsToggleCard } from "./ui/SettingsToggleCard";
import { HapticsSettings } from "./HapticsSettings";

interface FeatureSettingsPanelProps {
  settings: Settings;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}

export function FeatureSettingsPanel({ settings, t, onUpdateSettings }: FeatureSettingsPanelProps) {
  return (
    <div className="grid gap-3">
      <HapticsSettings settings={settings} t={t} onUpdateSettings={onUpdateSettings} />
      <SettingsToggleCard
        checked={settings.advancedWalletsEnabled}
        icon={<WalletCards className="h-5 w-5" />}
        label={t.settings.advancedWalletsSetting}
        hint={t.settings.advancedWalletsSettingHint}
        onChange={(checked) => onUpdateSettings({ advancedWalletsEnabled: checked })}
      />
      <SettingsToggleCard
        checked={settings.smartInsightsEnabled}
        icon={<BrainCircuit className="h-5 w-5" />}
        label={t.settings.smartInsightsSetting}
        hint={t.settings.smartInsightsSettingHint}
        onChange={(checked) => onUpdateSettings({ smartInsightsEnabled: checked })}
      />
    </div>
  );
}
