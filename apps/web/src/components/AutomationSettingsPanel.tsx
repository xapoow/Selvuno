import type { Settings, SettingsUpdate } from "@selvuno/types";
import { Layers3, ListPlus, Sparkles } from "lucide-react";
import type { Dictionary } from "../i18n";
import { SettingsToggleCard } from "./ui/SettingsToggleCard";

interface AutomationSettingsPanelProps {
  settings: Settings;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}

export function AutomationSettingsPanel({
  settings,
  t,
  onUpdateSettings
}: AutomationSettingsPanelProps) {
  return (
    <div className="grid gap-3">
      <SettingsToggleCard
        checked={settings.quickTemplatesEnabled}
        icon={<Layers3 className="h-5 w-5" />}
        label={t.settings.quickTemplatesSetting}
        hint={t.settings.quickTemplatesSettingHint}
        onChange={(checked) => onUpdateSettings({ quickTemplatesEnabled: checked })}
      />
      <SettingsToggleCard
        checked={settings.categorySuggestionsEnabled}
        icon={<Sparkles className="h-5 w-5" />}
        label={t.settings.categorySuggestionsSetting}
        hint={t.settings.categorySuggestionsSettingHint}
        onChange={(checked) => onUpdateSettings({ categorySuggestionsEnabled: checked })}
      />
      <SettingsToggleCard
        checked={settings.addAnotherEnabled}
        icon={<ListPlus className="h-5 w-5" />}
        label={t.settings.addAnotherSetting}
        hint={t.settings.addAnotherSettingHint}
        onChange={(checked) => onUpdateSettings({ addAnotherEnabled: checked })}
      />
    </div>
  );
}
