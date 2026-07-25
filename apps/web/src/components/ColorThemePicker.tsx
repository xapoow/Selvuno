import type { ColorThemePreference } from "@myfinances/types";
import { Check } from "lucide-react";
import { colorThemeOptions } from "../lib/colorThemes";
import { cn } from "../lib/cn";

interface ColorThemePickerProps {
  value: ColorThemePreference;
  labels: Record<ColorThemePreference, string>;
  onChange: (value: ColorThemePreference) => void;
}

export function ColorThemePicker({ value, labels, onChange }: ColorThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {colorThemeOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "app-focus grid min-h-[76px] gap-2 rounded-app p-3 text-left active:scale-[0.98]",
              selected
                ? "app-selected-control text-foreground"
                : "app-control text-muted hover:bg-surface/80 hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span
                className="app-swatch h-7 w-7 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${option.background} 0 28%, ${option.soft} 28% 60%, ${option.accent} 60% 100%)`
                }}
              />
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: option.marker }}
              />
            </span>
            <span className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="min-w-0 truncate">{labels[option.value]}</span>
              {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
