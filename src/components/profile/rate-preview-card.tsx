"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateQuickEstimate } from "@/lib/quick-calculator";
import { Sparkles } from "lucide-react";

interface RatePreviewCardProps {
  followers: number;
  platform: "instagram" | "tiktok" | "youtube" | "twitter";
  engagementRate?: number;
}

export function RatePreviewCard({
  followers,
  platform,
  engagementRate,
}: RatePreviewCardProps) {
  // Don't show preview if no followers entered
  if (!followers || followers < 100) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Rate Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add your follower count to see an estimated rate.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate estimated rate
  const estimate = calculateQuickEstimate({
    followerCount: followers,
    platform: platform,
    contentFormat: "reel", // Default to reel as most common
    niche: "lifestyle", // Default niche
  });

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Rate Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-mono font-bold tracking-tight">
            <span>${estimate.minRate.toLocaleString()}</span>
            <span className="text-muted-foreground mx-2">–</span>
            <span>${estimate.maxRate.toLocaleString()}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            For a typical {platform === "youtube" ? "YouTube video" : "Reel/TikTok"}
          </p>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your tier</span>
            <span className="font-medium capitalize">{estimate.tierName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Followers</span>
            <span className="font-mono">{followers.toLocaleString()}</span>
          </div>
          {engagementRate && engagementRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-mono">{engagementRate.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Add more details for a more accurate estimate. The final rate depends
          on content type, usage rights, and brand fit.
        </p>
      </CardContent>
    </Card>
  );
}
