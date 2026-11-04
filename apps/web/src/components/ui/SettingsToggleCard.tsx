import { useState } from "react";
import { cn } from "../../lib/cn";
import { Switch } from "./Switch";

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
        "app-surface flex items-start gap-3 rounded-2xl p-4 transition-colors",
        pending && "opacity-75"
      )}
      aria-busy={pending}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
      </div>
      <Switch
        checked={checked}
        label={label}
        disabled={pending}
        onClick={() => void handleChange()}
        className="disabled:cursor-wait"
      />
    </article>
  );
}
