import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-canvas hover:bg-accent-2",
        destructive:
          "bg-danger text-white hover:bg-danger/90",
        outline:
          "border border-line text-ink hover:border-line-strong hover:bg-raised",
        secondary:
          "bg-raised text-ink hover:bg-inset border border-line",
        ghost:
          "text-ink-2 hover:text-ink hover:bg-raised",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-body rounded-ctl",
        sm: "h-8 px-3 text-tiny rounded-chip",
        lg: "h-11 px-6 text-lead rounded-ctl",
        icon: "h-9 w-9 rounded-ctl",
        "icon-sm": "h-8 w-8 rounded-chip",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
