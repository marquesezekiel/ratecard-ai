"use client";

import { useState, useEffect, startTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  ProfileCompleteness,
  calculateProfileCompleteness,
} from "@/components/profile/profile-completeness";
import { RatePreviewCard } from "@/components/profile/rate-preview-card";
import { MobileRateSheet } from "@/components/profile/mobile-rate-sheet";
import { useCelebration } from "@/hooks/use-celebration";
import { CelebrationToast } from "@/components/ui/celebration-toast";
import { getCreatorLevel, type CreatorLevel } from "@/lib/gamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Zap, ChevronDown } from "lucide-react";
import { calculateTier } from "@/lib/pricing-engine";
import type { CreatorProfile } from "@/lib/types";

const breadcrumbItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Profile" },
];

interface ProfileFormValues {
  displayName?: string;
  handle?: string;
  location?: string;
  niches?: string[];
  activePlatforms?: string[];
  instagram?: { followers?: number; engagementRate?: number };
  tiktok?: { followers?: number; engagementRate?: number };
  youtube?: { followers?: number; engagementRate?: number };
  twitter?: { followers?: number; engagementRate?: number };
  audience?: {
    ageRange?: string;
    genderSplit?: { male?: number; female?: number; other?: number };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState<ProfileFormValues>({});
  const [completeness, setCompleteness] = useState(0);
  const prevLevelRef = useRef<CreatorLevel | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Quick setup state
  const [quickSetup, setQuickSetup] = useState({
    platform: "instagram",
    followers: "",
    engagementRate: "",
  });
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  const { celebration, celebrate, dismissCelebration } = useCelebration();

  useEffect(() => {
    async function loadProfile() {
      try {
        // Fetch from API as the authoritative source
        const response = await fetch("/api/profile");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            setInitialData(data);
            setFormValues(data);
            // Use the database-stored completeness value for consistency
            const initialCompleteness = data.profileCompleteness ?? calculateProfileCompleteness(data);
            setCompleteness(initialCompleteness);
            // Set initial level without triggering celebration
            prevLevelRef.current = getCreatorLevel(initialCompleteness);
            // User has existing profile, show full form by default
            setHasExistingProfile(true);
            setShowFullForm(true);
            // Sync to localStorage for offline access
            localStorage.setItem("creatorProfile", JSON.stringify(data));
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }

      // Fall back to localStorage if API fails or returns no data
      const stored = localStorage.getItem("creatorProfile");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setInitialData(data);
          setFormValues(data);
          const initialCompleteness = calculateProfileCompleteness(data);
          setCompleteness(initialCompleteness);
          prevLevelRef.current = getCreatorLevel(initialCompleteness);
          setHasExistingProfile(true);
          setShowFullForm(true);
        } catch {
          // Invalid JSON, start fresh
        }
      }
      setIsLoading(false);
    }

    startTransition(() => {
      loadProfile();
    });
  }, []);

  // Check for level-up when completeness changes
  const currentLevel = getCreatorLevel(completeness);

  useEffect(() => {
    if (prevLevelRef.current && prevLevelRef.current !== currentLevel) {
      // Level changed - check if it's an upgrade
      const levels: CreatorLevel[] = ["beginner", "rising", "pro", "expert"];
      const prevIndex = levels.indexOf(prevLevelRef.current);
      const currentIndex = levels.indexOf(currentLevel);

      if (currentIndex > prevIndex) {
        // Level up! Celebrate
        celebrate("profile_level_up");
      }
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel, celebrate]);

  const handleValuesChange = useCallback((values: ProfileFormValues) => {
    setFormValues(values);
    setCompleteness(calculateProfileCompleteness(values));
  }, []);

  const handleQuickSetup = useCallback(async () => {
    const followers = parseInt(quickSetup.followers, 10);
    if (!followers || followers < 100) return;

    setIsQuickSaving(true);

    try {
      // Create a minimal profile
      const minimalProfile: Partial<CreatorProfile> = {
        displayName: "Creator",
        handle: "creator",
        location: "United States",
        currency: "USD",
        niches: ["lifestyle"],
        tier: calculateTier(followers),
        totalReach: followers,
        avgEngagementRate: parseFloat(quickSetup.engagementRate) || 3.0,
        [quickSetup.platform]: {
          followers,
          engagementRate: parseFloat(quickSetup.engagementRate) || 3.0,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 40, female: 55, other: 5 },
          topLocations: ["United States"],
          interests: ["lifestyle"],
        },
      };

      // Save to localStorage
      localStorage.setItem("creatorProfile", JSON.stringify(minimalProfile));

      // Redirect to analyze page
      router.push("/dashboard/analyze");
    } catch (error) {
      console.error("Error creating profile:", error);
      setIsQuickSaving(false);
    }
  }, [quickSetup, router]);

  // Get the primary platform's data for the preview
  const getPrimaryPlatformData = () => {
    const platforms = formValues.activePlatforms || ["instagram"];
    const primaryPlatform = platforms[0] as
      | "instagram"
      | "tiktok"
      | "youtube"
      | "twitter";

    const platformData = formValues[primaryPlatform];

    return {
      platform: primaryPlatform,
      followers: platformData?.followers || 0,
      engagementRate: platformData?.engagementRate || 0,
    };
  };

  const primaryPlatform = getPrimaryPlatformData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show quick setup for new users who haven't shown full form yet
  if (!hasExistingProfile && !showFullForm) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Quick Setup Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Get started in seconds. You can add more details later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qs-platform">Platform</Label>
              <Select
                value={quickSetup.platform}
                onValueChange={(value) => setQuickSetup(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger id="qs-platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qs-followers">Followers</Label>
              <Input
                id="qs-followers"
                type="number"
                placeholder="e.g., 15000"
                value={quickSetup.followers}
                onChange={(e) => setQuickSetup(prev => ({ ...prev, followers: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qs-engagement">
                Engagement Rate (%) <span className="text-muted-foreground text-xs">optional</span>
              </Label>
              <Input
                id="qs-engagement"
                type="number"
                step="0.1"
                placeholder="e.g., 4.2"
                value={quickSetup.engagementRate}
                onChange={(e) => setQuickSetup(prev => ({ ...prev, engagementRate: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                (Likes + Comments) / Followers × 100. We&apos;ll assume 3% if you skip this.
              </p>
            </div>

            <Button
              onClick={handleQuickSetup}
              disabled={!quickSetup.followers || parseInt(quickSetup.followers, 10) < 100 || isQuickSaving}
              className="w-full"
            >
              {isQuickSaving ? "Setting up..." : "Start Analyzing Deals"}
            </Button>
          </CardContent>
        </Card>

        {/* Expand to full form - use Sheet overlay */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              <ChevronDown className="h-4 w-4" />
              Add more details for better accuracy
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Complete Your Profile</SheetTitle>
              <SheetDescription>
                More details = more accurate rates. Fill in what you know.
              </SheetDescription>
            </SheetHeader>
            <ProfileForm
              initialData={initialData}
              onValuesChange={handleValuesChange}
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Celebration Toast */}
      {celebration.isShowing && celebration.milestone && (
        <CelebrationToast
          title={celebration.milestone.title}
          subtitle={celebration.milestone.subtitle}
          emoji={celebration.milestone.emoji}
          onClose={dismissCelebration}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            The more you share, the more accurate your rates
          </p>
        </div>
        <ProfileCompleteness percentage={completeness} showDetails />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main form - 2 cols */}
        <div className="md:col-span-2">
          <ProfileForm
            initialData={initialData}
            onValuesChange={handleValuesChange}
          />
        </div>

        {/* Live Preview - 1 col, sticky on desktop */}
        <div className="hidden md:block">
          <div className="sticky top-6">
            <RatePreviewCard
              followers={primaryPlatform.followers}
              platform={primaryPlatform.platform}
              engagementRate={primaryPlatform.engagementRate}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Sticky bottom sheet */}
      <div className="md:hidden">
        <MobileRateSheet
          followers={primaryPlatform.followers}
          platform={primaryPlatform.platform}
          engagementRate={primaryPlatform.engagementRate}
        />
      </div>
    </div>
  );
}
