"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FABProps {
  className?: string
}

export function FAB({ className }: FABProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/dashboard/quick-quote')}
      className={cn(
        "fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6",
        "h-14 w-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label="Create new rate card"
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
