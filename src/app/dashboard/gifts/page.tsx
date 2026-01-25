"use client";

import { useState, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GiftEvaluatorForm } from "@/components/forms/gift-evaluator-form";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Gift } from "lucide-react";
import type { CreatorProfile, DMAnalysis, GiftEvaluationInput } from "@/lib/types";

const emptySubscribe = () => () => {};

function useLocalStorageProfile(): CreatorProfile | null | undefined {
  const cacheRef = useRef<{ raw: string | null; parsed: CreatorProfile | null }>({ raw: null, parsed: null });

  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem("creatorProfile");
    if (raw !== cacheRef.current.raw) {
      cacheRef.current.raw = raw;
      cacheRef.current.parsed = raw ? JSON.parse(raw) as CreatorProfile : null;
    }
    return cacheRef.current.parsed;
  }, []);

  const getServerSnapshot = useCallback((): CreatorProfile | null | undefined => undefined, []);

  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

/**
 * Parses gift analysis from session storage (client-side only).
 * Returns initial data for the gift evaluator form, and clears the storage.
 */
function getInitialGiftData(shouldEvaluate: boolean): Partial<GiftEvaluationInput> | undefined {
  if (typeof window === "undefined") return undefined;
  if (!shouldEvaluate) return undefined;

  const storedAnalysis = sessionStorage.getItem("giftAnalysis");
  if (!storedAnalysis) return undefined;

  try {
    const analysis: DMAnalysis = JSON.parse(storedAnalysis);
    // Clear immediately after reading to prevent re-processing
    sessionStorage.removeItem("giftAnalysis");
    return {
      productDescription: analysis.giftAnalysis?.productMentioned || "",
      estimatedProductValue: analysis.estimatedProductValue || 0,
      contentRequired: mapContentExpectation(analysis.giftAnalysis?.contentExpectation),
    };
  } catch {
    return undefined;
  }
}

export default function GiftsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useLocalStorageProfile();

  // Compute initial data synchronously on first render (avoids setState in effect)
  const shouldEvaluate = searchParams.get("evaluate") === "true";
  const [initialData] = useState(() => getInitialGiftData(shouldEvaluate));

  // Loading state
  if (profile === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Complete Your Profile First</h2>
        <p className="text-center text-muted-foreground max-w-md">
          We need your follower counts and engagement rates to evaluate gift offers properly.
        </p>
        <Button onClick={() => router.push("/dashboard/profile")}>
          Set Up Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold md:text-3xl">Gift Evaluator</h1>
        </div>
        <p className="text-muted-foreground">
          Evaluate gift offers and decide if they&apos;re worth your time.
        </p>
      </header>

      {/* Gift Evaluator Form */}
      <GiftEvaluatorForm
        profile={profile}
        initialData={initialData}
      />
    </div>
  );
}

/**
 * Map DM analysis content expectation to gift evaluator content required.
 */
function mapContentExpectation(expectation?: string): GiftEvaluationInput["contentRequired"] {
  switch (expectation) {
    case "explicit":
      return "dedicated_post";
    case "implied":
      return "organic_mention";
    case "none":
      return "organic_mention";
    default:
      return "dedicated_post";
  }
}
