"use client";

import { useState, useSyncExternalStore, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickQuoteForm } from "@/components/forms/quick-quote-form";
import { FitScoreDisplay } from "@/components/rate-card/fit-score-display";
import { PricingBreakdown } from "@/components/rate-card/pricing-breakdown";
import { PriceAdjuster } from "@/components/rate-card/price-adjuster";
import { NegotiationCheatSheet } from "@/components/rate-card/negotiation-cheat-sheet";
import { ShareActions } from "@/components/rate-card/share-actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfetti } from "@/components/ui/confetti";
import { AlertCircle, Loader2, RefreshCw, PartyPopper } from "lucide-react";
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
  const [showCelebration, setShowCelebration] = useState(false);
  const { fireMultiple } = useConfetti();

  // Track whether we've already handled the first rate card celebration
  const hasCheckedFirstRateCard = useRef(false);

  // Fire confetti on first rate card generation - use a callback in setTimeout to satisfy lint
  useEffect(() => {
    if (!result || hasCheckedFirstRateCard.current) return;

    hasCheckedFirstRateCard.current = true;
    const hasGeneratedBefore = localStorage.getItem("hasGeneratedRateCard");

    if (!hasGeneratedBefore) {
      localStorage.setItem("hasGeneratedRateCard", "true");
      // Use setTimeout callback to trigger state update and confetti
      setTimeout(() => {
        setShowCelebration(true);
        fireMultiple();
      }, 300);
    }
  }, [result, fireMultiple]);

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - centered when showing form, left-aligned when showing results */}
      {!result ? (
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-display font-bold md:text-3xl">Quick Quote</h1>
          <p className="text-muted-foreground">
            Get an instant rate without uploading a brief
          </p>
        </header>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold md:text-3xl">Your Quote</h1>
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
        <>
          {/* First rate card celebration */}
          {showCelebration && (
            <div className="text-center py-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <PartyPopper className="h-5 w-5" />
                <span className="font-medium">Your first rate card! You&apos;re on your way to getting paid what you&apos;re worth.</span>
              </div>
            </div>
          )}

          <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pricing">Your Rate</TabsTrigger>
            <TabsTrigger value="tips">Negotiation Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <FitScoreDisplay fitScore={result.fitScore} />
              <PricingBreakdown pricing={result.pricing} />
            </div>
            <PriceAdjuster
              calculatedPricing={result.pricing}
              onPriceChange={setAdjustedPricing}
            />
          </TabsContent>

          <TabsContent value="tips" className="mt-6">
            <NegotiationCheatSheet pricing={adjustedPricing || result.pricing} />
          </TabsContent>
        </Tabs>
        </>
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
