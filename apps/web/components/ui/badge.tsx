import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-tiny font-medium uppercase tracking-mono-cap",
  {
    variants: {
      variant: {
        default: "border-line bg-raised text-ink-2",
        accent: "border-accent/30 bg-accent/10 text-accent",
        secondary: "border-line bg-raised text-ink-2",
        destructive: "border-danger/30 bg-danger/10 text-danger",
        outline: "border-line text-ink-2",
        muted: "border-line bg-raised text-ink-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
