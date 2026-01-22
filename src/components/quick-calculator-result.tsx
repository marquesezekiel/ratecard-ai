"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import type { QuickEstimateResult } from "@/lib/types";

interface QuickCalculatorResultProps {
  result: QuickEstimateResult;
  onReset: () => void;
}

export function QuickCalculatorResult({
  result,
  onReset,
}: QuickCalculatorResultProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const platformDisplayNames: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    twitter: "Twitter/X",
    threads: "Threads",
    pinterest: "Pinterest",
    linkedin: "LinkedIn",
    snapchat: "Snapchat",
    twitch: "Twitch",
    bluesky: "Bluesky",
    lemon8: "Lemon8",
  };

  const formatDisplayNames: Record<string, string> = {
    static: "Static Post",
    carousel: "Carousel",
    story: "Story",
    reel: "Reel",
    video: "Video",
    live: "Live Stream",
    ugc: "UGC",
  };

  return (
    <div className="space-y-6">
      {/* Rate Display Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Your Estimated Rate</p>
            <div className="text-4xl sm:text-5xl font-bold mb-2">
              {formatCurrency(result.minRate)} – {formatCurrency(result.maxRate)}
            </div>
            <p className="text-sm opacity-80">
              per {formatDisplayNames[result.contentFormat] || result.contentFormat} on{" "}
              {platformDisplayNames[result.platform] || result.platform}
            </p>
          </div>
        </div>
        <CardContent className="p-6">
          {/* Tier Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {result.tierName} Creator
            </Badge>
            <span className="text-sm text-muted-foreground">
              Based on your follower count
            </span>
          </div>

          {/* Factors That Could Increase Rate */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">What Could Increase Your Rate</h3>
            </div>
            <div className="grid gap-3">
              {result.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm font-semibold text-green-600">
                      {factor.potentialIncrease}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {factor.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-6 pt-4 border-t">
            This is an estimate based on average engagement (3%). Your actual rate may be higher based on your specific metrics and deal terms.
          </p>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Want Your Exact Rate?</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Create a free account to get a personalized rate card based on your actual engagement, niche, and brand deals. It takes less than 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Get Your Personalized Rate Card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onReset}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Calculate Again
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
