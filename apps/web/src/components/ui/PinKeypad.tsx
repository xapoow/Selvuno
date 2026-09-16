import { Delete as DeleteIcon } from "lucide-react";
import { cn } from "../../lib/cn";

const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"]
] as const;

interface PinCodeFieldProps {
  active?: boolean;
  label: string;
  value: string;
  onActivate?: () => void;
}

export function PinCodeField({ active = true, label, value, onActivate }: PinCodeFieldProps) {
  const dotCount = Math.max(4, value.length);

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <button
        type="button"
        aria-label={label}
        onClick={onActivate}
        className={cn(
          "app-field app-focus flex h-12 items-center justify-center gap-2 rounded-app px-3 outline-none transition-colors",
          active && "border-accent ring-1 ring-accent/35"
        )}
      >
        <span className="sr-only">{value.length}</span>
        {Array.from({ length: dotCount }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "h-2.5 w-2.5 rounded-full border transition-colors",
              index < value.length
                ? "border-accent bg-accent"
                : "border-line bg-transparent"
            )}
          />
        ))}
      </button>
    </label>
  );
}

interface PinKeypadProps {
  value: string;
  label: string;
  deleteLabel: string;
  disabled?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
}

export function PinKeypad({
  value,
  label,
  deleteLabel,
  disabled = false,
  maxLength = 12,
  onChange
}: PinKeypadProps) {
  const appendDigit = (digit: string) => {
    if (!disabled && value.length < maxLength) {
      onChange(`${value}${digit}`);
    }
  };

  const deleteDigit = () => {
    if (!disabled && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-xs gap-2" role="group" aria-label={label}>
      {keypadRows.map((row) => (
        <div key={row[0]} className="grid grid-cols-3 gap-2">
          {row.map((digit) => (
            <button
              key={digit}
              type="button"
              aria-label={digit}
              disabled={disabled || value.length >= maxLength}
              onClick={() => appendDigit(digit)}
              className="app-control app-focus h-12 rounded-app text-xl font-semibold text-foreground transition-colors hover:bg-surface/90 active:scale-[0.97] disabled:opacity-45"
            >
              {digit}
            </button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2">
        <span aria-hidden="true" />
        <button
          type="button"
          aria-label="0"
          disabled={disabled || value.length >= maxLength}
          onClick={() => appendDigit("0")}
          className="app-control app-focus h-12 rounded-app text-xl font-semibold text-foreground transition-colors hover:bg-surface/90 active:scale-[0.97] disabled:opacity-45"
        >
          0
        </button>
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={disabled || !value.length}
          onClick={deleteDigit}
          className="app-focus grid h-12 place-items-center rounded-app text-muted transition-colors hover:bg-elevated/70 hover:text-foreground active:scale-[0.97] disabled:opacity-30"
        >
          <DeleteIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
