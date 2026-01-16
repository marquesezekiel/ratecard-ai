"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickQuoteForm } from "@/components/forms/quick-quote-form";
import { FitScoreDisplay } from "@/components/rate-card/fit-score-display";
import { PricingBreakdown } from "@/components/rate-card/pricing-breakdown";
import { PriceAdjuster } from "@/components/rate-card/price-adjuster";
import { ShareActions } from "@/components/rate-card/share-actions";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { CreatorProfile, ParsedBrief, FitScoreResult, PricingResult } from "@/lib/types";

export default function QuickQuotePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    brief: Omit<ParsedBrief, "id">;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  } | null>(null);
  const [adjustedPricing, setAdjustedPricing] = useState<PricingResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("creatorProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Complete Your Profile First</h2>
        <p className="text-center text-muted-foreground max-w-md">
          We need your follower counts and engagement rates to calculate your rate.
        </p>
        <Button onClick={() => router.push("/dashboard/profile")}>
          Set Up Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {result ? "Your Quote" : "Quick Quote"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {result
              ? `${result.brief.content.quantity}x ${result.brief.content.format} on ${result.brief.content.platform}`
              : "Get an instant rate without uploading a brief"
            }
          </p>
        </div>
        {result && profile && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setResult(null); setAdjustedPricing(null); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New Quote
            </Button>
            <ShareActions
              profile={profile}
              brief={result.brief}
              fitScore={result.fitScore}
              pricing={adjustedPricing || result.pricing}
            />
          </div>
        )}
      </div>

      {!result ? (
        <div className="max-w-xl">
          <QuickQuoteForm profile={profile} onQuoteGenerated={setResult} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FitScoreDisplay fitScore={result.fitScore} />
            <PricingBreakdown pricing={result.pricing} />
          </div>
          <PriceAdjuster
            calculatedPricing={result.pricing}
            onPriceChange={setAdjustedPricing}
          />
        </div>
      )}

      {!result && (
        <p className="text-center text-sm text-muted-foreground">
          Tip: If you have a full brand brief, use the{" "}
          <button
            onClick={() => router.push("/dashboard/upload")}
            className="text-primary hover:underline"
          >
            Upload Brief
          </button>{" "}
          flow for more accurate pricing.
        </p>
      )}
    </div>
  );
}
