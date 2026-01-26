"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, X } from "lucide-react";

interface ProfileCompletionBannerProps {
  completeness: number;
}

const DISMISS_KEY = "profile-banner-dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Check dismissal state from localStorage
function getIsDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (dismissedAt) {
    const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
    return timeSinceDismiss < DISMISS_DURATION_MS;
  }
  return false;
}

// Subscribe to storage changes
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// Server snapshot (assume dismissed to avoid flash)
function getServerSnapshot(): boolean {
  return true;
}

export function ProfileCompletionBanner({ completeness }: ProfileCompletionBannerProps) {
  // Use useSyncExternalStore to read localStorage without triggering lint warning
  const isDismissedFromStorage = useSyncExternalStore(
    subscribe,
    getIsDismissed,
    getServerSnapshot
  );
  const [isDismissed, setIsDismissed] = useState(isDismissedFromStorage);

  // Sync local state with storage state
  useEffect(() => {
    setIsDismissed(isDismissedFromStorage);
  }, [isDismissedFromStorage]);

  // Don't render if 100% complete or dismissed
  if (completeness >= 100 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  return (
    <div className="bg-primary/5 border-b border-primary/10">
      <div className="mx-auto max-w-6xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Progress value={completeness} className="w-20 h-2 flex-shrink-0" />
            <span className="text-sm text-foreground/80 truncate">
              Your profile is <span className="font-semibold">{completeness}%</span> complete
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/profile">
              <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-primary">
                Complete Profile
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
