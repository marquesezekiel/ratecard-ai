import { describe, it, expect } from "vitest";
import {
  generateNegotiationTalkingPoints,
  getMinimumAcceptableRate,
  getMarketBenchmark,
} from "@/lib/negotiation-talking-points";
import type { CreatorProfile, ParsedBrief, PricingResult } from "@/lib/types";

describe("negotiation-talking-points", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockProfile = (overrides?: Partial<CreatorProfile>): CreatorProfile => ({
    id: "test-1",
    userId: "user-1",
    displayName: "Maya Creates",
    handle: "mayacreates",
    bio: "Lifestyle and fashion content creator",
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

  const createMockPricing = (overrides?: Partial<PricingResult>): PricingResult => ({
    pricePerDeliverable: 450,
    quantity: 1,
    totalPrice: 450,
    currency: "USD",
    currencySymbol: "$",
    validDays: 14,
    layers: [],
    formula: "Base × Engagement × Format × Fit × Rights × Complexity",
    pricingModel: "flat_fee",
    ...overrides,
  });

  // ==========================================================================
  // MAIN FUNCTION TESTS
  // ==========================================================================

  describe("generateNegotiationTalkingPoints", () => {
    it("returns all four sections", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result).toHaveProperty("whyThisRate");
      expect(result).toHaveProperty("confidenceBoosters");
      expect(result).toHaveProperty("pushBack");
      expect(result).toHaveProperty("quickResponse");
      expect(result).toHaveProperty("generatedAt");
    });

    it("generates timestamp on creation", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const before = new Date();
      const result = generateNegotiationTalkingPoints(pricing, profile, brief);
      const after = new Date();

      expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ==========================================================================
  // WHY THIS RATE SECTION TESTS
  // ==========================================================================

  describe("whyThisRate section", () => {
    it("includes 3-4 bullet points", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.whyThisRate.bulletPoints.length).toBeGreaterThanOrEqual(3);
      expect(result.whyThisRate.bulletPoints.length).toBeLessThanOrEqual(4);
    });

    it("includes engagement rate in bullet points", () => {
      const profile = createMockProfile({ avgEngagementRate: 5.0 });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const engagementPoint = result.whyThisRate.bulletPoints.find(
        (p) => p.point.includes("engagement") || p.point.includes("5%")
      );
      expect(engagementPoint).toBeDefined();
    });

    it("includes audience size in bullet points", () => {
      const profile = createMockProfile({ totalReach: 50000 });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const audiencePoint = result.whyThisRate.bulletPoints.find(
        (p) => p.point.includes("50,000") || p.point.includes("followers")
      );
      expect(audiencePoint).toBeDefined();
    });

    it("includes niche expertise in bullet points", () => {
      const profile = createMockProfile({ niches: ["fashion", "beauty"] });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const nichePoint = result.whyThisRate.bulletPoints.find(
        (p) => p.point.includes("fashion") || p.point.includes("expertise")
      );
      expect(nichePoint).toBeDefined();
    });

    it("includes summary statement", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.whyThisRate.summary).toBeTruthy();
      expect(result.whyThisRate.summary.length).toBeGreaterThan(20);
    });
  });

  // ==========================================================================
  // CONFIDENCE BOOSTERS SECTION TESTS
  // ==========================================================================

  describe("confidenceBoosters section", () => {
    it("includes market comparison", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.marketComparison).toBeTruthy();
    });

    it("correctly identifies rate above market", () => {
      const profile = createMockProfile({ tier: "micro" }); // Benchmark: $400
      const brief = createMockBrief();
      const pricing = createMockPricing({ pricePerDeliverable: 500, totalPrice: 500 }); // 25% above

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.marketPosition).toBe("above");
      expect(result.confidenceBoosters.marketPercentage).toBeGreaterThan(100);
    });

    it("correctly identifies rate at market", () => {
      const profile = createMockProfile({ tier: "micro" }); // Benchmark: $400
      const brief = createMockBrief();
      const pricing = createMockPricing({ pricePerDeliverable: 400, totalPrice: 400 });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.marketPosition).toBe("at");
      expect(result.confidenceBoosters.marketPercentage).toBe(100);
    });

    it("correctly identifies rate below market", () => {
      const profile = createMockProfile({ tier: "micro" }); // Benchmark: $400
      const brief = createMockBrief();
      const pricing = createMockPricing({ pricePerDeliverable: 300, totalPrice: 300 }); // 25% below

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.marketPosition).toBe("below");
      expect(result.confidenceBoosters.marketPercentage).toBeLessThan(100);
    });

    it("includes value reminders", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.valueReminders.length).toBeGreaterThanOrEqual(2);
    });

    it("includes encouragement message", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.confidenceBoosters.encouragement).toBeTruthy();
    });
  });

  // ==========================================================================
  // PUSH BACK SECTION TESTS
  // ==========================================================================

  describe("pushBack section", () => {
    it("includes 2-3 counter-offer scripts", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.pushBack.counterOfferScripts.length).toBeGreaterThanOrEqual(2);
      expect(result.pushBack.counterOfferScripts.length).toBeLessThanOrEqual(3);
    });

    it("counter-offers have scenario and script", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      for (const counterOffer of result.pushBack.counterOfferScripts) {
        expect(counterOffer.scenario).toBeTruthy();
        expect(counterOffer.script).toBeTruthy();
        expect(counterOffer.script.length).toBeGreaterThan(50);
      }
    });

    it("calculates minimum acceptable rate correctly", () => {
      const profile = createMockProfile({ tier: "micro" }); // 65% minimum
      const brief = createMockBrief();
      const pricing = createMockPricing({ totalPrice: 500 });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      // Micro tier minimum is 65%, so 500 * 0.65 = 325
      expect(result.pushBack.minimumRate).toBe(325);
      expect(result.pushBack.minimumRatePercentage).toBe(65);
    });

    it("includes walk-away point guidance", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.pushBack.walkAwayPoint).toBeTruthy();
      expect(result.pushBack.walkAwayPoint.length).toBeGreaterThan(50);
    });

    it("includes negotiation levers", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.pushBack.negotiationLevers.length).toBeGreaterThanOrEqual(3);
    });

    it("includes usage rights counter-offer when applicable", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        usageRights: { durationDays: 90, exclusivity: "category", paidAmplification: false },
      });
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const usageRightsScript = result.pushBack.counterOfferScripts.find(
        (s) => s.concession?.includes("usage") || s.script.includes("usage")
      );
      expect(usageRightsScript).toBeDefined();
    });

    it("includes quantity reduction counter-offer for multi-deliverable deals", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing({ quantity: 3, pricePerDeliverable: 400, totalPrice: 1200 });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const quantityScript = result.pushBack.counterOfferScripts.find(
        (s) => s.concession?.includes("deliverable") || s.script.includes("Instead of")
      );
      expect(quantityScript).toBeDefined();
    });
  });

  // ==========================================================================
  // QUICK RESPONSE SECTION TESTS
  // ==========================================================================

  describe("quickResponse section", () => {
    it("includes greeting with brand name", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({ brand: { name: "Acme Corp", industry: "tech", product: "Software" } });
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.quickResponse.greeting).toContain("Acme Corp");
    });

    it("includes rate statement with correct amount", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing({ totalPrice: 750, currencySymbol: "$" });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.quickResponse.rateStatement).toContain("$750");
    });

    it("includes full message with all parts", () => {
      const profile = createMockProfile({ displayName: "Test Creator" });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      const fullMessage = result.quickResponse.fullMessage;
      expect(fullMessage).toContain(result.quickResponse.greeting);
      expect(fullMessage).toContain("Test Creator"); // Creator's name at the end
      expect(fullMessage.length).toBeGreaterThan(200);
    });

    it("includes platform and format in rate statement", () => {
      const profile = createMockProfile();
      const brief = createMockBrief({
        content: { platform: "tiktok", format: "video", quantity: 1, creativeDirection: "Test" },
      });
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.quickResponse.rateStatement).toMatch(/TikTok|Video/i);
    });

    it("includes closing CTA", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.quickResponse.closingCTA).toBeTruthy();
      expect(result.quickResponse.closingCTA.length).toBeGreaterThan(20);
    });
  });

  // ==========================================================================
  // HELPER FUNCTION TESTS
  // ==========================================================================

  describe("getMinimumAcceptableRate", () => {
    it("returns correct minimum for nano tier", () => {
      const result = getMinimumAcceptableRate("nano", 1000);
      expect(result).toBe(600); // 60%
    });

    it("returns correct minimum for micro tier", () => {
      const result = getMinimumAcceptableRate("micro", 1000);
      expect(result).toBe(650); // 65%
    });

    it("returns correct minimum for mid tier", () => {
      const result = getMinimumAcceptableRate("mid", 1000);
      expect(result).toBe(700); // 70%
    });

    it("returns correct minimum for macro tier", () => {
      const result = getMinimumAcceptableRate("macro", 1000);
      expect(result).toBe(800); // 80%
    });

    it("returns correct minimum for celebrity tier", () => {
      const result = getMinimumAcceptableRate("celebrity", 10000);
      expect(result).toBe(9000); // 90%
    });
  });

  describe("getMarketBenchmark", () => {
    it("returns correct benchmark for nano tier", () => {
      expect(getMarketBenchmark("nano")).toBe(150);
    });

    it("returns correct benchmark for micro tier", () => {
      expect(getMarketBenchmark("micro")).toBe(400);
    });

    it("returns correct benchmark for mid tier", () => {
      expect(getMarketBenchmark("mid")).toBe(800);
    });

    it("returns correct benchmark for rising tier", () => {
      expect(getMarketBenchmark("rising")).toBe(1500);
    });

    it("returns correct benchmark for macro tier", () => {
      expect(getMarketBenchmark("macro")).toBe(3000);
    });

    it("returns correct benchmark for mega tier", () => {
      expect(getMarketBenchmark("mega")).toBe(6000);
    });

    it("returns correct benchmark for celebrity tier", () => {
      expect(getMarketBenchmark("celebrity")).toBe(12000);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("handles creator with single niche", () => {
      const profile = createMockProfile({ niches: ["tech"] });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.whyThisRate.bulletPoints.some((p) => p.point.includes("tech"))).toBe(true);
    });

    it("handles creator with no niches", () => {
      const profile = createMockProfile({ niches: [] });
      const brief = createMockBrief();
      const pricing = createMockPricing();

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      // Should not throw, should have default content
      expect(result.whyThisRate.bulletPoints.length).toBeGreaterThan(0);
    });

    it("handles single deliverable (no quantity reduction offer)", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing({ quantity: 1 });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      // Should still have at least 2 counter-offers (usage rights and general)
      expect(result.pushBack.counterOfferScripts.length).toBeGreaterThanOrEqual(2);
    });

    it("handles celebrity tier with high minimum rate", () => {
      const profile = createMockProfile({ tier: "celebrity" });
      const brief = createMockBrief();
      const pricing = createMockPricing({ totalPrice: 15000 });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      // Celebrity minimum is 90%, so 15000 * 0.9 = 13500
      expect(result.pushBack.minimumRate).toBe(13500);
      expect(result.pushBack.minimumRatePercentage).toBe(90);
    });

    it("handles different currencies", () => {
      const profile = createMockProfile();
      const brief = createMockBrief();
      const pricing = createMockPricing({ currencySymbol: "£", currency: "GBP" });

      const result = generateNegotiationTalkingPoints(pricing, profile, brief);

      expect(result.quickResponse.rateStatement).toContain("£");
    });
  });
});
