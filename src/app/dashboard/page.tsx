"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useRateCards } from "@/hooks/use-rate-cards";
import { useGifts } from "@/hooks/use-gifts";
import { InlineMessageAnalyzer } from "@/components/dashboard/inline-message-analyzer";
import { RecentActivityFeed, type Activity } from "@/components/dashboard/recent-activity-feed";
import { Gift, ArrowRight } from "lucide-react";

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
  const { gifts, followUpsDue } = useGifts();

  // Calculate total generated this month from rate cards
  const totalGenerated = useMemo(() => {
    const now = new Date();
    const thisMonth = rateCards.filter((r) => {
      const date = new Date(r.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    return thisMonth.reduce((sum, r) => sum + r.finalRate, 0);
  }, [rateCards]);

  // Get creator handle from profile
  const creatorHandle = profile?.handle ?? null;
  const firstName = user?.name?.split(" ")[0] || "Creator";

  // Combine rate cards and gifts into unified activity feed (last 5 items)
  const recentActivities: Activity[] = useMemo(() => {
    const rateActivities: Activity[] = rateCards.slice(0, 10).map((rate) => ({
      id: rate.id,
      type: "rate_card" as const,
      title: rate.brandName || rate.name || "Quick Quote",
      subtitle: `${rate.platform} · ${rate.contentFormat} · $${rate.finalRate.toLocaleString()}`,
      timestamp: new Date(rate.createdAt),
      dealQuality: rate.dealQuality as Activity["dealQuality"],
    }));

    const giftActivities: Activity[] = gifts.slice(0, 10).map((gift) => ({
      id: gift.id,
      type: "gift" as const,
      title: gift.brandName,
      subtitle: `$${gift.productValue.toLocaleString()} product · ${gift.status.replace("_", " ")}`,
      timestamp: new Date(gift.createdAt),
      isGift: true,
    }));

    // Merge and sort by timestamp, take top 5
    return [...rateActivities, ...giftActivities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [rateCards, gifts]);

  const hasActivity = recentActivities.length > 0;
  const hasFollowUpsDue = followUpsDue.length > 0;

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


      {/* Contextual Gift Alert - only when follow-ups are due */}
      {hasFollowUpsDue && (
        <Link
          href="/dashboard/gifts"
          className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">
                {followUpsDue.length} gift follow-up{followUpsDue.length !== 1 ? "s" : ""} due
              </p>
              <p className="text-sm text-amber-700">
                Time to convert {followUpsDue.length === 1 ? "this" : "these"} to paid deals
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* PRIMARY: Inline Message Analyzer - the single focused action */}
      <section className="space-y-3">
        <InlineMessageAnalyzer />
        {/* Secondary path */}
        <p className="text-xs text-muted-foreground text-center">
          Already have a brief?{" "}
          <Link href="/dashboard/analyze?tab=briefs" className="text-primary hover:underline">
            Upload it directly <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>
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
