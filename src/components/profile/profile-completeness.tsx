"use client";

import { cn } from "@/lib/utils";
import {
  getCreatorLevel,
  CREATOR_LEVELS,
} from "@/lib/gamification";

interface ProfileCompletenessProps {
  percentage: number;
  className?: string;
  showDetails?: boolean;
}

export function ProfileCompleteness({
  percentage,
  className,
  showDetails = false,
}: ProfileCompletenessProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const level = getCreatorLevel(clampedPercentage);
  const levelConfig = CREATOR_LEVELS[level];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Level badge + percentage */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{levelConfig.emoji}</span>
        <div>
          <div className={cn("font-semibold text-sm", levelConfig.color)}>
            {levelConfig.name}
          </div>
          {showDetails && (
            <div className="text-xs text-muted-foreground">
              {levelConfig.description}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              level === "expert"
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : level === "pro"
                ? "bg-gradient-to-r from-orange-400 to-orange-500"
                : level === "rising"
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500"
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Single percentage display */}
        <div className="text-xs text-muted-foreground text-right">
          <span className="font-mono">{Math.round(clampedPercentage)}%</span> complete
        </div>
      </div>
    </div>
  );
}

// Re-export calculateProfileCompleteness from the calc file
export { calculateProfileCompleteness } from "./profile-completeness-calc";
