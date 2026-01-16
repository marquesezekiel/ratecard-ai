import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles: larger, smoother, more premium
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: rich violet with subtle gradient and lift on hover
        default:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 hover:-translate-y-0.5",
        
        // Destructive: warm red
        destructive:
          "bg-destructive text-white shadow-md hover:shadow-lg hover:bg-destructive/90 hover:-translate-y-0.5",
        
        // Outline: clean border with violet tint on hover
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent",
        
        // Secondary: soft violet background
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // Ghost: minimal, just hover state
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        
        // Link: text only
        link: 
          "text-primary underline-offset-4 hover:underline",
        
        // Success: for confirmations
        success:
          "bg-emerald-600 text-white shadow-md hover:shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5",
      },
      size: {
        // Sizes are more generous for better tap targets
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg gap-1.5 px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base font-bold",
        icon: "size-11 rounded-xl",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
