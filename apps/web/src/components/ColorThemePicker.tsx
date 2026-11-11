import type { ColorThemePreference } from "@selvuno/types";
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
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {colorThemeOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "app-focus relative flex flex-col justify-between min-h-[80px] rounded-xl p-3 text-left transition-all duration-150 active:scale-[0.98]",
              selected
                ? "app-selected-control text-foreground ring-2 ring-accent/60 shadow-sm"
                : "app-control text-muted hover:bg-surface/80 hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className="h-7 w-7 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/15"
                style={{
                  background: `linear-gradient(135deg, ${option.soft} 0 50%, ${option.accent} 50% 100%)`
                }}
              />
              {selected ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              ) : (
                <span className="h-5 w-5" />
              )}
            </div>
            <div className="mt-2 text-xs font-medium text-foreground">
              <span className="truncate">{labels[option.value]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
