import type { Settings, SettingsUpdate } from "@myfinances/types";
import { WalletCards } from "lucide-react";
import type { Dictionary } from "../i18n";

interface FeatureSettingsPanelProps {
  settings: Settings;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}

export function FeatureSettingsPanel({ settings, t, onUpdateSettings }: FeatureSettingsPanelProps) {
  return (
    <div className="grid gap-3">
      <article className="app-surface flex items-start gap-3 rounded-app p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
          <WalletCards className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {t.settings.advancedWalletsSetting}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {t.settings.advancedWalletsSettingHint}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.advancedWalletsEnabled}
          aria-label={t.settings.advancedWalletsSetting}
          onClick={() =>
            void onUpdateSettings({ advancedWalletsEnabled: !settings.advancedWalletsEnabled })
          }
          className={`app-focus relative mt-1 h-7 w-12 shrink-0 rounded-full border transition-colors ${
            settings.advancedWalletsEnabled
              ? "border-accent bg-accent"
              : "border-line bg-elevated"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              settings.advancedWalletsEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </article>
    </div>
  );
}
