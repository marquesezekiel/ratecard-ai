"use client";

import { useState, useEffect, startTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Calculator, Gift } from "lucide-react";
import { InlineMessageAnalyzer } from "@/components/dashboard/inline-message-analyzer";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentActivityFeed, type Activity } from "@/components/dashboard/recent-activity-feed";

interface RateCardHistoryItem {
  name: string;
  platform: string;
  format: string;
  price: number;
  createdAt: string;
}

// Time-based greeting helper
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentRates, setRecentRates] = useState<RateCardHistoryItem[]>([]);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [pendingGifts, setPendingGifts] = useState(0);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);

  useEffect(() => {
    startTransition(() => {
      // Load saved rates
      const savedRates = localStorage.getItem("savedRates");
      if (savedRates) {
        const rates = JSON.parse(savedRates) as RateCardHistoryItem[];
        setRecentRates(rates.slice(0, 5));
        // Calculate total generated this month
        const now = new Date();
        const thisMonth = rates.filter((r) => {
          const date = new Date(r.createdAt);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        const total = thisMonth.reduce((sum, r) => sum + r.price, 0);
        setTotalGenerated(total);
      }
      // Load pending gifts count
      const savedGifts = localStorage.getItem("giftDeals");
      if (savedGifts) {
        const gifts = JSON.parse(savedGifts);
        const pending = gifts.filter((g: { status: string }) => g.status === "pending" || g.status === "received").length;
        setPendingGifts(pending);
      }
      // Load creator handle from profile
      const profile = localStorage.getItem("creatorProfile");
      if (profile) {
        try {
          const data = JSON.parse(profile);
          if (data.handle) {
            setCreatorHandle(data.handle);
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    });
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Creator";

  // Transform recent rates into activity feed format
  const recentActivities: Activity[] = recentRates.map((rate, index) => ({
    id: `rate-${index}`,
    type: "rate_card" as const,
    title: rate.name || "Quick Quote",
    subtitle: `${rate.platform} · ${rate.format} · $${rate.price.toLocaleString()}`,
    timestamp: new Date(rate.createdAt),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success-focused header with personalization */}
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold">
          {getGreeting()}{creatorHandle ? `, @${creatorHandle}` : `, ${firstName}`}
        </h1>
        <p className="text-muted-foreground">
          {totalGenerated > 0 ? (
            <>
              You&apos;ve quoted <span className="font-mono font-semibold text-primary">${totalGenerated.toLocaleString()}</span> in rates this month
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

      {/* SECONDARY: Quick actions */}
      <section className="grid grid-cols-2 gap-4">
        <QuickActionCard
          href="/dashboard/quick-quote"
          icon={Calculator}
          title="Quick Rate"
          description="Get an instant quote"
          variant="outline"
        />
        <QuickActionCard
          href="/dashboard/gifts"
          icon={Gift}
          title="Gift Deals"
          badge={pendingGifts > 0 ? `${pendingGifts} pending` : undefined}
          description="Track gift offers"
          variant="outline"
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
