"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GiftEvaluatorForm } from "@/components/forms/gift-evaluator-form";
import { GiftTrackingList } from "@/components/dashboard/gift-tracking-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Gift, Plus, List, Calculator } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGifts } from "@/hooks/use-gifts";
import { cn } from "@/lib/utils";
import type { DMAnalysis, GiftEvaluationInput } from "@/lib/types";

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
  const { profile, isLoading: profileLoading } = useProfile();
  const { gifts, followUpsDue, updateGift, deleteGift, isLoading: giftsLoading } = useGifts();

  // Compute initial data synchronously on first render (avoids setState in effect)
  const shouldEvaluate = searchParams.get("evaluate") === "true";
  const [initialData] = useState(() => getInitialGiftData(shouldEvaluate));

  // Tab state - default to tracking if has gifts, evaluate if coming from DM analysis
  const [activeTab, setActiveTab] = useState<"evaluate" | "tracking">(
    shouldEvaluate ? "evaluate" : "tracking"
  );

  // Quick stats
  const stats = useMemo(() => {
    const total = gifts.length;
    const active = gifts.filter(g => !["converted", "declined", "archived"].includes(g.status)).length;
    const converted = gifts.filter(g => g.status === "converted").length;
    const totalValue = gifts.reduce((sum, g) => sum + (g.productValue || 0), 0);
    const convertedValue = gifts
      .filter(g => g.status === "converted")
      .reduce((sum, g) => sum + (g.convertedAmount || 0), 0);

    return { total, active, converted, totalValue, convertedValue };
  }, [gifts]);

  // Loading state
  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading profile">
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
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold md:text-3xl">Gift Deals</h1>
          </div>
          {gifts.length > 0 && activeTab === "tracking" && (
            <Button size="sm" onClick={() => setActiveTab("evaluate")}>
              <Plus className="h-4 w-4 mr-2" />
              Evaluate New
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Track gift offers, manage follow-ups, and convert them to paid deals.
        </p>
      </header>

      {/* Quick Stats (only show if has gifts) */}
      {gifts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-green-600">{stats.converted}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono">${stats.totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Products Received</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-green-600">
                ${stats.convertedValue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Converted Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("tracking")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "tracking"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            My Gifts
            {gifts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                {gifts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("evaluate")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "evaluate"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Calculator className="h-4 w-4" />
            Evaluate New
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "tracking" ? (
        giftsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GiftTrackingList
            gifts={gifts}
            followUpsDue={followUpsDue}
            onUpdate={updateGift}
            onDelete={deleteGift}
          />
        )
      ) : (
        <GiftEvaluatorForm
          profile={profile}
          initialData={initialData}
        />
      )}
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
