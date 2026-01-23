"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Gift, Clock } from "lucide-react"

type DealQuality = "excellent" | "good" | "fair" | "caution"
type BadgeType = "quality" | "gift" | "urgent" | "scam"

interface DealBadgeProps {
  type: BadgeType
  value?: DealQuality | boolean
  className?: string
}

const qualityConfig: Record<DealQuality, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  excellent: {
    label: "Great Deal",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle2,
  },
  good: {
    label: "Good Deal",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
  },
  fair: {
    label: "Fair",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: AlertTriangle,
  },
  caution: {
    label: "Caution",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: AlertTriangle,
  },
}

export function DealBadge({ type, value, className }: DealBadgeProps) {
  if (type === "quality" && typeof value === "string") {
    const config = qualityConfig[value as DealQuality]
    const Icon = config.icon
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color,
        className
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  if (type === "gift" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-coral/10 text-coral border-coral/20",
        className
      )}>
        <Gift className="h-3 w-3" />
        Gift Offer
      </span>
    )
  }

  if (type === "urgent" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-amber-500/10 text-amber-600 border-amber-500/20",
        className
      )}>
        <Clock className="h-3 w-3" />
        Time Sensitive
      </span>
    )
  }

  if (type === "scam" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-red-500/10 text-red-600 border-red-500/20",
        className
      )}>
        <AlertTriangle className="h-3 w-3" />
        Red Flags Detected
      </span>
    )
  }

  return null
}

/**
 * Convert numeric deal quality score to category
 */
export function getDealQualityLevel(score: number): DealQuality {
  if (score >= 85) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "fair"
  return "caution"
}
