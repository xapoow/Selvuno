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
    <div className="grid grid-flow-col rounded-app bg-elevated p-1 ring-1 ring-line">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-[6px] px-3 text-sm font-medium text-muted transition duration-200 active:scale-[0.98]",
            value === option.value && "bg-accent text-white shadow-sm"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
