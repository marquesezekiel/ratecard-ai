"use client"

import { useState } from "react"
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react"
import { calculateQuickEstimate } from "@/lib/quick-calculator"
import { cn } from "@/lib/utils"

interface MobileRateSheetProps {
  followers: number
  platform: "instagram" | "tiktok" | "youtube" | "twitter"
  engagementRate?: number
}

export function MobileRateSheet({
  followers,
  platform,
  engagementRate,
}: MobileRateSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show if no meaningful data
  if (!followers || followers < 100) {
    return null
  }

  const estimate = calculateQuickEstimate({
    followerCount: followers,
    platform: platform,
    contentFormat: "reel",
    niche: "lifestyle",
  })

  return (
    <div
      className={cn(
        "fixed bottom-[72px] left-0 right-0 z-40 bg-card border-t shadow-lg transition-all duration-300 safe-area-bottom",
        isExpanded ? "pb-4" : "pb-2"
      )}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Estimated Rate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono">
            ${estimate.minRate.toLocaleString()} - ${estimate.maxRate.toLocaleString()}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pt-2 border-t animate-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Your Tier</p>
              <p className="font-medium capitalize">{estimate.tierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Followers</p>
              <p className="font-mono font-medium">{followers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="font-mono font-medium">
                {engagementRate ? `${engagementRate.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Based on a typical Reel. Final rate depends on usage rights and brand fit.
          </p>
        </div>
      )}
    </div>
  )
}
