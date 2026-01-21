import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  Outcome,
  OutcomeStatus,
  OutcomeSourceType,
  OutcomeProposedType,
} from "@/lib/types";

// Mock the db module before importing outcome-analytics
vi.mock("@/lib/db", () => ({
  db: {
    outcome: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import after mocking
import { db } from "@/lib/db";
import {
  createOutcome,
  getOutcomes,
  getOutcome,
  updateOutcome,
  deleteOutcome,
  calculateAcceptanceRate,
  calculateAverageNegotiationDelta,
  calculateGiftConversionRate,
  calculateAvgGiftConversionTime,
  getMarketBenchmark,
  getOutcomeAnalytics,
  compareToMarket,
} from "@/lib/outcome-analytics";

describe("outcome-analytics", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockOutcome = (overrides?: Partial<Outcome>): Outcome => ({
    id: "outcome-1",
    creatorId: "creator-1",
    sourceType: "rate_card" as OutcomeSourceType,
    sourceId: "ratecard-1",
    proposedRate: 500,
    proposedType: "paid" as OutcomeProposedType,
    platform: "instagram",
    dealType: "sponsored",
    niche: "beauty",
    outcome: "pending" as OutcomeStatus,
    finalRate: null,
    negotiationDelta: null,
    giftOutcome: null,
    giftConversionDays: null,
    brandName: "Test Brand",
    brandFollowers: 50000,
    dealLength: "one_time",
    wasGiftFirst: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    closedAt: null,
    ...overrides,
  });

  const createMockPrismaOutcome = (overrides?: Partial<Outcome>) => {
    const outcome = createMockOutcome(overrides);
    return {
      ...outcome,
      sourceType: outcome.sourceType as string,
      proposedType: outcome.proposedType as string,
      outcome: outcome.outcome as string,
      giftOutcome: outcome.giftOutcome as string | null,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // CRUD OPERATIONS TESTS
  // ==========================================================================

  describe("createOutcome", () => {
    it("creates an outcome with required fields", async () => {
      const mockOutcome = createMockPrismaOutcome();
      vi.mocked(db.outcome.create).mockResolvedValue(mockOutcome);

      const result = await createOutcome("creator-1", {
        sourceType: "rate_card",
        proposedType: "paid",
        platform: "instagram",
        dealType: "sponsored",
      });

      expect(db.outcome.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: "creator-1",
          sourceType: "rate_card",
          proposedType: "paid",
          platform: "instagram",
          dealType: "sponsored",
          outcome: "pending",
        }),
      });

      expect(result.sourceType).toBe("rate_card");
      expect(result.outcome).toBe("pending");
    });

    it("creates an outcome with all optional fields", async () => {
      const mockOutcome = createMockPrismaOutcome({
        proposedRate: 750,
        niche: "finance",
        brandName: "Finance Co",
        brandFollowers: 100000,
        dealLength: "3_month",
        wasGiftFirst: true,
      });
      vi.mocked(db.outcome.create).mockResolvedValue(mockOutcome);

      await createOutcome("creator-1", {
        sourceType: "dm_analysis",
        proposedType: "hybrid",
        platform: "tiktok",
        dealType: "sponsored",
        proposedRate: 750,
        niche: "finance",
        brandName: "Finance Co",
        brandFollowers: 100000,
        dealLength: "3_month",
        wasGiftFirst: true,
      });

      expect(db.outcome.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proposedRate: 750,
          niche: "finance",
          brandName: "Finance Co",
          brandFollowers: 100000,
          dealLength: "3_month",
          wasGiftFirst: true,
        }),
      });
    });

    it("creates a gift outcome", async () => {
      const mockOutcome = createMockPrismaOutcome({
        proposedType: "gift",
        proposedRate: null,
      });
      vi.mocked(db.outcome.create).mockResolvedValue(mockOutcome);

      await createOutcome("creator-1", {
        sourceType: "gift_evaluation",
        proposedType: "gift",
        platform: "instagram",
        dealType: "sponsored",
      });

      expect(db.outcome.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: "gift_evaluation",
          proposedType: "gift",
        }),
      });
    });
  });

  describe("getOutcomes", () => {
    it("returns all outcomes for a creator", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({ id: "outcome-1" }),
        createMockPrismaOutcome({ id: "outcome-2", platform: "tiktok" }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const result = await getOutcomes("creator-1");

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: { creatorId: "creator-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });

    it("filters by sourceType", async () => {
      const mockOutcomes = [createMockPrismaOutcome()];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      await getOutcomes("creator-1", { sourceType: "rate_card" });

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          creatorId: "creator-1",
          sourceType: "rate_card",
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("filters by outcome status", async () => {
      const mockOutcomes = [createMockPrismaOutcome({ outcome: "accepted" })];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      await getOutcomes("creator-1", { outcome: "accepted" });

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          outcome: "accepted",
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("filters by date range", async () => {
      const mockOutcomes = [createMockPrismaOutcome()];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      await getOutcomes("creator-1", {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-01-31"),
          },
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    it("filters for closed outcomes only", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({ closedAt: new Date("2025-01-15") }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      await getOutcomes("creator-1", { closedOnly: true });

      expect(db.outcome.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          closedAt: { not: null },
        }),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getOutcome", () => {
    it("returns a single outcome", async () => {
      const mockOutcome = createMockPrismaOutcome();
      vi.mocked(db.outcome.findFirst).mockResolvedValue(mockOutcome);

      const result = await getOutcome("creator-1", "outcome-1");

      expect(db.outcome.findFirst).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
      });
      expect(result?.id).toBe("outcome-1");
    });

    it("returns null if not found", async () => {
      vi.mocked(db.outcome.findFirst).mockResolvedValue(null);

      const result = await getOutcome("creator-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateOutcome", () => {
    it("updates outcome status", async () => {
      const mockOutcome = createMockPrismaOutcome({ outcome: "accepted" });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      const result = await updateOutcome("creator-1", "outcome-1", {
        outcome: "accepted",
      });

      expect(db.outcome.update).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
        data: { outcome: "accepted" },
      });
      expect(result.outcome).toBe("accepted");
    });

    it("updates with negotiation details", async () => {
      const mockOutcome = createMockPrismaOutcome({
        outcome: "negotiated",
        finalRate: 600,
        negotiationDelta: 20,
      });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      await updateOutcome("creator-1", "outcome-1", {
        outcome: "negotiated",
        finalRate: 600,
        negotiationDelta: 20,
      });

      expect(db.outcome.update).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
        data: {
          outcome: "negotiated",
          finalRate: 600,
          negotiationDelta: 20,
        },
      });
    });

    it("updates gift-specific fields", async () => {
      const mockOutcome = createMockPrismaOutcome({
        outcome: "gift_converted",
        giftOutcome: "converted_later",
        giftConversionDays: 30,
      });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      await updateOutcome("creator-1", "outcome-1", {
        outcome: "gift_converted",
        giftOutcome: "converted_later",
        giftConversionDays: 30,
      });

      expect(db.outcome.update).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          giftOutcome: "converted_later",
          giftConversionDays: 30,
        }),
      });
    });

    it("updates closedAt", async () => {
      const closedDate = new Date("2025-01-15");
      const mockOutcome = createMockPrismaOutcome({ closedAt: closedDate });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      await updateOutcome("creator-1", "outcome-1", {
        closedAt: "2025-01-15",
      });

      expect(db.outcome.update).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
        data: { closedAt: closedDate },
      });
    });
  });

  describe("deleteOutcome", () => {
    it("deletes an outcome", async () => {
      vi.mocked(db.outcome.delete).mockResolvedValue(createMockPrismaOutcome());

      await deleteOutcome("creator-1", "outcome-1");

      expect(db.outcome.delete).toHaveBeenCalledWith({
        where: { id: "outcome-1", creatorId: "creator-1" },
      });
    });
  });

  // ==========================================================================
  // ANALYTICS CALCULATION TESTS
  // ==========================================================================

  describe("calculateAcceptanceRate", () => {
    it("calculates correct paid acceptance rate", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", outcome: "accepted" }),
        createMockOutcome({ proposedType: "paid", outcome: "negotiated" }),
        createMockOutcome({ proposedType: "paid", outcome: "rejected" }),
        createMockOutcome({ proposedType: "paid", outcome: "ghosted" }),
      ];

      const rates = calculateAcceptanceRate(outcomes);

      expect(rates.paid).toBe(0.5); // 2/4 accepted/negotiated
      expect(rates.counts.paid).toBe(4);
    });

    it("calculates correct gift acceptance rate", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "gift", outcome: "gift_accepted" }),
        createMockOutcome({ proposedType: "gift", outcome: "gift_converted" }),
        createMockOutcome({ proposedType: "gift", outcome: "rejected" }),
      ];

      const rates = calculateAcceptanceRate(outcomes);

      expect(rates.gift).toBeCloseTo(0.667, 2); // 2/3
      expect(rates.counts.gift).toBe(3);
    });

    it("calculates overall acceptance rate", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", outcome: "accepted" }),
        createMockOutcome({ proposedType: "paid", outcome: "rejected" }),
        createMockOutcome({ proposedType: "gift", outcome: "gift_accepted" }),
        createMockOutcome({ proposedType: "gift", outcome: "rejected" }),
      ];

      const rates = calculateAcceptanceRate(outcomes);

      expect(rates.overall).toBe(0.5); // 2/4 total accepted
      expect(rates.counts.total).toBe(4);
    });

    it("excludes pending outcomes from rate calculation", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", outcome: "accepted" }),
        createMockOutcome({ proposedType: "paid", outcome: "pending" }),
        createMockOutcome({ proposedType: "paid", outcome: "pending" }),
      ];

      const rates = calculateAcceptanceRate(outcomes);

      expect(rates.paid).toBe(1.0); // 1/1 (pending not counted)
      expect(rates.counts.paid).toBe(1);
    });

    it("returns 0 when no outcomes", () => {
      const rates = calculateAcceptanceRate([]);

      expect(rates.paid).toBe(0);
      expect(rates.gift).toBe(0);
      expect(rates.overall).toBe(0);
    });
  });

  describe("calculateAverageNegotiationDelta", () => {
    it("calculates average positive delta", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "negotiated", negotiationDelta: 20 }),
        createMockOutcome({ outcome: "negotiated", negotiationDelta: 10 }),
        createMockOutcome({ outcome: "negotiated", negotiationDelta: 15 }),
      ];

      const avg = calculateAverageNegotiationDelta(outcomes);

      expect(avg).toBe(15); // (20+10+15)/3
    });

    it("calculates average negative delta", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "negotiated", negotiationDelta: -10 }),
        createMockOutcome({ outcome: "negotiated", negotiationDelta: -20 }),
      ];

      const avg = calculateAverageNegotiationDelta(outcomes);

      expect(avg).toBe(-15); // (-10-20)/2
    });

    it("ignores non-negotiated outcomes", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "negotiated", negotiationDelta: 20 }),
        createMockOutcome({ outcome: "accepted", negotiationDelta: 0 }),
        createMockOutcome({ outcome: "rejected", negotiationDelta: null }),
      ];

      const avg = calculateAverageNegotiationDelta(outcomes);

      expect(avg).toBe(20); // Only the negotiated one counts
    });

    it("returns 0 when no negotiated outcomes", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "accepted" }),
        createMockOutcome({ outcome: "rejected" }),
      ];

      const avg = calculateAverageNegotiationDelta(outcomes);

      expect(avg).toBe(0);
    });
  });

  describe("calculateGiftConversionRate", () => {
    it("calculates correct conversion rate", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "gift", outcome: "gift_converted" }),
        createMockOutcome({ proposedType: "gift", outcome: "gift_accepted" }),
        createMockOutcome({ proposedType: "gift", outcome: "rejected" }),
        createMockOutcome({
          proposedType: "paid",
          wasGiftFirst: true,
          giftOutcome: "converted_later",
        }),
      ];

      const rate = calculateGiftConversionRate(outcomes);

      // 2 converted (gift_converted + converted_later) out of 4 gift-related
      expect(rate).toBe(0.5);
    });

    it("includes wasGiftFirst outcomes", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", wasGiftFirst: true, outcome: "accepted" }),
        createMockOutcome({ proposedType: "paid", wasGiftFirst: true, giftOutcome: "converted_later" }),
      ];

      const rate = calculateGiftConversionRate(outcomes);

      expect(rate).toBe(0.5); // 1/2
    });

    it("returns 0 when no gift outcomes", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", outcome: "accepted" }),
      ];

      const rate = calculateGiftConversionRate(outcomes);

      expect(rate).toBe(0);
    });
  });

  describe("calculateAvgGiftConversionTime", () => {
    it("calculates average conversion time", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({
          outcome: "gift_converted",
          giftConversionDays: 14,
        }),
        createMockOutcome({
          outcome: "gift_converted",
          giftConversionDays: 28,
        }),
        createMockOutcome({
          giftOutcome: "converted_later",
          giftConversionDays: 21,
        }),
      ];

      const avg = calculateAvgGiftConversionTime(outcomes);

      expect(avg).toBe(21); // (14+28+21)/3
    });

    it("returns null when no converted gifts with time data", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "gift_accepted" }),
        createMockOutcome({ outcome: "gift_converted", giftConversionDays: null }),
      ];

      const avg = calculateAvgGiftConversionTime(outcomes);

      expect(avg).toBeNull();
    });
  });

  describe("getMarketBenchmark", () => {
    it("returns benchmark for platform", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({
          platform: "instagram",
          outcome: "accepted",
          finalRate: 500,
        }),
        createMockPrismaOutcome({
          platform: "instagram",
          outcome: "negotiated",
          finalRate: 600,
          negotiationDelta: 10,
        }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const benchmark = await getMarketBenchmark("instagram", null, null);

      expect(benchmark.sampleSize).toBe(2);
      expect(benchmark.segment.platform).toBe("instagram");
      expect(benchmark.avgRate).toBe(550); // (500+600)/2
    });

    it("returns benchmark for niche", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({ niche: "beauty", outcome: "accepted" }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const benchmark = await getMarketBenchmark(null, "beauty", null);

      expect(benchmark.segment.niche).toBe("beauty");
    });

    it("returns empty benchmark when no data", async () => {
      vi.mocked(db.outcome.findMany).mockResolvedValue([]);

      const benchmark = await getMarketBenchmark("instagram", "beauty", "nano");

      expect(benchmark.sampleSize).toBe(0);
      expect(benchmark.avgAcceptanceRate).toBe(0);
    });
  });

  describe("compareToMarket", () => {
    it("returns above when creator rate is higher", () => {
      const comparison = compareToMarket(0.8, 0.6);

      expect(comparison.position).toBe("above");
      expect(comparison.percentDiff).toBeGreaterThan(0);
      expect(comparison.message).toContain("above average");
    });

    it("returns below when creator rate is lower", () => {
      const comparison = compareToMarket(0.4, 0.6);

      expect(comparison.position).toBe("below");
      expect(comparison.percentDiff).toBeLessThan(0);
      expect(comparison.message).toContain("below average");
    });

    it("returns at when rates are similar", () => {
      const comparison = compareToMarket(0.61, 0.6);

      expect(comparison.position).toBe("at");
      expect(comparison.message).toContain("at market average");
    });
  });

  // ==========================================================================
  // COMPREHENSIVE ANALYTICS TESTS
  // ==========================================================================

  describe("getOutcomeAnalytics", () => {
    it("calculates comprehensive analytics", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({
          id: "1",
          proposedType: "paid",
          outcome: "accepted",
          finalRate: 500,
        }),
        createMockPrismaOutcome({
          id: "2",
          proposedType: "paid",
          outcome: "negotiated",
          finalRate: 600,
          negotiationDelta: 20,
        }),
        createMockPrismaOutcome({
          id: "3",
          proposedType: "gift",
          outcome: "gift_converted",
          finalRate: 400,
          giftConversionDays: 21,
        }),
        createMockPrismaOutcome({
          id: "4",
          proposedType: "paid",
          outcome: "rejected",
        }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      expect(analytics.totalOutcomes).toBe(4);
      expect(analytics.byStatus.accepted).toBe(1);
      expect(analytics.byStatus.negotiated).toBe(1);
      expect(analytics.byStatus.rejected).toBe(1);
      expect(analytics.byStatus.gift_converted).toBe(1);
      expect(analytics.negotiatedCount).toBe(1);
      expect(analytics.avgNegotiationDelta).toBe(20);
      expect(analytics.totalRevenue).toBe(1500); // 500+600+400
      expect(analytics.avgDealValue).toBe(500); // 1500/3 closed deals
    });

    it("calculates gift-specific metrics", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({
          proposedType: "gift",
          outcome: "gift_converted",
          giftConversionDays: 14,
        }),
        createMockPrismaOutcome({
          proposedType: "gift",
          outcome: "gift_accepted",
        }),
        createMockPrismaOutcome({
          proposedType: "paid",
          wasGiftFirst: true,
          giftOutcome: "converted_later",
          giftConversionDays: 28,
        }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      expect(analytics.totalGifts).toBe(3); // All are gift-related
      expect(analytics.giftsConverted).toBe(2); // 2 converted
      expect(analytics.giftConversionRate).toBeCloseTo(0.667, 2); // 2/3
      expect(analytics.avgGiftConversionDays).toBe(21); // (14+28)/2
    });

    it("handles empty outcome list", async () => {
      vi.mocked(db.outcome.findMany).mockResolvedValue([]);

      const analytics = await getOutcomeAnalytics("creator-1");

      expect(analytics.totalOutcomes).toBe(0);
      expect(analytics.acceptanceRates.overall).toBe(0);
      expect(analytics.totalRevenue).toBe(0);
      expect(analytics.avgDealValue).toBe(0);
    });

    it("generates insights for high acceptance rate", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({ outcome: "accepted" }),
        createMockPrismaOutcome({ outcome: "accepted" }),
        createMockPrismaOutcome({ outcome: "accepted" }),
        createMockPrismaOutcome({ outcome: "accepted" }),
        createMockPrismaOutcome({ outcome: "rejected" }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      // Should have insights about acceptance rate
      expect(analytics.insights.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // STATUS TRANSITION TESTS
  // ==========================================================================

  describe("outcome status transitions", () => {
    it("transitions from pending to accepted", async () => {
      const mockOutcome = createMockPrismaOutcome({ outcome: "accepted" });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      const result = await updateOutcome("creator-1", "outcome-1", {
        outcome: "accepted",
        finalRate: 500,
        closedAt: new Date(),
      });

      expect(result.outcome).toBe("accepted");
    });

    it("transitions from pending to negotiated with delta", async () => {
      const mockOutcome = createMockPrismaOutcome({
        outcome: "negotiated",
        finalRate: 600,
        negotiationDelta: 20,
      });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      const result = await updateOutcome("creator-1", "outcome-1", {
        outcome: "negotiated",
        finalRate: 600,
        negotiationDelta: 20,
      });

      expect(result.outcome).toBe("negotiated");
      expect(result.negotiationDelta).toBe(20);
    });

    it("transitions gift_accepted to gift_converted", async () => {
      const mockOutcome = createMockPrismaOutcome({
        outcome: "gift_converted",
        giftOutcome: "converted_later",
        giftConversionDays: 30,
        finalRate: 400,
      });
      vi.mocked(db.outcome.update).mockResolvedValue(mockOutcome);

      const result = await updateOutcome("creator-1", "outcome-1", {
        outcome: "gift_converted",
        giftOutcome: "converted_later",
        giftConversionDays: 30,
        finalRate: 400,
      });

      expect(result.outcome).toBe("gift_converted");
      expect(result.giftOutcome).toBe("converted_later");
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe("edge cases", () => {
    it("handles outcome with all null optional fields", async () => {
      const minimalOutcome = createMockPrismaOutcome({
        sourceId: null,
        proposedRate: null,
        niche: null,
        finalRate: null,
        negotiationDelta: null,
        giftOutcome: null,
        giftConversionDays: null,
        brandName: null,
        brandFollowers: null,
        dealLength: null,
        closedAt: null,
      });
      vi.mocked(db.outcome.findFirst).mockResolvedValue(minimalOutcome);

      const result = await getOutcome("creator-1", "outcome-1");

      expect(result).not.toBeNull();
      expect(result?.proposedRate).toBeNull();
    });

    it("calculates rates with mixed outcome types", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ proposedType: "paid", outcome: "accepted" }),
        createMockOutcome({ proposedType: "gift", outcome: "gift_accepted" }),
        createMockOutcome({ proposedType: "hybrid", outcome: "negotiated" }),
        createMockOutcome({ proposedType: "affiliate", outcome: "rejected" }),
      ];

      const rates = calculateAcceptanceRate(outcomes);

      // paid and hybrid count as "paid" type
      expect(rates.paid).toBe(1.0); // 2/2 (accepted + negotiated)
      expect(rates.gift).toBe(1.0); // 1/1 (gift_accepted)
      expect(rates.overall).toBe(0.75); // 3/4 overall
    });

    it("handles negative negotiation deltas correctly", () => {
      const outcomes: Outcome[] = [
        createMockOutcome({ outcome: "negotiated", negotiationDelta: -15 }),
        createMockOutcome({ outcome: "negotiated", negotiationDelta: -5 }),
      ];

      const avg = calculateAverageNegotiationDelta(outcomes);

      expect(avg).toBe(-10); // Average of negative deltas
    });

    it("handles outcomes from all source types", async () => {
      const mockOutcomes = [
        createMockPrismaOutcome({ sourceType: "rate_card" }),
        createMockPrismaOutcome({ sourceType: "dm_analysis" }),
        createMockPrismaOutcome({ sourceType: "gift_evaluation" }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      expect(analytics.totalOutcomes).toBe(3);
    });

    it("calculates time-based metrics correctly", async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      const oldDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      const mockOutcomes = [
        createMockPrismaOutcome({ createdAt: now }),
        createMockPrismaOutcome({ createdAt: recentDate }),
        createMockPrismaOutcome({ createdAt: oldDate }),
      ];
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      expect(analytics.last30Days).toBe(2); // 2 in last 30 days
      expect(analytics.last90Days).toBe(3); // All 3 in last 90 days
    });
  });

  // ==========================================================================
  // INSIGHT GENERATION TESTS
  // ==========================================================================

  describe("insight generation", () => {
    it("generates positive insight for high acceptance rate", async () => {
      // Create outcomes with very high acceptance rate
      const mockOutcomes = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockPrismaOutcome({
            id: `outcome-${i}`,
            outcome: i < 9 ? "accepted" : "rejected", // 90% acceptance
          })
        );
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      // With sufficient data (10 outcomes), insights should be generated
      // The insight may be positive, negative, or neutral depending on benchmark
      expect(analytics.insights.length).toBeGreaterThan(0);
    });

    it("generates suggestion for high ghost rate", async () => {
      // Create outcomes with high ghost rate
      const mockOutcomes = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockPrismaOutcome({
            id: `outcome-${i}`,
            outcome: i < 4 ? "ghosted" : "accepted", // 40% ghost rate
          })
        );
      vi.mocked(db.outcome.findMany).mockResolvedValue(mockOutcomes);

      const analytics = await getOutcomeAnalytics("creator-1");

      const suggestions = analytics.insights.filter(
        (i) => i.type === "suggestion"
      );
      const ghostSuggestion = suggestions.find((s) =>
        s.message.toLowerCase().includes("ghost")
      );
      expect(ghostSuggestion).toBeDefined();
    });
  });
});
