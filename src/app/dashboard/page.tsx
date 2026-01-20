"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, FileText, CheckCircle2, Circle, ArrowRight, Clock } from "lucide-react";
import { SavedRates } from "@/components/rate-card/saved-rates";
import type { CreatorProfile } from "@/lib/types";

interface RateCardHistoryItem {
  brandName?: string;
  platform: string;
  format: string;
  totalPrice: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [recentRates, setRecentRates] = useState<RateCardHistoryItem[]>([]);

  useEffect(() => {
    startTransition(() => {
      const saved = localStorage.getItem("creatorProfile");
      if (saved) setProfile(JSON.parse(saved));

      const savedRates = localStorage.getItem("rateCardHistory");
      if (savedRates) setRecentRates(JSON.parse(savedRates).slice(0, 3));
    });
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const hasProfile = !!profile;
  const hasRates = recentRates.length > 0;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Get a defendable rate in minutes.
        </p>
      </div>

      {/* Two Decision Tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Quick Quote Tile */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Quick Quote</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Get a rate in 30 seconds — perfect for DM inquiries.
            </p>
            <Link href="/dashboard/quick-quote">
              <Button className="w-full sm:w-auto">
                Get My Rate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Upload Brief Tile */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
              <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Upload Brief</h2>
            <p className="text-muted-foreground text-sm mb-6">
              For precise pricing from a brand&apos;s campaign brief.
            </p>
            <Link href="/dashboard/upload">
              <Button variant="outline" className="w-full sm:w-auto">
                Upload Brief
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Compact Progress Row */}
      <div className="flex items-center justify-center gap-4 py-4">
        <ProgressStep
          label="Profile"
          complete={hasProfile}
          href="/dashboard/profile"
        />
        <ProgressDivider />
        <ProgressStep
          label="Get Quote"
          complete={hasRates}
          href="/dashboard/quick-quote"
        />
        <ProgressDivider />
        <ProgressStep
          label="Share"
          complete={false}
          href="/dashboard/history"
        />
      </div>

      {/* Recent Rate Cards */}
      {hasRates ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Rate Cards</h2>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3">
            {recentRates.map((rate, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{rate.brandName || "Quick Quote"}</p>
                    <p className="text-sm text-muted-foreground">
                      {rate.platform} · {rate.format}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${rate.totalPrice}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">
            Your rate cards will appear here after you generate them.
          </p>
        </Card>
      )}

      {/* Quick Reference - Saved Rates */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Reference</h2>
        <SavedRates onAddNew={() => router.push("/dashboard/quick-quote")} />
      </div>
    </div>
  );
}

function ProgressStep({
  label,
  complete,
  href
}: {
  label: string;
  complete: boolean;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 group">
      {complete ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground" />
      )}
      <span className={`text-sm ${complete ? "text-foreground" : "text-muted-foreground"} group-hover:text-foreground transition-colors`}>
        {label}
      </span>
    </Link>
  );
}

function ProgressDivider() {
  return <div className="h-px w-8 bg-border" />;
}
