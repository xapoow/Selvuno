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
          "app-field app-focus h-11 rounded-app px-3 text-base text-foreground outline-none",
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
