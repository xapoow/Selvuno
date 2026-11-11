import { useEffect, useRef, useState } from "react";
import type { Settings, SettingsUpdate } from "@selvuno/types";
import { Vibrate } from "lucide-react";
import type { Dictionary } from "../i18n";
import { haptics } from "../lib/haptics";
import { Button } from "./ui/Button";
import { SettingsToggleCard } from "./ui/SettingsToggleCard";

export function HapticsSettings({ settings, t, onUpdateSettings }: {
  settings: Settings; t: Dictionary; onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}) {
  const supported = haptics.isSupported();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  useEffect(() => { setResult(null); }, [settings.hapticsEnabled]);

  return <SettingsToggleCard
    checked={settings.hapticsEnabled}
    icon={<Vibrate className="h-5 w-5" />}
    label={t.settings.haptics}
    hint={supported ? t.settings.hapticsHint : t.settings.hapticsUnsupported}
    disabled={!supported && !settings.hapticsEnabled}
    onChange={async (enabled) => {
      setSaving(true);
      setResult(null);
      if (!enabled) haptics.cancel();
      try { await onUpdateSettings({ hapticsEnabled: enabled }); }
      finally { setSaving(false); }
    }}
  >
    <div className="mt-3 grid justify-items-start gap-2">
      <Button type="button" variant="secondary" size="small" disabled={!supported || !settings.hapticsEnabled || saving || testing}
        onClick={() => {
          setTesting(true);
          setResult(haptics.play("selection", settings.hapticsEnabled));
          timer.current = setTimeout(() => { setTesting(false); timer.current = null; }, 250);
        }}>
        <Vibrate className="h-4 w-4" />{t.settings.hapticsTest}
      </Button>
      {result !== null ? <p role="status" className="text-xs leading-5 text-muted">{result ? t.settings.hapticsRequested : t.settings.hapticsBlocked}</p> : null}
    </div>
  </SettingsToggleCard>;
}
