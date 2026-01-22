"use client";

import { useState, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GiftEvaluatorForm } from "@/components/forms/gift-evaluator-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, Gift, TrendingUp } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("evaluate");

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold md:text-3xl">Gift Deals</h1>
        </div>
        <p className="text-muted-foreground">
          Evaluate gift offers and decide if they&apos;re worth your time.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evaluate" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Evaluate Gift
          </TabsTrigger>
          <TabsTrigger value="track" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Track Gifts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluate" className="mt-6">
          <GiftEvaluatorForm
            profile={profile}
            initialData={initialData}
          />
        </TabsContent>

        <TabsContent value="track" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Gift Tracker
              </CardTitle>
              <CardDescription>
                Track your gift collaborations and convert them to paid partnerships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The gift tracker will help you manage brand relationships,
                  track content performance, and convert gifts into paid partnerships.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
