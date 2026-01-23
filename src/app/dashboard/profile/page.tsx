"use client";

import { useState, useEffect, startTransition, useCallback } from "react";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  ProfileCompleteness,
  calculateProfileCompleteness,
} from "@/components/profile/profile-completeness";
import { RatePreviewCard } from "@/components/profile/rate-preview-card";
import { MobileRateSheet } from "@/components/profile/mobile-rate-sheet";

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
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState<ProfileFormValues>({});
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("creatorProfile");
    startTransition(() => {
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setInitialData(data);
          setFormValues(data);
          setCompleteness(calculateProfileCompleteness(data));
        } catch {
          // Invalid JSON, start fresh
        }
      }
      setIsLoading(false);
    });
  }, []);

  const handleValuesChange = useCallback((values: ProfileFormValues) => {
    setFormValues(values);
    setCompleteness(calculateProfileCompleteness(values));
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            The more you share, the more accurate your rates
          </p>
        </div>
        <ProfileCompleteness percentage={completeness} />
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
