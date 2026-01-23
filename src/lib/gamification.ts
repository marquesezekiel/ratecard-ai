export type CreatorLevel = "beginner" | "rising" | "pro" | "expert"

interface LevelConfig {
  name: string
  minPercentage: number
  emoji: string
  color: string
  description: string
}

export const CREATOR_LEVELS: Record<CreatorLevel, LevelConfig> = {
  beginner: {
    name: "Beginner",
    minPercentage: 0,
    emoji: "🌱",
    color: "text-yellow-500",
    description: "Just getting started",
  },
  rising: {
    name: "Rising",
    minPercentage: 40,
    emoji: "🌟",
    color: "text-primary",
    description: "Building your profile",
  },
  pro: {
    name: "Pro",
    minPercentage: 70,
    emoji: "🔥",
    color: "text-orange-500",
    description: "Profile looking strong",
  },
  expert: {
    name: "Expert",
    minPercentage: 100,
    emoji: "👑",
    color: "text-amber-500",
    description: "Fully optimized",
  },
}

export function getCreatorLevel(percentage: number): CreatorLevel {
  if (percentage >= 100) return "expert"
  if (percentage >= 70) return "pro"
  if (percentage >= 40) return "rising"
  return "beginner"
}

export function getNextLevel(current: CreatorLevel): CreatorLevel | null {
  const order: CreatorLevel[] = ["beginner", "rising", "pro", "expert"]
  const currentIndex = order.indexOf(current)
  if (currentIndex === order.length - 1) return null
  return order[currentIndex + 1]
}

export function getPercentageToNextLevel(percentage: number): number {
  const current = getCreatorLevel(percentage)
  const next = getNextLevel(current)
  if (!next) return 0

  const nextConfig = CREATOR_LEVELS[next]
  const currentConfig = CREATOR_LEVELS[current]

  const range = nextConfig.minPercentage - currentConfig.minPercentage
  const progress = percentage - currentConfig.minPercentage
  return Math.round((progress / range) * 100)
}
