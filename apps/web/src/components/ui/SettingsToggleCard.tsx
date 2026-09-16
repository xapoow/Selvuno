import { useState } from "react";
import { cn } from "../../lib/cn";

interface SettingsToggleCardProps {
  checked: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onChange: (checked: boolean) => Promise<void>;
}

export function SettingsToggleCard({
  checked,
  icon,
  label,
  hint,
  onChange
}: SettingsToggleCardProps) {
  const [pending, setPending] = useState(false);

  async function handleChange() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      await onChange(!checked);
    } catch {
      // The settings page owns the shared save error message.
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      className={cn(
        "app-surface flex items-start gap-3 rounded-app p-4 transition-colors",
        pending && "opacity-75"
      )}
      aria-busy={pending}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
        {icon}
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
        disabled={pending}
        onClick={() => void handleChange()}
        className="app-focus -my-2 grid h-11 w-14 shrink-0 place-items-center rounded-app disabled:cursor-wait"
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-7 w-12 rounded-full border transition-colors",
            checked ? "border-accent bg-accent" : "border-line bg-elevated"
          )}
        >
          <span
            className={cn(
              "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              checked ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
    </article>
  );
}
