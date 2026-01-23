"use client"

import { DealBadge, getDealQualityLevel } from "./deal-badge"

interface DealBadgesRowProps {
  dealQualityScore?: number
  isGiftOffer?: boolean
  hasDeadline?: boolean
  hasRedFlags?: boolean
  className?: string
}

export function DealBadgesRow({
  dealQualityScore,
  isGiftOffer,
  hasDeadline,
  hasRedFlags,
  className
}: DealBadgesRowProps) {
  const hasBadges = dealQualityScore !== undefined || isGiftOffer || hasDeadline || hasRedFlags

  if (!hasBadges) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {dealQualityScore !== undefined && (
        <DealBadge type="quality" value={getDealQualityLevel(dealQualityScore)} />
      )}
      {isGiftOffer && <DealBadge type="gift" value={true} />}
      {hasDeadline && <DealBadge type="urgent" value={true} />}
      {hasRedFlags && <DealBadge type="scam" value={true} />}
    </div>
  )
}
