import { describe, it, expect } from "vitest";
import { calculateFitScore } from "@/lib/fit-score";
import type { CreatorProfile, ParsedBrief } from "@/lib/types";

describe("fit-score", () => {
  const createMockProfile = (overrides?: Partial<CreatorProfile>): CreatorProfile => ({
    id: "test-1",
    userId: "user-1",
    displayName: "Test Creator",
    handle: "testcreator",
    bio: "Test bio",
    location: "United States",
    niches: ["lifestyle", "fashion"],
    instagram: {
      followers: 25000,
      engagementRate: 4.5,
      avgLikes: 1000,
      avgComments: 50,
      avgViews: 5000,
    },
    audience: {
      ageRange: "18-24",
      genderSplit: { male: 30, female: 65, other: 5 },
      topLocations: ["United States", "United Kingdom"],
      interests: ["fashion", "lifestyle"],
    },
    tier: "micro",
    totalReach: 25000,
    avgEngagementRate: 4.5,
    currency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockBrief = (overrides?: Partial<ParsedBrief>): ParsedBrief => ({
    brand: {
      name: "Fashion Brand",
      industry: "fashion",
      product: "Clothing line",
    },
    campaign: {
      objective: "awareness",
      targetAudience: "women 18-24",
      budgetRange: "$500-1000",
    },
    content: {
      platform: "instagram",
      format: "reel",
      quantity: 1,
      creativeDirection: "Showcase product",
    },
    usageRights: {
      durationDays: 30,
      exclusivity: "none",
      paidAmplification: false,
    },
    timeline: {
      deadline: "2 weeks",
    },
    rawText: "Test brief",
    ...overrides,
  });

  describe("calculateFitScore", () => {
    it("returns score between 0 and 100", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it("returns correct fit level for high score", () => {
      const profile = createMockProfile({
        niches: ["fashion", "style", "clothing"],
      });
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(["perfect", "high"]).toContain(result.fitLevel);
    });

    it("includes all 5 breakdown components", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown).toHaveProperty("nicheMatch");
      expect(result.breakdown).toHaveProperty("demographicMatch");
      expect(result.breakdown).toHaveProperty("platformMatch");
      expect(result.breakdown).toHaveProperty("engagementQuality");
      expect(result.breakdown).toHaveProperty("contentCapability");
    });

    it("weights sum to 1.0", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);
      const totalWeight =
        result.breakdown.nicheMatch.weight +
        result.breakdown.demographicMatch.weight +
        result.breakdown.platformMatch.weight +
        result.breakdown.engagementQuality.weight +
        result.breakdown.contentCapability.weight;

      expect(totalWeight).toBeCloseTo(1.0);
    });

    it("returns positive price adjustment for high fit", () => {
      const profile = createMockProfile({
        niches: ["fashion", "beauty", "style"],
        avgEngagementRate: 6.0,
      });
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      if (result.fitLevel === "high" || result.fitLevel === "perfect") {
        expect(result.priceAdjustment).toBeGreaterThan(0);
      }
    });

    it("returns negative price adjustment for low fit", () => {
      const profile = createMockProfile({
        niches: ["gaming", "tech"],
        avgEngagementRate: 0.5,
      });
      const brief = createMockBrief({
        brand: {
          name: "Beauty Brand",
          industry: "beauty",
          product: "Skincare",
        },
      });

      const result = calculateFitScore(profile, brief);

      if (result.fitLevel === "low") {
        expect(result.priceAdjustment).toBeLessThan(0);
      }
    });

    it("provides actionable insights", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeLessThanOrEqual(5);
    });
  });

  describe("niche matching", () => {
    it("scores high for matching niches", () => {
      const profile = createMockProfile({ niches: ["fashion", "style"] });
      const brief = createMockBrief({ brand: { name: "Brand", industry: "fashion", product: "Clothes" } });

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.nicheMatch.score).toBeGreaterThanOrEqual(75);
    });

    it("scores low for mismatched niches", () => {
      const profile = createMockProfile({ niches: ["gaming", "tech"] });
      const brief = createMockBrief({ brand: { name: "Brand", industry: "fashion", product: "Clothes" } });

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.nicheMatch.score).toBeLessThan(50);
    });
  });

  describe("platform matching", () => {
    it("scores high when creator has strong presence on target platform", () => {
      const profile = createMockProfile({
        instagram: {
          followers: 50000,
          engagementRate: 5.0,
          avgLikes: 2000,
          avgComments: 100,
          avgViews: 10000,
        },
      });
      const brief = createMockBrief({ content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" } });

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.platformMatch.score).toBeGreaterThanOrEqual(70);
    });

    it("scores low when creator lacks target platform", () => {
      const profile = createMockProfile({
        instagram: undefined,
        tiktok: {
          followers: 50000,
          engagementRate: 5.0,
          avgLikes: 2000,
          avgComments: 100,
          avgViews: 10000,
        },
      });
      const brief = createMockBrief({ content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" } });

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.platformMatch.score).toBeLessThanOrEqual(20);
    });
  });

  describe("engagement quality", () => {
    it("scores high for above-benchmark engagement", () => {
      const profile = createMockProfile({
        tier: "micro",
        avgEngagementRate: 5.0, // Benchmark for micro is 3.5%
      });
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.engagementQuality.score).toBeGreaterThanOrEqual(70);
    });

    it("scores lower for below-benchmark engagement", () => {
      const profile = createMockProfile({
        tier: "micro",
        avgEngagementRate: 2.0, // Below benchmark of 3.5%
      });
      const brief = createMockBrief();

      const result = calculateFitScore(profile, brief);

      expect(result.breakdown.engagementQuality.score).toBeLessThan(70);
    });
  });
});
