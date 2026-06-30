import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-outline text-foreground",
        restmuell: "border-transparent text-white",
        biomuell: "border-transparent text-white",
        papier: "border-transparent text-white",
        gelbe_tonne: "border-transparent text-foreground",
        sondermuell: "border-transparent text-white",
        unknown: "border-transparent bg-surface-container-highest text-foreground",
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

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const typeColors: Record<string, string> = {
    restmuell: "var(--type-restmuell)",
    biomuell: "var(--type-biomuell)",
    papier: "var(--type-papier)",
    gelbe_tonne: "var(--type-gelbe-tonne)",
    sondermuell: "var(--type-sondermuell)",
  };

  const bgStyle =
    variant && typeColors[variant]
      ? { backgroundColor: typeColors[variant], ...style }
      : style;

  return (
    <div className={cn(badgeVariants({ variant }), className)} style={bgStyle} {...props} />
  );
}

export { Badge, badgeVariants };
