import { describe, it, expect } from "vitest";
import { calculateTier, calculatePrice, getNichePremium, calculateUGCPrice, getWhitelistingPremium } from "@/lib/pricing-engine";
import type { CreatorProfile, ParsedBrief, FitScoreResult } from "@/lib/types";

describe("pricing-engine", () => {
  describe("calculateTier", () => {
    // ==========================================================================
    // Tier: Nano (1K-10K followers) - $150 base rate
    // ==========================================================================
    describe("nano tier (1K-10K followers)", () => {
      it("returns nano for followers < 10K", () => {
        expect(calculateTier(1000)).toBe("nano");
        expect(calculateTier(5000)).toBe("nano");
        expect(calculateTier(9999)).toBe("nano");
      });

      it("returns nano at lower boundary", () => {
        expect(calculateTier(1)).toBe("nano");
        expect(calculateTier(999)).toBe("nano");
      });

      it("returns nano just below 10K boundary", () => {
        expect(calculateTier(9999)).toBe("nano");
      });
    });

    // ==========================================================================
    // Tier: Micro (10K-50K followers) - $400 base rate
    // ==========================================================================
    describe("micro tier (10K-50K followers)", () => {
      it("returns micro for followers 10K-50K", () => {
        expect(calculateTier(10000)).toBe("micro");
        expect(calculateTier(25000)).toBe("micro");
        expect(calculateTier(49999)).toBe("micro");
      });

      it("returns micro at exact 10K boundary", () => {
        expect(calculateTier(10000)).toBe("micro");
      });

      it("returns micro just below 50K boundary", () => {
        expect(calculateTier(49999)).toBe("micro");
      });
    });

    // ==========================================================================
    // Tier: Mid (50K-100K followers) - $800 base rate
    // ==========================================================================
    describe("mid tier (50K-100K followers)", () => {
      it("returns mid for followers 50K-100K", () => {
        expect(calculateTier(50000)).toBe("mid");
        expect(calculateTier(75000)).toBe("mid");
        expect(calculateTier(99999)).toBe("mid");
      });

      it("returns mid at exact 50K boundary", () => {
        expect(calculateTier(50000)).toBe("mid");
      });

      it("returns mid just below 100K boundary", () => {
        expect(calculateTier(99999)).toBe("mid");
      });
    });

    // ==========================================================================
    // Tier: Rising (100K-250K followers) - $1,500 base rate
    // ==========================================================================
    describe("rising tier (100K-250K followers)", () => {
      it("returns rising for followers 100K-250K", () => {
        expect(calculateTier(100000)).toBe("rising");
        expect(calculateTier(150000)).toBe("rising");
        expect(calculateTier(249999)).toBe("rising");
      });

      it("returns rising at exact 100K boundary", () => {
        expect(calculateTier(100000)).toBe("rising");
      });

      it("returns rising just below 250K boundary", () => {
        expect(calculateTier(249999)).toBe("rising");
      });
    });

    // ==========================================================================
    // Tier: Macro (250K-500K followers) - $3,000 base rate
    // ==========================================================================
    describe("macro tier (250K-500K followers)", () => {
      it("returns macro for followers 250K-500K", () => {
        expect(calculateTier(250000)).toBe("macro");
        expect(calculateTier(350000)).toBe("macro");
        expect(calculateTier(499999)).toBe("macro");
      });

      it("returns macro at exact 250K boundary", () => {
        expect(calculateTier(250000)).toBe("macro");
      });

      it("returns macro just below 500K boundary", () => {
        expect(calculateTier(499999)).toBe("macro");
      });
    });

    // ==========================================================================
    // Tier: Mega (500K-1M followers) - $6,000 base rate
    // ==========================================================================
    describe("mega tier (500K-1M followers)", () => {
      it("returns mega for followers 500K-1M", () => {
        expect(calculateTier(500000)).toBe("mega");
        expect(calculateTier(750000)).toBe("mega");
        expect(calculateTier(999999)).toBe("mega");
      });

      it("returns mega at exact 500K boundary", () => {
        expect(calculateTier(500000)).toBe("mega");
      });

      it("returns mega just below 1M boundary", () => {
        expect(calculateTier(999999)).toBe("mega");
      });
    });

    // ==========================================================================
    // Tier: Celebrity (1M+ followers) - $12,000 base rate
    // ==========================================================================
    describe("celebrity tier (1M+ followers)", () => {
      it("returns celebrity for followers 1M+", () => {
        expect(calculateTier(1000000)).toBe("celebrity");
        expect(calculateTier(2000000)).toBe("celebrity");
        expect(calculateTier(10000000)).toBe("celebrity");
      });

      it("returns celebrity at exact 1M boundary", () => {
        expect(calculateTier(1000000)).toBe("celebrity");
      });

      it("returns celebrity for very large follower counts", () => {
        expect(calculateTier(50000000)).toBe("celebrity");
        expect(calculateTier(100000000)).toBe("celebrity");
      });
    });

    // ==========================================================================
    // Edge Cases - All Tier Boundaries
    // ==========================================================================
    describe("tier boundary edge cases", () => {
      it("handles exact tier boundaries correctly", () => {
        // Each boundary should return the higher tier
        expect(calculateTier(10000)).toBe("micro"); // 10K = micro, not nano
        expect(calculateTier(50000)).toBe("mid"); // 50K = mid, not micro
        expect(calculateTier(100000)).toBe("rising"); // 100K = rising, not mid
        expect(calculateTier(250000)).toBe("macro"); // 250K = macro, not rising
        expect(calculateTier(500000)).toBe("mega"); // 500K = mega, not macro
        expect(calculateTier(1000000)).toBe("celebrity"); // 1M = celebrity, not mega
      });

      it("handles one-below-boundary correctly", () => {
        expect(calculateTier(9999)).toBe("nano");
        expect(calculateTier(49999)).toBe("micro");
        expect(calculateTier(99999)).toBe("mid");
        expect(calculateTier(249999)).toBe("rising");
        expect(calculateTier(499999)).toBe("macro");
        expect(calculateTier(999999)).toBe("mega");
      });
    });
  });

  // ============================================================================
  // getNichePremium Tests
  // ============================================================================
  describe("getNichePremium", () => {
    describe("high-value niches (2.0x)", () => {
      it("returns 2.0x for finance", () => {
        expect(getNichePremium("finance")).toBe(2.0);
        expect(getNichePremium("Finance")).toBe(2.0);
        expect(getNichePremium("FINANCE")).toBe(2.0);
      });

      it("returns 2.0x for investing", () => {
        expect(getNichePremium("investing")).toBe(2.0);
      });
    });

    describe("high-value niches (1.8x)", () => {
      it("returns 1.8x for B2B/Business", () => {
        expect(getNichePremium("b2b")).toBe(1.8);
        expect(getNichePremium("business")).toBe(1.8);
      });
    });

    describe("high-value niches (1.7x)", () => {
      it("returns 1.7x for Tech/Software", () => {
        expect(getNichePremium("tech")).toBe(1.7);
        expect(getNichePremium("software")).toBe(1.7);
        expect(getNichePremium("technology")).toBe(1.7);
      });

      it("returns 1.7x for Legal/Medical", () => {
        expect(getNichePremium("legal")).toBe(1.7);
        expect(getNichePremium("medical")).toBe(1.7);
        expect(getNichePremium("healthcare")).toBe(1.7);
      });
    });

    describe("high-value niches (1.5x)", () => {
      it("returns 1.5x for Luxury/High-end Fashion", () => {
        expect(getNichePremium("luxury")).toBe(1.5);
        expect(getNichePremium("high-end fashion")).toBe(1.5);
      });
    });

    describe("premium niches (1.3x)", () => {
      it("returns 1.3x for Beauty/Skincare", () => {
        expect(getNichePremium("beauty")).toBe(1.3);
        expect(getNichePremium("skincare")).toBe(1.3);
        expect(getNichePremium("cosmetics")).toBe(1.3);
      });
    });

    describe("premium niches (1.2x)", () => {
      it("returns 1.2x for Fitness/Wellness", () => {
        expect(getNichePremium("fitness")).toBe(1.2);
        expect(getNichePremium("wellness")).toBe(1.2);
        expect(getNichePremium("health")).toBe(1.2);
      });
    });

    describe("standard niches (1.15x)", () => {
      it("returns 1.15x for Food/Cooking", () => {
        expect(getNichePremium("food")).toBe(1.15);
        expect(getNichePremium("cooking")).toBe(1.15);
        expect(getNichePremium("recipes")).toBe(1.15);
      });

      it("returns 1.15x for Travel", () => {
        expect(getNichePremium("travel")).toBe(1.15);
      });
    });

    describe("standard niches (1.1x)", () => {
      it("returns 1.1x for Parenting/Family", () => {
        expect(getNichePremium("parenting")).toBe(1.1);
        expect(getNichePremium("family")).toBe(1.1);
        expect(getNichePremium("motherhood")).toBe(1.1);
      });
    });

    describe("baseline niches (1.0x)", () => {
      it("returns 1.0x for Lifestyle", () => {
        expect(getNichePremium("lifestyle")).toBe(1.0);
      });

      it("returns 1.0x for Entertainment/Comedy", () => {
        expect(getNichePremium("entertainment")).toBe(1.0);
        expect(getNichePremium("comedy")).toBe(1.0);
        expect(getNichePremium("music")).toBe(1.0);
      });
    });

    describe("below baseline niches (0.95x)", () => {
      it("returns 0.95x for Gaming", () => {
        expect(getNichePremium("gaming")).toBe(0.95);
        expect(getNichePremium("esports")).toBe(0.95);
      });
    });

    describe("unknown niches", () => {
      it("returns 1.0x (default) for unknown niches", () => {
        expect(getNichePremium("unknown")).toBe(1.0);
        expect(getNichePremium("random")).toBe(1.0);
        expect(getNichePremium("notarealcategory")).toBe(1.0);
        expect(getNichePremium("")).toBe(1.0);
      });

      it("handles case insensitivity", () => {
        expect(getNichePremium("FINANCE")).toBe(2.0);
        expect(getNichePremium("Finance")).toBe(2.0);
        expect(getNichePremium("fInAnCe")).toBe(2.0);
      });

      it("handles whitespace", () => {
        expect(getNichePremium("  finance  ")).toBe(2.0);
        expect(getNichePremium("  beauty  ")).toBe(1.3);
      });
    });
  });

  // ============================================================================
  // getWhitelistingPremium Tests
  // ============================================================================
  describe("getWhitelistingPremium", () => {
    describe("all whitelisting types return correct premiums", () => {
      it("returns 0% (0.0) for none", () => {
        expect(getWhitelistingPremium("none")).toBe(0);
      });

      it("returns +50% (0.5) for organic", () => {
        expect(getWhitelistingPremium("organic")).toBe(0.5);
      });

      it("returns +100% (1.0) for paid_social", () => {
        expect(getWhitelistingPremium("paid_social")).toBe(1.0);
      });

      it("returns +200% (2.0) for full_media", () => {
        expect(getWhitelistingPremium("full_media")).toBe(2.0);
      });
    });

    describe("default handling", () => {
      it("returns 0% for undefined", () => {
        expect(getWhitelistingPremium(undefined)).toBe(0);
      });

      it("returns 0% for empty string", () => {
        expect(getWhitelistingPremium("")).toBe(0);
      });

      it("returns 0% for unknown type", () => {
        expect(getWhitelistingPremium("unknown")).toBe(0);
        expect(getWhitelistingPremium("random")).toBe(0);
      });
    });

    describe("case handling", () => {
      it("handles different cases", () => {
        expect(getWhitelistingPremium("ORGANIC")).toBe(0.5);
        expect(getWhitelistingPremium("Paid_Social")).toBe(1.0);
        expect(getWhitelistingPremium("FULL_MEDIA")).toBe(2.0);
      });

      it("handles whitespace", () => {
        expect(getWhitelistingPremium("  organic  ")).toBe(0.5);
        expect(getWhitelistingPremium("  paid_social  ")).toBe(1.0);
      });
    });
  });

  describe("calculatePrice", () => {
    // Helper function to create a mock profile with specific tier and niches
    function createMockProfile(
      tier: "nano" | "micro" | "mid" | "rising" | "macro" | "mega" | "celebrity",
      followers: number,
      engagementRate: number = 4.5,
      niches: string[] = ["lifestyle", "fashion"]
    ): CreatorProfile {
      return {
        id: "test-1",
        userId: "user-1",
        displayName: "Test Creator",
        handle: "testcreator",
        bio: "Test bio",
        location: "United States",
        niches,
        instagram: {
          followers,
          engagementRate,
          avgLikes: Math.round(followers * engagementRate / 100),
          avgComments: 50,
          avgViews: followers * 0.2,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 30, female: 65, other: 5 },
          topLocations: ["United States", "United Kingdom"],
          interests: ["fashion", "lifestyle"],
        },
        tier,
        totalReach: followers,
        avgEngagementRate: engagementRate,
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const mockBrief: ParsedBrief = {
      brand: {
        name: "Test Brand",
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
        creativeDirection: "Showcase product in lifestyle setting",
      },
      usageRights: {
        durationDays: 30,
        exclusivity: "none",
        paidAmplification: false,
      },
      timeline: {
        deadline: "2 weeks",
      },
      rawText: "Test brief content",
    };

    const mockFitScore: FitScoreResult = {
      totalScore: 75,
      fitLevel: "high",
      priceAdjustment: 0.15,
      breakdown: {
        nicheMatch: { score: 80, weight: 0.3, insight: "Good niche match" },
        demographicMatch: { score: 70, weight: 0.25, insight: "Good demo match" },
        platformMatch: { score: 85, weight: 0.2, insight: "Strong platform" },
        engagementQuality: { score: 75, weight: 0.15, insight: "Above average" },
        contentCapability: { score: 60, weight: 0.1, insight: "Capable" },
      },
      insights: ["Good fit overall"],
    };

    it("calculates price with all 8 layers (including niche premium and whitelisting)", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.layers).toHaveLength(8);
      expect(result.layers[0].name).toBe("Base Rate");
      expect(result.layers[1].name).toBe("Engagement Multiplier");
      expect(result.layers[2].name).toBe("Niche Premium");
      expect(result.layers[3].name).toBe("Format Premium");
      expect(result.layers[4].name).toBe("Fit Score");
      expect(result.layers[5].name).toBe("Usage Rights");
      expect(result.layers[6].name).toBe("Whitelisting");
      expect(result.layers[7].name).toBe("Complexity");
    });

    it("returns price per deliverable and total", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.pricePerDeliverable).toBeGreaterThan(0);
      expect(result.totalPrice).toBe(result.pricePerDeliverable * mockBrief.content.quantity);
    });

    // ==========================================================================
    // Base Rate Tests for Each Tier (2025 Industry Standards)
    // ==========================================================================
    describe("base rates by tier (2025 standards)", () => {
      it("applies nano tier base rate of $150", () => {
        const mockProfile = createMockProfile("nano", 5000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(150);
      });

      it("applies micro tier base rate of $400", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(400);
      });

      it("applies mid tier base rate of $800", () => {
        const mockProfile = createMockProfile("mid", 75000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(800);
      });

      it("applies rising tier base rate of $1,500", () => {
        const mockProfile = createMockProfile("rising", 150000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(1500);
      });

      it("applies macro tier base rate of $3,000", () => {
        const mockProfile = createMockProfile("macro", 350000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(3000);
      });

      it("applies mega tier base rate of $6,000", () => {
        const mockProfile = createMockProfile("mega", 750000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(6000);
      });

      it("applies celebrity tier base rate of $12,000", () => {
        const mockProfile = createMockProfile("celebrity", 2000000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);
        expect(result.layers[0].adjustment).toBe(12000);
      });
    });

    // ==========================================================================
    // Niche Premium Integration Tests
    // ==========================================================================
    describe("niche premium integration", () => {
      it("applies niche premium multiplier to price calculation", () => {
        const financeProfile = createMockProfile("micro", 25000, 4.5, ["finance"]);
        const lifestyleProfile = createMockProfile("micro", 25000, 4.5, ["lifestyle"]);

        const financeResult = calculatePrice(financeProfile, mockBrief, mockFitScore);
        const lifestyleResult = calculatePrice(lifestyleProfile, mockBrief, mockFitScore);

        // Finance (2.0x) should produce higher price than lifestyle (1.0x)
        expect(financeResult.pricePerDeliverable).toBeGreaterThan(lifestyleResult.pricePerDeliverable);
      });

      it("uses first niche in array as primary niche", () => {
        const financeFirstProfile = createMockProfile("micro", 25000, 4.5, ["finance", "lifestyle"]);
        const lifestyleFirstProfile = createMockProfile("micro", 25000, 4.5, ["lifestyle", "finance"]);

        const financeFirstResult = calculatePrice(financeFirstProfile, mockBrief, mockFitScore);
        const lifestyleFirstResult = calculatePrice(lifestyleFirstProfile, mockBrief, mockFitScore);

        // Finance first should have higher price
        expect(financeFirstResult.pricePerDeliverable).toBeGreaterThan(lifestyleFirstResult.pricePerDeliverable);
      });

      it("niche premium layer shows correct multiplier", () => {
        const financeProfile = createMockProfile("micro", 25000, 4.5, ["finance"]);
        const result = calculatePrice(financeProfile, mockBrief, mockFitScore);

        const nicheLayer = result.layers.find(l => l.name === "Niche Premium");
        expect(nicheLayer).toBeDefined();
        expect(nicheLayer?.multiplier).toBe(2.0);
      });

      it("defaults to lifestyle (1.0x) for empty niches array", () => {
        const emptyNichesProfile = createMockProfile("micro", 25000, 4.5, []);
        const lifestyleProfile = createMockProfile("micro", 25000, 4.5, ["lifestyle"]);

        const emptyResult = calculatePrice(emptyNichesProfile, mockBrief, mockFitScore);
        const lifestyleResult = calculatePrice(lifestyleProfile, mockBrief, mockFitScore);

        expect(emptyResult.pricePerDeliverable).toBe(lifestyleResult.pricePerDeliverable);
      });

      it("high-value niches significantly increase price", () => {
        const financeProfile = createMockProfile("micro", 25000, 4.5, ["finance"]);
        const gamingProfile = createMockProfile("micro", 25000, 4.5, ["gaming"]);

        const financeResult = calculatePrice(financeProfile, mockBrief, mockFitScore);
        const gamingResult = calculatePrice(gamingProfile, mockBrief, mockFitScore);

        // Finance (2.0x) vs Gaming (0.95x) - should be roughly 2x difference
        const ratio = financeResult.pricePerDeliverable / gamingResult.pricePerDeliverable;
        expect(ratio).toBeGreaterThan(1.9);
        expect(ratio).toBeLessThan(2.2);
      });
    });

    // ==========================================================================
    // Whitelisting Integration Tests
    // ==========================================================================
    describe("whitelisting integration", () => {
      it("whitelisting layer shows correct multiplier for paid_social", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithWhitelisting: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            ...mockBrief.usageRights,
            whitelistingType: "paid_social",
          },
        };

        const result = calculatePrice(mockProfile, briefWithWhitelisting, mockFitScore);

        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");
        expect(whitelistingLayer).toBeDefined();
        expect(whitelistingLayer?.multiplier).toBe(2.0); // 1 + 100%
      });

      it("whitelisting increases price when applied", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefNoWhitelisting: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            ...mockBrief.usageRights,
            whitelistingType: "none",
          },
        };
        const briefWithWhitelisting: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            ...mockBrief.usageRights,
            whitelistingType: "paid_social",
          },
        };

        const noWhitelistingResult = calculatePrice(mockProfile, briefNoWhitelisting, mockFitScore);
        const withWhitelistingResult = calculatePrice(mockProfile, briefWithWhitelisting, mockFitScore);

        // paid_social adds +100%, so price should be significantly higher
        expect(withWhitelistingResult.pricePerDeliverable).toBeGreaterThan(
          noWhitelistingResult.pricePerDeliverable
        );
      });

      it("whitelisting stacks with usage rights", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithBoth: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            durationDays: 90, // 3 months = +45%
            exclusivity: "category", // +30%
            paidAmplification: true,
            whitelistingType: "full_media", // +200%
          },
        };

        const result = calculatePrice(mockProfile, briefWithBoth, mockFitScore);

        // Check both layers exist
        const usageRightsLayer = result.layers.find(l => l.name === "Usage Rights");
        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");

        expect(usageRightsLayer).toBeDefined();
        expect(whitelistingLayer).toBeDefined();

        // Usage rights: 0.45 (duration) + 0.30 (exclusivity) = 0.75 → multiplier 1.75
        expect(usageRightsLayer?.multiplier).toBeCloseTo(1.75, 2);

        // Whitelisting: +200% → multiplier 3.0
        expect(whitelistingLayer?.multiplier).toBe(3.0);
      });

      it("defaults to no whitelisting (0%) when not specified", () => {
        const mockProfile = createMockProfile("micro", 25000);
        // mockBrief doesn't have whitelistingType set
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");
        expect(whitelistingLayer).toBeDefined();
        expect(whitelistingLayer?.multiplier).toBe(1.0); // 1 + 0%
      });

      it("full_media whitelisting triples the portion affected", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithFullMedia: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            ...mockBrief.usageRights,
            whitelistingType: "full_media",
          },
        };

        const result = calculatePrice(mockProfile, briefWithFullMedia, mockFitScore);

        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");
        expect(whitelistingLayer?.multiplier).toBe(3.0); // 1 + 200%
      });

      it("organic whitelisting adds 50% premium", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithOrganic: ParsedBrief = {
          ...mockBrief,
          usageRights: {
            ...mockBrief.usageRights,
            whitelistingType: "organic",
          },
        };

        const result = calculatePrice(mockProfile, briefWithOrganic, mockFitScore);

        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");
        expect(whitelistingLayer?.multiplier).toBe(1.5); // 1 + 50%
      });
    });

    it("rounds price to nearest $5", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.pricePerDeliverable % 5).toBe(0);
    });

    it("includes niche multiplier in formula representation", () => {
      const financeProfile = createMockProfile("micro", 25000, 4.5, ["finance"]);
      const result = calculatePrice(financeProfile, mockBrief, mockFitScore);

      expect(result.formula).toContain("$400");
      expect(result.formula).toContain("2.0"); // Finance multiplier
      expect(result.formula).toContain("×");
    });

    it("sets quote validity to 14 days", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.validDays).toBe(14);
    });

    // ==========================================================================
    // Integration Tests: Tier + Price Calculation
    // ==========================================================================
    describe("tier integration with pricing", () => {
      it("nano tier with standard brief produces reasonable price", () => {
        const mockProfile = createMockProfile("nano", 5000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        // Base rate $150, with multipliers should be in reasonable range
        expect(result.pricePerDeliverable).toBeGreaterThanOrEqual(150);
        expect(result.pricePerDeliverable).toBeLessThanOrEqual(600);
      });

      it("celebrity tier with standard brief produces high price", () => {
        const mockProfile = createMockProfile("celebrity", 2000000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        // Base rate $12,000, with multipliers should be significantly higher
        expect(result.pricePerDeliverable).toBeGreaterThanOrEqual(12000);
        expect(result.pricePerDeliverable).toBeLessThanOrEqual(50000);
      });

      it("price increases with tier", () => {
        const nanoProfile = createMockProfile("nano", 5000);
        const microProfile = createMockProfile("micro", 25000);
        const midProfile = createMockProfile("mid", 75000);
        const risingProfile = createMockProfile("rising", 150000);
        const macroProfile = createMockProfile("macro", 350000);
        const megaProfile = createMockProfile("mega", 750000);
        const celebrityProfile = createMockProfile("celebrity", 2000000);

        const nanoPrice = calculatePrice(nanoProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const microPrice = calculatePrice(microProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const midPrice = calculatePrice(midProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const risingPrice = calculatePrice(risingProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const macroPrice = calculatePrice(macroProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const megaPrice = calculatePrice(megaProfile, mockBrief, mockFitScore).pricePerDeliverable;
        const celebrityPrice = calculatePrice(celebrityProfile, mockBrief, mockFitScore).pricePerDeliverable;

        expect(microPrice).toBeGreaterThan(nanoPrice);
        expect(midPrice).toBeGreaterThan(microPrice);
        expect(risingPrice).toBeGreaterThan(midPrice);
        expect(macroPrice).toBeGreaterThan(risingPrice);
        expect(megaPrice).toBeGreaterThan(macroPrice);
        expect(celebrityPrice).toBeGreaterThan(megaPrice);
      });
    });
  });

  // ============================================================================
  // UGC Pricing Tests
  // ============================================================================
  describe("calculateUGCPrice", () => {
    // Helper function to create a mock profile
    function createMockProfile(
      tier: "nano" | "micro" | "mid" | "rising" | "macro" | "mega" | "celebrity",
      followers: number
    ): CreatorProfile {
      return {
        id: "test-1",
        userId: "user-1",
        displayName: "Test Creator",
        handle: "testcreator",
        bio: "Test bio",
        location: "United States",
        niches: ["lifestyle"],
        instagram: {
          followers,
          engagementRate: 4.5,
          avgLikes: Math.round(followers * 0.045),
          avgComments: 50,
          avgViews: followers * 0.2,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 30, female: 65, other: 5 },
          topLocations: ["United States", "United Kingdom"],
          interests: ["fashion", "lifestyle"],
        },
        tier,
        totalReach: followers,
        avgEngagementRate: 4.5,
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    function createUGCBrief(
      ugcFormat: "video" | "photo",
      durationDays: number = 30,
      exclusivity: "none" | "category" | "full" = "none",
      quantity: number = 1
    ): ParsedBrief {
      return {
        dealType: "ugc",
        ugcFormat,
        brand: {
          name: "Test Brand",
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
          format: "static", // This is ignored for UGC
          quantity,
          creativeDirection: "Product showcase",
        },
        usageRights: {
          durationDays,
          exclusivity,
          paidAmplification: false,
        },
        timeline: {
          deadline: "2 weeks",
        },
        rawText: "UGC brief content",
      };
    }

    // Note: UGC pricing doesn't use fit scores - audience size is irrelevant

    // ==========================================================================
    // UGC Base Rate Tests
    // ==========================================================================
    describe("UGC base rates", () => {
      it("applies $175 base rate for UGC video", () => {
        const profile = createMockProfile("nano", 5000);
        const brief = createUGCBrief("video", 0); // No usage rights to isolate base rate

        const result = calculateUGCPrice(brief, profile);

        expect(result.layers[0].name).toBe("UGC Base Rate");
        expect(result.layers[0].adjustment).toBe(175);
      });

      it("applies $100 base rate for UGC photo", () => {
        const profile = createMockProfile("nano", 5000);
        const brief = createUGCBrief("photo", 0);

        const result = calculateUGCPrice(brief, profile);

        expect(result.layers[0].name).toBe("UGC Base Rate");
        expect(result.layers[0].adjustment).toBe(100);
      });
    });

    // ==========================================================================
    // UGC Ignores Follower Count
    // ==========================================================================
    describe("UGC pricing ignores follower count", () => {
      it("nano and celebrity creators get same UGC price", () => {
        const nanoProfile = createMockProfile("nano", 5000);
        const celebrityProfile = createMockProfile("celebrity", 5000000);
        const brief = createUGCBrief("video");

        const nanoResult = calculateUGCPrice(brief, nanoProfile);
        const celebrityResult = calculateUGCPrice(brief, celebrityProfile);

        // UGC price should be the same regardless of follower count
        expect(nanoResult.pricePerDeliverable).toBe(celebrityResult.pricePerDeliverable);
      });

      it("UGC price is independent of engagement rate", () => {
        const lowEngagementProfile = createMockProfile("micro", 25000);
        lowEngagementProfile.avgEngagementRate = 0.5;

        const highEngagementProfile = createMockProfile("micro", 25000);
        highEngagementProfile.avgEngagementRate = 10.0;

        const brief = createUGCBrief("video");

        const lowResult = calculateUGCPrice(brief, lowEngagementProfile);
        const highResult = calculateUGCPrice(brief, highEngagementProfile);

        expect(lowResult.pricePerDeliverable).toBe(highResult.pricePerDeliverable);
      });
    });

    // ==========================================================================
    // UGC Usage Rights Still Apply
    // ==========================================================================
    describe("UGC usage rights", () => {
      it("applies usage rights premium to UGC price", () => {
        const profile = createMockProfile("micro", 25000);
        const noRightsBrief = createUGCBrief("video", 0, "none");
        const withRightsBrief = createUGCBrief("video", 90, "none"); // 3 months

        const noRightsResult = calculateUGCPrice(noRightsBrief, profile);
        const withRightsResult = calculateUGCPrice(withRightsBrief, profile);

        expect(withRightsResult.pricePerDeliverable).toBeGreaterThan(
          noRightsResult.pricePerDeliverable
        );
      });

      it("applies exclusivity premium to UGC price", () => {
        const profile = createMockProfile("micro", 25000);
        const noExclusivityBrief = createUGCBrief("video", 30, "none");
        const fullExclusivityBrief = createUGCBrief("video", 30, "full");

        const noExclusivityResult = calculateUGCPrice(noExclusivityBrief, profile);
        const fullExclusivityResult = calculateUGCPrice(fullExclusivityBrief, profile);

        expect(fullExclusivityResult.pricePerDeliverable).toBeGreaterThan(
          noExclusivityResult.pricePerDeliverable
        );
      });
    });

    // ==========================================================================
    // UGC Complexity Still Applies
    // ==========================================================================
    describe("UGC complexity", () => {
      it("video UGC has higher complexity than photo UGC", () => {
        const profile = createMockProfile("micro", 25000);
        const photoBrief = createUGCBrief("photo", 30);
        const videoBrief = createUGCBrief("video", 30);

        const photoResult = calculateUGCPrice(photoBrief, profile);
        const videoResult = calculateUGCPrice(videoBrief, profile);

        // Video ($175 base + standard complexity) should be higher than photo ($100 base + simple complexity)
        expect(videoResult.pricePerDeliverable).toBeGreaterThan(
          photoResult.pricePerDeliverable
        );
      });
    });

    // ==========================================================================
    // UGC Has 4 Layers (Base, Usage Rights, Whitelisting, Complexity)
    // ==========================================================================
    describe("UGC layer structure", () => {
      it("UGC pricing has exactly 4 layers", () => {
        const profile = createMockProfile("micro", 25000);
        const brief = createUGCBrief("video");

        const result = calculateUGCPrice(brief, profile);

        expect(result.layers).toHaveLength(4);
        expect(result.layers[0].name).toBe("UGC Base Rate");
        expect(result.layers[1].name).toBe("Usage Rights");
        expect(result.layers[2].name).toBe("Whitelisting");
        expect(result.layers[3].name).toBe("Complexity");
      });
    });

    // ==========================================================================
    // UGC Whitelisting Tests
    // ==========================================================================
    describe("UGC whitelisting", () => {
      it("applies whitelisting premium to UGC price", () => {
        const profile = createMockProfile("micro", 25000);
        const noWhitelistingBrief = createUGCBrief("video", 30, "none", 1);
        const withWhitelistingBrief: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          usageRights: {
            durationDays: 30,
            exclusivity: "none",
            paidAmplification: false,
            whitelistingType: "paid_social",
          },
        };

        const noWhitelistingResult = calculateUGCPrice(noWhitelistingBrief, profile);
        const withWhitelistingResult = calculateUGCPrice(withWhitelistingBrief, profile);

        expect(withWhitelistingResult.pricePerDeliverable).toBeGreaterThan(
          noWhitelistingResult.pricePerDeliverable
        );
      });

      it("UGC whitelisting shows correct multiplier", () => {
        const profile = createMockProfile("micro", 25000);
        const briefWithWhitelisting: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          usageRights: {
            durationDays: 30,
            exclusivity: "none",
            paidAmplification: false,
            whitelistingType: "full_media",
          },
        };

        const result = calculateUGCPrice(briefWithWhitelisting, profile);

        const whitelistingLayer = result.layers.find(l => l.name === "Whitelisting");
        expect(whitelistingLayer).toBeDefined();
        expect(whitelistingLayer?.multiplier).toBe(3.0); // 1 + 200%
      });
    });

    // ==========================================================================
    // UGC Quantity Calculation
    // ==========================================================================
    describe("UGC quantity", () => {
      it("multiplies price by quantity", () => {
        const profile = createMockProfile("micro", 25000);
        const singleBrief = createUGCBrief("video", 30, "none", 1);
        const tripleBrief = createUGCBrief("video", 30, "none", 3);

        const singleResult = calculateUGCPrice(singleBrief, profile);
        const tripleResult = calculateUGCPrice(tripleBrief, profile);

        expect(tripleResult.totalPrice).toBe(singleResult.pricePerDeliverable * 3);
      });
    });
  });

  // ============================================================================
  // calculatePrice routing tests
  // ============================================================================
  describe("calculatePrice routing", () => {
    function createMockProfile(
      tier: "nano" | "micro" | "mid" | "rising" | "macro" | "mega" | "celebrity",
      followers: number
    ): CreatorProfile {
      return {
        id: "test-1",
        userId: "user-1",
        displayName: "Test Creator",
        handle: "testcreator",
        bio: "Test bio",
        location: "United States",
        niches: ["lifestyle"],
        instagram: {
          followers,
          engagementRate: 4.5,
          avgLikes: Math.round(followers * 0.045),
          avgComments: 50,
          avgViews: followers * 0.2,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 30, female: 65, other: 5 },
          topLocations: ["United States", "United Kingdom"],
          interests: ["fashion", "lifestyle"],
        },
        tier,
        totalReach: followers,
        avgEngagementRate: 4.5,
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const mockFitScore: FitScoreResult = {
      totalScore: 75,
      fitLevel: "high",
      priceAdjustment: 0.15,
      breakdown: {
        nicheMatch: { score: 80, weight: 0.3, insight: "Good niche match" },
        demographicMatch: { score: 70, weight: 0.25, insight: "Good demo match" },
        platformMatch: { score: 85, weight: 0.2, insight: "Strong platform" },
        engagementQuality: { score: 75, weight: 0.15, insight: "Above average" },
        contentCapability: { score: 60, weight: 0.1, insight: "Capable" },
      },
      insights: ["Good fit overall"],
    };

    it("routes to UGC pricing when dealType is ugc", () => {
      const profile = createMockProfile("micro", 25000);
      const ugcBrief: ParsedBrief = {
        dealType: "ugc",
        ugcFormat: "video",
        brand: { name: "Test", industry: "fashion", product: "Product" },
        campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
        content: { platform: "instagram", format: "static", quantity: 1, creativeDirection: "Test" },
        usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
        timeline: { deadline: "2 weeks" },
        rawText: "Test",
      };

      const result = calculatePrice(profile, ugcBrief, mockFitScore);

      // UGC has 4 layers (Base, Usage Rights, Whitelisting, Complexity)
      expect(result.layers).toHaveLength(4);
      expect(result.layers[0].name).toBe("UGC Base Rate");
    });

    it("routes to sponsored pricing when dealType is sponsored", () => {
      const profile = createMockProfile("micro", 25000);
      const sponsoredBrief: ParsedBrief = {
        dealType: "sponsored",
        brand: { name: "Test", industry: "fashion", product: "Product" },
        campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
        content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
        usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
        timeline: { deadline: "2 weeks" },
        rawText: "Test",
      };

      const result = calculatePrice(profile, sponsoredBrief, mockFitScore);

      // Sponsored has 8 layers (with Whitelisting)
      expect(result.layers).toHaveLength(8);
      expect(result.layers[0].name).toBe("Base Rate");
    });

    it("defaults to sponsored pricing when dealType is undefined", () => {
      const profile = createMockProfile("micro", 25000);
      const defaultBrief: ParsedBrief = {
        // No dealType specified
        brand: { name: "Test", industry: "fashion", product: "Product" },
        campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
        content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
        usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
        timeline: { deadline: "2 weeks" },
        rawText: "Test",
      };

      const result = calculatePrice(profile, defaultBrief, mockFitScore);

      // Should default to sponsored (8 layers)
      expect(result.layers).toHaveLength(8);
      expect(result.layers[0].name).toBe("Base Rate");
    });

    it("sponsored pricing still works as before", () => {
      const nanoProfile = createMockProfile("nano", 5000);
      const microProfile = createMockProfile("micro", 25000);
      const sponsoredBrief: ParsedBrief = {
        dealType: "sponsored",
        brand: { name: "Test", industry: "fashion", product: "Product" },
        campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
        content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
        usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
        timeline: { deadline: "2 weeks" },
        rawText: "Test",
      };

      const nanoResult = calculatePrice(nanoProfile, sponsoredBrief, mockFitScore);
      const microResult = calculatePrice(microProfile, sponsoredBrief, mockFitScore);

      // Micro should have higher price than nano (audience-based)
      expect(microResult.pricePerDeliverable).toBeGreaterThan(nanoResult.pricePerDeliverable);
    });
  });
});
