"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useRateCards } from "@/hooks/use-rate-cards";
import { InlineMessageAnalyzer } from "@/components/dashboard/inline-message-analyzer";
import { RecentActivityFeed, type Activity } from "@/components/dashboard/recent-activity-feed";

// Time-based greeting helper
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { rateCards } = useRateCards();

  // Calculate total generated this month from rate cards
  const totalGenerated = useMemo(() => {
    const now = new Date();
    const thisMonth = rateCards.filter((r) => {
      const date = new Date(r.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    return thisMonth.reduce((sum, r) => sum + r.finalRate, 0);
  }, [rateCards]);

  // Get recent rates (top 5)
  const recentRates = useMemo(() => rateCards.slice(0, 5), [rateCards]);

  // Get creator handle from profile
  const creatorHandle = profile?.handle ?? null;
  const firstName = user?.name?.split(" ")[0] || "Creator";
  const hasActivity = recentRates.length > 0;

  // Transform recent rates into activity feed format
  const recentActivities: Activity[] = recentRates.map((rate) => ({
    id: rate.id,
    type: "rate_card" as const,
    title: rate.name || "Quick Quote",
    subtitle: `${rate.platform} · ${rate.contentFormat} · $${rate.finalRate.toLocaleString()}`,
    timestamp: new Date(rate.createdAt),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success-focused header with personalization */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
          {getGreeting()}{creatorHandle ? `, @${creatorHandle}` : `, ${firstName}`} ✨
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {totalGenerated > 0 ? (
            <>
              You&apos;ve quoted <span className="font-mono font-bold text-primary">${totalGenerated.toLocaleString()}</span> in rates this month
            </>
          ) : (
            "Ready to know your worth? Let's get you a rate."
          )}
        </p>
      </header>

      {/* PRIMARY: Inline Message Analyzer - the single focused action */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Paste a brand DM, email, or upload a brief. We&apos;ll tell you what to charge.
        </p>
        <InlineMessageAnalyzer />
      </section>

      {/* Recent Activity - only show if there's activity */}
      {hasActivity && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Activity
          </h2>
          <RecentActivityFeed activities={recentActivities} />
        </section>
      )}
    </div>
  );
}
