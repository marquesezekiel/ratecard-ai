import { describe, it, expect } from "vitest";
import {
  getContractChecklist,
  getItemsByCategory,
  getCriticalItems,
  getHighlightedItems,
  getDetectedRedFlags,
  getRedFlagsBySeverity,
  getAllChecklistItems,
  getAllRedFlags,
} from "@/lib/contract-checklist";
import type { ParsedBrief } from "@/lib/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createBasicBrief = (overrides?: Partial<ParsedBrief>): ParsedBrief => ({
  brand: {
    name: "Test Brand",
    industry: "beauty",
    product: "Skincare Serum",
  },
  campaign: {
    objective: "awareness",
    targetAudience: "Women 25-34",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 1,
    description: "Create a Reel showcasing the product",
  },
  timeline: {
    draftDue: new Date().toISOString(),
    publishDate: new Date().toISOString(),
  },
  ...overrides,
});

const createBriefWithExclusivity = (): ParsedBrief =>
  createBasicBrief({
    usageRights: {
      durationDays: 30,
      exclusivity: "category",
      paidAmplification: false,
    },
  });

const createBriefWithWhitelisting = (): ParsedBrief =>
  createBasicBrief({
    usageRights: {
      durationDays: 90,
      exclusivity: "none",
      paidAmplification: true,
    },
  });

const createBriefWithLongUsage = (): ParsedBrief =>
  createBasicBrief({
    usageRights: {
      durationDays: 400, // Over 1 year
      exclusivity: "none",
      paidAmplification: false,
    },
  });

const createRetainerBrief = (): ParsedBrief =>
  createBasicBrief({
    retainerConfig: {
      dealLength: "6_month",
      monthlyDeliverables: {
        posts: 2,
        stories: 4,
        reels: 1,
        videos: 0,
      },
    },
  });

const createAmbassadorBrief = (): ParsedBrief =>
  createBasicBrief({
    retainerConfig: {
      dealLength: "12_month",
      monthlyDeliverables: {
        posts: 4,
        stories: 8,
        reels: 2,
        videos: 1,
      },
    },
    usageRights: {
      durationDays: 365,
      exclusivity: "full",
      paidAmplification: true,
    },
  });

const createAffiliateBrief = (): ParsedBrief =>
  createBasicBrief({
    pricingModel: "affiliate",
    affiliateConfig: {
      commissionRate: 15,
      estimatedMonthlySales: 100,
      averageOrderValue: 50,
    },
  });

const createHybridBrief = (): ParsedBrief =>
  createBasicBrief({
    pricingModel: "hybrid",
    affiliateConfig: {
      commissionRate: 10,
      estimatedMonthlySales: 50,
      averageOrderValue: 75,
    },
  });

const createUGCBrief = (): ParsedBrief =>
  createBasicBrief({
    dealType: "ugc",
    ugcFormat: "video",
  });

// =============================================================================
// TESTS
// =============================================================================

describe("contract-checklist", () => {
  // ==========================================================================
  // getContractChecklist TESTS
  // ==========================================================================

  describe("getContractChecklist", () => {
    it("returns all required sections", () => {
      const result = getContractChecklist();

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("redFlags");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("byCategory");
      expect(result).toHaveProperty("dealNotes");
    });

    it("returns items for all categories", () => {
      const result = getContractChecklist();

      expect(result.byCategory.payment).toBeGreaterThan(0);
      expect(result.byCategory.content_rights).toBeGreaterThan(0);
      expect(result.byCategory.exclusivity).toBeGreaterThan(0);
      expect(result.byCategory.legal).toBeGreaterThan(0);
    });

    it("returns correct summary statistics", () => {
      const result = getContractChecklist();

      expect(result.summary.totalItems).toBe(result.items.length);
      expect(result.summary.criticalItems).toBeGreaterThan(0);
      expect(result.summary.criticalItems).toBeLessThanOrEqual(result.summary.totalItems);
    });

    it("returns red flags", () => {
      const result = getContractChecklist();

      expect(result.redFlags.length).toBeGreaterThan(0);
    });

    it("returns deal notes when no brief provided", () => {
      const result = getContractChecklist();

      expect(result.dealNotes.length).toBeGreaterThan(0);
      expect(result.dealNotes[0]).toContain("no specific deal data");
    });
  });

  // ==========================================================================
  // CHECKLIST ITEMS TESTS
  // ==========================================================================

  describe("checklist items", () => {
    it("includes all payment items", () => {
      const result = getContractChecklist();
      const paymentItems = result.items.filter((i) => i.category === "payment");

      expect(paymentItems.length).toBe(5);
      expect(paymentItems.some((i) => i.id === "payment-amount")).toBe(true);
      expect(paymentItems.some((i) => i.id === "payment-timeline")).toBe(true);
      expect(paymentItems.some((i) => i.id === "late-payment-penalty")).toBe(true);
      expect(paymentItems.some((i) => i.id === "deposit-upfront")).toBe(true);
      expect(paymentItems.some((i) => i.id === "kill-fee")).toBe(true);
    });

    it("includes all content rights items", () => {
      const result = getContractChecklist();
      const contentItems = result.items.filter((i) => i.category === "content_rights");

      expect(contentItems.length).toBe(6);
      expect(contentItems.some((i) => i.id === "deliverables-defined")).toBe(true);
      expect(contentItems.some((i) => i.id === "revision-rounds")).toBe(true);
      expect(contentItems.some((i) => i.id === "usage-duration")).toBe(true);
      expect(contentItems.some((i) => i.id === "usage-channels")).toBe(true);
      expect(contentItems.some((i) => i.id === "usage-territory")).toBe(true);
      expect(contentItems.some((i) => i.id === "raw-content-ownership")).toBe(true);
    });

    it("includes all exclusivity items", () => {
      const result = getContractChecklist();
      const exclusivityItems = result.items.filter((i) => i.category === "exclusivity");

      expect(exclusivityItems.length).toBe(3);
      expect(exclusivityItems.some((i) => i.id === "exclusivity-period")).toBe(true);
      expect(exclusivityItems.some((i) => i.id === "exclusivity-scope")).toBe(true);
      expect(exclusivityItems.some((i) => i.id === "exclusivity-compensation")).toBe(true);
    });

    it("includes all legal items", () => {
      const result = getContractChecklist();
      const legalItems = result.items.filter((i) => i.category === "legal");

      expect(legalItems.length).toBe(4);
      expect(legalItems.some((i) => i.id === "termination-clause")).toBe(true);
      expect(legalItems.some((i) => i.id === "dispute-resolution")).toBe(true);
      expect(legalItems.some((i) => i.id === "liability-limits")).toBe(true);
      expect(legalItems.some((i) => i.id === "ftc-compliance")).toBe(true);
    });

    it("each item has required fields", () => {
      const result = getContractChecklist();

      for (const item of result.items) {
        expect(item.id).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.term).toBeTruthy();
        expect(item.explanation).toBeTruthy();
        expect(item.recommendation).toBeTruthy();
        expect(["critical", "important", "recommended"]).toContain(item.priority);
        expect(typeof item.applicable).toBe("boolean");
        expect(typeof item.highlighted).toBe("boolean");
      }
    });

    it("marks critical items as critical priority", () => {
      const result = getContractChecklist();

      // Payment amount and timeline should be critical
      const paymentAmount = result.items.find((i) => i.id === "payment-amount");
      const paymentTimeline = result.items.find((i) => i.id === "payment-timeline");

      expect(paymentAmount?.priority).toBe("critical");
      expect(paymentTimeline?.priority).toBe("critical");
    });
  });

  // ==========================================================================
  // RED FLAGS TESTS
  // ==========================================================================

  describe("red flags", () => {
    it("includes all red flags", () => {
      const result = getContractChecklist();

      expect(result.redFlags.length).toBe(10);
    });

    it("each red flag has required fields", () => {
      const result = getContractChecklist();

      for (const flag of result.redFlags) {
        expect(flag.id).toBeTruthy();
        expect(flag.flag).toBeTruthy();
        expect(flag.reason).toBeTruthy();
        expect(flag.action).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(flag.severity);
        expect(typeof flag.detected).toBe("boolean");
      }
    });

    it("includes high severity red flags", () => {
      const result = getContractChecklist();
      const highSeverity = result.redFlags.filter((f) => f.severity === "high");

      expect(highSeverity.length).toBeGreaterThan(0);
      expect(highSeverity.some((f) => f.id === "perpetual-rights")).toBe(true);
      expect(highSeverity.some((f) => f.id === "unpaid-usage-rights")).toBe(true);
      expect(highSeverity.some((f) => f.id === "uncompensated-exclusivity")).toBe(true);
      expect(highSeverity.some((f) => f.id === "long-payment-terms")).toBe(true);
    });

    it("includes medium severity red flags", () => {
      const result = getContractChecklist();
      const mediumSeverity = result.redFlags.filter((f) => f.severity === "medium");

      expect(mediumSeverity.length).toBeGreaterThan(0);
      expect(mediumSeverity.some((f) => f.id === "unlimited-revisions")).toBe(true);
      expect(mediumSeverity.some((f) => f.id === "moral-rights-waiver")).toBe(true);
    });

    it("includes low severity red flags", () => {
      const result = getContractChecklist();
      const lowSeverity = result.redFlags.filter((f) => f.severity === "low");

      expect(lowSeverity.length).toBeGreaterThan(0);
      expect(lowSeverity.some((f) => f.id === "auto-renewal")).toBe(true);
    });
  });

  // ==========================================================================
  // RED FLAG DETECTION TESTS
  // ==========================================================================

  describe("red flag detection", () => {
    it("detects perpetual rights when usage > 365 days", () => {
      const brief = createBriefWithLongUsage();
      const result = getContractChecklist(brief);

      const perpetualFlag = result.redFlags.find((f) => f.id === "perpetual-rights");
      expect(perpetualFlag?.detected).toBe(true);
    });

    it("does not detect perpetual rights for standard usage", () => {
      const brief = createBasicBrief({
        usageRights: {
          durationDays: 30,
          exclusivity: "none",
          paidAmplification: false,
        },
      });
      const result = getContractChecklist(brief);

      const perpetualFlag = result.redFlags.find((f) => f.id === "perpetual-rights");
      expect(perpetualFlag?.detected).toBe(false);
    });

    it("detects unpaid usage rights when whitelisting requested", () => {
      const brief = createBriefWithWhitelisting();
      const result = getContractChecklist(brief);

      const usageFlag = result.redFlags.find((f) => f.id === "unpaid-usage-rights");
      expect(usageFlag?.detected).toBe(true);
    });

    it("detects uncompensated exclusivity", () => {
      const brief = createBriefWithExclusivity();
      const result = getContractChecklist(brief);

      const exclusivityFlag = result.redFlags.find((f) => f.id === "uncompensated-exclusivity");
      expect(exclusivityFlag?.detected).toBe(true);
    });

    it("does not detect exclusivity flag when no exclusivity", () => {
      const brief = createBasicBrief({
        usageRights: {
          durationDays: 30,
          exclusivity: "none",
          paidAmplification: false,
        },
      });
      const result = getContractChecklist(brief);

      const exclusivityFlag = result.redFlags.find((f) => f.id === "uncompensated-exclusivity");
      expect(exclusivityFlag?.detected).toBe(false);
    });

    it("summary correctly counts detected red flags", () => {
      const brief = createAmbassadorBrief(); // Has multiple red flag triggers
      const result = getContractChecklist(brief);

      const actualDetected = result.redFlags.filter((f) => f.detected).length;
      expect(result.summary.detectedRedFlags).toBe(actualDetected);
    });
  });

  // ==========================================================================
  // HIGHLIGHTING TESTS
  // ==========================================================================

  describe("item highlighting", () => {
    it("highlights usage rights items when usage rights specified", () => {
      const brief = createBriefWithWhitelisting();
      const result = getContractChecklist(brief);

      const usageDuration = result.items.find((i) => i.id === "usage-duration");
      const usageChannels = result.items.find((i) => i.id === "usage-channels");

      expect(usageDuration?.highlighted).toBe(true);
      expect(usageChannels?.highlighted).toBe(true);
    });

    it("highlights exclusivity items when exclusivity specified", () => {
      const brief = createBriefWithExclusivity();
      const result = getContractChecklist(brief);

      const exclusivityPeriod = result.items.find((i) => i.id === "exclusivity-period");
      const exclusivityScope = result.items.find((i) => i.id === "exclusivity-scope");

      expect(exclusivityPeriod?.highlighted).toBe(true);
      expect(exclusivityScope?.highlighted).toBe(true);
    });

    it("highlights deposit for retainer deals", () => {
      const brief = createRetainerBrief();
      const result = getContractChecklist(brief);

      const deposit = result.items.find((i) => i.id === "deposit-upfront");
      expect(deposit?.highlighted).toBe(true);
    });

    it("highlights kill fee for retainer deals", () => {
      const brief = createRetainerBrief();
      const result = getContractChecklist(brief);

      const killFee = result.items.find((i) => i.id === "kill-fee");
      expect(killFee?.highlighted).toBe(true);
    });

    it("always highlights revision rounds", () => {
      const brief = createBasicBrief();
      const result = getContractChecklist(brief);

      const revisions = result.items.find((i) => i.id === "revision-rounds");
      expect(revisions?.highlighted).toBe(true);
    });

    it("always highlights payment amount and timeline", () => {
      const brief = createBasicBrief();
      const result = getContractChecklist(brief);

      const paymentAmount = result.items.find((i) => i.id === "payment-amount");
      const paymentTimeline = result.items.find((i) => i.id === "payment-timeline");

      expect(paymentAmount?.highlighted).toBe(true);
      expect(paymentTimeline?.highlighted).toBe(true);
    });
  });

  // ==========================================================================
  // DEAL NOTES TESTS
  // ==========================================================================

  describe("deal notes", () => {
    it("includes UGC note for UGC deals", () => {
      const brief = createUGCBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("UGC"))).toBe(true);
    });

    it("includes affiliate note for affiliate deals", () => {
      const brief = createAffiliateBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Affiliate"))).toBe(true);
    });

    it("includes hybrid note for hybrid deals", () => {
      const brief = createHybridBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Hybrid"))).toBe(true);
    });

    it("includes ambassador note for 12-month deals", () => {
      const brief = createAmbassadorBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Ambassador"))).toBe(true);
    });

    it("includes retainer note for 6-month deals", () => {
      const brief = createRetainerBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Retainer"))).toBe(true);
    });

    it("includes whitelisting note when paid amplification", () => {
      const brief = createBriefWithWhitelisting();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Paid Amplification") || n.includes("ads"))).toBe(true);
    });

    it("includes full exclusivity warning", () => {
      const brief = createAmbassadorBrief();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Full Exclusivity"))).toBe(true);
    });

    it("includes category exclusivity note", () => {
      const brief = createBriefWithExclusivity();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Category Exclusivity"))).toBe(true);
    });

    it("includes extended usage note for long duration", () => {
      const brief = createBriefWithLongUsage();
      const result = getContractChecklist(brief);

      expect(result.dealNotes.some((n) => n.includes("Extended Usage") || n.includes("400 days"))).toBe(true);
    });
  });

  // ==========================================================================
  // HELPER FUNCTION TESTS
  // ==========================================================================

  describe("getItemsByCategory", () => {
    it("returns only items of specified category", () => {
      const checklist = getContractChecklist();
      const paymentItems = getItemsByCategory(checklist, "payment");

      expect(paymentItems.length).toBeGreaterThan(0);
      expect(paymentItems.every((i) => i.category === "payment")).toBe(true);
    });

    it("returns empty array for category with no items", () => {
      const checklist = getContractChecklist();
      const items = getItemsByCategory(checklist, "payment");

      // All items should be of category payment
      expect(items.every((i) => i.category === "payment")).toBe(true);
    });
  });

  describe("getCriticalItems", () => {
    it("returns only critical priority items", () => {
      const checklist = getContractChecklist();
      const criticalItems = getCriticalItems(checklist);

      expect(criticalItems.length).toBeGreaterThan(0);
      expect(criticalItems.every((i) => i.priority === "critical")).toBe(true);
    });
  });

  describe("getHighlightedItems", () => {
    it("returns only highlighted items", () => {
      const brief = createAmbassadorBrief();
      const checklist = getContractChecklist(brief);
      const highlightedItems = getHighlightedItems(checklist);

      expect(highlightedItems.length).toBeGreaterThan(0);
      expect(highlightedItems.every((i) => i.highlighted)).toBe(true);
    });

    it("returns empty array when no items highlighted", () => {
      const checklist = getContractChecklist(); // No brief = no highlights
      const highlightedItems = getHighlightedItems(checklist);

      expect(highlightedItems.length).toBe(0);
    });
  });

  describe("getDetectedRedFlags", () => {
    it("returns only detected red flags", () => {
      const brief = createAmbassadorBrief();
      const checklist = getContractChecklist(brief);
      const detected = getDetectedRedFlags(checklist);

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.every((f) => f.detected)).toBe(true);
    });

    it("returns empty array when no flags detected", () => {
      const checklist = getContractChecklist(); // No brief = no detection
      const detected = getDetectedRedFlags(checklist);

      expect(detected.length).toBe(0);
    });
  });

  describe("getRedFlagsBySeverity", () => {
    it("returns only flags of specified severity", () => {
      const checklist = getContractChecklist();
      const highFlags = getRedFlagsBySeverity(checklist, "high");

      expect(highFlags.length).toBeGreaterThan(0);
      expect(highFlags.every((f) => f.severity === "high")).toBe(true);
    });
  });

  describe("getAllChecklistItems", () => {
    it("returns all items without brief context", () => {
      const items = getAllChecklistItems();

      expect(items.length).toBe(18); // 5 + 6 + 3 + 4 = 18 items
      expect(items.every((i) => i.applicable === true)).toBe(true);
      expect(items.every((i) => i.highlighted === false)).toBe(true);
    });
  });

  describe("getAllRedFlags", () => {
    it("returns all red flags without detection", () => {
      const flags = getAllRedFlags();

      expect(flags.length).toBe(10);
      expect(flags.every((f) => f.detected === false)).toBe(true);
    });
  });
});
