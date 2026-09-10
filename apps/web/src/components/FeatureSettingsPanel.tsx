import type { Settings, SettingsUpdate } from "@myfinances/types";
import { BrainCircuit, WalletCards, type LucideIcon } from "lucide-react";
import type { Dictionary } from "../i18n";

interface FeatureSettingsPanelProps {
  settings: Settings;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}

export function FeatureSettingsPanel({ settings, t, onUpdateSettings }: FeatureSettingsPanelProps) {
  return (
    <div className="grid gap-3">
      <FeatureToggle
        checked={settings.advancedWalletsEnabled}
        icon={WalletCards}
        label={t.settings.advancedWalletsSetting}
        hint={t.settings.advancedWalletsSettingHint}
        onChange={(checked) => onUpdateSettings({ advancedWalletsEnabled: checked })}
      />
      <FeatureToggle
        checked={settings.smartInsightsEnabled}
        icon={BrainCircuit}
        label={t.settings.smartInsightsSetting}
        hint={t.settings.smartInsightsSettingHint}
        onChange={(checked) => onUpdateSettings({ smartInsightsEnabled: checked })}
      />
    </div>
  );
}

function FeatureToggle({
  checked,
  icon: Icon,
  label,
  hint,
  onChange
}: {
  checked: boolean;
  icon: LucideIcon;
  label: string;
  hint: string;
  onChange: (checked: boolean) => Promise<void>;
}) {
  return (
    <article className="app-surface flex items-start gap-3 rounded-app p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => void onChange(!checked)}
        className={`app-focus relative mt-1 h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked ? "border-accent bg-accent" : "border-line bg-elevated"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </article>
  );
}
