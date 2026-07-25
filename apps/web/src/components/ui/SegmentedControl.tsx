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
  return (
    <div className="app-control grid grid-flow-col rounded-app p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "app-focus h-9 rounded-[6px] px-3 text-sm font-medium text-muted active:scale-[0.98]",
            value === option.value && "app-selected-control text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
