import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Settings, SettingsUpdate } from "@myfinances/types";
import type { Dictionary } from "../i18n";
import { autoLockOptions, isValidPin, type AutoLockMinutes } from "../lib/privacy";
import type { PrivacyLockController } from "../state/usePrivacyLock";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { SettingsToggleCard } from "./ui/SettingsToggleCard";

interface PrivacySettingsPanelProps {
  settings: Settings;
  privacy: PrivacyLockController;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}

type PinAction = "enable" | "change" | "disable" | null;

export function PrivacySettingsPanel({ settings, privacy, t, onUpdateSettings }: PrivacySettingsPanelProps) {
  const [pinAction, setPinAction] = useState<PinAction>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const closePinSheet = () => {
    setPinAction(null);
    setCurrentPin("");
    setNextPin("");
    setConfirmPin("");
    setError("");
  };

  const actionTitle =
    pinAction === "enable"
      ? t.settings.enablePin
      : pinAction === "change"
        ? t.settings.changePin
        : t.settings.disablePin;

  return (
    <>
      <div className="grid gap-4">
        <article className="app-surface grid gap-4 rounded-app p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{t.settings.pinProtection}</h3>
                <span className="app-control rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {privacy.pinEnabled ? t.settings.enabled : t.settings.disabled}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">{t.settings.pinProtectionHint}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {privacy.pinEnabled ? (
              <>
                <Button variant="secondary" size="small" onClick={() => setPinAction("change")}>
                  {t.settings.changePin}
                </Button>
                <Button variant="secondary" size="small" onClick={privacy.lockNow}>
                  <LockKeyhole className="h-4 w-4" />
                  {t.settings.lockNow}
                </Button>
                <Button variant="danger" size="small" onClick={() => setPinAction("disable")}>
                  {t.settings.disablePin}
                </Button>
              </>
            ) : (
              <Button size="small" onClick={() => setPinAction("enable")}>
                {t.settings.enablePin}
              </Button>
            )}
          </div>
          <SelectField
            label={t.settings.autoLock}
            value={String(privacy.config.autoLockMinutes)}
            disabled={!privacy.pinEnabled}
            onChange={(event) =>
              privacy.setAutoLockMinutes(Number(event.target.value) as AutoLockMinutes)
            }
          >
            {autoLockOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes === 0
                  ? t.settings.autoLockNever
                  : t.settings.autoLockMinutes.replace("{minutes}", String(minutes))}
              </option>
            ))}
          </SelectField>
        </article>

        <SettingsToggleCard
          checked={settings.hideAmounts}
          icon={
            settings.hideAmounts ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )
          }
          label={t.settings.hideAmounts}
          hint={t.settings.hideAmountsHint}
          onChange={(checked) => onUpdateSettings({ hideAmounts: checked })}
        />

        <p className="px-1 text-xs leading-5 text-muted">{t.settings.localPrivacyNote}</p>
      </div>

      <BottomSheet open={Boolean(pinAction)} title={actionTitle} onClose={closePinSheet}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            if (pinAction !== "enable" && !isValidPin(currentPin)) {
              setError(t.settings.pinIncorrect);
              return;
            }
            if (pinAction !== "disable") {
              if (!isValidPin(nextPin)) {
                setError(t.settings.pinRequirements);
                return;
              }
              if (nextPin !== confirmPin) {
                setError(t.settings.pinMismatch);
                return;
              }
            }
            setSubmitting(true);
            const action =
              pinAction === "enable"
                ? privacy.enablePin(nextPin).then(() => true)
                : pinAction === "change"
                  ? privacy.changePin(currentPin, nextPin)
                  : privacy.disablePin(currentPin);
            void action
              .then((success) => {
                if (success) {
                  closePinSheet();
                } else {
                  setError(t.settings.pinIncorrect);
                  setCurrentPin("");
                }
              })
              .catch(() => setError(t.settings.pinSaveError))
              .finally(() => setSubmitting(false));
          }}
        >
          {pinAction !== "enable" ? (
            <PinField label={t.settings.currentPin} value={currentPin} onChange={setCurrentPin} />
          ) : null}
          {pinAction !== "disable" ? (
            <>
              <PinField label={t.settings.newPin} value={nextPin} onChange={setNextPin} />
              <PinField label={t.settings.confirmPin} value={confirmPin} onChange={setConfirmPin} />
              <p className="text-xs leading-5 text-muted">{t.settings.pinRequirements}</p>
            </>
          ) : (
            <p className="text-sm leading-6 text-muted">{t.settings.disablePinHint}</p>
          )}
          {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
          <Button type="submit" variant={pinAction === "disable" ? "danger" : "primary"} disabled={submitting}>
            {actionTitle}
          </Button>
        </form>
      </BottomSheet>
    </>
  );
}

function PinField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        minLength={4}
        maxLength={12}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 12))}
        className="app-field app-focus h-11 rounded-app px-3 text-center text-lg tracking-[0.3em] outline-none"
      />
    </label>
  );
}
