import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-checked"> {
  checked: boolean;
  label: string;
}

export function Switch({ checked, label, className, ...props }: SwitchProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "app-focus grid h-11 w-14 shrink-0 self-center place-items-center rounded-xl border-0 bg-transparent p-0",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative block h-7 w-12 rounded-full border transition-colors",
          checked ? "border-accent bg-accent" : "border-line bg-elevated"
        )}
      >
        <span
          className={cn(
            "absolute left-[3px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
