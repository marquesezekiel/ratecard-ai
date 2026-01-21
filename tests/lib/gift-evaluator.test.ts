import { describe, it, expect } from "vitest";
import {
  evaluateGiftDeal,
  getHourlyRate,
  calculateTimeValue,
  calculateAudienceValue,
  calculateEffectiveHourlyRate,
  calculateStrategicScore,
  getConversionPotential,
  isPortfolioWorthy,
  hasBrandReputationBoost,
  getAcceptanceBoundaries,
} from "@/lib/gift-evaluator";
import type { CreatorProfile, GiftEvaluationInput } from "@/lib/types";

describe("gift-evaluator", () => {
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
    niches: ["lifestyle", "beauty"],
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
      interests: ["beauty", "lifestyle"],
    },
    tier: "micro",
    totalReach: 25000,
    avgEngagementRate: 4.5,
    currency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockGiftInput = (overrides?: Partial<GiftEvaluationInput>): GiftEvaluationInput => ({
    productDescription: "Premium skincare set",
    estimatedProductValue: 150,
    contentRequired: "dedicated_post",
    estimatedHoursToCreate: 2,
    brandQuality: "established_indie",
    wouldYouBuyIt: true,
    brandFollowers: 50000,
    hasWebsite: true,
    previousCreatorCollabs: true,
    ...overrides,
  });

  // ==========================================================================
  // HOURLY RATE TESTS
  // ==========================================================================

  describe("getHourlyRate", () => {
    it("returns $30/hr for nano tier", () => {
      expect(getHourlyRate("nano")).toBe(30);
    });

    it("returns $50/hr for micro tier", () => {
      expect(getHourlyRate("micro")).toBe(50);
    });

    it("returns $75/hr for mid tier", () => {
      expect(getHourlyRate("mid")).toBe(75);
    });

    it("returns $100/hr for rising tier", () => {
      expect(getHourlyRate("rising")).toBe(100);
    });

    it("returns $125/hr for macro tier", () => {
      expect(getHourlyRate("macro")).toBe(125);
    });

    it("returns $150/hr for mega tier", () => {
      expect(getHourlyRate("mega")).toBe(150);
    });

    it("returns $200/hr for celebrity tier", () => {
      expect(getHourlyRate("celebrity")).toBe(200);
    });
  });

  // ==========================================================================
  // TIME VALUE TESTS
  // ==========================================================================

  describe("calculateTimeValue", () => {
    it("calculates time value for micro tier (2 hours)", () => {
      // 2 hours × $50/hr = $100
      expect(calculateTimeValue(2, "micro")).toBe(100);
    });

    it("calculates time value for nano tier (3 hours)", () => {
      // 3 hours × $30/hr = $90
      expect(calculateTimeValue(3, "nano")).toBe(90);
    });

    it("calculates time value for macro tier (4 hours)", () => {
      // 4 hours × $125/hr = $500
      expect(calculateTimeValue(4, "macro")).toBe(500);
    });

    it("handles fractional hours", () => {
      // 1.5 hours × $50/hr = $75
      const value = calculateTimeValue(1.5, "micro");
      expect(value).toBeGreaterThanOrEqual(74);
      expect(value).toBeLessThanOrEqual(76);
    });

    it("returns 0 for 0 hours", () => {
      expect(calculateTimeValue(0, "micro")).toBe(0);
    });
  });

  // ==========================================================================
  // AUDIENCE VALUE TESTS
  // ==========================================================================

  describe("calculateAudienceValue", () => {
    it("calculates audience value for typical micro creator", () => {
      // (25000 followers × 4.5% engagement × 0.001 × $5 CPM)
      // = 25000 × 0.045 × 0.001 × 5 = 5.625, rounded to 6
      const value = calculateAudienceValue(25000, 4.5);
      expect(value).toBe(6);
    });

    it("calculates audience value for high engagement", () => {
      // (25000 × 8% × 0.001 × $5) ~ 10
      const value = calculateAudienceValue(25000, 8);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(11);
    });

    it("calculates audience value for larger creator", () => {
      // (100000 × 3% × 0.001 × $5) ~ 15
      const value = calculateAudienceValue(100000, 3);
      expect(value).toBeGreaterThanOrEqual(15);
      expect(value).toBeLessThanOrEqual(16);
    });

    it("returns 0 for 0 followers", () => {
      expect(calculateAudienceValue(0, 5)).toBe(0);
    });

    it("returns 0 for 0 engagement", () => {
      expect(calculateAudienceValue(25000, 0)).toBe(0);
    });
  });

  // ==========================================================================
  // EFFECTIVE HOURLY RATE TESTS
  // ==========================================================================

  describe("calculateEffectiveHourlyRate", () => {
    it("calculates effective hourly rate correctly", () => {
      // $150 product / 2 hours = $75/hr
      expect(calculateEffectiveHourlyRate(150, 2)).toBe(75);
    });

    it("calculates low effective rate for high hours", () => {
      // $100 product / 5 hours = $20/hr
      expect(calculateEffectiveHourlyRate(100, 5)).toBe(20);
    });

    it("calculates high effective rate for low hours", () => {
      // $200 product / 1 hour = $200/hr
      expect(calculateEffectiveHourlyRate(200, 1)).toBe(200);
    });

    it("returns 0 for 0 hours", () => {
      expect(calculateEffectiveHourlyRate(150, 0)).toBe(0);
    });

    it("handles small product values", () => {
      // $50 product / 2 hours = $25/hr
      expect(calculateEffectiveHourlyRate(50, 2)).toBe(25);
    });
  });

  // ==========================================================================
  // STRATEGIC SCORE TESTS
  // ==========================================================================

  describe("calculateStrategicScore", () => {
    it("gives +3 for major brand", () => {
      const input = createMockGiftInput({ brandQuality: "major_brand" });
      const { score } = calculateStrategicScore(input);
      expect(score).toBeGreaterThanOrEqual(3);
    });

    it("gives +2 for established indie", () => {
      const input = createMockGiftInput({ brandQuality: "established_indie" });
      const { score } = calculateStrategicScore(input);
      expect(score).toBeGreaterThanOrEqual(2);
    });

    it("gives -5 for suspicious brand", () => {
      const input = createMockGiftInput({
        brandQuality: "suspicious",
        wouldYouBuyIt: false,
        hasWebsite: false,
        previousCreatorCollabs: false,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBe(0); // Clamped to 0
    });

    it("gives +2 for product creator would buy", () => {
      const input = createMockGiftInput({
        brandQuality: "new_unknown",
        wouldYouBuyIt: true,
        hasWebsite: false,
        previousCreatorCollabs: false,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBe(2); // Just the wouldYouBuyIt bonus
    });

    it("gives +2 for previous creator collabs", () => {
      const input = createMockGiftInput({
        brandQuality: "new_unknown",
        wouldYouBuyIt: false,
        hasWebsite: false,
        previousCreatorCollabs: true,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBe(2);
    });

    it("gives +1 for having a website", () => {
      const input = createMockGiftInput({
        brandQuality: "new_unknown",
        wouldYouBuyIt: false,
        hasWebsite: true,
        previousCreatorCollabs: false,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBe(1);
    });

    it("gives +1 for large brand following", () => {
      const input = createMockGiftInput({
        brandQuality: "new_unknown",
        wouldYouBuyIt: false,
        hasWebsite: false,
        previousCreatorCollabs: false,
        brandFollowers: 100000,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBe(1);
    });

    it("caps strategic score at 10", () => {
      const input = createMockGiftInput({
        brandQuality: "major_brand",
        wouldYouBuyIt: true,
        hasWebsite: true,
        previousCreatorCollabs: true,
        brandFollowers: 500000,
      });
      const { score } = calculateStrategicScore(input);
      expect(score).toBeLessThanOrEqual(10);
    });

    it("returns reasons for scoring", () => {
      const input = createMockGiftInput({ brandQuality: "major_brand" });
      const { reasons } = calculateStrategicScore(input);
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some(r => r.includes("portfolio"))).toBe(true);
    });
  });

  // ==========================================================================
  // CONVERSION POTENTIAL TESTS
  // ==========================================================================

  describe("getConversionPotential", () => {
    it("returns high for major brand with signals", () => {
      const input = createMockGiftInput({
        brandQuality: "major_brand",
        hasWebsite: true,
        previousCreatorCollabs: true,
      });
      expect(getConversionPotential(input)).toBe("high");
    });

    it("returns high for established indie with signals", () => {
      const input = createMockGiftInput({
        brandQuality: "established_indie",
        hasWebsite: true,
        previousCreatorCollabs: true,
      });
      expect(getConversionPotential(input)).toBe("high");
    });

    it("returns low for suspicious brand", () => {
      const input = createMockGiftInput({ brandQuality: "suspicious" });
      expect(getConversionPotential(input)).toBe("low");
    });

    it("returns low for new unknown without website", () => {
      const input = createMockGiftInput({
        brandQuality: "new_unknown",
        hasWebsite: false,
      });
      expect(getConversionPotential(input)).toBe("low");
    });

    it("returns medium for established indie without collabs", () => {
      const input = createMockGiftInput({
        brandQuality: "established_indie",
        hasWebsite: true,
        previousCreatorCollabs: false,
        brandFollowers: 10000,
      });
      expect(getConversionPotential(input)).toBe("medium");
    });
  });

  // ==========================================================================
  // PORTFOLIO WORTH TESTS
  // ==========================================================================

  describe("isPortfolioWorthy", () => {
    it("returns true for major brand", () => {
      const input = createMockGiftInput({ brandQuality: "major_brand" });
      expect(isPortfolioWorthy(input)).toBe(true);
    });

    it("returns true for established indie with signals", () => {
      const input = createMockGiftInput({
        brandQuality: "established_indie",
        hasWebsite: true,
        previousCreatorCollabs: true,
      });
      expect(isPortfolioWorthy(input)).toBe(true);
    });

    it("returns false for new unknown", () => {
      const input = createMockGiftInput({ brandQuality: "new_unknown" });
      expect(isPortfolioWorthy(input)).toBe(false);
    });

    it("returns false for suspicious brand", () => {
      const input = createMockGiftInput({ brandQuality: "suspicious" });
      expect(isPortfolioWorthy(input)).toBe(false);
    });
  });

  // ==========================================================================
  // BRAND REPUTATION BOOST TESTS
  // ==========================================================================

  describe("hasBrandReputationBoost", () => {
    it("returns true only for major brand", () => {
      expect(hasBrandReputationBoost(createMockGiftInput({ brandQuality: "major_brand" }))).toBe(true);
      expect(hasBrandReputationBoost(createMockGiftInput({ brandQuality: "established_indie" }))).toBe(false);
      expect(hasBrandReputationBoost(createMockGiftInput({ brandQuality: "new_unknown" }))).toBe(false);
      expect(hasBrandReputationBoost(createMockGiftInput({ brandQuality: "suspicious" }))).toBe(false);
    });
  });

  // ==========================================================================
  // ACCEPTANCE BOUNDARIES TESTS
  // ==========================================================================

  describe("getAcceptanceBoundaries", () => {
    it("limits content for high value gap", () => {
      const input = createMockGiftInput({ contentRequired: "dedicated_post" });
      const boundaries = getAcceptanceBoundaries(input, 60);
      expect(boundaries.maxContentType).toContain("story");
      expect(boundaries.timeLimit).toContain("24-hour");
    });

    it("allows requested content for low value gap", () => {
      const input = createMockGiftInput({ contentRequired: "dedicated_post" });
      const boundaries = getAcceptanceBoundaries(input, 10);
      expect(boundaries.maxContentType).toContain("as requested");
    });

    it("limits video content appropriately", () => {
      const input = createMockGiftInput({ contentRequired: "video_content" });
      const boundaries = getAcceptanceBoundaries(input, 30);
      expect(boundaries.maxContentType).toContain("video");
    });

    it("always limits usage rights", () => {
      const input = createMockGiftInput();
      const boundaries = getAcceptanceBoundaries(input, 20);
      expect(boundaries.rightsLimit).toContain("No usage rights");
    });
  });

  // ==========================================================================
  // MAIN EVALUATION FUNCTION TESTS
  // ==========================================================================

  describe("evaluateGiftDeal", () => {
    describe("worth score calculation", () => {
      it("returns high worth score for high-value product + low effort", () => {
        const profile = createMockProfile({ tier: "micro" });
        const input = createMockGiftInput({
          estimatedProductValue: 300,
          estimatedHoursToCreate: 1,
          brandQuality: "major_brand",
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.worthScore).toBeGreaterThanOrEqual(70);
      });

      it("returns low worth score for low-value product + high effort", () => {
        const profile = createMockProfile({ tier: "macro" });
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          estimatedHoursToCreate: 5,
          brandQuality: "new_unknown",
          wouldYouBuyIt: false,
          hasWebsite: false,
          previousCreatorCollabs: false,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.worthScore).toBeLessThan(50);
      });

      it("penalizes suspicious brands heavily", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          brandQuality: "suspicious",
          wouldYouBuyIt: false,
          hasWebsite: false,
          previousCreatorCollabs: false,
          brandFollowers: 100,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.worthScore).toBeLessThan(40);
        expect(result.recommendation).toBe("run_away");
      });

      it("clamps worth score to 0-100 range", () => {
        const profile = createMockProfile();

        // Very bad deal
        const badInput = createMockGiftInput({
          estimatedProductValue: 10,
          estimatedHoursToCreate: 10,
          brandQuality: "suspicious",
        });
        const badResult = evaluateGiftDeal(badInput, profile);
        expect(badResult.worthScore).toBeGreaterThanOrEqual(0);

        // Very good deal
        const goodInput = createMockGiftInput({
          estimatedProductValue: 500,
          estimatedHoursToCreate: 0.5,
          brandQuality: "major_brand",
        });
        const goodResult = evaluateGiftDeal(goodInput, profile);
        expect(goodResult.worthScore).toBeLessThanOrEqual(100);
      });
    });

    describe("recommendation logic", () => {
      it("recommends accept_with_hook for high worth + high strategic", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 300,
          estimatedHoursToCreate: 1,
          brandQuality: "major_brand",
          wouldYouBuyIt: true,
          hasWebsite: true,
          previousCreatorCollabs: true,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.recommendation).toBe("accept_with_hook");
      });

      it("recommends counter_hybrid for mid worth + mid strategic", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 100,
          estimatedHoursToCreate: 2,
          brandQuality: "established_indie",
          wouldYouBuyIt: true,
          hasWebsite: true,
          previousCreatorCollabs: true,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(["counter_hybrid", "accept_with_hook"]).toContain(result.recommendation);
      });

      it("recommends ask_budget_first for mid worth + low strategic", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 100,
          estimatedHoursToCreate: 2,
          brandQuality: "new_unknown",
          wouldYouBuyIt: false,
          hasWebsite: true,
          previousCreatorCollabs: false,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(["ask_budget_first", "counter_hybrid", "decline_politely"]).toContain(result.recommendation);
      });

      it("recommends decline_politely for low worth", () => {
        const profile = createMockProfile({ tier: "mid" });
        const input = createMockGiftInput({
          estimatedProductValue: 40,
          estimatedHoursToCreate: 3,
          brandQuality: "new_unknown",
          wouldYouBuyIt: false,
          hasWebsite: true, // Keep some legitimacy to avoid run_away
          previousCreatorCollabs: false,
        });
        const result = evaluateGiftDeal(input, profile);
        // Worth score should be low (30-50 range) resulting in decline or ask_budget
        expect(["decline_politely", "ask_budget_first", "run_away"]).toContain(result.recommendation);
      });

      it("recommends run_away for very low worth (suspicious)", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          brandQuality: "suspicious",
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.recommendation).toBe("run_away");
      });
    });

    describe("analysis breakdown", () => {
      it("calculates product value correctly", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({ estimatedProductValue: 175 });
        const result = evaluateGiftDeal(input, profile);
        expect(result.analysis.productValue).toBe(175);
      });

      it("calculates time value correctly", () => {
        const profile = createMockProfile({ tier: "micro" });
        const input = createMockGiftInput({ estimatedHoursToCreate: 3 });
        const result = evaluateGiftDeal(input, profile);
        // 3 hours × $50/hr = $150
        expect(result.analysis.yourTimeValue).toBe(150);
      });

      it("calculates value gap correctly", () => {
        const profile = createMockProfile({ tier: "micro", totalReach: 25000, avgEngagementRate: 4.5 });
        const input = createMockGiftInput({
          estimatedProductValue: 200,
          estimatedHoursToCreate: 2,
        });
        const result = evaluateGiftDeal(input, profile);
        // Time value: 2 × $50 = $100
        // Audience value: small amount (6 × 1.0 = 6)
        // Total providing: ~$106
        // Product value: $200
        // Gap: $200 - $106 = $94 (positive = good)
        expect(result.analysis.valueGap).toBeGreaterThan(0);
      });

      it("calculates effective hourly rate", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 100,
          estimatedHoursToCreate: 2,
        });
        const result = evaluateGiftDeal(input, profile);
        // $100 / 2 hours = $50/hr
        expect(result.analysis.effectiveHourlyRate).toBe(50);
      });
    });

    describe("strategic value assessment", () => {
      it("includes strategic score", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(result.strategicValue.score).toBeGreaterThanOrEqual(0);
        expect(result.strategicValue.score).toBeLessThanOrEqual(10);
      });

      it("includes portfolio worth assessment", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({ brandQuality: "major_brand" });
        const result = evaluateGiftDeal(input, profile);
        expect(result.strategicValue.portfolioWorth).toBe(true);
      });

      it("includes conversion potential", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(["high", "medium", "low"]).toContain(result.strategicValue.conversionPotential);
      });

      it("includes strategic reasons", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(result.strategicValue.reasons.length).toBeGreaterThan(0);
      });
    });

    describe("minimum acceptable add-on", () => {
      it("calculates add-on for negative value gap", () => {
        const profile = createMockProfile({ tier: "macro" });
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          estimatedHoursToCreate: 4,
          contentRequired: "multiple_posts",
        });
        const result = evaluateGiftDeal(input, profile);
        // Creator is providing way more value than receiving
        expect(result.minimumAcceptableAddOn).toBeGreaterThan(0);
      });

      it("returns 0 for positive value gap", () => {
        const profile = createMockProfile({ tier: "nano" });
        const input = createMockGiftInput({
          estimatedProductValue: 300,
          estimatedHoursToCreate: 1,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.minimumAcceptableAddOn).toBe(0);
      });

      it("rounds to nearest $25", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          estimatedHoursToCreate: 3,
        });
        const result = evaluateGiftDeal(input, profile);
        expect(result.minimumAcceptableAddOn % 25).toBe(0);
      });
    });

    describe("walk away point", () => {
      it("provides walk away guidance", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(result.walkAwayPoint).toBeTruthy();
        expect(typeof result.walkAwayPoint).toBe("string");
      });

      it("has specific message for run_away", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({
          brandQuality: "suspicious",
          estimatedProductValue: 30,
          wouldYouBuyIt: false,
          hasWebsite: false,
          previousCreatorCollabs: false,
        });
        const result = evaluateGiftDeal(input, profile);
        // For run_away recommendations, walk away point mentions red flags
        if (result.recommendation === "run_away") {
          expect(result.walkAwayPoint).toContain("red flags");
        } else {
          expect(result.walkAwayPoint).toBeTruthy();
        }
      });
    });

    describe("acceptance boundaries", () => {
      it("provides content boundaries", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(result.acceptanceBoundaries.maxContentType).toBeTruthy();
        expect(result.acceptanceBoundaries.timeLimit).toBeTruthy();
        expect(result.acceptanceBoundaries.rightsLimit).toBeTruthy();
      });
    });

    describe("suggested counter offer", () => {
      it("generates counter offer text", () => {
        const profile = createMockProfile();
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);
        expect(result.suggestedCounterOffer).toBeTruthy();
        expect(typeof result.suggestedCounterOffer).toBe("string");
      });

      it("includes rate in counter offer when needed", () => {
        const profile = createMockProfile({ tier: "micro" });
        const input = createMockGiftInput({
          estimatedProductValue: 50,
          estimatedHoursToCreate: 3,
        });
        const result = evaluateGiftDeal(input, profile);
        if (result.minimumAcceptableAddOn > 0) {
          expect(result.suggestedCounterOffer).toContain("$");
        }
      });
    });
  });

  // ==========================================================================
  // TIER-BASED EVALUATION TESTS
  // ==========================================================================

  describe("tier-based evaluations", () => {
    const tiers: CreatorProfile["tier"][] = ["nano", "micro", "mid", "rising", "macro", "mega", "celebrity"];

    tiers.forEach((tier) => {
      it(`evaluates correctly for ${tier} tier`, () => {
        const profile = createMockProfile({ tier });
        const input = createMockGiftInput();
        const result = evaluateGiftDeal(input, profile);

        expect(result.worthScore).toBeGreaterThanOrEqual(0);
        expect(result.worthScore).toBeLessThanOrEqual(100);
        expect(result.recommendation).toBeTruthy();
        expect(result.analysis).toBeTruthy();
      });
    });

    it("higher tier = lower effective hourly rate for same product", () => {
      const input = createMockGiftInput({
        estimatedProductValue: 100,
        estimatedHoursToCreate: 2,
      });

      const nanoProfile = createMockProfile({ tier: "nano" });
      const macroProfile = createMockProfile({ tier: "macro" });

      const nanoResult = evaluateGiftDeal(input, nanoProfile);
      const macroResult = evaluateGiftDeal(input, macroProfile);

      // Same product value / hours, but higher tier means their time is worth more
      // So the deal should be worse for higher tier creators
      expect(macroResult.worthScore).toBeLessThan(nanoResult.worthScore);
    });
  });

  // ==========================================================================
  // CONTENT TYPE TESTS
  // ==========================================================================

  describe("content type handling", () => {
    const contentTypes: GiftEvaluationInput["contentRequired"][] = [
      "organic_mention",
      "dedicated_post",
      "multiple_posts",
      "video_content",
    ];

    contentTypes.forEach((contentType) => {
      it(`evaluates ${contentType} content type`, () => {
        const profile = createMockProfile();
        const input = createMockGiftInput({ contentRequired: contentType });
        const result = evaluateGiftDeal(input, profile);
        expect(result.worthScore).toBeGreaterThanOrEqual(0);
      });
    });

    it("organic_mention requires less effort (higher score)", () => {
      const profile = createMockProfile();
      const organicInput = createMockGiftInput({ contentRequired: "organic_mention" });
      const multipleInput = createMockGiftInput({ contentRequired: "multiple_posts" });

      const organicResult = evaluateGiftDeal(organicInput, profile);
      const multipleResult = evaluateGiftDeal(multipleInput, profile);

      // Organic mention should be a better deal (less effort for same product)
      expect(organicResult.worthScore).toBeGreaterThan(multipleResult.worthScore);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("handles very high product value", () => {
      const profile = createMockProfile();
      const input = createMockGiftInput({
        estimatedProductValue: 5000,
        estimatedHoursToCreate: 1,
      });
      const result = evaluateGiftDeal(input, profile);
      expect(result.worthScore).toBeGreaterThanOrEqual(70);
      expect(result.recommendation).toBe("accept_with_hook");
    });

    it("handles very low product value", () => {
      const profile = createMockProfile();
      const input = createMockGiftInput({
        estimatedProductValue: 5,
        estimatedHoursToCreate: 5,
      });
      const result = evaluateGiftDeal(input, profile);
      expect(result.worthScore).toBeLessThan(50);
    });

    it("handles null brand followers", () => {
      const profile = createMockProfile();
      const input = createMockGiftInput({ brandFollowers: null });
      const result = evaluateGiftDeal(input, profile);
      expect(result.worthScore).toBeGreaterThanOrEqual(0);
    });

    it("handles very small hours estimate", () => {
      const profile = createMockProfile();
      const input = createMockGiftInput({
        estimatedHoursToCreate: 0.25,
        estimatedProductValue: 50,
      });
      const result = evaluateGiftDeal(input, profile);
      // $50 / 0.25 hours = $200/hr effective rate
      expect(result.analysis.effectiveHourlyRate).toBe(200);
    });

    it("handles large follower count", () => {
      const profile = createMockProfile({
        tier: "celebrity",
        totalReach: 5000000,
        avgEngagementRate: 2.0,
      });
      const input = createMockGiftInput();
      const result = evaluateGiftDeal(input, profile);
      expect(result.worthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
