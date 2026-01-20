"use client";

import { useState, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuickQuoteForm } from "@/components/forms/quick-quote-form";
import { FitScoreDisplay } from "@/components/rate-card/fit-score-display";
import { PricingBreakdown } from "@/components/rate-card/pricing-breakdown";
import { PriceAdjuster } from "@/components/rate-card/price-adjuster";
import { NegotiationCheatSheet } from "@/components/rate-card/negotiation-cheat-sheet";
import { ShareActions } from "@/components/rate-card/share-actions";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { CreatorProfile, ParsedBrief, FitScoreResult, PricingResult } from "@/lib/types";

const emptySubscribe = () => () => {};

function useLocalStorageProfile(): CreatorProfile | null | undefined {
  // Cache the parsed result to avoid infinite loops
  const cacheRef = useRef<{ raw: string | null; parsed: CreatorProfile | null }>({ raw: null, parsed: null });

  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem("creatorProfile");
    // Only re-parse if the raw string changed
    if (raw !== cacheRef.current.raw) {
      cacheRef.current.raw = raw;
      cacheRef.current.parsed = raw ? JSON.parse(raw) as CreatorProfile : null;
    }
    return cacheRef.current.parsed;
  }, []);

  // Return undefined on server to indicate "loading" state
  const getServerSnapshot = useCallback((): CreatorProfile | null | undefined => undefined, []);

  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

export default function QuickQuotePage() {
  const router = useRouter();
  const profile = useLocalStorageProfile();
  const [result, setResult] = useState<{
    brief: Omit<ParsedBrief, "id">;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  } | null>(null);
  const [adjustedPricing, setAdjustedPricing] = useState<PricingResult | null>(null);

  // undefined means still loading (server render), null means no profile
  if (profile === undefined) {
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
      {/* Header - centered when showing form, left-aligned when showing results */}
      {!result ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Quick Quote</h1>
          <p className="text-muted-foreground mt-1">
            Get an instant rate without uploading a brief
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Your Quote</h1>
            <p className="text-muted-foreground mt-1">
              {result.brief.content.quantity}x {result.brief.content.format} on {result.brief.content.platform}
            </p>
          </div>
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
        </div>
      )}

      {!result ? (
        <div className="max-w-xl mx-auto">
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
          <NegotiationCheatSheet pricing={adjustedPricing || result.pricing} />
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
