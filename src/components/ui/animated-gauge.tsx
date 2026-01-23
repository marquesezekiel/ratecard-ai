"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedGaugeProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  showValue?: boolean
}

export function AnimatedGauge({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  label,
  showValue = true
}: AnimatedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const getColor = (val: number) => {
    if (val >= 85) return { stroke: "stroke-green-500", text: "text-green-500" }
    if (val >= 70) return { stroke: "stroke-blue-500", text: "text-blue-500" }
    if (val >= 50) return { stroke: "stroke-yellow-500", text: "text-yellow-500" }
    return { stroke: "stroke-red-500", text: "text-red-500" }
  }

  const colors = getColor(value)

  return (
    <div className={cn("relative flex flex-col items-center", className)} style={{ width: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", colors.stroke)}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {/* Center value */}
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-display font-bold", colors.text)}>
            {animatedValue}
          </span>
        </div>
      )}
      {/* Label below */}
      {label && (
        <span className="mt-2 text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

// Smaller inline gauge variant
export function InlineGauge({
  value,
  className
}: {
  value: number
  className?: string
}) {
  const getColor = (val: number) => {
    if (val >= 85) return "bg-green-500"
    if (val >= 70) return "bg-blue-500"
    if (val >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000 ease-out rounded-full", getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-mono tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  )
}
