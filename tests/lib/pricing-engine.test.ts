import { describe, it, expect } from "vitest";
import { calculateTier, calculatePrice } from "@/lib/pricing-engine";
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

  describe("calculatePrice", () => {
    // Helper function to create a mock profile with specific tier
    function createMockProfile(
      tier: "nano" | "micro" | "mid" | "rising" | "macro" | "mega" | "celebrity",
      followers: number,
      engagementRate: number = 4.5
    ): CreatorProfile {
      return {
        id: "test-1",
        userId: "user-1",
        displayName: "Test Creator",
        handle: "testcreator",
        bio: "Test bio",
        location: "United States",
        niches: ["lifestyle", "fashion"],
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

    it("calculates price with all 6 layers", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.layers).toHaveLength(6);
      expect(result.layers[0].name).toBe("Base Rate");
      expect(result.layers[1].name).toBe("Engagement Multiplier");
      expect(result.layers[2].name).toBe("Format Premium");
      expect(result.layers[3].name).toBe("Fit Score");
      expect(result.layers[4].name).toBe("Usage Rights");
      expect(result.layers[5].name).toBe("Complexity");
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

    it("rounds price to nearest $5", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.pricePerDeliverable % 5).toBe(0);
    });

    it("includes formula representation", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.formula).toContain("$400");
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
});
