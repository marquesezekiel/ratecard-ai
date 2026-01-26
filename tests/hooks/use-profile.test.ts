import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ApiResponse, CreatorProfile } from "@/lib/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockProfile: CreatorProfile = {
  id: "profile-1",
  userId: "user-1",
  displayName: "Test Creator",
  handle: "testcreator",
  bio: "A test creator",
  location: "United States",
  niches: ["lifestyle", "fashion"],
  instagram: {
    followers: 15000,
    engagementRate: 4.5,
    avgLikes: 500,
    avgComments: 25,
    avgViews: 2000,
  },
  audience: {
    ageRange: "18-24",
    genderSplit: { male: 30, female: 65, other: 5 },
    topLocations: ["United States", "Canada"],
    interests: ["fashion", "beauty"],
  },
  tier: "micro",
  totalReach: 15000,
  avgEngagementRate: 4.5,
  currency: "USD",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

describe("useProfile hook", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("fetches profile data and provides expected interface", async () => {
    const mockResponse: ApiResponse<CreatorProfile> = {
      success: true,
      data: mockProfile,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { useProfile } = await import("@/hooks/use-profile");
    const { result } = renderHook(() => useProfile());

    // Hook should provide the expected interface
    expect(result.current).toHaveProperty("profile");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("mutate");
    expect(typeof result.current.mutate).toBe("function");

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify fetch was called with correct endpoint
    expect(mockFetch).toHaveBeenCalledWith("/api/profile");
  });
});
