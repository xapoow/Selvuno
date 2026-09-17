import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div className="app-control relative grid grid-flow-col auto-cols-fr rounded-xl p-1">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "app-focus relative z-10 flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors active:scale-[0.98]",
              isSelected ? "text-foreground font-semibold" : "text-muted hover:text-foreground"
            )}
          >
            {isSelected ? (
              <motion.span
                layoutId={`segment-pill-${layoutId}`}
                className="app-selected-control absolute inset-0 -z-10 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            ) : null}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
