"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /**
   * Indicates if the associated field is required.
   * When true, displays a visual asterisk (*) and sr-only "(required)" text.
   */
  required?: boolean
}

function Label({
  className,
  required,
  children,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <>
          <span className="text-destructive" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </LabelPrimitive.Root>
  )
}

export { Label }
export type { LabelProps }
