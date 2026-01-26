import { describe, it, expect } from "vitest";
import {
  calculateProfileCompleteness,
  isQuickSetupComplete,
  getOnboardingState,
  getMissingProfileFields,
} from "@/lib/onboarding";
import type { CreatorProfile } from "@/lib/types";

describe("calculateProfileCompleteness", () => {
  it("returns 0 for null/undefined profile", () => {
    expect(calculateProfileCompleteness(null)).toBe(0);
    expect(calculateProfileCompleteness(undefined)).toBe(0);
  });

  it("returns 0 for empty profile", () => {
    expect(calculateProfileCompleteness({})).toBe(0);
  });

  it("returns 40 for minimum profile (platform + followers only)", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 0 },
      totalReach: 10000,
    };
    expect(calculateProfileCompleteness(profile)).toBe(40);
  });

  it("returns 55 for profile with platform, followers, and engagement rate", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
    };
    expect(calculateProfileCompleteness(profile)).toBe(55);
  });

  it("returns correct percentage for profile with niche added", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle", "fashion"],
    };
    expect(calculateProfileCompleteness(profile)).toBe(65);
  });

  it("returns correct percentage for profile with location", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
    };
    expect(calculateProfileCompleteness(profile)).toBe(75);
  });

  it("returns correct percentage for profile with display name", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
      displayName: "Maya Creates",
    };
    expect(calculateProfileCompleteness(profile)).toBe(80);
  });

  it("returns correct percentage for profile with bio", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
      displayName: "Maya Creates",
      bio: "Lifestyle content creator sharing daily inspiration",
    };
    expect(calculateProfileCompleteness(profile)).toBe(85);
  });

  it("returns correct percentage for profile with audience data", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
      displayName: "Maya Creates",
      bio: "Lifestyle content creator",
      audience: {
        topLocations: ["United States", "Canada"],
      },
    };
    expect(calculateProfileCompleteness(profile)).toBe(95);
  });

  it("returns 100 for complete profile", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
      displayName: "Maya Creates",
      handle: "@maya.creates",
      bio: "Lifestyle content creator",
      audience: {
        topLocations: ["United States", "Canada"],
      },
    };
    expect(calculateProfileCompleteness(profile)).toBe(100);
  });

  it("caps at 100 even if multiple platforms are added", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      tiktok: { followers: 20000, engagementRate: 6.0 },
      youtube: { followers: 5000, engagementRate: 2.0 },
      totalReach: 35000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle", "fashion", "beauty"],
      location: "United States",
      displayName: "Maya Creates",
      handle: "@maya.creates",
      bio: "Multi-platform lifestyle content creator",
      audience: {
        topLocations: ["United States", "Canada", "UK"],
      },
    };
    expect(calculateProfileCompleteness(profile)).toBe(100);
  });
});

describe("isQuickSetupComplete", () => {
  it("returns false for null/undefined profile", () => {
    expect(isQuickSetupComplete(null)).toBe(false);
    expect(isQuickSetupComplete(undefined)).toBe(false);
  });

  it("returns false for empty profile", () => {
    expect(isQuickSetupComplete({})).toBe(false);
  });

  it("returns false for profile with only platform but no followers", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 0, engagementRate: 0 },
      totalReach: 0,
    };
    expect(isQuickSetupComplete(profile)).toBe(false);
  });

  it("returns false for profile with only followers but no platform", () => {
    const profile: Partial<CreatorProfile> = {
      totalReach: 10000,
    };
    expect(isQuickSetupComplete(profile)).toBe(false);
  });

  it("returns true for profile with platform and followers", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 3.0 },
      totalReach: 10000,
    };
    expect(isQuickSetupComplete(profile)).toBe(true);
  });

  it("returns true for any platform with followers", () => {
    const tiktokProfile: Partial<CreatorProfile> = {
      tiktok: { followers: 5000, engagementRate: 5.0 },
      totalReach: 5000,
    };
    expect(isQuickSetupComplete(tiktokProfile)).toBe(true);

    const youtubeProfile: Partial<CreatorProfile> = {
      youtube: { followers: 15000, engagementRate: 2.0 },
      totalReach: 15000,
    };
    expect(isQuickSetupComplete(youtubeProfile)).toBe(true);
  });
});

describe("getOnboardingState", () => {
  it("returns default state for null/undefined profile", () => {
    const state = getOnboardingState(null);
    expect(state).toEqual({
      quickSetupComplete: false,
      profileCompleteness: 0,
      hasSeenDashboardTour: false,
    });
  });

  it("uses stored values if available", () => {
    const profile = {
      quickSetupComplete: true,
      profileCompleteness: 75,
      hasSeenDashboardTour: true,
      onboardingCompletedAt: new Date("2024-01-15"),
    };
    const state = getOnboardingState(profile);
    expect(state.quickSetupComplete).toBe(true);
    expect(state.profileCompleteness).toBe(75);
    expect(state.hasSeenDashboardTour).toBe(true);
    expect(state.onboardingCompletedAt).toEqual(new Date("2024-01-15"));
  });

  it("calculates values if not stored", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
    };
    const state = getOnboardingState(profile);
    expect(state.quickSetupComplete).toBe(true);
    expect(state.profileCompleteness).toBe(55);
    expect(state.hasSeenDashboardTour).toBe(false);
  });
});

describe("getMissingProfileFields", () => {
  it("returns all fields for null/undefined profile", () => {
    const missing = getMissingProfileFields(null);
    expect(missing.length).toBe(5); // Returns top 5 missing fields
    expect(missing[0].field).toBe("platform");
    expect(missing[1].field).toBe("followers");
  });

  it("returns missing fields sorted by impact", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 0 },
      totalReach: 10000,
    };
    const missing = getMissingProfileFields(profile);

    // Should not include platform or followers
    expect(missing.find((f) => f.field === "platform")).toBeUndefined();
    expect(missing.find((f) => f.field === "followers")).toBeUndefined();

    // Should include engagement rate as highest impact
    expect(missing[0].field).toBe("engagementRate");
    expect(missing[0].impact).toBe(15);
  });

  it("returns empty array for complete profile", () => {
    const profile: Partial<CreatorProfile> = {
      instagram: { followers: 10000, engagementRate: 4.5 },
      totalReach: 10000,
      avgEngagementRate: 4.5,
      niches: ["lifestyle"],
      location: "United States",
      displayName: "Maya Creates",
      handle: "@maya.creates",
      bio: "Lifestyle content creator",
      audience: {
        topLocations: ["United States"],
      },
    };
    const missing = getMissingProfileFields(profile);
    expect(missing.length).toBe(0);
  });
});
