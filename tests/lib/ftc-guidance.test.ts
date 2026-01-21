import { describe, it, expect } from "vitest";
import {
  getFTCGuidance,
  getCompensationType,
  getAllPlatformGuidance,
  getContentRules,
  validateDisclosure,
} from "@/lib/ftc-guidance";
import type { Platform } from "@/lib/types";

describe("ftc-guidance", () => {
  // ==========================================================================
  // getFTCGuidance TESTS
  // ==========================================================================

  describe("getFTCGuidance", () => {
    it("returns all required sections", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result).toHaveProperty("platformGuidance");
      expect(result).toHaveProperty("contentRules");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("checklist");
      expect(result).toHaveProperty("generalReminders");
    });

    it("returns null aiDisclosure when hasAIContent is false", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.aiDisclosure).toBeNull();
    });

    it("returns aiDisclosure guidance when hasAIContent is true", () => {
      const result = getFTCGuidance("instagram", "paid", true);

      expect(result.aiDisclosure).not.toBeNull();
      expect(result.aiDisclosure?.recommended).toBe(true);
      expect(result.aiDisclosure?.suggestedText).toBe("Created with AI assistance");
    });

    it("includes AI disclosure checklist item when hasAIContent is true", () => {
      const result = getFTCGuidance("instagram", "paid", true);

      const aiItem = result.checklist.find((item) => item.id === "ai-disclosure");
      expect(aiItem).toBeDefined();
      expect(aiItem?.priority).toBe("recommended");
    });
  });

  // ==========================================================================
  // PLATFORM-SPECIFIC GUIDANCE TESTS
  // ==========================================================================

  describe("platform-specific guidance", () => {
    const platforms: Platform[] = [
      "instagram",
      "tiktok",
      "youtube",
      "youtube_shorts",
      "twitter",
      "threads",
      "pinterest",
      "linkedin",
      "bluesky",
      "lemon8",
      "snapchat",
      "twitch",
    ];

    it.each(platforms)("returns guidance for %s", (platform) => {
      const result = getFTCGuidance(platform, "paid", false);

      expect(result.platformGuidance.platform).toBe(platform);
      expect(result.platformGuidance.platformName).toBeTruthy();
      expect(result.platformGuidance.requiredDisclosure).toBeTruthy();
      expect(result.platformGuidance.recommendations.length).toBeGreaterThan(0);
      expect(result.platformGuidance.mistakes.length).toBeGreaterThan(0);
    });

    it("returns Instagram-specific guidance correctly", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.platformGuidance.platformName).toBe("Instagram");
      expect(result.platformGuidance.requiredDisclosure).toContain("#ad");
      expect(result.platformGuidance.builtInTools.length).toBeGreaterThan(0);
      expect(result.platformGuidance.builtInTools.some((t) => t.includes("Paid partnership"))).toBe(true);
    });

    it("returns TikTok-specific guidance with verbal mention requirement", () => {
      const result = getFTCGuidance("tiktok", "paid", false);

      expect(result.platformGuidance.platformName).toBe("TikTok");
      expect(result.platformGuidance.requiredDisclosure).toContain("Verbal");
      expect(result.checklist.some((item) => item.id === "verbal-disclosure")).toBe(true);
    });

    it("returns YouTube-specific guidance with checkbox mention", () => {
      const result = getFTCGuidance("youtube", "paid", false);

      expect(result.platformGuidance.platformName).toBe("YouTube");
      expect(result.platformGuidance.requiredDisclosure).toContain("Includes paid promotion");
      expect(result.checklist.some((item) => item.id === "verbal-disclosure")).toBe(true);
    });

    it("returns Twitter-specific guidance", () => {
      const result = getFTCGuidance("twitter", "paid", false);

      expect(result.platformGuidance.platformName).toBe("X (Twitter)");
      expect(result.platformGuidance.requiredDisclosure).toContain("#ad");
    });

    it("returns LinkedIn-specific guidance with B2B context", () => {
      const result = getFTCGuidance("linkedin", "paid", false);

      expect(result.platformGuidance.platformName).toBe("LinkedIn");
      expect(result.platformGuidance.recommendations.some((r) => r.includes("B2B"))).toBe(true);
    });

    it("returns Twitch-specific guidance with stream title mention", () => {
      const result = getFTCGuidance("twitch", "paid", false);

      expect(result.platformGuidance.platformName).toBe("Twitch");
      expect(result.platformGuidance.requiredDisclosure).toContain("stream title");
      expect(result.checklist.some((item) => item.id === "verbal-disclosure")).toBe(true);
    });

    it("includes verbal disclosure checklist item for video platforms", () => {
      const videoPlatforms: Platform[] = ["tiktok", "youtube", "youtube_shorts", "twitch"];

      for (const platform of videoPlatforms) {
        const result = getFTCGuidance(platform, "paid", false);
        expect(result.checklist.some((item) => item.id === "verbal-disclosure")).toBe(true);
      }
    });

    it("does not include verbal disclosure for non-video platforms", () => {
      const nonVideoPlatforms: Platform[] = ["instagram", "twitter", "threads", "linkedin"];

      for (const platform of nonVideoPlatforms) {
        const result = getFTCGuidance(platform, "paid", false);
        expect(result.checklist.some((item) => item.id === "verbal-disclosure")).toBe(false);
      }
    });

    it("includes platform tools checklist item when platform has built-in tools", () => {
      const platformsWithTools: Platform[] = ["instagram", "tiktok", "youtube", "pinterest"];

      for (const platform of platformsWithTools) {
        const result = getFTCGuidance(platform, "paid", false);
        expect(result.checklist.some((item) => item.id === "platform-label")).toBe(true);
      }
    });
  });

  // ==========================================================================
  // COMPENSATION TYPE TESTS
  // ==========================================================================

  describe("compensation type guidance", () => {
    it("returns paid guidance for paid deals", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.contentRules.type).toBe("paid");
      expect(result.summary.headline).toContain("paid partnership");
    });

    it("returns gifted guidance for gifted deals", () => {
      const result = getFTCGuidance("instagram", "gifted", false);

      expect(result.contentRules.type).toBe("gifted");
      expect(result.summary.headline).toContain("gifted product");
      expect(result.checklist.some((item) => item.id === "gift-disclosure")).toBe(true);
    });

    it("returns affiliate guidance for affiliate deals", () => {
      const result = getFTCGuidance("instagram", "affiliate", false);

      expect(result.contentRules.type).toBe("affiliate");
      expect(result.summary.headline).toContain("affiliate links");
      expect(result.checklist.some((item) => item.id === "affiliate-disclosure")).toBe(true);
    });

    it("returns hybrid guidance for hybrid deals", () => {
      const result = getFTCGuidance("instagram", "hybrid", false);

      expect(result.contentRules.type).toBe("hybrid");
      expect(result.summary.headline).toContain("affiliate links");
      expect(result.checklist.some((item) => item.id === "affiliate-disclosure")).toBe(true);
    });

    it("paid content rules include #ad as acceptable", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.contentRules.acceptableFormats.some((f) => f.includes("#ad"))).toBe(true);
    });

    it("paid content rules exclude #sp as acceptable", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.contentRules.unacceptableFormats.some((f) => f.includes("#sp"))).toBe(true);
    });

    it("gifted content rules include #gifted as acceptable", () => {
      const result = getFTCGuidance("instagram", "gifted", false);

      expect(result.contentRules.acceptableFormats.some((f) => f.includes("#gifted"))).toBe(true);
    });

    it("affiliate content rules mention commission disclosure", () => {
      const result = getFTCGuidance("instagram", "affiliate", false);

      expect(result.contentRules.requirement).toContain("commission");
    });
  });

  // ==========================================================================
  // getCompensationType TESTS
  // ==========================================================================

  describe("getCompensationType", () => {
    it("returns paid for sponsored deal type", () => {
      const result = getCompensationType("sponsored", false, false);
      expect(result).toBe("paid");
    });

    it("returns gifted when hasGift is true and dealType is ugc", () => {
      const result = getCompensationType("ugc", true, false);
      expect(result).toBe("gifted");
    });

    it("returns affiliate when hasAffiliate is true and dealType is ugc", () => {
      const result = getCompensationType("ugc", false, true);
      expect(result).toBe("affiliate");
    });

    it("returns hybrid when hasAffiliate is true and dealType is sponsored", () => {
      const result = getCompensationType("sponsored", false, true);
      expect(result).toBe("hybrid");
    });

    it("returns paid by default for sponsored dealType", () => {
      const result = getCompensationType("sponsored");
      expect(result).toBe("paid");
    });
  });

  // ==========================================================================
  // getAllPlatformGuidance TESTS
  // ==========================================================================

  describe("getAllPlatformGuidance", () => {
    it("returns guidance for all platforms", () => {
      const result = getAllPlatformGuidance();

      expect(result.length).toBe(12); // 12 platforms defined
    });

    it("each platform guidance has required fields", () => {
      const result = getAllPlatformGuidance();

      for (const guidance of result) {
        expect(guidance.platform).toBeTruthy();
        expect(guidance.platformName).toBeTruthy();
        expect(guidance.requiredDisclosure).toBeTruthy();
        expect(guidance.recommendations).toBeInstanceOf(Array);
        expect(guidance.mistakes).toBeInstanceOf(Array);
      }
    });
  });

  // ==========================================================================
  // getContentRules TESTS
  // ==========================================================================

  describe("getContentRules", () => {
    it("returns rules for paid compensation type", () => {
      const result = getContentRules("paid");

      expect(result.type).toBe("paid");
      expect(result.requirement).toBeTruthy();
      expect(result.acceptableFormats.length).toBeGreaterThan(0);
      expect(result.unacceptableFormats.length).toBeGreaterThan(0);
    });

    it("returns rules for gifted compensation type", () => {
      const result = getContentRules("gifted");

      expect(result.type).toBe("gifted");
      expect(result.requirement).toContain("free");
    });

    it("returns rules for affiliate compensation type", () => {
      const result = getContentRules("affiliate");

      expect(result.type).toBe("affiliate");
      expect(result.requirement).toContain("commission");
    });

    it("returns rules for hybrid compensation type", () => {
      const result = getContentRules("hybrid");

      expect(result.type).toBe("hybrid");
      expect(result.requirement).toContain("both");
    });
  });

  // ==========================================================================
  // validateDisclosure TESTS
  // ==========================================================================

  describe("validateDisclosure", () => {
    it("validates #ad as acceptable for paid content", () => {
      const result = validateDisclosure("#ad This is sponsored content", "paid");

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it("validates #sponsored as acceptable for paid content", () => {
      const result = validateDisclosure("#sponsored content", "paid");

      expect(result.valid).toBe(true);
    });

    it("rejects #sp alone for paid content", () => {
      const result = validateDisclosure("#sp This is sponsored content", "paid");

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("#sp"))).toBe(true);
    });

    it("rejects #spon alone for paid content", () => {
      const result = validateDisclosure("#spon Check out this product", "paid");

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("#spon"))).toBe(true);
    });

    it("validates #gifted for gifted content", () => {
      const result = validateDisclosure("#gifted This was sent to me", "gifted");

      expect(result.valid).toBe(true);
    });

    it("validates #affiliate for affiliate content", () => {
      const result = validateDisclosure("#affiliate I may earn commission", "affiliate");

      expect(result.valid).toBe(true);
    });

    it("rejects missing paid disclosure in hybrid content", () => {
      const result = validateDisclosure("#affiliate link only", "hybrid");

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("paid"))).toBe(true);
    });

    it("rejects missing affiliate disclosure in hybrid content", () => {
      const result = validateDisclosure("#ad sponsored post only", "hybrid");

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("affiliate") || i.includes("commission"))).toBe(true);
    });

    it("validates complete hybrid disclosure", () => {
      const result = validateDisclosure("#ad #affiliate I may earn commission from this sponsored post", "hybrid");

      expect(result.valid).toBe(true);
    });
  });

  // ==========================================================================
  // SUMMARY SECTION TESTS
  // ==========================================================================

  describe("summary section", () => {
    it("summary includes headline for paid deals", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.summary.headline).toBeTruthy();
      expect(result.summary.headline).toContain("FTC disclosure required");
    });

    it("summary includes required text", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.summary.requiredText).toBeTruthy();
      expect(result.summary.requiredText).toContain("#ad");
    });

    it("summary includes placement guidance", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.summary.placement).toBeTruthy();
      expect(result.summary.placement).toContain("BEGINNING");
    });
  });

  // ==========================================================================
  // CHECKLIST TESTS
  // ==========================================================================

  describe("checklist", () => {
    it("includes base checklist items for all deals", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      const baseItems = ["visible-disclosure", "beginning-placement", "clear-language"];
      for (const itemId of baseItems) {
        expect(result.checklist.some((item) => item.id === itemId)).toBe(true);
      }
    });

    it("checklist items have required fields", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      for (const item of result.checklist) {
        expect(item.id).toBeTruthy();
        expect(item.text).toBeTruthy();
        expect(["critical", "important", "recommended"]).toContain(item.priority);
        expect(item.reason).toBeTruthy();
      }
    });

    it("critical items are marked as critical", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      const visibleItem = result.checklist.find((item) => item.id === "visible-disclosure");
      expect(visibleItem?.priority).toBe("critical");

      const beginningItem = result.checklist.find((item) => item.id === "beginning-placement");
      expect(beginningItem?.priority).toBe("critical");
    });
  });

  // ==========================================================================
  // GENERAL REMINDERS TESTS
  // ==========================================================================

  describe("general reminders", () => {
    it("includes general reminders", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      expect(result.generalReminders.length).toBeGreaterThan(0);
    });

    it("general reminders include key FTC principles", () => {
      const result = getFTCGuidance("instagram", "paid", false);

      // Should mention beginning/start placement
      expect(result.generalReminders.some((r) => r.includes("BEGINNING") || r.includes("beginning"))).toBe(true);

      // Should mention visible/clear disclosure
      expect(result.generalReminders.some((r) => r.includes("visible") || r.includes("clear"))).toBe(true);
    });
  });
});
