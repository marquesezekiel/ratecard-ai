"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Zap, ArrowRight, Loader2, Lock } from "lucide-react";
import { FitScoreDisplay } from "@/components/rate-card/fit-score-display";
import { PricingBreakdown } from "@/components/rate-card/pricing-breakdown";
import { NegotiationCheatSheet } from "@/components/rate-card/negotiation-cheat-sheet";
import type { CreatorProfile, ParsedBrief, FitScoreResult, PricingResult, Platform, ContentFormat } from "@/lib/types";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
];

const FORMATS = [
  { value: "static", label: "Static Post", platforms: ["instagram", "twitter"] },
  { value: "carousel", label: "Carousel", platforms: ["instagram"] },
  { value: "story", label: "Story", platforms: ["instagram"] },
  { value: "reel", label: "Reel", platforms: ["instagram"] },
  { value: "video", label: "Short Video", platforms: ["tiktok", "youtube"] },
  { value: "ugc", label: "UGC Only", platforms: ["instagram", "tiktok", "youtube"] },
];

const USAGE_OPTIONS = [
  { value: "organic", label: "Organic only", days: 0, exclusivity: "none" as const },
  { value: "30-day", label: "30-day paid usage", days: 30, exclusivity: "none" as const },
  { value: "90-day", label: "90-day paid usage", days: 90, exclusivity: "none" as const },
  { value: "perpetual", label: "Perpetual rights", days: -1, exclusivity: "none" as const },
];

type Step = "profile" | "content" | "result";

export default function PublicQuotePage() {
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [platform, setPlatform] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagementRate, setEngagementRate] = useState("");

  // Content fields
  const [format, setFormat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [usageOption, setUsageOption] = useState("organic");

  // Results
  const [result, setResult] = useState<{
    brief: Omit<ParsedBrief, "id">;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  } | null>(null);

  const availableFormats = FORMATS.filter(f =>
    f.platforms.includes(platform) || platform === ""
  );

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !followers || !engagementRate) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setStep("content");
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!format) {
      setError("Please select content type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build synthetic profile
      const profile: CreatorProfile = {
        id: "temp",
        userId: "temp",
        displayName: "Creator",
        handle: "creator",
        bio: "",
        location: "United States",
        niches: ["lifestyle"],
        [platform]: {
          followers: parseInt(followers),
          engagementRate: parseFloat(engagementRate),
          avgLikes: Math.round(parseInt(followers) * parseFloat(engagementRate) / 100),
          avgComments: Math.round(parseInt(followers) * parseFloat(engagementRate) / 100 * 0.1),
          avgViews: parseInt(followers) * 2,
        },
        audience: {
          ageRange: "18-34",
          genderSplit: { male: 40, female: 55, other: 5 },
          topLocations: ["United States"],
          interests: ["lifestyle"],
        },
        tier: parseInt(followers) < 10000 ? "nano" : parseInt(followers) < 50000 ? "micro" : parseInt(followers) < 500000 ? "mid" : "macro",
        totalReach: parseInt(followers),
        avgEngagementRate: parseFloat(engagementRate),
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const selectedUsage = USAGE_OPTIONS.find(u => u.value === usageOption)!;

      const syntheticBrief: Omit<ParsedBrief, "id"> = {
        brand: { name: "Brand", industry: "lifestyle", product: "Product" },
        campaign: { objective: "Brand awareness", targetAudience: "General", budgetRange: "Not specified" },
        content: {
          platform: platform as Platform,
          format: format as ContentFormat,
          quantity,
          creativeDirection: "Creator's discretion",
        },
        usageRights: {
          durationDays: selectedUsage.days,
          exclusivity: selectedUsage.exclusivity,
          paidAmplification: selectedUsage.days > 0,
        },
        timeline: { deadline: "Flexible" },
        rawText: `Quick quote for ${quantity}x ${format} on ${platform}`,
      };

      const response = await fetch("/api/public-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, brief: syntheticBrief }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Calculation failed");
      }

      setResult({
        brief: syntheticBrief,
        fitScore: data.data.fitScore,
        pricing: data.data.pricing,
      });
      setStep("result");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">RateCard.AI</span>
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {step === "profile" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Know your worth</h1>
              <p className="text-muted-foreground mt-2">
                Get a data-backed rate in 60 seconds. No signup required.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Your Stats
                </CardTitle>
                <CardDescription>
                  We need a few numbers to calculate your rate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Where do you create?" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Follower Count</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 15000"
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Engagement Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 4.2"
                      value={engagementRate}
                      onChange={(e) => setEngagementRate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      (Likes + Comments) / Followers x 100
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "content" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">What are you creating?</h1>
              <p className="text-muted-foreground mt-2">
                Tell us about the deliverable.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleContentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="What are you creating?" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormats.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Usage Rights</Label>
                    <RadioGroup value={usageOption} onValueChange={setUsageOption} className="space-y-2">
                      {USAGE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          htmlFor={option.value}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                            usageOption === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <span className="font-medium text-sm">{option.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep("profile")}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          Get My Rate
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Your Rate</h1>
              <p className="text-muted-foreground mt-2">
                {result.brief.content.quantity}x {result.brief.content.format} on {result.brief.content.platform}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FitScoreDisplay fitScore={result.fitScore} />
              <PricingBreakdown pricing={result.pricing} />
            </div>

            {/* Negotiation Cheat Sheet */}
            <NegotiationCheatSheet pricing={result.pricing} />

            {/* Gated Actions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Save your rate card</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a free account to download the PDF, save to history, and access your rates anytime.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Link href="/sign-up">
                        <Button>
                          Create Free Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => setStep("profile")}>
                        Start Over
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
