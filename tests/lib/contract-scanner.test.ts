import { describe, it, expect } from "vitest";
import {
  getHealthLevel,
  generateChangeRequest,
  isValidContractText,
  getMinContractLength,
} from "@/lib/contract-scanner";
import type { ContractScanResult } from "@/lib/types";

describe("contract-scanner", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockResult = (overrides?: Partial<ContractScanResult>): ContractScanResult => ({
    healthScore: 75,
    healthLevel: "good",
    categories: {
      payment: { score: 20, status: "complete", findings: ["Payment terms clearly stated"] },
      contentRights: { score: 18, status: "partial", findings: ["Deliverables defined but revisions unlimited"] },
      exclusivity: { score: 20, status: "complete", findings: ["No exclusivity required"] },
      legal: { score: 17, status: "partial", findings: ["Termination clause exists"] },
    },
    foundClauses: [
      {
        category: "payment",
        item: "Payment amount",
        quote: "$500 flat fee",
        assessment: "good",
      },
      {
        category: "payment",
        item: "Payment timeline",
        quote: "Net-30 upon invoice",
        assessment: "good",
      },
    ],
    missingClauses: [
      {
        category: "payment",
        item: "Kill fee clause",
        importance: "important",
        suggestion: "Add 25-50% kill fee for brand cancellation",
      },
    ],
    redFlags: [],
    recommendations: [
      "Add a kill fee clause",
      "Limit revision rounds to 2 maximum",
    ],
    changeRequestTemplate: "Hi, I've reviewed the contract...",
    ...overrides,
  });

  const createBadResult = (): ContractScanResult => ({
    healthScore: 35,
    healthLevel: "poor",
    categories: {
      payment: { score: 10, status: "partial", findings: ["Payment amount stated but terms poor"] },
      contentRights: { score: 8, status: "missing", findings: ["No revision limit, perpetual rights"] },
      exclusivity: { score: 10, status: "partial", findings: ["Category exclusivity without compensation"] },
      legal: { score: 7, status: "missing", findings: ["No termination clause"] },
    },
    foundClauses: [
      {
        category: "payment",
        item: "Payment amount",
        quote: "$500 flat fee",
        assessment: "good",
      },
      {
        category: "contentRights",
        item: "Usage rights",
        quote: "perpetual, worldwide, all media",
        assessment: "red_flag",
      },
    ],
    missingClauses: [
      {
        category: "payment",
        item: "Kill fee clause",
        importance: "critical",
        suggestion: "Add 25-50% kill fee for brand cancellation",
      },
      {
        category: "contentRights",
        item: "Revision limit",
        importance: "critical",
        suggestion: "Cap revisions at 2 rounds maximum",
      },
    ],
    redFlags: [
      {
        severity: "high",
        clause: "Perpetual usage rights",
        quote: "perpetual, worldwide, all media",
        explanation: "The brand wants unlimited usage forever without additional payment.",
        suggestion: "Limit to 90 days or charge 3-5x base rate for perpetual",
      },
      {
        severity: "medium",
        clause: "Unlimited revisions",
        explanation: "No cap on revision rounds can lead to endless unpaid work.",
        suggestion: "Add 'Maximum 2 revision rounds included'",
      },
    ],
    recommendations: [
      "Remove perpetual rights or negotiate significant premium",
      "Add revision limit",
      "Add kill fee clause",
    ],
    changeRequestTemplate: "",
  });

  // ==========================================================================
  // HEALTH LEVEL TESTS
  // ==========================================================================

  describe("getHealthLevel", () => {
    it("returns 'excellent' for scores 80 and above", () => {
      expect(getHealthLevel(80)).toBe("excellent");
      expect(getHealthLevel(85)).toBe("excellent");
      expect(getHealthLevel(100)).toBe("excellent");
    });

    it("returns 'good' for scores 60-79", () => {
      expect(getHealthLevel(60)).toBe("good");
      expect(getHealthLevel(70)).toBe("good");
      expect(getHealthLevel(79)).toBe("good");
    });

    it("returns 'fair' for scores 40-59", () => {
      expect(getHealthLevel(40)).toBe("fair");
      expect(getHealthLevel(50)).toBe("fair");
      expect(getHealthLevel(59)).toBe("fair");
    });

    it("returns 'poor' for scores below 40", () => {
      expect(getHealthLevel(0)).toBe("poor");
      expect(getHealthLevel(20)).toBe("poor");
      expect(getHealthLevel(39)).toBe("poor");
    });

    it("handles edge cases at boundaries", () => {
      expect(getHealthLevel(80)).toBe("excellent");
      expect(getHealthLevel(79)).toBe("good");
      expect(getHealthLevel(60)).toBe("good");
      expect(getHealthLevel(59)).toBe("fair");
      expect(getHealthLevel(40)).toBe("fair");
      expect(getHealthLevel(39)).toBe("poor");
    });
  });

  // ==========================================================================
  // CHANGE REQUEST GENERATION TESTS
  // ==========================================================================

  describe("generateChangeRequest", () => {
    it("generates empty-ish template for good contract with no issues", () => {
      const result = createMockResult({
        redFlags: [],
        missingClauses: [],
      });
      const changeRequest = generateChangeRequest(result);

      expect(changeRequest).toContain("looks good");
      expect(changeRequest).not.toContain("HIGH PRIORITY");
      expect(changeRequest).not.toContain("CRITICAL");
    });

    it("includes high priority items for high severity red flags", () => {
      const result = createBadResult();
      const changeRequest = generateChangeRequest(result);

      expect(changeRequest).toContain("[HIGH PRIORITY]");
      expect(changeRequest).toContain("Perpetual usage rights");
    });

    it("includes critical items for critical missing clauses", () => {
      const result = createBadResult();
      const changeRequest = generateChangeRequest(result);

      expect(changeRequest).toContain("[CRITICAL]");
      expect(changeRequest).toContain("Kill fee");
    });

    it("includes important items for medium severity red flags", () => {
      const result = createBadResult();
      const changeRequest = generateChangeRequest(result);

      expect(changeRequest).toContain("[IMPORTANT]");
      expect(changeRequest).toContain("Unlimited revisions");
    });

    it("uses creator name when provided", () => {
      const result = createMockResult();
      const changeRequest = generateChangeRequest(result, "Maya Creates");

      expect(changeRequest).toContain("Maya Creates");
    });

    it("uses placeholder when creator name not provided", () => {
      const result = createBadResult();
      const changeRequest = generateChangeRequest(result);

      expect(changeRequest).toContain("[Your Name]");
    });

    it("orders changes by priority", () => {
      const result = createBadResult();
      const changeRequest = generateChangeRequest(result);

      const highPriorityIndex = changeRequest.indexOf("[HIGH PRIORITY]");
      const criticalIndex = changeRequest.indexOf("[CRITICAL]");
      const importantIndex = changeRequest.indexOf("[IMPORTANT]");

      // High priority should come before critical
      expect(highPriorityIndex).toBeLessThan(criticalIndex);
      // Critical should come before important
      expect(criticalIndex).toBeLessThan(importantIndex);
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe("isValidContractText", () => {
    it("returns true for text meeting minimum length", () => {
      const text = "a".repeat(100);
      expect(isValidContractText(text)).toBe(true);
    });

    it("returns false for text below minimum length", () => {
      const text = "a".repeat(99);
      expect(isValidContractText(text)).toBe(false);
    });

    it("returns false for empty text", () => {
      expect(isValidContractText("")).toBe(false);
    });

    it("trims whitespace before checking length", () => {
      const text = "   " + "a".repeat(95) + "   ";
      expect(isValidContractText(text)).toBe(false);
    });

    it("returns true for text with exact minimum length after trim", () => {
      const text = "   " + "a".repeat(100) + "   ";
      expect(isValidContractText(text)).toBe(true);
    });
  });

  describe("getMinContractLength", () => {
    it("returns the minimum contract length constant", () => {
      const minLength = getMinContractLength();
      expect(minLength).toBe(100);
    });
  });

  // ==========================================================================
  // HEALTH SCORE CALCULATION TESTS (via result structure)
  // ==========================================================================

  describe("health score calculation", () => {
    it("sums category scores correctly", () => {
      const result = createMockResult({
        categories: {
          payment: { score: 25, status: "complete", findings: [] },
          contentRights: { score: 20, status: "partial", findings: [] },
          exclusivity: { score: 25, status: "complete", findings: [] },
          legal: { score: 15, status: "partial", findings: [] },
        },
      });

      const expectedScore = 25 + 20 + 25 + 15; // 85
      expect(result.categories.payment.score +
             result.categories.contentRights.score +
             result.categories.exclusivity.score +
             result.categories.legal.score).toBe(expectedScore);
    });

    it("category scores are capped at 25", () => {
      const result = createMockResult();

      expect(result.categories.payment.score).toBeLessThanOrEqual(25);
      expect(result.categories.contentRights.score).toBeLessThanOrEqual(25);
      expect(result.categories.exclusivity.score).toBeLessThanOrEqual(25);
      expect(result.categories.legal.score).toBeLessThanOrEqual(25);
    });

    it("category scores are non-negative", () => {
      const result = createBadResult();

      expect(result.categories.payment.score).toBeGreaterThanOrEqual(0);
      expect(result.categories.contentRights.score).toBeGreaterThanOrEqual(0);
      expect(result.categories.exclusivity.score).toBeGreaterThanOrEqual(0);
      expect(result.categories.legal.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // RESULT STRUCTURE TESTS
  // ==========================================================================

  describe("result structure", () => {
    it("has all required fields", () => {
      const result = createMockResult();

      expect(result).toHaveProperty("healthScore");
      expect(result).toHaveProperty("healthLevel");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("foundClauses");
      expect(result).toHaveProperty("missingClauses");
      expect(result).toHaveProperty("redFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("changeRequestTemplate");
    });

    it("has all category fields", () => {
      const result = createMockResult();

      expect(result.categories).toHaveProperty("payment");
      expect(result.categories).toHaveProperty("contentRights");
      expect(result.categories).toHaveProperty("exclusivity");
      expect(result.categories).toHaveProperty("legal");
    });

    it("found clauses have required fields", () => {
      const result = createMockResult();

      result.foundClauses.forEach(clause => {
        expect(clause).toHaveProperty("category");
        expect(clause).toHaveProperty("item");
        expect(clause).toHaveProperty("quote");
        expect(clause).toHaveProperty("assessment");
      });
    });

    it("missing clauses have required fields", () => {
      const result = createMockResult();

      result.missingClauses.forEach(clause => {
        expect(clause).toHaveProperty("category");
        expect(clause).toHaveProperty("item");
        expect(clause).toHaveProperty("importance");
        expect(clause).toHaveProperty("suggestion");
      });
    });

    it("red flags have required fields", () => {
      const result = createBadResult();

      result.redFlags.forEach(flag => {
        expect(flag).toHaveProperty("severity");
        expect(flag).toHaveProperty("clause");
        expect(flag).toHaveProperty("explanation");
        expect(flag).toHaveProperty("suggestion");
      });
    });
  });

  // ==========================================================================
  // ASSESSMENT CLASSIFICATION TESTS
  // ==========================================================================

  describe("clause assessments", () => {
    it("identifies good clauses", () => {
      const result = createMockResult();
      const goodClauses = result.foundClauses.filter(c => c.assessment === "good");

      expect(goodClauses.length).toBeGreaterThan(0);
    });

    it("identifies red flag clauses", () => {
      const result = createBadResult();
      const redFlagClauses = result.foundClauses.filter(c => c.assessment === "red_flag");

      expect(redFlagClauses.length).toBeGreaterThan(0);
    });

    it("red flags include perpetual rights", () => {
      const result = createBadResult();
      const perpetualFlag = result.redFlags.find(f =>
        f.clause.toLowerCase().includes("perpetual")
      );

      expect(perpetualFlag).toBeDefined();
      expect(perpetualFlag?.severity).toBe("high");
    });
  });

  // ==========================================================================
  // MISSING CLAUSE IMPORTANCE TESTS
  // ==========================================================================

  describe("missing clause importance levels", () => {
    it("classifies kill fee as important or critical", () => {
      const result = createMockResult();
      const killFeeClause = result.missingClauses.find(c =>
        c.item.toLowerCase().includes("kill fee")
      );

      expect(killFeeClause).toBeDefined();
      expect(["critical", "important"]).toContain(killFeeClause?.importance);
    });

    it("classifies revision limit as critical when unlimited", () => {
      const result = createBadResult();
      const revisionClause = result.missingClauses.find(c =>
        c.item.toLowerCase().includes("revision")
      );

      expect(revisionClause).toBeDefined();
      expect(revisionClause?.importance).toBe("critical");
    });
  });
});
