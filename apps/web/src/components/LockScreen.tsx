import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import type { Dictionary } from "../i18n";
import { PIN_LENGTH } from "../lib/privacy";
import { Button } from "./ui/Button";
import { PinCodeField, PinKeypad } from "./ui/PinKeypad";

interface LockScreenProps {
  t: Dictionary;
  onUnlock: (pin: string) => Promise<boolean>;
}

export function LockScreen({ t, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="app-page-bg grid min-h-dvh place-items-center px-4 py-[calc(env(safe-area-inset-top)+1rem)] text-foreground">
      <form
        className="app-surface grid w-full max-w-sm gap-5 rounded-2xl p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setSubmitting(true);
          void onUnlock(pin)
            .then((valid) => {
              if (!valid) {
                setError(t.settings.pinIncorrect);
                setPin("");
              }
            })
            .catch(() => setError(t.settings.pinSaveError))
            .finally(() => setSubmitting(false));
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-soft text-accent">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t.brand}</p>
          <h1 className="mt-1 text-2xl font-semibold">{t.settings.appLocked}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t.settings.appLockedHint}</p>
        </div>
        <PinCodeField label={t.settings.enterPin} value={pin} />
        <PinKeypad
          value={pin}
          label={t.settings.pinKeypad}
          deleteLabel={t.settings.deleteDigit}
          disabled={submitting}
          onChange={(value) => {
            setPin(value);
            setError("");
          }}
        />
        {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
        <Button type="submit" disabled={pin.length !== PIN_LENGTH || submitting}>
          {submitting ? t.settings.checkingPin : t.settings.unlock}
        </Button>
      </form>
    </main>
  );
}
