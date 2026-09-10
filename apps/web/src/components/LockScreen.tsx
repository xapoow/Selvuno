import { useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import type { Dictionary } from "../i18n";
import { Button } from "./ui/Button";

interface LockScreenProps {
  t: Dictionary;
  onUnlock: (pin: string) => Promise<boolean>;
}

export function LockScreen({ t, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <main className="app-page-bg grid min-h-dvh place-items-center px-4 py-[calc(env(safe-area-inset-top)+1rem)] text-foreground">
      <form
        className="app-surface grid w-full max-w-sm gap-5 rounded-app p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setSubmitting(true);
          void onUnlock(pin)
            .then((valid) => {
              if (!valid) {
                setError(t.settings.pinIncorrect);
                setPin("");
                inputRef.current?.focus();
              }
            })
            .catch(() => setError(t.settings.pinSaveError))
            .finally(() => setSubmitting(false));
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-app bg-accent-soft text-accent">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">MyFinances</p>
          <h1 className="mt-1 text-2xl font-semibold">{t.settings.appLocked}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t.settings.appLockedHint}</p>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          <span>{t.settings.enterPin}</span>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]*"
            minLength={4}
            maxLength={12}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 12))}
            className="app-field app-focus h-12 rounded-app px-3 text-center text-xl tracking-[0.35em] outline-none"
          />
        </label>
        {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
        <Button type="submit" disabled={pin.length < 4 || submitting}>
          {submitting ? t.settings.checkingPin : t.settings.unlock}
        </Button>
      </form>
    </main>
  );
}
