import { forwardRef } from "react";
import { cn } from "../../lib/cn";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, label, children, ...props }, ref) => (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <select
        ref={ref}
        className={cn(
          "h-11 rounded-app border border-line bg-surface px-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  )
);

SelectField.displayName = "SelectField";
