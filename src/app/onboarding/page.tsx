"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowRight, Zap } from "lucide-react";
import { calculateTier } from "@/lib/pricing-engine";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent, setUserProperties } from "@/lib/analytics";
import type { CreatorProfile, Platform } from "@/lib/types";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "threads", label: "Threads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitch", label: "Twitch" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const hasTrackedStart = useRef(false);

  const [platform, setPlatform] = useState<Platform>("instagram");
  const [followers, setFollowers] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Track onboarding start once
  useEffect(() => {
    if (!hasTrackedStart.current && !authLoading && user) {
      trackEvent('onboarding_start');
      hasTrackedStart.current = true;
    }
  }, [authLoading, user]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const followerCount = parseInt(followers, 10);
    if (!followerCount || followerCount < 100) {
      setError("Please enter a valid follower count (minimum 100)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create minimal profile data
      const profileData: Partial<CreatorProfile> & {
        quickSetupComplete: boolean;
      } = {
        displayName: user?.name || "Creator",
        handle: "creator",
        location: "United States",
        niches: ["lifestyle"],
        tier: calculateTier(followerCount),
        totalReach: followerCount,
        avgEngagementRate: parseFloat(engagementRate) || 3.0,
        [platform]: {
          followers: followerCount,
          engagementRate: parseFloat(engagementRate) || 3.0,
          avgLikes: 0,
          avgComments: 0,
          avgViews: 0,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 40, female: 55, other: 5 },
          topLocations: ["United States"],
          interests: ["lifestyle"],
        },
        quickSetupComplete: true,
      };

      // Save to database
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      // Also save to localStorage for client-side use
      localStorage.setItem("creatorProfile", JSON.stringify(profileData));

      // Track onboarding complete
      trackEvent('onboarding_complete', {
        platform,
        followers: followerCount,
        tier: profileData.tier,
      });

      // Set user properties for segmentation
      setUserProperties({
        tier: profileData.tier,
        primaryPlatform: platform,
        totalFollowers: followerCount,
        avgEngagementRate: profileData.avgEngagementRate,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-sparkle" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">RateCard.AI</h1>
      </div>

      {/* Onboarding Card */}
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Quick Setup</CardTitle>
          <CardDescription>
            Tell us about your primary platform. You can add more details later.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                {error}
              </div>
            )}

            {/* Platform Select */}
            <div className="space-y-2">
              <Label htmlFor="platform">Primary Platform</Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as Platform)}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select your main platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Followers Input */}
            <div className="space-y-2">
              <Label htmlFor="followers">Follower Count</Label>
              <Input
                id="followers"
                type="number"
                placeholder="e.g., 15000"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                min={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your total followers on this platform
              </p>
            </div>

            {/* Engagement Rate Input */}
            <div className="space-y-2">
              <Label htmlFor="engagement">
                Engagement Rate (%)
                <span className="text-muted-foreground text-xs ml-1">optional</span>
              </Label>
              <Input
                id="engagement"
                type="number"
                step="0.1"
                placeholder="e.g., 4.2"
                value={engagementRate}
                onChange={(e) => setEngagementRate(e.target.value)}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                (Likes + Comments) / Followers x 100. We&apos;ll assume 3% if you skip this.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !followers}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <p className="mt-6 text-sm text-muted-foreground text-center max-w-sm">
        You can always update your profile later to get more accurate rate calculations.
      </p>
    </div>
  );
}
