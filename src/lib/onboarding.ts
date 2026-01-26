/**
 * Onboarding utilities for RateCard.AI
 *
 * Handles profile completeness calculation and onboarding state management.
 */

import type { CreatorProfile, OnboardingState } from "./types";

/**
 * Profile completeness weights.
 * Total: 100 points
 *
 * Required (40%):
 * - platform: 20 points
 * - followers: 20 points
 *
 * Important (40%):
 * - engagementRate: 15 points
 * - niche: 10 points
 * - location: 10 points
 * - displayName: 5 points
 *
 * Nice to have (20%):
 * - bio: 5 points
 * - audience: 10 points
 * - handle: 5 points
 */
const COMPLETENESS_WEIGHTS = {
  // Required (40%)
  platform: 20,
  followers: 20,

  // Important (40%)
  engagementRate: 15,
  niche: 10,
  location: 10,
  displayName: 5,

  // Nice to have (20%)
  bio: 5,
  audience: 10,
  handle: 5,
} as const;

/**
 * Calculate profile completeness percentage.
 *
 * @param profile - Partial creator profile data
 * @returns Completeness percentage (0-100)
 */
export function calculateProfileCompleteness(
  profile: Partial<CreatorProfile> | null | undefined
): number {
  if (!profile) return 0;

  let score = 0;

  // Platform check (20 points)
  // At least one platform must have data
  const hasPlatform = Boolean(
    profile.instagram ||
      profile.tiktok ||
      profile.youtube ||
      profile.twitter
  );
  if (hasPlatform) {
    score += COMPLETENESS_WEIGHTS.platform;
  }

  // Followers check (20 points)
  if (profile.totalReach && profile.totalReach > 0) {
    score += COMPLETENESS_WEIGHTS.followers;
  }

  // Engagement rate check (15 points)
  if (profile.avgEngagementRate && profile.avgEngagementRate > 0) {
    score += COMPLETENESS_WEIGHTS.engagementRate;
  }

  // Niche check (10 points)
  if (profile.niches && profile.niches.length > 0) {
    score += COMPLETENESS_WEIGHTS.niche;
  }

  // Location check (10 points)
  if (profile.location && profile.location.length > 0) {
    score += COMPLETENESS_WEIGHTS.location;
  }

  // Display name check (5 points)
  if (profile.displayName && profile.displayName.length > 0) {
    score += COMPLETENESS_WEIGHTS.displayName;
  }

  // Bio check (5 points)
  if (profile.bio && profile.bio.length > 0) {
    score += COMPLETENESS_WEIGHTS.bio;
  }

  // Audience check (10 points)
  // Check if audience has topLocations data
  const audience = profile.audience as {
    topLocations?: string[];
  } | null;
  if (audience?.topLocations && audience.topLocations.length > 0) {
    score += COMPLETENESS_WEIGHTS.audience;
  }

  // Handle check (5 points)
  if (profile.handle && profile.handle.length > 0) {
    score += COMPLETENESS_WEIGHTS.handle;
  }

  return Math.min(100, score);
}

/**
 * Check if quick setup is complete.
 * Quick setup requires: platform + followers minimum.
 *
 * @param profile - Partial creator profile data
 * @returns Whether quick setup requirements are met
 */
export function isQuickSetupComplete(
  profile: Partial<CreatorProfile> | null | undefined
): boolean {
  if (!profile) return false;

  // Must have at least one platform with data
  const hasPlatform = Boolean(
    profile.instagram ||
      profile.tiktok ||
      profile.youtube ||
      profile.twitter
  );

  // Must have followers > 0
  const hasFollowers = Boolean(profile.totalReach && profile.totalReach > 0);

  return hasPlatform && hasFollowers;
}

/**
 * Get the onboarding state from a profile.
 *
 * @param profile - Creator profile (can be from DB with extra fields)
 * @returns Onboarding state
 */
export function getOnboardingState(
  profile: (Partial<CreatorProfile> & Partial<OnboardingState>) | null | undefined
): OnboardingState {
  if (!profile) {
    return {
      quickSetupComplete: false,
      profileCompleteness: 0,
      hasSeenDashboardTour: false,
    };
  }

  // Use stored values if available, otherwise calculate
  const quickSetupComplete =
    profile.quickSetupComplete ?? isQuickSetupComplete(profile);
  const profileCompleteness =
    profile.profileCompleteness ?? calculateProfileCompleteness(profile);

  return {
    quickSetupComplete,
    profileCompleteness,
    hasSeenDashboardTour: profile.hasSeenDashboardTour ?? false,
    onboardingCompletedAt: profile.onboardingCompletedAt,
  };
}

/**
 * Get missing profile fields with their impact.
 * Used to guide users on what to fill out next.
 *
 * @param profile - Partial creator profile
 * @returns Array of missing fields with impact
 */
export function getMissingProfileFields(
  profile: Partial<CreatorProfile> | null | undefined
): Array<{ field: string; label: string; impact: number }> {
  const missing: Array<{ field: string; label: string; impact: number }> = [];

  if (!profile) {
    return [
      { field: "platform", label: "Primary Platform", impact: 20 },
      { field: "followers", label: "Follower Count", impact: 20 },
      { field: "engagementRate", label: "Engagement Rate", impact: 15 },
      { field: "niche", label: "Content Niche", impact: 10 },
      { field: "location", label: "Location", impact: 10 },
    ];
  }

  // Check each field
  const hasPlatform = Boolean(
    profile.instagram || profile.tiktok || profile.youtube || profile.twitter
  );
  if (!hasPlatform) {
    missing.push({ field: "platform", label: "Primary Platform", impact: 20 });
  }

  if (!profile.totalReach || profile.totalReach <= 0) {
    missing.push({ field: "followers", label: "Follower Count", impact: 20 });
  }

  if (!profile.avgEngagementRate || profile.avgEngagementRate <= 0) {
    missing.push({
      field: "engagementRate",
      label: "Engagement Rate",
      impact: 15,
    });
  }

  if (!profile.niches || profile.niches.length === 0) {
    missing.push({ field: "niche", label: "Content Niche", impact: 10 });
  }

  if (!profile.location) {
    missing.push({ field: "location", label: "Location", impact: 10 });
  }

  if (!profile.displayName) {
    missing.push({ field: "displayName", label: "Display Name", impact: 5 });
  }

  if (!profile.bio) {
    missing.push({ field: "bio", label: "Bio", impact: 5 });
  }

  const audience = profile.audience as { topLocations?: string[] } | null;
  if (!audience?.topLocations || audience.topLocations.length === 0) {
    missing.push({
      field: "audience",
      label: "Audience Demographics",
      impact: 10,
    });
  }

  if (!profile.handle) {
    missing.push({ field: "handle", label: "Social Handle", impact: 5 });
  }

  // Sort by impact (highest first)
  return missing.sort((a, b) => b.impact - a.impact);
}
