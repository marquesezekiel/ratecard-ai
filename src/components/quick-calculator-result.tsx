"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Users,
  RefreshCw,
  Globe,
  Briefcase,
  Camera,
} from "lucide-react";
import type { QuickEstimateResult } from "@/lib/types";

interface QuickCalculatorResultProps {
  result: QuickEstimateResult;
  onReset: () => void;
}

const iconMap: Record<string, typeof TrendingUp> = {
  TrendingUp,
  Globe,
  Briefcase,
  Camera,
};

export function QuickCalculatorResult({
  result,
  onReset,
}: QuickCalculatorResultProps) {
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
      {/* Main Rate Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Your Estimated Rate</p>
            <div className="text-4xl sm:text-5xl font-bold font-mono mb-2">
              <AnimatedNumber value={result.minRate} prefix="$" duration={800} />
              <span className="text-2xl mx-2 opacity-70">–</span>
              <AnimatedNumber value={result.maxRate} prefix="$" duration={1000} />
            </div>
            <p className="text-sm opacity-80">
              per {formatDisplayNames[result.contentFormat] || result.contentFormat}
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Percentile Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Where you stand among {result.tierName} creators
              </span>
              <Badge variant="secondary" className="font-mono">
                Top {100 - result.percentile}%
              </Badge>
            </div>

            {/* Visual percentile bar */}
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              {/* Background gradient showing distribution */}
              <div className="absolute inset-0 bg-gradient-to-r from-muted via-primary/20 to-primary/40" />

              {/* Marker for user's position */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary shadow-lg"
                style={{ left: `${result.percentile}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              </div>

              {/* Labels */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[10px] text-muted-foreground">
                <span>$0</span>
                <span className="font-medium text-foreground">You</span>
                <span>${result.topPerformerRange.max.toLocaleString()}+</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              {result.percentile >= 50 ? (
                <>You&apos;re charging more than <span className="font-semibold text-foreground">{result.percentile}%</span> of similar creators</>
              ) : (
                <>Top {result.tierName} creators charge <span className="font-semibold text-foreground">${result.topPerformerRange.min.toLocaleString()}–${result.topPerformerRange.max.toLocaleString()}</span></>
              )}
            </p>
          </div>

          {/* The Gap: What's NOT Included */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">What This Estimate is Missing</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {result.missingFactors.map((factor, i) => {
                const Icon = iconMap[factor.icon] || TrendingUp;
                return (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{factor.name}</span>
                        <span className="text-xs font-mono text-amber-600">{factor.impact}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{factor.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-center text-muted-foreground mt-4">
              These 4 factors can swing your rate by <span className="font-semibold text-foreground">$200–$800</span>
            </p>
          </div>

          {/* The Insight */}
          <div className="border-t pt-6">
            <div className="bg-gradient-to-r from-coral/10 to-primary/10 rounded-xl p-4 text-center">
              <p className="text-3xl mb-2">💡</p>
              <p className="font-semibold mb-1">Did you know?</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">73% of creators</span> with 10K-50K followers undercharge by an average of <span className="font-mono font-medium text-coral">$340</span> per deal.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                That&apos;s <span className="font-semibold">$4,000+ left on the table</span> per year.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-display font-bold mb-2">
              Your Real Rate Could Be ${result.potentialWithFullProfile.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">
              Get your personalized rate card with full analysis — takes 2 minutes, free forever.
            </p>
          </div>

          {/* What they get */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              "Rate based on YOUR engagement",
              "Negotiation scripts to copy",
              "Brand message analyzer",
              "PDF rate card to send",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {benefit}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button asChild size="lg" className="w-full gap-2 text-base">
              <Link href="/sign-up">
                Get Your Real Rate Card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try different inputs
            </Button>
          </div>

          {/* Testimonial */}
          <div className="border-t pt-4 mt-2">
            <p className="text-sm text-center italic text-muted-foreground">
              &quot;I went from charging $150 to $600 after seeing what creators like me were actually getting paid&quot;
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              — @lifestyle.sarah, 22K followers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
