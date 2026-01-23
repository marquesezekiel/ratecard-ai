"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  className,
  decimals = 0
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = previousValue.current

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (value - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        previousValue.current = value
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  const formattedValue = decimals > 0
    ? displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString()

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}
