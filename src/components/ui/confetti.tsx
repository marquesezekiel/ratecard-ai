"use client"

import confetti from "canvas-confetti"
import { useCallback } from "react"

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
  colors?: string[]
}

export function useConfetti() {
  const fire = useCallback((options?: ConfettiOptions) => {
    const defaults: ConfettiOptions = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      // Teal, Mint, Coral, Sky, Amber
      colors: ['#36a9b1', '#4ADE80', '#FF7B54', '#38bdf8', '#fcd34d']
    }

    confetti({
      ...defaults,
      ...options,
      origin: { ...defaults.origin, ...options?.origin }
    })
  }, [])

  const fireMultiple = useCallback(() => {
    // Fire multiple bursts for extra celebration
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      // Teal, Mint, Coral, Sky, Amber
      colors: ['#36a9b1', '#4ADE80', '#FF7B54', '#38bdf8', '#fcd34d']
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  return { fire, fireMultiple }
}
