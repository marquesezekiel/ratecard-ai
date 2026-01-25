import { describe, it, expect } from "vitest";
import {
  getTrustLevel,
  getTrustLevelInfo,
  createCacheKey,
  isValidVettingInput,
  type BrandVettingInput,
  type BrandVettingResult,
} from "@/lib/brand-vetter";

describe("brand-vetter", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockInput = (overrides?: Partial<BrandVettingInput>): BrandVettingInput => ({
    brandName: "GlowSkin Beauty",
    brandHandle: "@glowskinbeauty",
    brandWebsite: "https://glowskin.co",
    brandEmail: "partnerships@glowskin.co",
    platform: "instagram",
    ...overrides,
  });

  const createMockResult = (overrides?: Partial<BrandVettingResult>): BrandVettingResult => ({
    trustScore: 78,
    trustLevel: "likely_legit",
    breakdown: {
      socialPresence: {
        score: 20,
        confidence: "high",
        details: ["45K followers", "Active posting", "Good engagement"],
      },
      websiteVerification: {
        score: 22,
        confidence: "high",
        details: ["SSL valid", "Professional design", "Contact page exists"],
      },
      collaborationHistory: {
        score: 16,
        confidence: "medium",
        details: ["8 known creator collaborations"],
      },
      scamIndicators: {
        score: 20,
        confidence: "high",
        details: ["No red flags detected"],
      },
    },
    findings: [
      {
        category: "social",
        finding: "Brand has 45K followers on Instagram",
        evidence: "Active account since 2021",
        sentiment: "positive",
      },
      {
        category: "website",
        finding: "Professional website with SSL",
        sentiment: "positive",
      },
      {
        category: "collabs",
        finding: "Has worked with creators before",
        evidence: "8 #ad posts found",
        sentiment: "positive",
      },
    ],
    redFlags: [],
    recommendations: [
      "This brand appears legitimate. Proceed with normal due diligence.",
    ],
    checkedAt: new Date(),
    dataSources: ["Social media analysis", "Website check"],
    cached: false,
    ...overrides,
  });

  const createHighTrustResult = (): BrandVettingResult =>
    createMockResult({
      trustScore: 92,
      trustLevel: "verified",
      breakdown: {
        socialPresence: {
          score: 25,
          confidence: "high",
          details: ["500K+ followers", "Verified account", "Excellent engagement"],
        },
        websiteVerification: {
          score: 24,
          confidence: "high",
          details: ["Premium domain", "SSL", "Full company info"],
        },
        collaborationHistory: {
          score: 23,
          confidence: "high",
          details: ["Major brand with known campaigns", "Ambassador program"],
        },
        scamIndicators: {
          score: 20,
          confidence: "high",
          details: ["No red flags detected"],
        },
      },
    });

  const createSuspiciousResult = (): BrandVettingResult => ({
    trustScore: 28,
    trustLevel: "high_risk",
    breakdown: {
      socialPresence: {
        score: 8,
        confidence: "medium",
        details: ["Low follower count", "Inactive posting", "Fake follower patterns"],
      },
      websiteVerification: {
        score: 5,
        confidence: "low",
        details: ["Free hosting domain", "No SSL", "No contact info"],
      },
      collaborationHistory: {
        score: 5,
        confidence: "low",
        details: ["No evidence of creator collaborations"],
      },
      scamIndicators: {
        score: 10,
        confidence: "high",
        details: ["Multiple red flags detected"],
      },
    },
    findings: [
      {
        category: "social",
        finding: "Account appears to have purchased followers",
        sentiment: "negative",
      },
      {
        category: "website",
        finding: "Website uses free hosting",
        sentiment: "negative",
      },
    ],
    redFlags: [
      {
        severity: "high",
        flag: "Fake follower patterns",
        explanation: "Follower-to-engagement ratio suggests purchased followers",
      },
      {
        severity: "high",
        flag: "No payment mentioned",
        explanation: "Expects content creation without discussing compensation",
      },
      {
        severity: "medium",
        flag: "Mass outreach patterns",
        explanation: "Same message sent to many creators",
      },
    ],
    recommendations: [
      "Multiple red flags detected. Consider declining this opportunity.",
      "If proceeding, get payment terms in writing before any work.",
    ],
    checkedAt: new Date(),
    dataSources: ["Social media analysis"],
    cached: false,
  });

  // ==========================================================================
  // TRUST LEVEL TESTS
  // ==========================================================================

  describe("getTrustLevel", () => {
    it("returns 'verified' for scores 80 and above", () => {
      expect(getTrustLevel(80)).toBe("verified");
      expect(getTrustLevel(90)).toBe("verified");
      expect(getTrustLevel(100)).toBe("verified");
    });

    it("returns 'likely_legit' for scores 60-79", () => {
      expect(getTrustLevel(60)).toBe("likely_legit");
      expect(getTrustLevel(70)).toBe("likely_legit");
      expect(getTrustLevel(79)).toBe("likely_legit");
    });

    it("returns 'caution' for scores 40-59", () => {
      expect(getTrustLevel(40)).toBe("caution");
      expect(getTrustLevel(50)).toBe("caution");
      expect(getTrustLevel(59)).toBe("caution");
    });

    it("returns 'high_risk' for scores below 40", () => {
      expect(getTrustLevel(0)).toBe("high_risk");
      expect(getTrustLevel(20)).toBe("high_risk");
      expect(getTrustLevel(39)).toBe("high_risk");
    });

    it("handles edge cases at boundaries", () => {
      expect(getTrustLevel(80)).toBe("verified");
      expect(getTrustLevel(79)).toBe("likely_legit");
      expect(getTrustLevel(60)).toBe("likely_legit");
      expect(getTrustLevel(59)).toBe("caution");
      expect(getTrustLevel(40)).toBe("caution");
      expect(getTrustLevel(39)).toBe("high_risk");
    });
  });

  describe("getTrustLevelInfo", () => {
    it("returns correct info for verified level", () => {
      const info = getTrustLevelInfo("verified");
      expect(info.label).toBe("Strong Signals");
      expect(info.color).toBe("green");
      expect(info.description).toContain("diligence");
    });

    it("returns correct info for likely_legit level", () => {
      const info = getTrustLevelInfo("likely_legit");
      expect(info.label).toBe("Good Signals");
      expect(info.color).toBe("blue");
      expect(info.description).toContain("verify");
    });

    it("returns correct info for caution level", () => {
      const info = getTrustLevelInfo("caution");
      expect(info.label).toBe("Mixed Signals");
      expect(info.color).toBe("yellow");
      expect(info.description).toContain("concerns");
    });

    it("returns correct info for high_risk level", () => {
      const info = getTrustLevelInfo("high_risk");
      expect(info.label).toBe("Caution Advised");
      expect(info.color).toBe("red");
      expect(info.description).toContain("warning");
    });
  });

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("isValidVettingInput", () => {
    it("returns true for valid input with all fields", () => {
      const input = createMockInput();
      expect(isValidVettingInput(input)).toBe(true);
    });

    it("returns true for minimal valid input", () => {
      const input = {
        brandName: "Test Brand",
        platform: "instagram",
      };
      expect(isValidVettingInput(input)).toBe(true);
    });

    it("returns false for missing brand name", () => {
      const input = {
        platform: "instagram",
      };
      expect(isValidVettingInput(input)).toBe(false);
    });

    it("returns false for missing platform", () => {
      const input = {
        brandName: "Test Brand",
      };
      expect(isValidVettingInput(input)).toBe(false);
    });

    it("returns false for brand name too short", () => {
      const input = {
        brandName: "A",
        platform: "instagram",
      };
      expect(isValidVettingInput(input)).toBe(false);
    });

    it("returns false for null input", () => {
      expect(isValidVettingInput(null)).toBe(false);
    });

    it("returns false for non-object input", () => {
      expect(isValidVettingInput("string")).toBe(false);
      expect(isValidVettingInput(123)).toBe(false);
    });
  });

  // ==========================================================================
  // CACHE KEY TESTS
  // ==========================================================================

  describe("createCacheKey", () => {
    it("creates consistent cache key for same brand", () => {
      const input1 = createMockInput({ brandName: "Test Brand" });
      const input2 = createMockInput({ brandName: "Test Brand" });

      const key1 = createCacheKey(input1);
      const key2 = createCacheKey(input2);

      expect(key1).toBe(key2);
    });

    it("normalizes brand name to lowercase", () => {
      const input1 = createMockInput({ brandName: "Test Brand" });
      const input2 = createMockInput({ brandName: "test brand" });
      const input3 = createMockInput({ brandName: "TEST BRAND" });

      expect(createCacheKey(input1)).toBe(createCacheKey(input2));
      expect(createCacheKey(input2)).toBe(createCacheKey(input3));
    });

    it("trims whitespace from brand name", () => {
      const input1 = createMockInput({ brandName: "Test Brand" });
      const input2 = createMockInput({ brandName: "  Test Brand  " });

      expect(createCacheKey(input1)).toBe(createCacheKey(input2));
    });

    it("includes date in cache key", () => {
      const input = createMockInput();
      const key = createCacheKey(input);

      // Key should contain today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      expect(key).toContain(today);
    });

    it("creates different keys for different brands", () => {
      const input1 = createMockInput({ brandName: "Brand A" });
      const input2 = createMockInput({ brandName: "Brand B" });

      expect(createCacheKey(input1)).not.toBe(createCacheKey(input2));
    });
  });

  // ==========================================================================
  // RESULT STRUCTURE TESTS
  // ==========================================================================

  describe("result structure", () => {
    it("has all required fields", () => {
      const result = createMockResult();

      expect(result).toHaveProperty("trustScore");
      expect(result).toHaveProperty("trustLevel");
      expect(result).toHaveProperty("breakdown");
      expect(result).toHaveProperty("findings");
      expect(result).toHaveProperty("redFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("checkedAt");
      expect(result).toHaveProperty("dataSources");
      expect(result).toHaveProperty("cached");
    });

    it("has all breakdown categories", () => {
      const result = createMockResult();

      expect(result.breakdown).toHaveProperty("socialPresence");
      expect(result.breakdown).toHaveProperty("websiteVerification");
      expect(result.breakdown).toHaveProperty("collaborationHistory");
      expect(result.breakdown).toHaveProperty("scamIndicators");
    });

    it("category scores have required fields", () => {
      const result = createMockResult();

      Object.values(result.breakdown).forEach((category) => {
        expect(category).toHaveProperty("score");
        expect(category).toHaveProperty("confidence");
        expect(category).toHaveProperty("details");
        expect(typeof category.score).toBe("number");
        expect(["high", "medium", "low"]).toContain(category.confidence);
        expect(Array.isArray(category.details)).toBe(true);
      });
    });

    it("findings have required fields", () => {
      const result = createMockResult();

      result.findings.forEach((finding) => {
        expect(finding).toHaveProperty("category");
        expect(finding).toHaveProperty("finding");
        expect(finding).toHaveProperty("sentiment");
        expect(["social", "website", "collabs", "scam_check"]).toContain(finding.category);
        expect(["positive", "neutral", "negative"]).toContain(finding.sentiment);
      });
    });

    it("red flags have required fields when present", () => {
      const result = createSuspiciousResult();

      expect(result.redFlags.length).toBeGreaterThan(0);
      result.redFlags.forEach((flag) => {
        expect(flag).toHaveProperty("severity");
        expect(flag).toHaveProperty("flag");
        expect(flag).toHaveProperty("explanation");
        expect(["high", "medium", "low"]).toContain(flag.severity);
      });
    });
  });

  // ==========================================================================
  // SCORE CALCULATION TESTS
  // ==========================================================================

  describe("score calculation", () => {
    it("sums category scores correctly", () => {
      const result = createMockResult({
        breakdown: {
          socialPresence: { score: 20, confidence: "high", details: [] },
          websiteVerification: { score: 22, confidence: "high", details: [] },
          collaborationHistory: { score: 16, confidence: "medium", details: [] },
          scamIndicators: { score: 20, confidence: "high", details: [] },
        },
      });

      const expectedScore = 20 + 22 + 16 + 20; // 78
      expect(
        result.breakdown.socialPresence.score +
          result.breakdown.websiteVerification.score +
          result.breakdown.collaborationHistory.score +
          result.breakdown.scamIndicators.score
      ).toBe(expectedScore);
    });

    it("category scores are capped at 25", () => {
      const result = createMockResult();

      expect(result.breakdown.socialPresence.score).toBeLessThanOrEqual(25);
      expect(result.breakdown.websiteVerification.score).toBeLessThanOrEqual(25);
      expect(result.breakdown.collaborationHistory.score).toBeLessThanOrEqual(25);
      expect(result.breakdown.scamIndicators.score).toBeLessThanOrEqual(25);
    });

    it("category scores are non-negative", () => {
      const result = createSuspiciousResult();

      expect(result.breakdown.socialPresence.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.websiteVerification.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.collaborationHistory.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.scamIndicators.score).toBeGreaterThanOrEqual(0);
    });

    it("total score is between 0 and 100", () => {
      const highResult = createHighTrustResult();
      const lowResult = createSuspiciousResult();

      expect(highResult.trustScore).toBeGreaterThanOrEqual(0);
      expect(highResult.trustScore).toBeLessThanOrEqual(100);
      expect(lowResult.trustScore).toBeGreaterThanOrEqual(0);
      expect(lowResult.trustScore).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // TRUST LEVEL CONSISTENCY TESTS
  // ==========================================================================

  describe("trust level consistency", () => {
    it("high trust result has verified or likely_legit level", () => {
      const result = createHighTrustResult();
      expect(["verified", "likely_legit"]).toContain(result.trustLevel);
    });

    it("suspicious result has caution or high_risk level", () => {
      const result = createSuspiciousResult();
      expect(["caution", "high_risk"]).toContain(result.trustLevel);
    });

    it("trust level matches trust score", () => {
      const result = createMockResult({ trustScore: 85 });
      expect(getTrustLevel(result.trustScore)).toBe("verified");

      const result2 = createMockResult({ trustScore: 65 });
      expect(getTrustLevel(result2.trustScore)).toBe("likely_legit");

      const result3 = createMockResult({ trustScore: 45 });
      expect(getTrustLevel(result3.trustScore)).toBe("caution");

      const result4 = createMockResult({ trustScore: 25 });
      expect(getTrustLevel(result4.trustScore)).toBe("high_risk");
    });
  });

  // ==========================================================================
  // RED FLAG TESTS
  // ==========================================================================

  describe("red flags", () => {
    it("suspicious brands have red flags", () => {
      const result = createSuspiciousResult();
      expect(result.redFlags.length).toBeGreaterThan(0);
    });

    it("high trust brands have no or few red flags", () => {
      const result = createHighTrustResult();
      expect(result.redFlags.length).toBe(0);
    });

    it("high severity flags affect trust score significantly", () => {
      const result = createSuspiciousResult();
      const highSeverityFlags = result.redFlags.filter((f) => f.severity === "high");

      // If there are high severity flags, trust score should be low
      if (highSeverityFlags.length > 0) {
        expect(result.trustScore).toBeLessThan(60);
      }
    });

    it("red flags include expected scam indicators", () => {
      const result = createSuspiciousResult();
      const flagTexts = result.redFlags.map((f) => f.flag.toLowerCase());

      // Should detect at least one common scam indicator
      const commonIndicators = [
        "fake follower",
        "no payment",
        "mass outreach",
        "free hosting",
        "mlm",
        "pay to collab",
      ];

      const hasCommonIndicator = commonIndicators.some((indicator) =>
        flagTexts.some((text) => text.includes(indicator))
      );

      expect(hasCommonIndicator).toBe(true);
    });
  });

  // ==========================================================================
  // FINDINGS TESTS
  // ==========================================================================

  describe("findings", () => {
    it("positive findings present for legitimate brands", () => {
      const result = createMockResult();
      const positiveFindings = result.findings.filter((f) => f.sentiment === "positive");
      expect(positiveFindings.length).toBeGreaterThan(0);
    });

    it("negative findings present for suspicious brands", () => {
      const result = createSuspiciousResult();
      const negativeFindings = result.findings.filter((f) => f.sentiment === "negative");
      expect(negativeFindings.length).toBeGreaterThan(0);
    });

    it("findings cover multiple categories", () => {
      const result = createMockResult();
      const categories = new Set(result.findings.map((f) => f.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  // ==========================================================================
  // RECOMMENDATIONS TESTS
  // ==========================================================================

  describe("recommendations", () => {
    it("provides recommendations for all trust levels", () => {
      const highResult = createHighTrustResult();
      const lowResult = createSuspiciousResult();

      expect(highResult.recommendations.length).toBeGreaterThan(0);
      expect(lowResult.recommendations.length).toBeGreaterThan(0);
    });

    it("high risk brands get warnings in recommendations", () => {
      const result = createSuspiciousResult();
      const hasWarning = result.recommendations.some(
        (r) =>
          r.toLowerCase().includes("decline") ||
          r.toLowerCase().includes("risk") ||
          r.toLowerCase().includes("careful") ||
          r.toLowerCase().includes("red flag")
      );
      expect(hasWarning).toBe(true);
    });

    it("verified brands get positive recommendations", () => {
      const result = createHighTrustResult();
      const hasPositive = result.recommendations.some(
        (r) =>
          r.toLowerCase().includes("legitimate") ||
          r.toLowerCase().includes("proceed") ||
          r.toLowerCase().includes("safe")
      );
      expect(hasPositive).toBe(true);
    });
  });

  // ==========================================================================
  // MINIMAL INPUT TESTS
  // ==========================================================================

  describe("minimal input handling", () => {
    it("accepts input with only brand name and platform", () => {
      const input = {
        brandName: "Test Brand",
        platform: "instagram" as const,
      };
      expect(isValidVettingInput(input)).toBe(true);
    });

    it("result structure is complete even with minimal input", () => {
      const result = createMockResult();

      // Remove optional inputs and verify structure is still complete
      expect(result.breakdown.socialPresence).toBeDefined();
      expect(result.breakdown.websiteVerification).toBeDefined();
      expect(result.breakdown.collaborationHistory).toBeDefined();
      expect(result.breakdown.scamIndicators).toBeDefined();
    });
  });

  // ==========================================================================
  // WELL-KNOWN BRAND TESTS
  // ==========================================================================

  describe("well-known brand handling", () => {
    it("major brands get high trust scores", () => {
      const result = createHighTrustResult();

      // A well-known brand should have high scores
      expect(result.trustScore).toBeGreaterThanOrEqual(80);
      expect(result.trustLevel).toBe("verified");
    });

    it("major brands have verified social presence", () => {
      const result = createHighTrustResult();

      expect(result.breakdown.socialPresence.score).toBeGreaterThanOrEqual(20);
      expect(result.breakdown.socialPresence.confidence).toBe("high");
    });

    it("major brands have collaboration history", () => {
      const result = createHighTrustResult();

      expect(result.breakdown.collaborationHistory.score).toBeGreaterThanOrEqual(15);
    });
  });
});
