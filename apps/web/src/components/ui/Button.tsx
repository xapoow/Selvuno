import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-app px-4 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background shadow-soft dark:shadow-softDark",
        secondary: "bg-elevated text-foreground ring-1 ring-line",
        ghost: "bg-transparent text-muted hover:bg-elevated hover:text-foreground",
        danger: "bg-expense text-white"
      },
      size: {
        default: "h-11 px-4",
        icon: "h-10 w-10 px-0",
        small: "h-9 px-3 text-xs"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);

Button.displayName = "Button";
