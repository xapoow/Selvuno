import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "app-focus inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "app-button-primary bg-accent text-white hover:brightness-[1.03]",
        secondary: "app-control text-foreground hover:bg-surface/90",
        ghost: "bg-transparent text-muted hover:bg-elevated/70 hover:text-foreground",
        danger: "app-button-danger bg-expense text-white hover:brightness-[1.03]"
      },
      size: {
        default: "h-11 px-4 rounded-xl",
        icon: "h-10 w-10 px-0 rounded-xl",
        small: "h-9 px-3 text-xs rounded-lg"
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
