import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ApiResponse, SavedRateCard } from "@/lib/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockRateCard: SavedRateCard = {
  id: "rate-card-1",
  creatorId: "user-1",
  name: "Test Rate Card",
  platform: "instagram",
  contentFormat: "reel",
  baseRate: 400,
  finalRate: 520,
  adjustments: [
    { name: "Platform", description: "Instagram baseline", type: "multiply", value: 1.0 },
  ],
  dealQuality: null,
  briefId: null,
  brandName: "Test Brand",
  campaignName: "Summer Campaign",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
  lastAccessedAt: new Date("2024-01-20"),
};

describe("useRateCards hook", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("fetches rate cards and provides expected interface", async () => {
    const mockResponse: ApiResponse<SavedRateCard[]> = {
      success: true,
      data: [mockRateCard],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { useRateCards } = await import("@/hooks/use-rate-cards");
    const { result } = renderHook(() => useRateCards());

    // Hook should provide the expected interface
    expect(result.current).toHaveProperty("rateCards");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("createRateCard");
    expect(result.current).toHaveProperty("updateRateCard");
    expect(result.current).toHaveProperty("deleteRateCard");
    expect(typeof result.current.createRateCard).toBe("function");
    expect(typeof result.current.updateRateCard).toBe("function");
    expect(typeof result.current.deleteRateCard).toBe("function");

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify fetch was called with correct endpoint
    expect(mockFetch).toHaveBeenCalledWith("/api/rate-cards");
  });
});
