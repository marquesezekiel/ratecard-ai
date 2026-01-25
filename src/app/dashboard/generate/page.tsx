"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceAdjuster } from "@/components/rate-card/price-adjuster";
import { NegotiationCheatSheet } from "@/components/rate-card/negotiation-cheat-sheet";
import { ShareActions } from "@/components/rate-card/share-actions";
import type { CreatorProfile, ParsedBrief, FitScoreResult, PricingResult, ApiResponse } from "@/lib/types";

type PageState = "loading" | "calculating" | "success" | "error" | "missing-data";

export default function GeneratePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [fitScore, setFitScore] = useState<FitScoreResult | null>(null);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [adjustedPricing, setAdjustedPricing] = useState<PricingResult | null>(null);
  const [brief, setBrief] = useState<ParsedBrief | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    const loadDataAndCalculate = async () => {
      // Load data from localStorage
      const profileData = localStorage.getItem("creatorProfile");
      const briefData = localStorage.getItem("currentBrief");

      if (!profileData || !briefData) {
        startTransition(() => {
          setPageState("missing-data");
          setError(!profileData ? "profile" : "brief");
        });
        return;
      }

      try {
        const loadedProfile: CreatorProfile = JSON.parse(profileData);
        const parsedBrief: ParsedBrief = JSON.parse(briefData);
        setProfile(loadedProfile);
        setBrief(parsedBrief);

        startTransition(() => {
          setPageState("calculating");
        });

        // Call calculate API
        const response = await fetch("/api/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile: loadedProfile, brief: parsedBrief }),
        });

        const result: ApiResponse<{ fitScore: FitScoreResult; pricing: PricingResult }> = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to calculate rate");
        }

        setFitScore(result.data.fitScore);
        setPricing(result.data.pricing);
        setPageState("success");
      } catch (err) {
        setPageState("error");
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    };

    loadDataAndCalculate();
  }, []);

  const handleStartOver = () => {
    localStorage.removeItem("currentBrief");
    router.push("/dashboard/analyze");
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Missing data state
  if (pageState === "missing-data") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold">Missing Information</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {error === "profile"
            ? "Please complete your profile before generating a rate card."
            : "Please upload a brand brief first."}
        </p>
        <Button
          onClick={() => router.push(error === "profile" ? "/dashboard/profile" : "/dashboard/analyze")}
          className="mt-6"
        >
          {error === "profile" ? "Complete Profile" : "Upload Brief"}
        </Button>
      </div>
    );
  }

  // Calculating state
  if (pageState === "calculating") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold">Calculating your rate...</h2>
              <p className="text-muted-foreground mt-2">
                Analyzing brand fit and running pricing engine
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
              <Button onClick={handleStartOver} variant="outline" className="mt-6">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - show results
  if (pageState === "success" && fitScore && pricing && brief && profile) {
    const fitLevelColors: Record<string, string> = {
      perfect: "bg-green-100 text-green-800",
      high: "bg-blue-100 text-blue-800",
      medium: "bg-amber-100 text-amber-800",
      low: "bg-red-100 text-red-800",
    };

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <h1 className="text-2xl font-display font-bold">Your Rate Card is Ready</h1>
          </div>
          <p className="text-muted-foreground">
            Here&apos;s your recommended rate for {brief.brand.name}
          </p>
        </header>

        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Rate</CardTitle>
            <CardDescription>Based on your profile and brand requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-primary">
                ${pricing.totalPrice.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-2">
                {pricing.quantity > 1
                  ? `$${pricing.pricePerDeliverable.toLocaleString()} × ${pricing.quantity} deliverables`
                  : "Total project rate"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fit Score Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Brand Fit Score</CardTitle>
              <Badge className={fitLevelColors[fitScore.fitLevel]}>
                {fitScore.fitLevel.charAt(0).toUpperCase() + fitScore.fitLevel.slice(1)} Fit
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{fitScore.totalScore}</div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${fitScore.totalScore}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{fitScore.insights[0]}</p>
          </CardContent>
        </Card>

        {/* Price Adjuster */}
        <PriceAdjuster
          calculatedPricing={pricing}
          onPriceChange={setAdjustedPricing}
        />

        {/* Negotiation Scripts */}
        <NegotiationCheatSheet pricing={adjustedPricing || pricing} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ShareActions
              profile={profile}
              brief={brief}
              fitScore={fitScore}
              pricing={adjustedPricing || pricing}
            />
          </div>
          <Button onClick={handleStartOver} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            New Rate Card
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
