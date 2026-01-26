"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useRateCards } from "@/hooks/use-rate-cards";
import { Calculator, Gift } from "lucide-react";
import { InlineMessageAnalyzer } from "@/components/dashboard/inline-message-analyzer";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
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

  // TODO: Pending gifts should come from API once gift tracking is migrated
  const pendingGifts = 0;

  const firstName = user?.name?.split(" ")[0] || "Creator";

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

      {/* PRIMARY: Inline Message Analyzer */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Got a brand message?
          </h2>
          <span className="text-xs text-muted-foreground">
            Works with DMs, emails, and briefs
          </span>
        </div>
        <InlineMessageAnalyzer />
      </section>

      {/* SECONDARY: Quick actions - with distinct visual identities */}
      <section className="grid grid-cols-2 gap-4">
        <QuickActionCard
          href="/quick-calculate"
          icon={Calculator}
          title="Quick Rate"
          description="Get an instant quote"
          variant="outline"
          accent="primary"
          emoji="⚡"
        />
        <QuickActionCard
          href="/dashboard/gifts"
          icon={Gift}
          title="Gift Deals"
          badge={pendingGifts > 0 ? `${pendingGifts} pending` : undefined}
          description="Track gift offers"
          variant="outline"
          accent="coral"
          emoji="🎁"
        />
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recent Activity
        </h2>
        <RecentActivityFeed activities={recentActivities} />
      </section>
    </div>
  );
}
