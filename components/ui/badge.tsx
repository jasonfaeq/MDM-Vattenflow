import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-2 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground dark:bg-primary/90 dark:text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground dark:bg-secondary/90 dark:text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground dark:bg-destructive/90 dark:text-destructive-foreground [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground dark:text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-green-500 dark:bg-green-500/90 text-white [a&]:hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 dark:bg-yellow-500/90 text-white [a&]:hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 dark:bg-blue-500/90 text-white [a&]:hover:bg-blue-600",
        error: "border-transparent bg-red-500 dark:bg-red-500/90 text-white [a&]:hover:bg-red-600",
        pending:
          "border-transparent bg-yellow-500 dark:bg-yellow-500/90 text-white [a&]:hover:bg-yellow-600",
        completed:
          "border-transparent bg-green-500 dark:bg-green-500/90 text-white [a&]:hover:bg-green-600",
        rejected:
          "border-transparent bg-red-500 dark:bg-red-500/90 text-white [a&]:hover:bg-red-600",
        inProgress:
          "border-transparent bg-blue-500 dark:bg-blue-500/90 text-white [a&]:hover:bg-blue-600",
        pendingInfo:
          "border-transparent bg-yellow-500 dark:bg-yellow-500/90 text-white [a&]:hover:bg-yellow-600",
        forwardedToSD:
          "border-transparent bg-purple-500 dark:bg-purple-500/90 text-white [a&]:hover:bg-purple-600",
        locked:
          "border-transparent bg-gray-500 dark:bg-gray-500/90 text-white [a&]:hover:bg-gray-600",
        unlocked:
          "border-transparent bg-gray-500 dark:bg-gray-500/90 text-white [a&]:hover:bg-gray-600",
        modified:
          "border-transparent bg-gray-500 dark:bg-gray-500/90 text-white [a&]:hover:bg-gray-600",
        submitted:
          "border-transparent bg-gray-500 dark:bg-gray-500/90 text-white [a&]:hover:bg-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
