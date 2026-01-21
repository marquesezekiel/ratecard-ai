import { describe, it, expect } from "vitest";
import { calculateTier, calculatePrice } from "@/lib/pricing-engine";
import type { CreatorProfile, ParsedBrief, FitScoreResult } from "@/lib/types";

describe("pricing-engine", () => {
  describe("calculateTier", () => {
    it("returns nano for followers < 10K", () => {
      expect(calculateTier(1000)).toBe("nano");
      expect(calculateTier(5000)).toBe("nano");
      expect(calculateTier(9999)).toBe("nano");
    });

    it("returns micro for followers 10K-50K", () => {
      expect(calculateTier(10000)).toBe("micro");
      expect(calculateTier(25000)).toBe("micro");
      expect(calculateTier(49999)).toBe("micro");
    });

    it("returns mid for followers 50K-500K", () => {
      expect(calculateTier(50000)).toBe("mid");
      expect(calculateTier(100000)).toBe("mid");
      expect(calculateTier(499999)).toBe("mid");
    });

    it("returns macro for followers 500K+", () => {
      expect(calculateTier(500000)).toBe("macro");
      expect(calculateTier(1000000)).toBe("macro");
    });
  });

  describe("calculatePrice", () => {
    const mockProfile: CreatorProfile = {
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
    };

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
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.pricePerDeliverable).toBeGreaterThan(0);
      expect(result.totalPrice).toBe(result.pricePerDeliverable * mockBrief.content.quantity);
    });

    it("applies micro tier base rate of $250", () => {
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.layers[0].adjustment).toBe(250);
    });

    it("rounds price to nearest $5", () => {
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.pricePerDeliverable % 5).toBe(0);
    });

    it("includes formula representation", () => {
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.formula).toContain("$250");
      expect(result.formula).toContain("×");
    });

    it("sets quote validity to 14 days", () => {
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.validDays).toBe(14);
    });
  });
});
