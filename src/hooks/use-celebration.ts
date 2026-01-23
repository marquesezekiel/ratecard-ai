"use client"

import { useState, useCallback } from "react"
import { useConfetti } from "@/components/ui/confetti"
import {
  type MilestoneType,
  MILESTONES,
  checkMilestone,
  markMilestoneAchieved
} from "@/lib/celebrations"

interface CelebrationState {
  isShowing: boolean
  milestone: typeof MILESTONES[MilestoneType] | null
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isShowing: false,
    milestone: null,
  })
  const { fireMultiple } = useConfetti()

  const celebrate = useCallback((type: MilestoneType) => {
    if (!checkMilestone(type)) return // Already achieved

    markMilestoneAchieved(type)
    const milestone = MILESTONES[type]

    setCelebration({ isShowing: true, milestone })
    fireMultiple()
  }, [fireMultiple])

  const dismissCelebration = useCallback(() => {
    setCelebration({ isShowing: false, milestone: null })
  }, [])

  return {
    celebration,
    celebrate,
    dismissCelebration,
  }
}
