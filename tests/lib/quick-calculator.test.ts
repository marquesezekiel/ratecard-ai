import { describe, it, expect } from "vitest";
import {
  calculateQuickEstimate,
  getTierDisplayName,
  getAllRateInfluencers,
} from "@/lib/quick-calculator";
import type { QuickCalculatorInput, CreatorTier } from "@/lib/types";

describe("quick-calculator", () => {
  // ==========================================================================
  // TIER BOUNDARY TESTS
  // ==========================================================================

  describe("tier boundaries", () => {
    const testCases: { followers: number; expectedTier: CreatorTier; tierName: string }[] = [
      // Nano tier: 1K - 10K
      { followers: 1000, expectedTier: "nano", tierName: "Nano" },
      { followers: 5000, expectedTier: "nano", tierName: "Nano" },
      { followers: 9999, expectedTier: "nano", tierName: "Nano" },

      // Micro tier: 10K - 50K (boundary at 10K)
      { followers: 10000, expectedTier: "micro", tierName: "Micro" },
      { followers: 25000, expectedTier: "micro", tierName: "Micro" },
      { followers: 49999, expectedTier: "micro", tierName: "Micro" },

      // Mid tier: 50K - 100K (boundary at 50K)
      { followers: 50000, expectedTier: "mid", tierName: "Mid-Tier" },
      { followers: 75000, expectedTier: "mid", tierName: "Mid-Tier" },
      { followers: 99999, expectedTier: "mid", tierName: "Mid-Tier" },

      // Rising tier: 100K - 250K (boundary at 100K)
      { followers: 100000, expectedTier: "rising", tierName: "Rising" },
      { followers: 175000, expectedTier: "rising", tierName: "Rising" },
      { followers: 249999, expectedTier: "rising", tierName: "Rising" },

      // Macro tier: 250K - 500K (boundary at 250K)
      { followers: 250000, expectedTier: "macro", tierName: "Macro" },
      { followers: 375000, expectedTier: "macro", tierName: "Macro" },
      { followers: 499999, expectedTier: "macro", tierName: "Macro" },

      // Mega tier: 500K - 1M (boundary at 500K)
      { followers: 500000, expectedTier: "mega", tierName: "Mega" },
      { followers: 750000, expectedTier: "mega", tierName: "Mega" },
      { followers: 999999, expectedTier: "mega", tierName: "Mega" },

      // Celebrity tier: 1M+ (boundary at 1M)
      { followers: 1000000, expectedTier: "celebrity", tierName: "Celebrity" },
      { followers: 5000000, expectedTier: "celebrity", tierName: "Celebrity" },
    ];

    testCases.forEach(({ followers, expectedTier, tierName }) => {
      it(`assigns ${tierName} tier for ${followers.toLocaleString()} followers`, () => {
        const result = calculateQuickEstimate({
          followerCount: followers,
          platform: "instagram",
          contentFormat: "static",
        });

        expect(result.tier).toBe(expectedTier);
        expect(result.tierName).toBe(tierName);
      });
    });
  });

  // ==========================================================================
  // PLATFORM MULTIPLIER TESTS
  // ==========================================================================

  describe("platform multipliers", () => {
    const baseInput: Omit<QuickCalculatorInput, "platform"> = {
      followerCount: 25000, // Micro tier, base $400
      contentFormat: "static",
      niche: "lifestyle",
    };

    it("applies Instagram baseline multiplier (1.0x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "instagram",
      });

      // Base rate for micro = $400, Instagram = 1.0x, engagement 3% = 1.0x
      expect(result.baseRate).toBe(400);
    });

    it("applies TikTok multiplier (0.9x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "tiktok",
      });

      // $400 * 0.9 = $360
      expect(result.baseRate).toBe(360);
    });

    it("applies YouTube premium multiplier (1.4x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "youtube",
      });

      // $400 * 1.4 = $560
      expect(result.baseRate).toBe(560);
    });

    it("applies LinkedIn B2B multiplier (1.3x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "linkedin",
      });

      // $400 * 1.3 = $520
      expect(result.baseRate).toBe(520);
    });

    it("applies Twitch streaming multiplier (1.1x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "twitch",
      });

      // $400 * 1.1 = $440
      expect(result.baseRate).toBe(440);
    });

    it("applies Bluesky emerging platform multiplier (0.5x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "bluesky",
      });

      // $400 * 0.5 = $200
      expect(result.baseRate).toBe(200);
    });

    it("applies Twitter multiplier (0.7x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        platform: "twitter",
      });

      // $400 * 0.7 = $280
      expect(result.baseRate).toBe(280);
    });
  });

  // ==========================================================================
  // NICHE PREMIUM TESTS
  // ==========================================================================

  describe("niche premiums", () => {
    const baseInput: Omit<QuickCalculatorInput, "niche"> = {
      followerCount: 25000, // Micro tier, base $400
      platform: "instagram", // 1.0x multiplier
      contentFormat: "static", // 0% premium
    };

    it("applies finance premium (2.0x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        niche: "finance",
      });

      // $400 * 2.0 = $800
      expect(result.baseRate).toBe(800);
    });

    it("applies business/B2B premium (1.8x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        niche: "business",
      });

      // $400 * 1.8 = $720
      expect(result.baseRate).toBe(720);
    });

    it("applies tech premium (1.7x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        niche: "tech",
      });

      // $400 * 1.7 = $680
      expect(result.baseRate).toBe(680);
    });

    it("applies beauty premium (1.3x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        niche: "beauty",
      });

      // $400 * 1.3 = $520
      expect(result.baseRate).toBe(520);
    });

    it("applies gaming discount (0.95x)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        niche: "gaming",
      });

      // $400 * 0.95 = $380
      expect(result.baseRate).toBe(380);
    });

    it("defaults to lifestyle (1.0x) when niche not specified", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
        // No niche specified
      });

      expect(result.niche).toBe("lifestyle");
      expect(result.baseRate).toBe(400);
    });
  });

  // ==========================================================================
  // CONTENT FORMAT PREMIUM TESTS
  // ==========================================================================

  describe("content format premiums", () => {
    const baseInput: Omit<QuickCalculatorInput, "contentFormat"> = {
      followerCount: 25000, // Micro tier, base $400
      platform: "instagram", // 1.0x multiplier
      niche: "lifestyle", // 1.0x premium
    };

    it("applies static format (0% premium)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "static",
      });

      expect(result.baseRate).toBe(400);
    });

    it("applies carousel format (+15% premium)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "carousel",
      });

      // $400 * 1.15 = $460
      expect(result.baseRate).toBe(460);
    });

    it("applies story format (-15% discount)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "story",
      });

      // $400 * 0.85 = $340
      expect(result.baseRate).toBe(340);
    });

    it("applies reel format (+25% premium)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "reel",
      });

      // $400 * 1.25 = $500
      expect(result.baseRate).toBe(500);
    });

    it("applies video format (+35% premium)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "video",
      });

      // $400 * 1.35 = $540
      expect(result.baseRate).toBe(540);
    });

    it("applies live format (+40% premium)", () => {
      const result = calculateQuickEstimate({
        ...baseInput,
        contentFormat: "live",
      });

      // $400 * 1.40 = $560
      expect(result.baseRate).toBe(560);
    });
  });

  // ==========================================================================
  // RANGE CALCULATION TESTS (±20%)
  // ==========================================================================

  describe("range calculation", () => {
    it("calculates min rate as -20% of base", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
      });

      // Base = $400, Min = $400 * 0.8 = $320
      expect(result.minRate).toBe(320);
    });

    it("calculates max rate as +20% of base", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
      });

      // Base = $400, Max = $400 * 1.2 = $480
      expect(result.maxRate).toBe(480);
    });

    it("rounds all rates to nearest $5", () => {
      // Use a combination that produces a non-round number
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "twitter", // 0.7x = $280 base
        contentFormat: "carousel", // +15% = $322
      });

      // $400 * 0.7 * 1.15 = $322
      // Rounded to $320
      // Min: $322 * 0.8 = $257.6 → $260 (rounded to nearest 5)
      // Max: $322 * 1.2 = $386.4 → $385 (rounded to nearest 5)
      expect(result.baseRate % 5).toBe(0);
      expect(result.minRate % 5).toBe(0);
      expect(result.maxRate % 5).toBe(0);
    });

    it("maintains correct range proportions", () => {
      const result = calculateQuickEstimate({
        followerCount: 100000, // Rising tier
        platform: "youtube", // 1.4x
        contentFormat: "video", // +35%
      });

      // Verify range is approximately ±20%
      const rangePercent = (result.maxRate - result.minRate) / result.baseRate;
      expect(rangePercent).toBeCloseTo(0.4, 1); // ±20% = 40% total range
    });
  });

  // ==========================================================================
  // FACTORS ARRAY TESTS
  // ==========================================================================

  describe("factors array", () => {
    it("always includes engagement factor", () => {
      const result = calculateQuickEstimate({
        followerCount: 5000, // Nano tier
        platform: "instagram",
        contentFormat: "static",
      });

      const hasEngagement = result.factors.some((f) =>
        f.name.toLowerCase().includes("engagement")
      );
      expect(hasEngagement).toBe(true);
    });

    it("always includes usage rights factor", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
      });

      const hasUsageRights = result.factors.some((f) =>
        f.name.toLowerCase().includes("usage")
      );
      expect(hasUsageRights).toBe(true);
    });

    it("includes exclusivity for non-nano creators", () => {
      const microResult = calculateQuickEstimate({
        followerCount: 25000, // Micro
        platform: "instagram",
        contentFormat: "static",
      });

      const hasExclusivity = microResult.factors.some((f) =>
        f.name.toLowerCase().includes("exclusivity")
      );
      expect(hasExclusivity).toBe(true);
    });

    it("includes whitelisting for video content", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "reel",
      });

      const hasWhitelisting = result.factors.some((f) =>
        f.name.toLowerCase().includes("whitelisting")
      );
      expect(hasWhitelisting).toBe(true);
    });

    it("limits factors to 4 for cleaner UI", () => {
      const result = calculateQuickEstimate({
        followerCount: 500000, // Mega tier
        platform: "youtube",
        contentFormat: "video",
      });

      expect(result.factors.length).toBeLessThanOrEqual(4);
    });

    it("each factor has name, description, and potentialIncrease", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
      });

      result.factors.forEach((factor) => {
        expect(factor.name).toBeDefined();
        expect(factor.name.length).toBeGreaterThan(0);
        expect(factor.description).toBeDefined();
        expect(factor.description.length).toBeGreaterThan(0);
        expect(factor.potentialIncrease).toBeDefined();
        expect(factor.potentialIncrease).toMatch(/\+.*%/);
      });
    });
  });

  // ==========================================================================
  // HELPER FUNCTION TESTS
  // ==========================================================================

  describe("getTierDisplayName", () => {
    it("returns correct display names for all tiers", () => {
      expect(getTierDisplayName("nano")).toBe("Nano");
      expect(getTierDisplayName("micro")).toBe("Micro");
      expect(getTierDisplayName("mid")).toBe("Mid-Tier");
      expect(getTierDisplayName("rising")).toBe("Rising");
      expect(getTierDisplayName("macro")).toBe("Macro");
      expect(getTierDisplayName("mega")).toBe("Mega");
      expect(getTierDisplayName("celebrity")).toBe("Celebrity");
    });
  });

  describe("getAllRateInfluencers", () => {
    it("returns all available rate influencers", () => {
      const influencers = getAllRateInfluencers();

      expect(influencers.length).toBeGreaterThan(0);
      expect(influencers.some((i) => i.name.includes("Engagement"))).toBe(true);
      expect(influencers.some((i) => i.name.includes("Usage Rights"))).toBe(true);
      expect(influencers.some((i) => i.name.includes("Exclusivity"))).toBe(true);
      expect(influencers.some((i) => i.name.includes("Whitelisting"))).toBe(true);
      expect(influencers.some((i) => i.name.includes("Q4"))).toBe(true);
    });
  });

  // ==========================================================================
  // RESULT STRUCTURE TESTS
  // ==========================================================================

  describe("result structure", () => {
    it("returns all required fields", () => {
      const result = calculateQuickEstimate({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "reel",
        niche: "beauty",
      });

      expect(result).toHaveProperty("minRate");
      expect(result).toHaveProperty("maxRate");
      expect(result).toHaveProperty("baseRate");
      expect(result).toHaveProperty("tierName");
      expect(result).toHaveProperty("tier");
      expect(result).toHaveProperty("factors");
      expect(result).toHaveProperty("platform");
      expect(result).toHaveProperty("contentFormat");
      expect(result).toHaveProperty("niche");
    });

    it("preserves input values in result", () => {
      const input: QuickCalculatorInput = {
        followerCount: 50000,
        platform: "tiktok",
        contentFormat: "video",
        niche: "tech",
      };

      const result = calculateQuickEstimate(input);

      expect(result.platform).toBe("tiktok");
      expect(result.contentFormat).toBe("video");
      expect(result.niche).toBe("tech");
    });

    it("rates are always positive numbers", () => {
      const result = calculateQuickEstimate({
        followerCount: 1000, // Minimum nano
        platform: "bluesky", // Lowest multiplier (0.5x)
        contentFormat: "story", // Discount (-15%)
      });

      expect(result.minRate).toBeGreaterThan(0);
      expect(result.maxRate).toBeGreaterThan(0);
      expect(result.baseRate).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe("combined calculations", () => {
    it("correctly combines all multipliers", () => {
      const result = calculateQuickEstimate({
        followerCount: 100000, // Rising tier: $1,500
        platform: "youtube", // 1.4x
        contentFormat: "video", // +35%
        niche: "tech", // 1.7x (actual value from pricing-engine)
      });

      // $1,500 * 1.4 * 1.7 * 1.35 = $4,819.50 → $4,820 (rounded to nearest 5)
      // With 3% engagement assumed (1.0x multiplier)
      expect(result.baseRate).toBe(4820);
    });

    it("produces reasonable rates across different scenarios", () => {
      // Budget creator scenario
      const budget = calculateQuickEstimate({
        followerCount: 5000,
        platform: "tiktok",
        contentFormat: "story",
      });
      expect(budget.baseRate).toBeLessThan(200);

      // Premium creator scenario
      const premium = calculateQuickEstimate({
        followerCount: 500000,
        platform: "youtube",
        contentFormat: "video",
        niche: "finance",
      });
      expect(premium.baseRate).toBeGreaterThan(10000);
    });
  });
});
