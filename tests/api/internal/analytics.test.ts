import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    outcome: {
      findMany: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GET } from "@/app/api/internal/analytics/route";

// Helper to create NextRequest with search params
function createRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/internal/analytics");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url, { method: "GET" });
}

const mockAdminSession = {
  user: {
    id: "admin-user-1",
    email: "admin@example.com",
    name: "Admin User",
  },
};

const mockNonAdminSession = {
  user: {
    id: "user-1",
    email: "regular@example.com",
    name: "Regular User",
  },
};

const mockOutcomes = [
  {
    id: "outcome-1",
    creatorId: "creator-1",
    sourceType: "rate_card",
    sourceId: null,
    proposedRate: 500,
    proposedType: "paid",
    platform: "instagram",
    dealType: "sponsored",
    niche: "lifestyle",
    outcome: "accepted",
    finalRate: 500,
    negotiationDelta: null,
    giftOutcome: null,
    giftConversionDays: null,
    brandName: "Brand A",
    brandFollowers: 100000,
    dealLength: "one_time",
    wasGiftFirst: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    closedAt: new Date("2024-01-16"),
  },
  {
    id: "outcome-2",
    creatorId: "creator-2",
    sourceType: "rate_card",
    sourceId: null,
    proposedRate: 600,
    proposedType: "paid",
    platform: "tiktok",
    dealType: "sponsored",
    niche: "tech",
    outcome: "negotiated",
    finalRate: 700,
    negotiationDelta: 16.67,
    giftOutcome: null,
    giftConversionDays: null,
    brandName: "Brand B",
    brandFollowers: 50000,
    dealLength: "one_time",
    wasGiftFirst: false,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    closedAt: new Date("2024-01-22"),
  },
  {
    id: "outcome-3",
    creatorId: "creator-1",
    sourceType: "dm_analysis",
    sourceId: null,
    proposedRate: null,
    proposedType: "gift",
    platform: "instagram",
    dealType: "sponsored",
    niche: "beauty",
    outcome: "gift_converted",
    finalRate: 300,
    negotiationDelta: null,
    giftOutcome: "converted_later",
    giftConversionDays: 14,
    brandName: "Brand C",
    brandFollowers: 25000,
    dealLength: "one_time",
    wasGiftFirst: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-24"),
    closedAt: new Date("2024-01-24"),
  },
  {
    id: "outcome-4",
    creatorId: "creator-3",
    sourceType: "rate_card",
    sourceId: null,
    proposedRate: 400,
    proposedType: "paid",
    platform: "instagram",
    dealType: "sponsored",
    niche: "lifestyle",
    outcome: "rejected",
    finalRate: null,
    negotiationDelta: null,
    giftOutcome: null,
    giftConversionDays: null,
    brandName: "Brand D",
    brandFollowers: 75000,
    dealLength: "one_time",
    wasGiftFirst: false,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
    closedAt: new Date("2024-01-26"),
  },
  {
    id: "outcome-5",
    creatorId: "creator-2",
    sourceType: "dm_analysis",
    sourceId: null,
    proposedRate: 200,
    proposedType: "gift",
    platform: "tiktok",
    dealType: "sponsored",
    niche: null,
    outcome: "pending",
    finalRate: null,
    negotiationDelta: null,
    giftOutcome: null,
    giftConversionDays: null,
    brandName: "Brand E",
    brandFollowers: 10000,
    dealLength: null,
    wasGiftFirst: false,
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28"),
    closedAt: null,
  },
];

describe("/api/internal/analytics", () => {
  beforeAll(() => {
    // Set the admin emails env var for testing
    process.env.ADMIN_EMAILS = "admin@example.com,other-admin@example.com";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Authentication & Authorization Tests
  // ===========================================================================

  describe("Authorization", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when user is not an admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockNonAdminSession);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns data when user is an admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  // ===========================================================================
  // Data Aggregation Tests
  // ===========================================================================

  describe("Data Aggregation", () => {
    it("returns correct total outcomes count", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.totalOutcomes).toBe(5);
    });

    it("calculates acceptance rate correctly (excluding pending)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // 4 closed outcomes: accepted, negotiated, gift_converted, rejected
      // 3 accepted (accepted, negotiated, gift_converted) / 4 closed = 0.75
      expect(data.data.acceptanceRate).toBe(0.75);
    });

    it("calculates average negotiation delta correctly", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Only 1 negotiated outcome with delta of 16.67
      expect(data.data.avgNegotiationDelta).toBeCloseTo(16.67, 2);
    });

    it("calculates gift conversion rate correctly", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // 2 gift outcomes: 1 converted, 1 pending
      // 1 converted / 2 total gifts = 0.5
      expect(data.data.giftConversionRate).toBe(0.5);
    });

    it("groups outcomes by status correctly", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.byStatus).toEqual({
        accepted: 1,
        negotiated: 1,
        gift_converted: 1,
        rejected: 1,
        pending: 1,
      });
    });

    it("groups outcomes by platform correctly", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Instagram: 3 outcomes, TikTok: 2 outcomes
      expect(data.data.byPlatform).toHaveLength(2);

      const instagramData = data.data.byPlatform.find(
        (p: { platform: string }) => p.platform === "Instagram"
      );
      const tiktokData = data.data.byPlatform.find(
        (p: { platform: string }) => p.platform === "TikTok"
      );

      expect(instagramData.count).toBe(3);
      expect(tiktokData.count).toBe(2);
    });

    it("generates time series data", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce(mockOutcomes);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(Array.isArray(data.data.overTime)).toBe(true);
      // Should have time series entries
      expect(data.data.overTime.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Filter Tests
  // ===========================================================================

  describe("Filters", () => {
    it("applies date range filter (7d)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest({ dateRange: "7d" });
      await GET(request);

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("applies date range filter (30d)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest({ dateRange: "30d" });
      await GET(request);

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("applies platform filter", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest({ platform: "instagram" });
      await GET(request);

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          platform: "instagram",
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("ignores platform filter when set to 'all'", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest({ platform: "all" });
      await GET(request);

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
      });
    });

    it("applies combined filters", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest({ dateRange: "30d", platform: "tiktok" });
      await GET(request);

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          platform: "tiktok",
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles empty outcomes array", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.totalOutcomes).toBe(0);
      expect(data.data.acceptanceRate).toBe(0);
      expect(data.data.avgNegotiationDelta).toBe(0);
      expect(data.data.giftConversionRate).toBe(0);
      expect(data.data.byStatus).toEqual({});
      expect(data.data.byPlatform).toEqual([]);
      expect(data.data.overTime).toEqual([]);
    });

    it("handles all pending outcomes", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([
        { ...mockOutcomes[4] }, // pending outcome
      ]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.totalOutcomes).toBe(1);
      // Acceptance rate should be 0 when no closed outcomes
      expect(data.data.acceptanceRate).toBe(0);
    });

    it("handles outcomes without negotiation delta", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([
        { ...mockOutcomes[0] }, // accepted without delta
      ]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.avgNegotiationDelta).toBe(0);
    });

    it("handles outcomes without rates", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession);
      vi.mocked(db.outcome.findMany).mockResolvedValueOnce([
        {
          ...mockOutcomes[0],
          proposedRate: null,
          finalRate: null,
        },
      ]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Should handle null rates gracefully
      expect(data.data.byPlatform[0].avgRate).toBe(0);
    });
  });
});
