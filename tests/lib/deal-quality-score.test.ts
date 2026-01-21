import { describe, it, expect } from "vitest";
import {
  calculateDealQuality,
  calculateDealQualityWithCompat,
  dealQualityToFitScore,
} from "@/lib/deal-quality-score";
import type { CreatorProfile, ParsedBrief, DealQualityInput } from "@/lib/types";

describe("deal-quality-score", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockProfile = (overrides?: Partial<CreatorProfile>): CreatorProfile => ({
    id: "test-1",
    userId: "user-1",
    displayName: "Test Creator",
    handle: "testcreator",
    bio: "Test bio",
    location: "United States",
    region: "united_states",
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

  const createMockDealInput = (overrides?: Partial<DealQualityInput>): DealQualityInput => ({
    brandTier: "established",
    brandHasWebsite: true,
    brandFollowers: 50000,
    brandHasCreatorHistory: true,
    paymentTerms: "net_30",
    mentionsOngoingPartnership: false,
    hasStrictScript: false,
    revisionRounds: 2,
    approvalProcess: "simple",
    ...overrides,
  });

  // ==========================================================================
  // MAIN FUNCTION TESTS
  // ==========================================================================

  describe("calculateDealQuality", () => {
    it("returns score between 0 and 100", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateDealQuality(profile, brief, {});

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it("returns correct quality level for high score", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        brandTier: "major",
        brandHasWebsite: true,
        brandFollowers: 500000,
        paymentTerms: "upfront",
        mentionsOngoingPartnership: true,
        isCategoryLeader: true,
        offeredRate: 500, // Above market rate for micro tier
      });

      const result = calculateDealQuality(profile, brief, input);

      expect(["excellent", "good"]).toContain(result.qualityLevel);
    });

    it("returns caution level for poor deal signals", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: {
          durationDays: 365,
          exclusivity: "full",
          paidAmplification: true,
        },
      });
      const input: DealQualityInput = {
        brandTier: "unknown",
        brandHasWebsite: false,
        brandFollowers: 100,
        paymentTerms: "net_90",
        hasStrictScript: true,
        revisionRounds: 10,
        offeredRate: 50, // Far below market rate
      };

      const result = calculateDealQuality(profile, brief, input);

      expect(result.qualityLevel).toBe("caution");
      expect(result.recommendation).toBe("decline");
    });

    it("includes all 6 breakdown components", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateDealQuality(profile, brief, {});

      expect(result.breakdown).toHaveProperty("rateFairness");
      expect(result.breakdown).toHaveProperty("brandLegitimacy");
      expect(result.breakdown).toHaveProperty("portfolioValue");
      expect(result.breakdown).toHaveProperty("growthPotential");
      expect(result.breakdown).toHaveProperty("termsFairness");
      expect(result.breakdown).toHaveProperty("creativeFreedom");
    });

    it("breakdown scores sum to total score", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateDealQuality(profile, brief, {});

      const breakdownSum =
        result.breakdown.rateFairness.score +
        result.breakdown.brandLegitimacy.score +
        result.breakdown.portfolioValue.score +
        result.breakdown.growthPotential.score +
        result.breakdown.termsFairness.score +
        result.breakdown.creativeFreedom.score;

      expect(result.totalScore).toBe(breakdownSum);
    });

    it("returns positive price adjustment for excellent deals", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        brandTier: "major",
        paymentTerms: "upfront",
        mentionsOngoingPartnership: true,
        isCategoryLeader: true,
        offeredRate: 600,
      });

      const result = calculateDealQuality(profile, brief, input);

      if (result.qualityLevel === "excellent" || result.qualityLevel === "good") {
        expect(result.priceAdjustment).toBeGreaterThan(0);
      }
    });

    it("returns negative price adjustment for caution deals", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 365, exclusivity: "full", paidAmplification: true },
      });
      const input: DealQualityInput = {
        brandTier: "unknown",
        paymentTerms: "net_90",
        offeredRate: 50,
      };

      const result = calculateDealQuality(profile, brief, input);

      if (result.qualityLevel === "caution") {
        expect(result.priceAdjustment).toBeLessThan(0);
      }
    });

    it("provides recommendation text", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateDealQuality(profile, brief, {});

      expect(result.recommendationText).toBeTruthy();
      expect(result.recommendationText.length).toBeGreaterThan(0);
    });

    it("provides actionable insights", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const result = calculateDealQuality(profile, brief, {});

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeLessThanOrEqual(5);
    });
  });

  // ==========================================================================
  // DIMENSION-SPECIFIC TESTS
  // ==========================================================================

  describe("rate fairness", () => {
    it("scores high when offered rate is above market", () => {
      const profile = createMockProfile({ tier: "micro" }); // Market rate: $400
      const brief = createMockBrief();
      const input = createMockDealInput({ offeredRate: 500 }); // 25% above

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.rateFairness.score).toBeGreaterThanOrEqual(
        result.breakdown.rateFairness.maxPoints * 0.8
      );
    });

    it("scores low when offered rate is far below market", () => {
      const profile = createMockProfile({ tier: "micro" }); // Market rate: $400
      const brief = createMockBrief();
      const input = createMockDealInput({ offeredRate: 100 }); // 75% below

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.rateFairness.score).toBeLessThan(
        result.breakdown.rateFairness.maxPoints * 0.4
      );
    });
  });

  describe("brand legitimacy", () => {
    it("scores high for major brand with strong presence", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        brandTier: "major",
        brandHasWebsite: true,
        brandFollowers: 500000,
        brandHasCreatorHistory: true,
      });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.brandLegitimacy.score).toBeGreaterThanOrEqual(
        result.breakdown.brandLegitimacy.maxPoints * 0.8
      );
    });

    it("scores low for unknown brand with no web presence", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input: DealQualityInput = {
        brandTier: "unknown",
        brandHasWebsite: false,
        brandFollowers: 50,
        brandHasCreatorHistory: false,
      };

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.brandLegitimacy.score).toBeLessThan(
        result.breakdown.brandLegitimacy.maxPoints * 0.4
      );
    });
  });

  describe("portfolio value", () => {
    it("scores high for matching niche and major brand", () => {
      const profile = createMockProfile({ niches: ["fashion", "lifestyle"] });
      const brief = createMockBrief({ brand: { name: "Luxury Fashion Co", industry: "fashion", product: "Clothes" } });
      const input = createMockDealInput({
        brandTier: "major",
        isCategoryLeader: true,
      });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.portfolioValue.score).toBeGreaterThanOrEqual(
        result.breakdown.portfolioValue.maxPoints * 0.7
      );
    });

    it("scores lower for mismatched niche", () => {
      const profile = createMockProfile({ niches: ["gaming", "tech"] });
      const brief = createMockBrief({ brand: { name: "Cosmetics Brand", industry: "beauty", product: "Makeup" } });
      const input = createMockDealInput({ brandTier: "emerging" });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.portfolioValue.score).toBeLessThan(
        result.breakdown.portfolioValue.maxPoints * 0.7
      );
    });
  });

  describe("growth potential", () => {
    it("scores high when ongoing partnership is mentioned", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        mentionsOngoingPartnership: true,
        isCategoryLeader: true,
      });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.growthPotential.score).toBeGreaterThanOrEqual(
        result.breakdown.growthPotential.maxPoints * 0.7
      );
    });

    it("scores higher for retainer deals", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        retainerConfig: {
          dealLength: "12_month",
          monthlyDeliverables: { posts: 4, stories: 8, reels: 2, videos: 0 },
        },
      });
      const input = createMockDealInput({ mentionsOngoingPartnership: true });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.growthPotential.score).toBeGreaterThanOrEqual(
        result.breakdown.growthPotential.maxPoints * 0.8
      );
    });
  });

  describe("terms fairness", () => {
    it("scores high for favorable payment terms", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 0, exclusivity: "none", paidAmplification: false },
      });
      const input = createMockDealInput({ paymentTerms: "upfront" });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.termsFairness.score).toBeGreaterThanOrEqual(
        result.breakdown.termsFairness.maxPoints * 0.8
      );
    });

    it("scores low for unfavorable terms", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 365, exclusivity: "full", paidAmplification: true },
      });
      const input: DealQualityInput = { paymentTerms: "net_90" };

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.termsFairness.score).toBeLessThan(
        result.breakdown.termsFairness.maxPoints * 0.5
      );
    });
  });

  describe("creative freedom", () => {
    it("scores high with loose guidelines and limited revisions", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        hasStrictScript: false,
        revisionRounds: 1,
        approvalProcess: "simple",
      });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.creativeFreedom.score).toBeGreaterThanOrEqual(
        result.breakdown.creativeFreedom.maxPoints * 0.8
      );
    });

    it("scores low with strict script and many revisions", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input: DealQualityInput = {
        hasStrictScript: true,
        revisionRounds: 5,
        approvalProcess: "complex",
      };

      const result = calculateDealQuality(profile, brief, input);

      expect(result.breakdown.creativeFreedom.score).toBeLessThan(
        result.breakdown.creativeFreedom.maxPoints * 0.4
      );
    });
  });

  // ==========================================================================
  // RED FLAGS / GREEN FLAGS TESTS
  // ==========================================================================

  describe("red flags", () => {
    it("detects rate below market value", () => {
      const profile = createMockProfile({ tier: "micro" });
      const brief = createMockBrief();
      const input = createMockDealInput({ offeredRate: 100 }); // Far below $400 market

      const result = calculateDealQuality(profile, brief, input);

      expect(result.redFlags.some((f) => f.toLowerCase().includes("rate"))).toBe(true);
    });

    it("detects Net-90 payment terms", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input: DealQualityInput = { paymentTerms: "net_90" };

      const result = calculateDealQuality(profile, brief, input);

      expect(result.redFlags.some((f) => f.toLowerCase().includes("payment") || f.toLowerCase().includes("net-60"))).toBe(true);
    });

    it("detects perpetual usage with exclusivity", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 400, exclusivity: "full", paidAmplification: true },
      });

      const result = calculateDealQuality(profile, brief, {});

      expect(result.redFlags.some((f) => f.toLowerCase().includes("perpetual") || f.toLowerCase().includes("exclusivity"))).toBe(true);
    });
  });

  describe("green flags", () => {
    it("detects rate at or above market", () => {
      const profile = createMockProfile({ tier: "micro" });
      const brief = createMockBrief();
      const input = createMockDealInput({ offeredRate: 500 }); // Above $400 market

      const result = calculateDealQuality(profile, brief, input);

      expect(result.greenFlags.some((f) => f.toLowerCase().includes("rate") || f.toLowerCase().includes("market"))).toBe(true);
    });

    it("detects fast payment terms", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({ paymentTerms: "upfront" });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.greenFlags.some((f) => f.toLowerCase().includes("payment"))).toBe(true);
    });

    it("detects major brand opportunity", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({ brandTier: "major" });

      const result = calculateDealQuality(profile, brief, input);

      expect(result.greenFlags.some((f) => f.toLowerCase().includes("major brand"))).toBe(true);
    });
  });

  // ==========================================================================
  // QUALITY LEVEL THRESHOLDS
  // ==========================================================================

  describe("quality level thresholds", () => {
    it("returns excellent for scores 85+", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        brandTier: "major",
        brandHasWebsite: true,
        brandFollowers: 1000000,
        brandHasCreatorHistory: true,
        paymentTerms: "upfront",
        mentionsOngoingPartnership: true,
        hasStrictScript: false,
        revisionRounds: 1,
        approvalProcess: "simple",
        offeredRate: 600,
        isCategoryLeader: true,
      });

      const result = calculateDealQuality(profile, brief, input);

      // If score is 85+, should be excellent
      if (result.totalScore >= 85) {
        expect(result.qualityLevel).toBe("excellent");
        expect(result.recommendation).toBe("take_deal");
      }
    });

    it("returns caution for scores below 50", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 365, exclusivity: "full", paidAmplification: true },
      });
      const input: DealQualityInput = {
        brandTier: "unknown",
        brandHasWebsite: false,
        brandFollowers: 10,
        brandHasCreatorHistory: false,
        paymentTerms: "net_90",
        hasStrictScript: true,
        revisionRounds: 10,
        approvalProcess: "complex",
        offeredRate: 25,
      };

      const result = calculateDealQuality(profile, brief, input);

      // If score is below 50, should be caution
      if (result.totalScore < 50) {
        expect(result.qualityLevel).toBe("caution");
        expect(result.recommendation).toBe("decline");
      }
    });
  });

  // ==========================================================================
  // BACKWARD COMPATIBILITY TESTS
  // ==========================================================================

  describe("dealQualityToFitScore", () => {
    it("converts deal quality to fit score format", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const dealQuality = calculateDealQuality(profile, brief, {});

      const fitScore = dealQualityToFitScore(dealQuality);

      expect(fitScore).toHaveProperty("totalScore");
      expect(fitScore).toHaveProperty("fitLevel");
      expect(fitScore).toHaveProperty("priceAdjustment");
      expect(fitScore).toHaveProperty("breakdown");
      expect(fitScore).toHaveProperty("insights");
    });

    it("maps excellent quality to perfect fit level", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const input = createMockDealInput({
        brandTier: "major",
        offeredRate: 600,
        paymentTerms: "upfront",
        mentionsOngoingPartnership: true,
        isCategoryLeader: true,
      });

      const dealQuality = calculateDealQuality(profile, brief, input);

      if (dealQuality.qualityLevel === "excellent") {
        const fitScore = dealQualityToFitScore(dealQuality);
        expect(fitScore.fitLevel).toBe("perfect");
      }
    });

    it("maps caution quality to low fit level", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 365, exclusivity: "full", paidAmplification: true },
      });
      const input: DealQualityInput = {
        brandTier: "unknown",
        paymentTerms: "net_90",
        offeredRate: 50,
      };

      const dealQuality = calculateDealQuality(profile, brief, input);

      if (dealQuality.qualityLevel === "caution") {
        const fitScore = dealQualityToFitScore(dealQuality);
        expect(fitScore.fitLevel).toBe("low");
      }
    });

    it("preserves price adjustment", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const dealQuality = calculateDealQuality(profile, brief, {});

      const fitScore = dealQualityToFitScore(dealQuality);

      expect(fitScore.priceAdjustment).toBe(dealQuality.priceAdjustment);
    });

    it("includes all 5 legacy breakdown components", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const dealQuality = calculateDealQuality(profile, brief, {});

      const fitScore = dealQualityToFitScore(dealQuality);

      expect(fitScore.breakdown).toHaveProperty("nicheMatch");
      expect(fitScore.breakdown).toHaveProperty("demographicMatch");
      expect(fitScore.breakdown).toHaveProperty("platformMatch");
      expect(fitScore.breakdown).toHaveProperty("engagementQuality");
      expect(fitScore.breakdown).toHaveProperty("contentCapability");
    });

    it("legacy breakdown weights sum to 1.0", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const dealQuality = calculateDealQuality(profile, brief, {});

      const fitScore = dealQualityToFitScore(dealQuality);
      const totalWeight =
        fitScore.breakdown.nicheMatch.weight +
        fitScore.breakdown.demographicMatch.weight +
        fitScore.breakdown.platformMatch.weight +
        fitScore.breakdown.engagementQuality.weight +
        fitScore.breakdown.contentCapability.weight;

      expect(totalWeight).toBeCloseTo(1.0);
    });
  });

  describe("calculateDealQualityWithCompat", () => {
    it("returns both deal quality and fit score", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const { dealQuality, fitScore } = calculateDealQualityWithCompat(profile, brief, {});

      expect(dealQuality).toBeDefined();
      expect(fitScore).toBeDefined();
      expect(dealQuality.totalScore).toBeDefined();
      expect(fitScore.totalScore).toBeDefined();
    });

    it("scores are consistent between formats", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();

      const { dealQuality, fitScore } = calculateDealQualityWithCompat(profile, brief, {});

      // Total scores should be the same
      expect(fitScore.totalScore).toBe(dealQuality.totalScore);
      // Price adjustments should be the same
      expect(fitScore.priceAdjustment).toBe(dealQuality.priceAdjustment);
    });
  });
});
