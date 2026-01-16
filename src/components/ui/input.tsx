import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Larger height (h-11), generous padding, smooth corners
        "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-base transition-all duration-200",
        // Placeholder and file styling
        "placeholder:text-muted-foreground/60 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Focus: violet ring, slightly lifted
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // Size adjustment for smaller screens
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
