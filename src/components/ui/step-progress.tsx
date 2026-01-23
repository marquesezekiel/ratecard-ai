import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export function StepProgress({ currentStep, totalSteps, labels }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep

        return (
          <div key={i} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              {labels && labels[i] && (
                <span
                  className={cn(
                    "text-xs mt-1.5 font-medium transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {labels[i]}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 md:w-12 mx-2 transition-all duration-300",
                  stepNum < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
