import { describe, it, expect } from "vitest";
import {
  calculateTier,
  calculatePrice,
  getNichePremium,
  calculateUGCPrice,
  getWhitelistingPremium,
  getSeasonalPremium,
  getRegionalMultiplier,
  getPlatformMultiplier,
  getAffiliateCategoryRates,
  calculateAffiliateEarnings,
  calculateHybridPrice,
  calculatePerformancePrice,
} from "@/lib/pricing-engine";
import type { CreatorProfile, ParsedBrief, FitScoreResult, Platform, AffiliateConfig, PerformanceConfig } from "@/lib/types";

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

  // ============================================================================
  // getSeasonalPremium Tests
  // ============================================================================
  describe("getSeasonalPremium", () => {
    describe("each season returns correct premium", () => {
      it("returns +25% for Q4 Holiday (Nov 1 - Dec 31)", () => {
        // November dates
        expect(getSeasonalPremium(new Date(2025, 10, 1)).premium).toBe(0.25); // Nov 1
        expect(getSeasonalPremium(new Date(2025, 10, 15)).premium).toBe(0.25); // Nov 15
        expect(getSeasonalPremium(new Date(2025, 10, 30)).premium).toBe(0.25); // Nov 30

        // December dates
        expect(getSeasonalPremium(new Date(2025, 11, 1)).premium).toBe(0.25); // Dec 1
        expect(getSeasonalPremium(new Date(2025, 11, 25)).premium).toBe(0.25); // Dec 25
        expect(getSeasonalPremium(new Date(2025, 11, 31)).premium).toBe(0.25); // Dec 31
      });

      it("returns +15% for Back to School (Aug 1 - Sep 15)", () => {
        // August dates
        expect(getSeasonalPremium(new Date(2025, 7, 1)).premium).toBe(0.15); // Aug 1
        expect(getSeasonalPremium(new Date(2025, 7, 15)).premium).toBe(0.15); // Aug 15
        expect(getSeasonalPremium(new Date(2025, 7, 31)).premium).toBe(0.15); // Aug 31

        // September dates (up to 15th)
        expect(getSeasonalPremium(new Date(2025, 8, 1)).premium).toBe(0.15); // Sep 1
        expect(getSeasonalPremium(new Date(2025, 8, 15)).premium).toBe(0.15); // Sep 15
      });

      it("returns +10% for Valentine's (Feb 1-14)", () => {
        expect(getSeasonalPremium(new Date(2025, 1, 1)).premium).toBe(0.10); // Feb 1
        expect(getSeasonalPremium(new Date(2025, 1, 7)).premium).toBe(0.10); // Feb 7
        expect(getSeasonalPremium(new Date(2025, 1, 14)).premium).toBe(0.10); // Feb 14
      });

      it("returns +5% for Summer (Jun 1 - Jul 31)", () => {
        // June dates
        expect(getSeasonalPremium(new Date(2025, 5, 1)).premium).toBe(0.05); // Jun 1
        expect(getSeasonalPremium(new Date(2025, 5, 15)).premium).toBe(0.05); // Jun 15
        expect(getSeasonalPremium(new Date(2025, 5, 30)).premium).toBe(0.05); // Jun 30

        // July dates
        expect(getSeasonalPremium(new Date(2025, 6, 1)).premium).toBe(0.05); // Jul 1
        expect(getSeasonalPremium(new Date(2025, 6, 31)).premium).toBe(0.05); // Jul 31
      });

      it("returns 0% for default (rest of year)", () => {
        expect(getSeasonalPremium(new Date(2025, 0, 15)).premium).toBe(0); // Jan 15
        expect(getSeasonalPremium(new Date(2025, 2, 15)).premium).toBe(0); // Mar 15
        expect(getSeasonalPremium(new Date(2025, 3, 15)).premium).toBe(0); // Apr 15
        expect(getSeasonalPremium(new Date(2025, 4, 15)).premium).toBe(0); // May 15
        expect(getSeasonalPremium(new Date(2025, 9, 15)).premium).toBe(0); // Oct 15
      });
    });

    describe("date edge cases", () => {
      it("Nov 1 = Q4 Holiday (+25%)", () => {
        const result = getSeasonalPremium(new Date(2025, 10, 1));
        expect(result.premium).toBe(0.25);
        expect(result.period).toBe("q4_holiday");
      });

      it("Oct 31 = Default (0%)", () => {
        const result = getSeasonalPremium(new Date(2025, 9, 31));
        expect(result.premium).toBe(0);
        expect(result.period).toBe("default");
      });

      it("Sep 15 = Back to School (+15%)", () => {
        const result = getSeasonalPremium(new Date(2025, 8, 15));
        expect(result.premium).toBe(0.15);
        expect(result.period).toBe("back_to_school");
      });

      it("Sep 16 = Default (0%)", () => {
        const result = getSeasonalPremium(new Date(2025, 8, 16));
        expect(result.premium).toBe(0);
        expect(result.period).toBe("default");
      });

      it("Feb 14 = Valentine's (+10%)", () => {
        const result = getSeasonalPremium(new Date(2025, 1, 14));
        expect(result.premium).toBe(0.10);
        expect(result.period).toBe("valentines");
      });

      it("Feb 15 = Default (0%)", () => {
        const result = getSeasonalPremium(new Date(2025, 1, 15));
        expect(result.premium).toBe(0);
        expect(result.period).toBe("default");
      });

      it("Aug 1 = Back to School (+15%), not Summer", () => {
        // Back to School takes priority over Summer in August
        const result = getSeasonalPremium(new Date(2025, 7, 1));
        expect(result.premium).toBe(0.15);
        expect(result.period).toBe("back_to_school");
      });

      it("Jul 31 = Summer (+5%)", () => {
        const result = getSeasonalPremium(new Date(2025, 6, 31));
        expect(result.premium).toBe(0.05);
        expect(result.period).toBe("summer");
      });
    });

    describe("manual date override", () => {
      it("accepts Date object", () => {
        const result = getSeasonalPremium(new Date(2025, 10, 15));
        expect(result.premium).toBe(0.25);
        expect(result.period).toBe("q4_holiday");
      });

      it("accepts date string", () => {
        const result = getSeasonalPremium("2025-11-15");
        expect(result.premium).toBe(0.25);
        expect(result.period).toBe("q4_holiday");
      });

      it("accepts ISO date string", () => {
        const result = getSeasonalPremium("2025-12-25T12:00:00Z");
        expect(result.premium).toBe(0.25);
        expect(result.period).toBe("q4_holiday");
      });
    });

    describe("default to current date", () => {
      it("uses current date when undefined", () => {
        const result = getSeasonalPremium(undefined);
        // Can't test exact value since it depends on current date,
        // but should return a valid result
        expect(result.premium).toBeGreaterThanOrEqual(0);
        expect(result.premium).toBeLessThanOrEqual(0.25);
        expect(result.period).toBeDefined();
        expect(result.displayName).toBeDefined();
      });

      it("uses current date when no argument", () => {
        const result = getSeasonalPremium();
        expect(result.premium).toBeGreaterThanOrEqual(0);
        expect(result.premium).toBeLessThanOrEqual(0.25);
      });

      it("uses current date for invalid date string", () => {
        const result = getSeasonalPremium("not-a-date");
        expect(result.premium).toBeGreaterThanOrEqual(0);
        expect(result.premium).toBeLessThanOrEqual(0.25);
      });
    });

    describe("display names", () => {
      it("returns correct display names for each period", () => {
        expect(getSeasonalPremium(new Date(2025, 10, 15)).displayName).toBe("Q4 Holiday Season (Nov-Dec)");
        expect(getSeasonalPremium(new Date(2025, 7, 15)).displayName).toBe("Back to School (Aug-Sep)");
        expect(getSeasonalPremium(new Date(2025, 1, 10)).displayName).toBe("Valentine's Day (Feb)");
        expect(getSeasonalPremium(new Date(2025, 5, 15)).displayName).toBe("Summer Season (Jun-Aug)");
        expect(getSeasonalPremium(new Date(2025, 3, 15)).displayName).toBe("Standard Period");
      });
    });
  });

  // ============================================================================
  // getRegionalMultiplier Tests
  // ============================================================================
  describe("getRegionalMultiplier", () => {
    describe("all regions return correct multipliers", () => {
      it("returns 1.0x for United States (baseline)", () => {
        expect(getRegionalMultiplier("united_states")).toBe(1.0);
      });

      it("returns 0.95x for United Kingdom", () => {
        expect(getRegionalMultiplier("united_kingdom")).toBe(0.95);
      });

      it("returns 0.9x for Canada", () => {
        expect(getRegionalMultiplier("canada")).toBe(0.9);
      });

      it("returns 0.9x for Australia", () => {
        expect(getRegionalMultiplier("australia")).toBe(0.9);
      });

      it("returns 0.85x for Western Europe", () => {
        expect(getRegionalMultiplier("western_europe")).toBe(0.85);
      });

      it("returns 1.1x for UAE/Gulf States", () => {
        expect(getRegionalMultiplier("uae_gulf")).toBe(1.1);
      });

      it("returns 0.95x for Singapore/Hong Kong", () => {
        expect(getRegionalMultiplier("singapore_hk")).toBe(0.95);
      });

      it("returns 0.8x for Japan", () => {
        expect(getRegionalMultiplier("japan")).toBe(0.8);
      });

      it("returns 0.75x for South Korea", () => {
        expect(getRegionalMultiplier("south_korea")).toBe(0.75);
      });

      it("returns 0.6x for Brazil", () => {
        expect(getRegionalMultiplier("brazil")).toBe(0.6);
      });

      it("returns 0.55x for Mexico", () => {
        expect(getRegionalMultiplier("mexico")).toBe(0.55);
      });

      it("returns 0.4x for India", () => {
        expect(getRegionalMultiplier("india")).toBe(0.4);
      });

      it("returns 0.5x for Southeast Asia", () => {
        expect(getRegionalMultiplier("southeast_asia")).toBe(0.5);
      });

      it("returns 0.5x for Eastern Europe", () => {
        expect(getRegionalMultiplier("eastern_europe")).toBe(0.5);
      });

      it("returns 0.4x for Africa", () => {
        expect(getRegionalMultiplier("africa")).toBe(0.4);
      });

      it("returns 0.7x for Other", () => {
        expect(getRegionalMultiplier("other")).toBe(0.7);
      });
    });

    describe("unknown region defaults to 0.7x", () => {
      it("returns 0.7x for unknown region string", () => {
        expect(getRegionalMultiplier("unknown")).toBe(0.7);
        expect(getRegionalMultiplier("random_region")).toBe(0.7);
        expect(getRegionalMultiplier("mars")).toBe(0.7);
      });

      it("returns 1.0x (US baseline) for undefined", () => {
        expect(getRegionalMultiplier(undefined)).toBe(1.0);
      });

      it("returns 1.0x (US baseline) for empty string", () => {
        // Empty string normalizes and doesn't match, so defaults to US
        expect(getRegionalMultiplier("")).toBe(1.0);
      });
    });

    describe("case and whitespace handling", () => {
      it("handles different cases", () => {
        expect(getRegionalMultiplier("UNITED_STATES")).toBe(1.0);
        expect(getRegionalMultiplier("United_Kingdom")).toBe(0.95);
        expect(getRegionalMultiplier("WESTERN_EUROPE")).toBe(0.85);
      });

      it("handles whitespace", () => {
        expect(getRegionalMultiplier("  united_states  ")).toBe(1.0);
        expect(getRegionalMultiplier("  india  ")).toBe(0.4);
      });

      it("handles spaces instead of underscores", () => {
        expect(getRegionalMultiplier("united states")).toBe(1.0);
        expect(getRegionalMultiplier("united kingdom")).toBe(0.95);
        expect(getRegionalMultiplier("western europe")).toBe(0.85);
      });
    });
  });

  // ============================================================================
  // getPlatformMultiplier Tests
  // ============================================================================
  describe("getPlatformMultiplier", () => {
    describe("all platforms return correct multipliers", () => {
      it("returns 1.0x for Instagram (baseline)", () => {
        expect(getPlatformMultiplier("instagram")).toBe(1.0);
      });

      it("returns 0.9x for TikTok", () => {
        expect(getPlatformMultiplier("tiktok")).toBe(0.9);
      });

      it("returns 1.4x for YouTube (long-form premium)", () => {
        expect(getPlatformMultiplier("youtube")).toBe(1.4);
      });

      it("returns 0.7x for YouTube Shorts", () => {
        expect(getPlatformMultiplier("youtube_shorts")).toBe(0.7);
      });

      it("returns 0.7x for Twitter/X", () => {
        expect(getPlatformMultiplier("twitter")).toBe(0.7);
      });

      it("returns 0.6x for Threads", () => {
        expect(getPlatformMultiplier("threads")).toBe(0.6);
      });

      it("returns 0.8x for Pinterest", () => {
        expect(getPlatformMultiplier("pinterest")).toBe(0.8);
      });

      it("returns 1.3x for LinkedIn (B2B premium)", () => {
        expect(getPlatformMultiplier("linkedin")).toBe(1.3);
      });

      it("returns 0.5x for Bluesky (emerging)", () => {
        expect(getPlatformMultiplier("bluesky")).toBe(0.5);
      });

      it("returns 0.6x for Lemon8", () => {
        expect(getPlatformMultiplier("lemon8")).toBe(0.6);
      });

      it("returns 0.75x for Snapchat", () => {
        expect(getPlatformMultiplier("snapchat")).toBe(0.75);
      });

      it("returns 1.1x for Twitch (live streaming premium)", () => {
        expect(getPlatformMultiplier("twitch")).toBe(1.1);
      });
    });

    describe("YouTube vs YouTube Shorts distinction", () => {
      it("YouTube (1.4x) is double YouTube Shorts (0.7x)", () => {
        const youtubeMultiplier = getPlatformMultiplier("youtube");
        const shortsMultiplier = getPlatformMultiplier("youtube_shorts");

        expect(youtubeMultiplier).toBe(1.4);
        expect(shortsMultiplier).toBe(0.7);
        expect(youtubeMultiplier).toBe(shortsMultiplier * 2);
      });

      it("correctly distinguishes between youtube and youtube_shorts", () => {
        expect(getPlatformMultiplier("youtube")).not.toBe(getPlatformMultiplier("youtube_shorts"));
      });
    });

    describe("unknown platform defaults to 1.0x", () => {
      it("returns 1.0x for unknown platform string", () => {
        expect(getPlatformMultiplier("unknown")).toBe(1.0);
        expect(getPlatformMultiplier("random_platform")).toBe(1.0);
        expect(getPlatformMultiplier("facebook")).toBe(1.0);
        expect(getPlatformMultiplier("myspace")).toBe(1.0);
      });

      it("returns 1.0x for undefined", () => {
        expect(getPlatformMultiplier(undefined)).toBe(1.0);
      });

      it("returns 1.0x for empty string", () => {
        expect(getPlatformMultiplier("")).toBe(1.0);
      });
    });

    describe("case and whitespace handling", () => {
      it("handles different cases", () => {
        expect(getPlatformMultiplier("INSTAGRAM")).toBe(1.0);
        expect(getPlatformMultiplier("TikTok")).toBe(0.9);
        expect(getPlatformMultiplier("YOUTUBE")).toBe(1.4);
        expect(getPlatformMultiplier("LinkedIn")).toBe(1.3);
      });

      it("handles whitespace", () => {
        expect(getPlatformMultiplier("  instagram  ")).toBe(1.0);
        expect(getPlatformMultiplier("  tiktok  ")).toBe(0.9);
      });

      it("handles spaces instead of underscores", () => {
        expect(getPlatformMultiplier("youtube shorts")).toBe(0.7);
      });
    });

    describe("platform multiplier rankings", () => {
      it("YouTube has highest multiplier", () => {
        const platforms: Platform[] = [
          "instagram", "tiktok", "youtube", "youtube_shorts",
          "twitter", "threads", "pinterest", "linkedin",
          "bluesky", "lemon8", "snapchat", "twitch"
        ];
        const multipliers = platforms.map(p => getPlatformMultiplier(p));
        const maxMultiplier = Math.max(...multipliers);

        expect(getPlatformMultiplier("youtube")).toBe(maxMultiplier);
      });

      it("Bluesky has lowest multiplier (emerging platform)", () => {
        const platforms: Platform[] = [
          "instagram", "tiktok", "youtube", "youtube_shorts",
          "twitter", "threads", "pinterest", "linkedin",
          "bluesky", "lemon8", "snapchat", "twitch"
        ];
        const multipliers = platforms.map(p => getPlatformMultiplier(p));
        const minMultiplier = Math.min(...multipliers);

        expect(getPlatformMultiplier("bluesky")).toBe(minMultiplier);
      });

      it("premium platforms (YouTube, LinkedIn, Twitch) are above baseline", () => {
        expect(getPlatformMultiplier("youtube")).toBeGreaterThan(1.0);
        expect(getPlatformMultiplier("linkedin")).toBeGreaterThan(1.0);
        expect(getPlatformMultiplier("twitch")).toBeGreaterThan(1.0);
      });

      it("emerging platforms (Bluesky, Threads, Lemon8) are below baseline", () => {
        expect(getPlatformMultiplier("bluesky")).toBeLessThan(1.0);
        expect(getPlatformMultiplier("threads")).toBeLessThan(1.0);
        expect(getPlatformMultiplier("lemon8")).toBeLessThan(1.0);
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

    it("calculates price with all 11 layers (including platform, regional, niche premium, whitelisting, and seasonal)", () => {
      const mockProfile = createMockProfile("micro", 25000);
      const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

      expect(result.layers).toHaveLength(11);
      expect(result.layers[0].name).toBe("Base Rate");
      expect(result.layers[1].name).toBe("Platform");
      expect(result.layers[2].name).toBe("Regional");
      expect(result.layers[3].name).toBe("Engagement Multiplier");
      expect(result.layers[4].name).toBe("Niche Premium");
      expect(result.layers[5].name).toBe("Format Premium");
      expect(result.layers[6].name).toBe("Fit Score");
      expect(result.layers[7].name).toBe("Usage Rights");
      expect(result.layers[8].name).toBe("Whitelisting");
      expect(result.layers[9].name).toBe("Complexity");
      expect(result.layers[10].name).toBe("Seasonal");
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

    // ==========================================================================
    // Seasonal Pricing Integration Tests
    // ==========================================================================
    describe("seasonal pricing integration", () => {
      it("seasonal layer shows correct multiplier for Q4 Holiday", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithQ4Date: ParsedBrief = {
          ...mockBrief,
          campaignDate: new Date(2025, 10, 15), // Nov 15
        };

        const result = calculatePrice(mockProfile, briefWithQ4Date, mockFitScore);

        const seasonalLayer = result.layers.find(l => l.name === "Seasonal");
        expect(seasonalLayer).toBeDefined();
        expect(seasonalLayer?.multiplier).toBe(1.25); // 1 + 25%
      });

      it("seasonal pricing increases price during Q4", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefQ4: ParsedBrief = {
          ...mockBrief,
          campaignDate: new Date(2025, 10, 15), // Nov 15 = Q4
        };
        const briefDefault: ParsedBrief = {
          ...mockBrief,
          campaignDate: new Date(2025, 3, 15), // Apr 15 = default
        };

        const resultQ4 = calculatePrice(mockProfile, briefQ4, mockFitScore);
        const resultDefault = calculatePrice(mockProfile, briefDefault, mockFitScore);

        // Q4 (+25%) should be higher than default (0%)
        expect(resultQ4.pricePerDeliverable).toBeGreaterThan(resultDefault.pricePerDeliverable);
      });

      it("seasonal pricing can be disabled", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithQ4Enabled: ParsedBrief = {
          ...mockBrief,
          campaignDate: new Date(2025, 10, 15),
          disableSeasonalPricing: false,
        };
        const briefWithQ4Disabled: ParsedBrief = {
          ...mockBrief,
          campaignDate: new Date(2025, 10, 15),
          disableSeasonalPricing: true,
        };

        const resultEnabled = calculatePrice(mockProfile, briefWithQ4Enabled, mockFitScore);
        const resultDisabled = calculatePrice(mockProfile, briefWithQ4Disabled, mockFitScore);

        // Enabled should have seasonal premium
        const enabledSeasonalLayer = resultEnabled.layers.find(l => l.name === "Seasonal");
        expect(enabledSeasonalLayer?.multiplier).toBe(1.25);

        // Disabled should have no seasonal premium
        const disabledSeasonalLayer = resultDisabled.layers.find(l => l.name === "Seasonal");
        expect(disabledSeasonalLayer?.multiplier).toBe(1.0);
        expect(disabledSeasonalLayer?.baseValue).toBe("disabled");
      });

      it("accepts date string for campaignDate", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const briefWithDateString: ParsedBrief = {
          ...mockBrief,
          campaignDate: "2025-12-25", // Christmas = Q4
        };

        const result = calculatePrice(mockProfile, briefWithDateString, mockFitScore);

        const seasonalLayer = result.layers.find(l => l.name === "Seasonal");
        expect(seasonalLayer?.multiplier).toBe(1.25);
      });

      it("defaults to current date when campaignDate not specified", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        const seasonalLayer = result.layers.find(l => l.name === "Seasonal");
        expect(seasonalLayer).toBeDefined();
        // Premium depends on current date, but layer should exist
        expect(seasonalLayer?.multiplier).toBeGreaterThanOrEqual(1.0);
        expect(seasonalLayer?.multiplier).toBeLessThanOrEqual(1.25);
      });
    });

    // ==========================================================================
    // Regional Pricing Integration Tests
    // ==========================================================================
    describe("regional pricing integration", () => {
      it("regional layer shows correct multiplier for India", () => {
        const mockProfile = createMockProfile("micro", 25000);
        mockProfile.region = "india";

        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        const regionalLayer = result.layers.find(l => l.name === "Regional");
        expect(regionalLayer).toBeDefined();
        expect(regionalLayer?.multiplier).toBe(0.4);
      });

      it("regional layer shows correct multiplier for UAE", () => {
        const mockProfile = createMockProfile("micro", 25000);
        mockProfile.region = "uae_gulf";

        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        const regionalLayer = result.layers.find(l => l.name === "Regional");
        expect(regionalLayer).toBeDefined();
        expect(regionalLayer?.multiplier).toBe(1.1);
      });

      it("regional pricing affects final price", () => {
        const usProfile = createMockProfile("micro", 25000);
        usProfile.region = "united_states";

        const indiaProfile = createMockProfile("micro", 25000);
        indiaProfile.region = "india";

        const usResult = calculatePrice(usProfile, mockBrief, mockFitScore);
        const indiaResult = calculatePrice(indiaProfile, mockBrief, mockFitScore);

        // India (0.4x) should be significantly lower than US (1.0x)
        expect(indiaResult.pricePerDeliverable).toBeLessThan(usResult.pricePerDeliverable);
        // Rough ratio check - India should be about 40% of US price
        const ratio = indiaResult.pricePerDeliverable / usResult.pricePerDeliverable;
        expect(ratio).toBeGreaterThan(0.35);
        expect(ratio).toBeLessThan(0.45);
      });

      it("UAE creators earn more than US baseline", () => {
        const usProfile = createMockProfile("micro", 25000);
        usProfile.region = "united_states";

        const uaeProfile = createMockProfile("micro", 25000);
        uaeProfile.region = "uae_gulf";

        const usResult = calculatePrice(usProfile, mockBrief, mockFitScore);
        const uaeResult = calculatePrice(uaeProfile, mockBrief, mockFitScore);

        // UAE (1.1x) should be higher than US (1.0x)
        expect(uaeResult.pricePerDeliverable).toBeGreaterThan(usResult.pricePerDeliverable);
      });

      it("defaults to US baseline when region not specified", () => {
        const mockProfile = createMockProfile("micro", 25000);
        // Don't set region

        const result = calculatePrice(mockProfile, mockBrief, mockFitScore);

        const regionalLayer = result.layers.find(l => l.name === "Regional");
        expect(regionalLayer).toBeDefined();
        expect(regionalLayer?.multiplier).toBe(1.0); // US baseline
      });

      it("integration with base rate - India nano vs US nano", () => {
        const usNanoProfile = createMockProfile("nano", 5000);
        usNanoProfile.region = "united_states";

        const indiaNanoProfile = createMockProfile("nano", 5000);
        indiaNanoProfile.region = "india";

        const usResult = calculatePrice(usNanoProfile, mockBrief, mockFitScore);
        const indiaResult = calculatePrice(indiaNanoProfile, mockBrief, mockFitScore);

        // Base rate is $150 for nano
        // US: $150 × 1.0 = $150 base × regional
        // India: $150 × 0.4 = $60 base × regional
        expect(usResult.pricePerDeliverable).toBeGreaterThan(indiaResult.pricePerDeliverable);
      });
    });

    // ==========================================================================
    // Platform Pricing Integration Tests
    // ==========================================================================
    describe("platform pricing integration", () => {
      it("platform layer shows correct multiplier for YouTube", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const youtubeBrief: ParsedBrief = {
          ...mockBrief,
          content: {
            ...mockBrief.content,
            platform: "youtube",
          },
        };

        const result = calculatePrice(mockProfile, youtubeBrief, mockFitScore);

        const platformLayer = result.layers.find(l => l.name === "Platform");
        expect(platformLayer).toBeDefined();
        expect(platformLayer?.multiplier).toBe(1.4);
      });

      it("platform layer shows correct multiplier for Bluesky", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const blueskyBrief: ParsedBrief = {
          ...mockBrief,
          content: {
            ...mockBrief.content,
            platform: "bluesky",
          },
        };

        const result = calculatePrice(mockProfile, blueskyBrief, mockFitScore);

        const platformLayer = result.layers.find(l => l.name === "Platform");
        expect(platformLayer).toBeDefined();
        expect(platformLayer?.multiplier).toBe(0.5);
      });

      it("platform pricing affects final price", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const youtubeBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "youtube" },
        };
        const blueskyBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "bluesky" },
        };

        const youtubeResult = calculatePrice(mockProfile, youtubeBrief, mockFitScore);
        const blueskyResult = calculatePrice(mockProfile, blueskyBrief, mockFitScore);

        // YouTube (1.4x) should be significantly higher than Bluesky (0.5x)
        expect(youtubeResult.pricePerDeliverable).toBeGreaterThan(blueskyResult.pricePerDeliverable);
        // Rough ratio check - YouTube should be about 2.8x Bluesky (1.4/0.5)
        const ratio = youtubeResult.pricePerDeliverable / blueskyResult.pricePerDeliverable;
        expect(ratio).toBeGreaterThan(2.5);
        expect(ratio).toBeLessThan(3.1);
      });

      it("YouTube vs YouTube Shorts pricing difference", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const youtubeBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "youtube" },
        };
        const shortsBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "youtube_shorts" },
        };

        const youtubeResult = calculatePrice(mockProfile, youtubeBrief, mockFitScore);
        const shortsResult = calculatePrice(mockProfile, shortsBrief, mockFitScore);

        // YouTube (1.4x) should be exactly double YouTube Shorts (0.7x)
        expect(youtubeResult.pricePerDeliverable).toBeGreaterThan(shortsResult.pricePerDeliverable);
        // Ratio should be close to 2.0 (1.4/0.7)
        const ratio = youtubeResult.pricePerDeliverable / shortsResult.pricePerDeliverable;
        expect(ratio).toBeGreaterThan(1.9);
        expect(ratio).toBeLessThan(2.1);
      });

      it("LinkedIn B2B premium increases price", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const instagramBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "instagram" },
        };
        const linkedinBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "linkedin" },
        };

        const instagramResult = calculatePrice(mockProfile, instagramBrief, mockFitScore);
        const linkedinResult = calculatePrice(mockProfile, linkedinBrief, mockFitScore);

        // LinkedIn (1.3x) should be higher than Instagram (1.0x)
        expect(linkedinResult.pricePerDeliverable).toBeGreaterThan(instagramResult.pricePerDeliverable);
      });

      it("Twitch streaming premium increases price", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const twitchBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "twitch" },
        };

        const result = calculatePrice(mockProfile, twitchBrief, mockFitScore);

        const platformLayer = result.layers.find(l => l.name === "Platform");
        expect(platformLayer?.multiplier).toBe(1.1);
      });

      it("emerging platforms reduce price appropriately", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const instagramBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "instagram" },
        };
        const threadsBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "threads" },
        };
        const lemon8Brief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "lemon8" },
        };

        const instagramResult = calculatePrice(mockProfile, instagramBrief, mockFitScore);
        const threadsResult = calculatePrice(mockProfile, threadsBrief, mockFitScore);
        const lemon8Result = calculatePrice(mockProfile, lemon8Brief, mockFitScore);

        // Instagram (1.0x) baseline
        // Threads (0.6x) and Lemon8 (0.6x) should be lower
        expect(threadsResult.pricePerDeliverable).toBeLessThan(instagramResult.pricePerDeliverable);
        expect(lemon8Result.pricePerDeliverable).toBeLessThan(instagramResult.pricePerDeliverable);
      });

      it("platform multiplier included in formula representation", () => {
        const mockProfile = createMockProfile("micro", 25000);
        const youtubeBrief: ParsedBrief = {
          ...mockBrief,
          content: { ...mockBrief.content, platform: "youtube" },
        };

        const result = calculatePrice(mockProfile, youtubeBrief, mockFitScore);

        expect(result.formula).toContain("1.40"); // Platform multiplier for YouTube
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
    // UGC Has 5 Layers (Base, Usage Rights, Whitelisting, Complexity, Seasonal)
    // ==========================================================================
    describe("UGC layer structure", () => {
      it("UGC pricing has exactly 5 layers", () => {
        const profile = createMockProfile("micro", 25000);
        const brief = createUGCBrief("video");

        const result = calculateUGCPrice(brief, profile);

        expect(result.layers).toHaveLength(5);
        expect(result.layers[0].name).toBe("UGC Base Rate");
        expect(result.layers[1].name).toBe("Usage Rights");
        expect(result.layers[2].name).toBe("Whitelisting");
        expect(result.layers[3].name).toBe("Complexity");
        expect(result.layers[4].name).toBe("Seasonal");
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
    // UGC Seasonal Tests
    // ==========================================================================
    describe("UGC seasonal pricing", () => {
      it("applies seasonal premium to UGC price", () => {
        const profile = createMockProfile("micro", 25000);
        const briefQ4: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          campaignDate: new Date(2025, 10, 15), // Nov = Q4
        };
        const briefDefault: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          campaignDate: new Date(2025, 3, 15), // Apr = default
        };

        const resultQ4 = calculateUGCPrice(briefQ4, profile);
        const resultDefault = calculateUGCPrice(briefDefault, profile);

        expect(resultQ4.pricePerDeliverable).toBeGreaterThan(resultDefault.pricePerDeliverable);
      });

      it("UGC seasonal can be disabled", () => {
        const profile = createMockProfile("micro", 25000);
        const briefEnabled: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          campaignDate: new Date(2025, 10, 15),
          disableSeasonalPricing: false,
        };
        const briefDisabled: ParsedBrief = {
          ...createUGCBrief("video", 30, "none", 1),
          campaignDate: new Date(2025, 10, 15),
          disableSeasonalPricing: true,
        };

        const resultEnabled = calculateUGCPrice(briefEnabled, profile);
        const resultDisabled = calculateUGCPrice(briefDisabled, profile);

        const enabledSeasonalLayer = resultEnabled.layers.find(l => l.name === "Seasonal");
        const disabledSeasonalLayer = resultDisabled.layers.find(l => l.name === "Seasonal");

        expect(enabledSeasonalLayer?.multiplier).toBe(1.25);
        expect(disabledSeasonalLayer?.multiplier).toBe(1.0);
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

      // UGC has 5 layers (Base, Usage Rights, Whitelisting, Complexity, Seasonal)
      expect(result.layers).toHaveLength(5);
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

      // Sponsored has 11 layers (with Platform, Regional, Whitelisting and Seasonal)
      expect(result.layers).toHaveLength(11);
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

      // Should default to sponsored (11 layers)
      expect(result.layers).toHaveLength(11);
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

  // ============================================================================
  // Affiliate/Performance Pricing Tests (Prompt 8)
  // ============================================================================
  describe("getAffiliateCategoryRates", () => {
    describe("fashion_apparel category (10-20%)", () => {
      it("returns correct rate range for fashion_apparel", () => {
        const rates = getAffiliateCategoryRates("fashion_apparel");
        expect(rates.min).toBe(10);
        expect(rates.max).toBe(20);
        expect(rates.default).toBe(15);
        expect(rates.displayName).toBe("Fashion/Apparel");
      });
    });

    describe("beauty_skincare category (15-25%)", () => {
      it("returns correct rate range for beauty_skincare", () => {
        const rates = getAffiliateCategoryRates("beauty_skincare");
        expect(rates.min).toBe(15);
        expect(rates.max).toBe(25);
        expect(rates.default).toBe(20);
        expect(rates.displayName).toBe("Beauty/Skincare");
      });
    });

    describe("tech_electronics category (5-10%)", () => {
      it("returns correct rate range for tech_electronics", () => {
        const rates = getAffiliateCategoryRates("tech_electronics");
        expect(rates.min).toBe(5);
        expect(rates.max).toBe(10);
        expect(rates.default).toBe(7);
        expect(rates.displayName).toBe("Tech/Electronics");
      });
    });

    describe("home_lifestyle category (8-15%)", () => {
      it("returns correct rate range for home_lifestyle", () => {
        const rates = getAffiliateCategoryRates("home_lifestyle");
        expect(rates.min).toBe(8);
        expect(rates.max).toBe(15);
        expect(rates.default).toBe(12);
        expect(rates.displayName).toBe("Home/Lifestyle");
      });
    });

    describe("food_beverage category (10-15%)", () => {
      it("returns correct rate range for food_beverage", () => {
        const rates = getAffiliateCategoryRates("food_beverage");
        expect(rates.min).toBe(10);
        expect(rates.max).toBe(15);
        expect(rates.default).toBe(12);
        expect(rates.displayName).toBe("Food/Beverage");
      });
    });

    describe("health_supplements category (15-30%)", () => {
      it("returns correct rate range for health_supplements", () => {
        const rates = getAffiliateCategoryRates("health_supplements");
        expect(rates.min).toBe(15);
        expect(rates.max).toBe(30);
        expect(rates.default).toBe(22);
        expect(rates.displayName).toBe("Health/Supplements");
      });
    });

    describe("digital_products category (20-40%)", () => {
      it("returns correct rate range for digital_products", () => {
        const rates = getAffiliateCategoryRates("digital_products");
        expect(rates.min).toBe(20);
        expect(rates.max).toBe(40);
        expect(rates.default).toBe(30);
        expect(rates.displayName).toBe("Digital Products/Courses");
      });
    });

    describe("services_subscriptions category (15-25%)", () => {
      it("returns correct rate range for services_subscriptions", () => {
        const rates = getAffiliateCategoryRates("services_subscriptions");
        expect(rates.min).toBe(15);
        expect(rates.max).toBe(25);
        expect(rates.default).toBe(20);
        expect(rates.displayName).toBe("Services/Subscriptions");
      });
    });

    describe("other category (10-15%)", () => {
      it("returns correct rate range for other", () => {
        const rates = getAffiliateCategoryRates("other");
        expect(rates.min).toBe(10);
        expect(rates.max).toBe(15);
        expect(rates.default).toBe(12);
        expect(rates.displayName).toBe("Other");
      });
    });

    describe("unknown category handling", () => {
      it("defaults to other for unknown category", () => {
        const rates = getAffiliateCategoryRates("unknown_category");
        expect(rates.min).toBe(10);
        expect(rates.max).toBe(15);
        expect(rates.default).toBe(12);
        expect(rates.displayName).toBe("Other");
      });

      it("defaults to other for undefined", () => {
        const rates = getAffiliateCategoryRates(undefined);
        expect(rates.min).toBe(10);
        expect(rates.max).toBe(15);
        expect(rates.default).toBe(12);
      });
    });
  });

  describe("calculateAffiliateEarnings", () => {
    describe("pure affiliate calculation", () => {
      it("calculates earnings correctly: rate × sales × aov", () => {
        const config: AffiliateConfig = {
          affiliateRate: 15,
          estimatedSales: 100,
          averageOrderValue: 50,
        };

        const result = calculateAffiliateEarnings(config);

        // 15% × 100 sales × $50 = $750
        expect(result.estimatedEarnings).toBe(750);
        expect(result.commissionRate).toBe(15);
        expect(result.estimatedSales).toBe(100);
        expect(result.averageOrderValue).toBe(50);
      });

      it("rounds earnings to nearest $5", () => {
        const config: AffiliateConfig = {
          affiliateRate: 12,
          estimatedSales: 47,
          averageOrderValue: 35,
        };

        const result = calculateAffiliateEarnings(config);

        // 12% × 47 × $35 = $197.40 → rounds to $195 or $200
        expect(result.estimatedEarnings % 5).toBe(0);
      });

      it("includes category rate range when category provided", () => {
        const config: AffiliateConfig = {
          affiliateRate: 15,
          estimatedSales: 100,
          averageOrderValue: 50,
          category: "beauty_skincare",
        };

        const result = calculateAffiliateEarnings(config);

        expect(result.categoryRateRange).toBeDefined();
        expect(result.categoryRateRange?.min).toBe(15);
        expect(result.categoryRateRange?.max).toBe(25);
      });

      it("does not include category rate range when no category", () => {
        const config: AffiliateConfig = {
          affiliateRate: 15,
          estimatedSales: 100,
          averageOrderValue: 50,
        };

        const result = calculateAffiliateEarnings(config);

        expect(result.categoryRateRange).toBeUndefined();
      });

      it("handles high-value categories like digital products", () => {
        const config: AffiliateConfig = {
          affiliateRate: 30,
          estimatedSales: 50,
          averageOrderValue: 100,
          category: "digital_products",
        };

        const result = calculateAffiliateEarnings(config);

        // 30% × 50 × $100 = $1,500
        expect(result.estimatedEarnings).toBe(1500);
      });

      it("handles low-value categories like tech", () => {
        const config: AffiliateConfig = {
          affiliateRate: 5,
          estimatedSales: 20,
          averageOrderValue: 500,
          category: "tech_electronics",
        };

        const result = calculateAffiliateEarnings(config);

        // 5% × 20 × $500 = $500
        expect(result.estimatedEarnings).toBe(500);
      });
    });
  });

  describe("calculateHybridPrice", () => {
    describe("hybrid pricing (50% base + affiliate)", () => {
      it("reduces base fee to 50% of full rate", () => {
        const fullRate = 1000;
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 15,
          estimatedSales: 100,
          averageOrderValue: 50,
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        expect(result.baseFee).toBe(500); // 50% of $1000
        expect(result.fullRate).toBe(1000);
        expect(result.baseDiscount).toBe(50);
      });

      it("adds affiliate earnings to base fee for combined estimate", () => {
        const fullRate = 1000;
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 15,
          estimatedSales: 100,
          averageOrderValue: 50,
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        // Base: $500 + Affiliate: $750 = $1,250
        expect(result.baseFee).toBe(500);
        expect(result.affiliateEarnings.estimatedEarnings).toBe(750);
        expect(result.combinedEstimate).toBe(1250);
      });

      it("rounds all values to nearest $5", () => {
        const fullRate = 847; // Odd number
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 12,
          estimatedSales: 33,
          averageOrderValue: 47,
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        expect(result.baseFee % 5).toBe(0);
        expect(result.fullRate % 5).toBe(0);
        expect(result.combinedEstimate % 5).toBe(0);
      });

      it("includes full affiliate breakdown", () => {
        const fullRate = 1000;
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 20,
          estimatedSales: 50,
          averageOrderValue: 75,
          category: "beauty_skincare",
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        expect(result.affiliateEarnings.commissionRate).toBe(20);
        expect(result.affiliateEarnings.estimatedSales).toBe(50);
        expect(result.affiliateEarnings.averageOrderValue).toBe(75);
        expect(result.affiliateEarnings.categoryRateRange).toBeDefined();
      });

      it("hybrid can result in higher earnings than flat fee", () => {
        const fullRate = 500;
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 30,
          estimatedSales: 100,
          averageOrderValue: 100,
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        // Base: $250 + Affiliate: $3,000 = $3,250 (much higher than $500 flat)
        expect(result.combinedEstimate).toBeGreaterThan(fullRate);
      });

      it("hybrid provides minimum guarantee even with low sales", () => {
        const fullRate = 1000;
        const affiliateConfig: AffiliateConfig = {
          affiliateRate: 10,
          estimatedSales: 5,
          averageOrderValue: 30,
        };

        const result = calculateHybridPrice(fullRate, affiliateConfig);

        // Base: $500 + Affiliate: $15 → $500 minimum guaranteed
        expect(result.baseFee).toBe(500);
        expect(result.combinedEstimate).toBeGreaterThanOrEqual(500);
      });
    });
  });

  describe("calculatePerformancePrice", () => {
    describe("performance pricing (base + bonus)", () => {
      it("keeps full base fee", () => {
        const baseFee = 1000;
        const performanceConfig: PerformanceConfig = {
          bonusThreshold: 1000,
          bonusMetric: "clicks",
          bonusAmount: 200,
        };

        const result = calculatePerformancePrice(baseFee, performanceConfig);

        expect(result.baseFee).toBe(1000);
      });

      it("adds bonus to calculate potential total", () => {
        const baseFee = 1000;
        const performanceConfig: PerformanceConfig = {
          bonusThreshold: 1000,
          bonusMetric: "clicks",
          bonusAmount: 200,
        };

        const result = calculatePerformancePrice(baseFee, performanceConfig);

        expect(result.potentialTotal).toBe(1200); // $1000 + $200 bonus
      });

      it("includes all performance config details", () => {
        const baseFee = 1500;
        const performanceConfig: PerformanceConfig = {
          bonusThreshold: 500,
          bonusMetric: "sales",
          bonusAmount: 500,
        };

        const result = calculatePerformancePrice(baseFee, performanceConfig);

        expect(result.bonusThreshold).toBe(500);
        expect(result.bonusMetric).toBe("sales");
        expect(result.bonusAmount).toBe(500);
      });

      it("rounds values to nearest $5", () => {
        const baseFee = 847;
        const performanceConfig: PerformanceConfig = {
          bonusThreshold: 1000,
          bonusMetric: "views",
          bonusAmount: 123,
        };

        const result = calculatePerformancePrice(baseFee, performanceConfig);

        expect(result.baseFee % 5).toBe(0);
        expect(result.bonusAmount % 5).toBe(0);
        expect(result.potentialTotal % 5).toBe(0);
      });

      it("handles all bonus metrics", () => {
        const baseFee = 1000;
        const metrics: Array<"clicks" | "sales" | "conversions" | "views"> = [
          "clicks", "sales", "conversions", "views"
        ];

        for (const metric of metrics) {
          const result = calculatePerformancePrice(baseFee, {
            bonusThreshold: 100,
            bonusMetric: metric,
            bonusAmount: 100,
          });

          expect(result.bonusMetric).toBe(metric);
        }
      });
    });
  });

  describe("calculatePrice with pricing models", () => {
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

    describe("pure affiliate pricing model", () => {
      it("routes to affiliate pricing when pricingModel is affiliate", () => {
        const profile = createMockProfile("micro", 25000);
        const affiliateBrief: ParsedBrief = {
          pricingModel: "affiliate",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 100,
            averageOrderValue: 50,
            category: "fashion_apparel",
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, affiliateBrief, mockFitScore);

        expect(result.pricingModel).toBe("affiliate");
        expect(result.pricePerDeliverable).toBe(0); // No flat fee for pure affiliate
        expect(result.affiliateBreakdown).toBeDefined();
        expect(result.affiliateBreakdown?.estimatedEarnings).toBe(750); // 15% × 100 × $50
      });

      it("affiliate pricing ignores follower count", () => {
        const nanoProfile = createMockProfile("nano", 5000);
        const celebrityProfile = createMockProfile("celebrity", 5000000);
        const affiliateBrief: ParsedBrief = {
          pricingModel: "affiliate",
          affiliateConfig: {
            affiliateRate: 20,
            estimatedSales: 100,
            averageOrderValue: 75,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const nanoResult = calculatePrice(nanoProfile, affiliateBrief, mockFitScore);
        const celebrityResult = calculatePrice(celebrityProfile, affiliateBrief, mockFitScore);

        // Both should have same affiliate earnings regardless of follower count
        expect(nanoResult.totalPrice).toBe(celebrityResult.totalPrice);
      });

      it("affiliate pricing has correct layer structure", () => {
        const profile = createMockProfile("micro", 25000);
        const affiliateBrief: ParsedBrief = {
          pricingModel: "affiliate",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 100,
            averageOrderValue: 50,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, affiliateBrief, mockFitScore);

        expect(result.layers).toHaveLength(4);
        expect(result.layers[0].name).toBe("Commission Rate");
        expect(result.layers[1].name).toBe("Estimated Sales");
        expect(result.layers[2].name).toBe("Average Order Value");
        expect(result.layers[3].name).toBe("Estimated Earnings");
      });

      it("affiliate pricing includes formula", () => {
        const profile = createMockProfile("micro", 25000);
        const affiliateBrief: ParsedBrief = {
          pricingModel: "affiliate",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 100,
            averageOrderValue: 50,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, affiliateBrief, mockFitScore);

        expect(result.formula).toContain("100 sales");
        expect(result.formula).toContain("$50 AOV");
        expect(result.formula).toContain("15%");
      });
    });

    describe("hybrid pricing model", () => {
      it("routes to hybrid pricing when pricingModel is hybrid", () => {
        const profile = createMockProfile("micro", 25000);
        const hybridBrief: ParsedBrief = {
          pricingModel: "hybrid",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 50,
            averageOrderValue: 40,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, hybridBrief, mockFitScore);

        expect(result.pricingModel).toBe("hybrid");
        expect(result.hybridBreakdown).toBeDefined();
        expect(result.affiliateBreakdown).toBeDefined();
      });

      it("hybrid pricing applies 50% discount to base fee", () => {
        const profile = createMockProfile("micro", 25000);
        const hybridBrief: ParsedBrief = {
          pricingModel: "hybrid",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 50,
            averageOrderValue: 40,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, hybridBrief, mockFitScore);

        // Hybrid discount should be 50%
        expect(result.hybridBreakdown?.baseDiscount).toBe(50);
        // Base fee should be 50% of full rate
        const fullRate = result.hybridBreakdown?.fullRate ?? 0;
        expect(result.hybridBreakdown?.baseFee).toBe(Math.round(fullRate / 2 / 5) * 5);
      });

      it("hybrid pricing combines base fee and affiliate", () => {
        const profile = createMockProfile("micro", 25000);
        const hybridBrief: ParsedBrief = {
          pricingModel: "hybrid",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 50,
            averageOrderValue: 40,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, hybridBrief, mockFitScore);

        const expectedCombined = result.hybridBreakdown!.baseFee + result.hybridBreakdown!.affiliateEarnings.estimatedEarnings;
        expect(result.hybridBreakdown?.combinedEstimate).toBeCloseTo(expectedCombined, -1);
      });

      it("hybrid pricing includes additional layers for discount and commission", () => {
        const profile = createMockProfile("micro", 25000);
        const hybridBrief: ParsedBrief = {
          pricingModel: "hybrid",
          affiliateConfig: {
            affiliateRate: 15,
            estimatedSales: 50,
            averageOrderValue: 40,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "sales", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, hybridBrief, mockFitScore);

        // Should have standard layers + 2 hybrid layers
        const layerNames = result.layers.map(l => l.name);
        expect(layerNames).toContain("Hybrid Discount");
        expect(layerNames).toContain("Affiliate Commission");
      });
    });

    describe("performance pricing model", () => {
      it("routes to performance pricing when pricingModel is performance", () => {
        const profile = createMockProfile("micro", 25000);
        const performanceBrief: ParsedBrief = {
          pricingModel: "performance",
          performanceConfig: {
            bonusThreshold: 1000,
            bonusMetric: "clicks",
            bonusAmount: 200,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, performanceBrief, mockFitScore);

        expect(result.pricingModel).toBe("performance");
        expect(result.performanceBreakdown).toBeDefined();
      });

      it("performance pricing keeps full base fee", () => {
        const profile = createMockProfile("micro", 25000);
        const performanceBrief: ParsedBrief = {
          pricingModel: "performance",
          performanceConfig: {
            bonusThreshold: 1000,
            bonusMetric: "clicks",
            bonusAmount: 200,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, performanceBrief, mockFitScore);

        // Total price should equal base fee (guaranteed amount)
        expect(result.totalPrice).toBe(result.performanceBreakdown?.baseFee);
      });

      it("performance pricing shows potential total with bonus", () => {
        const profile = createMockProfile("micro", 25000);
        const performanceBrief: ParsedBrief = {
          pricingModel: "performance",
          performanceConfig: {
            bonusThreshold: 1000,
            bonusMetric: "clicks",
            bonusAmount: 200,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, performanceBrief, mockFitScore);

        // Potential total should be base + bonus
        expect(result.performanceBreakdown?.potentialTotal).toBe(
          result.performanceBreakdown!.baseFee + 200
        );
      });

      it("performance pricing includes bonus layer", () => {
        const profile = createMockProfile("micro", 25000);
        const performanceBrief: ParsedBrief = {
          pricingModel: "performance",
          performanceConfig: {
            bonusThreshold: 500,
            bonusMetric: "sales",
            bonusAmount: 300,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, performanceBrief, mockFitScore);

        const layerNames = result.layers.map(l => l.name);
        expect(layerNames).toContain("Performance Bonus");
      });

      it("performance pricing includes all bonus metrics in breakdown", () => {
        const profile = createMockProfile("micro", 25000);
        const performanceBrief: ParsedBrief = {
          pricingModel: "performance",
          performanceConfig: {
            bonusThreshold: 500,
            bonusMetric: "conversions",
            bonusAmount: 300,
          },
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, performanceBrief, mockFitScore);

        expect(result.performanceBreakdown?.bonusThreshold).toBe(500);
        expect(result.performanceBreakdown?.bonusMetric).toBe("conversions");
        expect(result.performanceBreakdown?.bonusAmount).toBe(300);
      });
    });

    describe("flat_fee pricing model (default)", () => {
      it("defaults to flat_fee when pricingModel not specified", () => {
        const profile = createMockProfile("micro", 25000);
        const standardBrief: ParsedBrief = {
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const result = calculatePrice(profile, standardBrief, mockFitScore);

        expect(result.pricingModel).toBe("flat_fee");
        expect(result.affiliateBreakdown).toBeUndefined();
        expect(result.hybridBreakdown).toBeUndefined();
        expect(result.performanceBreakdown).toBeUndefined();
      });

      it("explicitly flat_fee works the same as default", () => {
        const profile = createMockProfile("micro", 25000);
        const explicitBrief: ParsedBrief = {
          pricingModel: "flat_fee",
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };
        const defaultBrief: ParsedBrief = {
          brand: { name: "Test", industry: "fashion", product: "Product" },
          campaign: { objective: "awareness", targetAudience: "women", budgetRange: "$500" },
          content: { platform: "instagram", format: "reel", quantity: 1, creativeDirection: "Test" },
          usageRights: { durationDays: 30, exclusivity: "none", paidAmplification: false },
          timeline: { deadline: "2 weeks" },
          rawText: "Test",
        };

        const explicitResult = calculatePrice(profile, explicitBrief, mockFitScore);
        const defaultResult = calculatePrice(profile, defaultBrief, mockFitScore);

        expect(explicitResult.totalPrice).toBe(defaultResult.totalPrice);
        expect(explicitResult.pricingModel).toBe("flat_fee");
      });
    });
  });
});
