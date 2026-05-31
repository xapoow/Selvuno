import { forwardRef } from "react";
import { cn } from "../../lib/cn";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, ...props }, ref) => (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <input
        ref={ref}
        className={cn(
          "h-11 rounded-app border border-line bg-surface px-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
          className
        )}
        {...props}
      />
    </label>
  )
);

TextField.displayName = "TextField";
