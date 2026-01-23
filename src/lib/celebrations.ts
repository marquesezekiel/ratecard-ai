export type MilestoneType =
  | "first_rate_card"
  | "fifth_rate_card"
  | "first_paid_deal"
  | "first_brand_vetted"
  | "profile_complete"
  | "high_rate_reached"
  | "profile_level_up"

interface Milestone {
  type: MilestoneType
  title: string
  subtitle: string
  emoji: string
}

export const MILESTONES: Record<MilestoneType, Milestone> = {
  first_rate_card: {
    type: "first_rate_card",
    title: "First rate card!",
    emoji: "🎉",
    subtitle: "You're on your way to getting paid what you're worth.",
  },
  fifth_rate_card: {
    type: "fifth_rate_card",
    title: "5 rate cards generated!",
    emoji: "🔥",
    subtitle: "You're becoming a pricing pro.",
  },
  first_paid_deal: {
    type: "first_paid_deal",
    title: "First paid deal tracked!",
    emoji: "💰",
    subtitle: "The bag has been secured.",
  },
  first_brand_vetted: {
    type: "first_brand_vetted",
    title: "First brand vetted!",
    emoji: "🔍",
    subtitle: "Smart move checking them out first.",
  },
  profile_complete: {
    type: "profile_complete",
    title: "Profile complete!",
    emoji: "⭐",
    subtitle: "Your rates are now fully personalized.",
  },
  high_rate_reached: {
    type: "high_rate_reached",
    title: "You quoted $1,000+!",
    emoji: "🚀",
    subtitle: "Big creator energy.",
  },
  profile_level_up: {
    type: "profile_level_up",
    title: "Level up!",
    emoji: "⬆️",
    subtitle: "Your profile just got stronger.",
  },
}

export function checkMilestone(type: MilestoneType): boolean {
  if (typeof window === "undefined") return false
  const achieved = localStorage.getItem(`milestone_${type}`)
  return !achieved
}

export function markMilestoneAchieved(type: MilestoneType): void {
  if (typeof window === "undefined") return
  localStorage.setItem(`milestone_${type}`, new Date().toISOString())
}

export function getRateCardCount(): number {
  if (typeof window === "undefined") return 0
  const saved = localStorage.getItem("savedRates")
  if (!saved) return 0
  try {
    const rates = JSON.parse(saved)
    return Array.isArray(rates) ? rates.length : 0
  } catch {
    return 0
  }
}
