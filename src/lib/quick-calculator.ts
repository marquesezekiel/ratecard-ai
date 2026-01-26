/**
 * Quick Calculator Module
 *
 * Provides instant rate estimates for creators on the landing page
 * without requiring authentication. Uses simplified calculations
 * based on follower count, platform, format, and niche.
 *
 * Key assumptions:
 * - 3% engagement rate (industry average)
 * - ±20% range to account for unknown variables
 * - US market (baseline regional multiplier)
 */

import {
  calculateTier,
  getPlatformMultiplier,
  getNichePremium,
} from "./pricing-engine";
import type {
  QuickCalculatorInput,
  QuickEstimateResult,
  RateInfluencer,
  MissingFactor,
  CreatorTier,
  Platform,
  ContentFormat,
} from "./types";

// Re-export types for convenience
export type { QuickCalculatorInput, QuickEstimateResult, RateInfluencer, MissingFactor };

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Base rates by tier (2025 industry standards).
 * Matches pricing-engine.ts BASE_RATES.
 */
const BASE_RATES: Record<CreatorTier, number> = {
  nano: 150,
  micro: 400,
  mid: 800,
  rising: 1500,
  macro: 3000,
  mega: 6000,
  celebrity: 12000,
};

/**
 * Format premium adjustments.
 * Matches pricing-engine.ts FORMAT_PREMIUMS.
 */
const FORMAT_PREMIUMS: Record<ContentFormat, number> = {
  static: 0,
  carousel: 0.15,
  story: -0.15,
  reel: 0.25,
  video: 0.35,
  live: 0.4,
  ugc: 0,
};

/**
 * Assumed engagement rate for quick estimates.
 * Industry average is approximately 3%.
 */
const ASSUMED_ENGAGEMENT_RATE = 3;

/**
 * Range percentage for min/max estimates.
 * Accounts for unknown variables like actual engagement, brand fit, etc.
 */
const ESTIMATE_RANGE_PERCENT = 0.2;

/**
 * Human-readable tier names for display.
 */
const TIER_DISPLAY_NAMES: Record<CreatorTier, string> = {
  nano: "Nano",
  micro: "Micro",
  mid: "Mid-Tier",
  rising: "Rising",
  macro: "Macro",
  mega: "Mega",
  celebrity: "Celebrity",
};

/**
 * Estimated rate ranges by tier (based on industry benchmarks, not real user data).
 * These are estimates used to show creators where their rate might fall.
 * Note: These are NOT based on aggregated user data - they are industry estimates.
 */
const ESTIMATED_TIER_RANGES: Record<CreatorTier, { p25: number; p50: number; p75: number; p90: number }> = {
  nano: { p25: 100, p50: 150, p75: 225, p90: 350 },
  micro: { p25: 275, p50: 400, p75: 550, p90: 750 },
  mid: { p25: 550, p50: 800, p75: 1100, p90: 1500 },
  rising: { p25: 1000, p50: 1500, p75: 2100, p90: 3000 },
  macro: { p25: 2000, p50: 3000, p75: 4500, p90: 6500 },
  mega: { p25: 4000, p50: 6000, p75: 9000, p90: 14000 },
  celebrity: { p25: 8000, p50: 12000, p75: 20000, p90: 35000 },
};

// =============================================================================
// MISSING FACTORS DEFINITIONS
// =============================================================================

/**
 * Individual missing factor definitions.
 * Used by getMissingFactors() to build dynamic lists.
 */
const ENGAGEMENT_FACTOR: MissingFactor = {
  name: "Your Actual Engagement",
  impact: "±30%",
  description: "High engagement = higher rates. We assumed 3% average.",
  icon: "TrendingUp",
};

const LOCATION_FACTOR: MissingFactor = {
  name: "Audience Location",
  impact: "+40%",
  description: "US/UK audiences pay significantly more than global average.",
  icon: "Globe",
};

const BRAND_WORK_FACTOR: MissingFactor = {
  name: "Past Brand Work",
  impact: "+15-25%",
  description: "Portfolio with recognizable brands justifies premium rates.",
  icon: "Briefcase",
};

const QUALITY_FACTOR: MissingFactor = {
  name: "Content Quality",
  impact: "+20-50%",
  description: "Professional production value commands higher rates.",
  icon: "Camera",
};

const AUDIENCE_DEMO_FACTOR: MissingFactor = {
  name: "Audience Demographics",
  impact: "+20-35%",
  description: "Age, income level, and interests affect brand value.",
  icon: "Users",
};

const PLATFORM_GROWTH_FACTOR: MissingFactor = {
  name: "Growth Velocity",
  impact: "+10-20%",
  description: "Fast-growing accounts command premium rates.",
  icon: "TrendingUp",
};

const NICHE_AUTHORITY_FACTOR: MissingFactor = {
  name: "Niche Authority",
  impact: "+15-30%",
  description: "Being a recognized expert in your niche adds value.",
  icon: "Award",
};

/**
 * Get missing factors dynamically based on input.
 * Returns relevant factors based on the creator's platform, tier, and format.
 *
 * @param input - The quick calculator input
 * @returns Array of missing factors (max 4)
 */
export function getMissingFactors(input: QuickCalculatorInput): MissingFactor[] {
  const factors: MissingFactor[] = [];
  const tier = calculateTier(input.followerCount);

  // Always show engagement - everyone can improve this
  factors.push(ENGAGEMENT_FACTOR);

  // Show location factor for most platforms (except LinkedIn which is more global)
  if (input.platform !== "linkedin") {
    factors.push(LOCATION_FACTOR);
  }

  // Show brand work factor for non-nano creators (they have more opportunity)
  if (tier !== "nano") {
    factors.push(BRAND_WORK_FACTOR);
  } else {
    // For nano creators, show growth potential instead
    factors.push(PLATFORM_GROWTH_FACTOR);
  }

  // Show quality factor for video formats (where production matters more)
  if (["reel", "video", "live"].includes(input.contentFormat)) {
    factors.push(QUALITY_FACTOR);
  } else if (["static", "carousel"].includes(input.contentFormat)) {
    // For static content, show niche authority
    factors.push(NICHE_AUTHORITY_FACTOR);
  }

  // For larger creators, audience demographics matter more
  if (["mid", "rising", "macro", "mega", "celebrity"].includes(tier)) {
    factors.push(AUDIENCE_DEMO_FACTOR);
  }

  // Limit to 4 factors for cleaner UI
  return factors.slice(0, 4);
}

/**
 * @deprecated Use getMissingFactors(input) instead for dynamic factors.
 * Kept for backwards compatibility - export if external code needs it.
 */
const _DEPRECATED_MISSING_FACTORS: MissingFactor[] = [
  ENGAGEMENT_FACTOR,
  LOCATION_FACTOR,
  BRAND_WORK_FACTOR,
  QUALITY_FACTOR,
];

// Export deprecated constant for any code that might still reference it
export { _DEPRECATED_MISSING_FACTORS as MISSING_FACTORS };

// =============================================================================
// RATE INFLUENCER DEFINITIONS
// =============================================================================

/**
 * Factors that could increase the base rate.
 * Shown to encourage users to sign up for full rate card.
 */
const RATE_INFLUENCERS: RateInfluencer[] = [
  {
    name: "High Engagement",
    description: "Engagement rate above 5% commands premium rates",
    potentialIncrease: "+20-60%",
  },
  {
    name: "Usage Rights",
    description: "Brands using your content in ads pay more",
    potentialIncrease: "+25-100%",
  },
  {
    name: "Exclusivity",
    description: "Not working with competitors justifies higher rates",
    potentialIncrease: "+30-50%",
  },
  {
    name: "Whitelisting",
    description: "Allowing brands to run your content as ads",
    potentialIncrease: "+50-200%",
  },
  {
    name: "Q4 Holiday Season",
    description: "Brands pay more during peak shopping seasons",
    potentialIncrease: "+15-25%",
  },
  {
    name: "Complex Production",
    description: "Multi-location shoots or professional editing",
    potentialIncrease: "+15-50%",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get engagement multiplier for the assumed 3% rate.
 * Simplified version of pricing-engine's engagement calculation.
 *
 * Brackets:
 * - < 1%: 0.8x (very low)
 * - 1-3%: 1.0x (average, baseline)
 * - 3-5%: 1.3x (good)
 * - 5-8%: 1.6x (great)
 * - 8%+: 2.0x (excellent)
 */
function getEngagementMultiplier(engagementRate: number): number {
  if (engagementRate < 1) return 0.8;
  if (engagementRate <= 3) return 1.0;
  if (engagementRate < 5) return 1.3;
  if (engagementRate < 8) return 1.6;
  return 2.0;
}

/**
 * Round to nearest $5 for professional appearance.
 */
function roundToNearestFive(price: number): number {
  return Math.round(price / 5) * 5;
}

/**
 * Calculate estimated percentile rank for a given rate within a tier.
 * Note: These percentiles are estimates based on industry benchmarks, not real user data.
 */
export function calculatePercentile(rate: number, tier: CreatorTier): number {
  const ranges = ESTIMATED_TIER_RANGES[tier];

  if (rate <= ranges.p25) return Math.round((rate / ranges.p25) * 25);
  if (rate <= ranges.p50) return 25 + Math.round(((rate - ranges.p25) / (ranges.p50 - ranges.p25)) * 25);
  if (rate <= ranges.p75) return 50 + Math.round(((rate - ranges.p50) / (ranges.p75 - ranges.p50)) * 25);
  if (rate <= ranges.p90) return 75 + Math.round(((rate - ranges.p75) / (ranges.p90 - ranges.p75)) * 15);
  return Math.min(99, 90 + Math.round(((rate - ranges.p90) / ranges.p90) * 9));
}

/**
 * Get the estimated range for top performers in this tier.
 * Note: These ranges are estimates based on industry benchmarks.
 */
export function getTopPerformerRange(tier: CreatorTier): { min: number; max: number } {
  const ranges = ESTIMATED_TIER_RANGES[tier];
  return { min: ranges.p75, max: ranges.p90 };
}

/**
 * Calculate the potential rate if engagement was high (6%+).
 * Includes engagement boost, usage rights, and exclusivity premiums.
 */
export function calculatePotentialRate(baseRate: number): number {
  // High engagement (6%+) = 1.6x multiplier
  // Plus usage rights (+50%) and exclusivity (+30%)
  return Math.round(baseRate * 1.6 * 1.5 * 1.3);
}

/**
 * Get relevant factors based on input.
 * Returns factors most likely to apply to this creator.
 */
function getRelevantFactors(
  tier: CreatorTier,
  platform: Platform,
  format: ContentFormat
): RateInfluencer[] {
  const factors: RateInfluencer[] = [];

  // Always show engagement - everyone can improve this
  factors.push(RATE_INFLUENCERS[0]);

  // Usage rights - relevant for all
  factors.push(RATE_INFLUENCERS[1]);

  // Exclusivity - more relevant for larger creators
  if (tier !== "nano") {
    factors.push(RATE_INFLUENCERS[2]);
  }

  // Whitelisting - very relevant for video/reel content
  if (format === "reel" || format === "video") {
    factors.push(RATE_INFLUENCERS[3]);
  }

  // Q4 seasonal - always relevant
  factors.push(RATE_INFLUENCERS[4]);

  // Complex production - relevant for video content
  if (format === "video" || format === "live") {
    factors.push(RATE_INFLUENCERS[5]);
  }

  // Limit to 4 factors for cleaner UI
  return factors.slice(0, 4);
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Calculate a quick rate estimate based on minimal input.
 *
 * This simplified calculation is designed for the landing page
 * to give creators an instant rate estimate without requiring signup.
 *
 * Formula:
 * BaseRate × PlatformMultiplier × EngagementMultiplier(3%) × NichePremium × FormatPremium
 *
 * Returns a ±20% range to account for:
 * - Unknown actual engagement rate
 * - Unknown brand fit/deal quality
 * - Unknown usage rights requirements
 * - Regional variations
 *
 * @param input - Minimal creator info (followers, platform, format, niche)
 * @returns Rate estimate with range and factors
 */
export function calculateQuickEstimate(
  input: QuickCalculatorInput
): QuickEstimateResult {
  const { followerCount, platform, contentFormat, niche = "lifestyle" } = input;

  // Step 1: Determine tier from follower count
  const tier = calculateTier(followerCount);
  const tierBaseRate = BASE_RATES[tier];

  // Step 2: Apply platform multiplier
  const platformMultiplier = getPlatformMultiplier(platform);
  let rate = tierBaseRate * platformMultiplier;

  // Step 3: Apply assumed engagement multiplier (3% = 1.0x)
  const engagementMultiplier = getEngagementMultiplier(ASSUMED_ENGAGEMENT_RATE);
  rate *= engagementMultiplier;

  // Step 4: Apply niche premium
  const nichePremium = getNichePremium(niche);
  rate *= nichePremium;

  // Step 5: Apply format premium
  const formatPremium = FORMAT_PREMIUMS[contentFormat];
  rate *= 1 + formatPremium;

  // Step 6: Calculate range (±20%)
  const baseRate = roundToNearestFive(rate);
  const minRate = roundToNearestFive(rate * (1 - ESTIMATE_RANGE_PERCENT));
  const maxRate = roundToNearestFive(rate * (1 + ESTIMATE_RANGE_PERCENT));

  // Step 7: Get relevant factors for this creator
  const factors = getRelevantFactors(tier, platform, contentFormat);

  return {
    minRate,
    maxRate,
    baseRate,
    tierName: TIER_DISPLAY_NAMES[tier],
    tier,
    factors,
    platform,
    contentFormat,
    niche,
    // NEW: Percentile & comparison data
    percentile: calculatePercentile(baseRate, tier),
    topPerformerRange: getTopPerformerRange(tier),
    potentialWithFullProfile: calculatePotentialRate(baseRate),
    // Dynamic missing factors based on input
    missingFactors: getMissingFactors(input),
  };
}

/**
 * Get the tier name for display purposes.
 *
 * @param tier - Creator tier
 * @returns Human-readable tier name
 */
export function getTierDisplayName(tier: CreatorTier): string {
  return TIER_DISPLAY_NAMES[tier];
}

/**
 * Get all available rate influencers.
 * Useful for showing users what factors affect their rates.
 *
 * @returns Array of all rate influencer factors
 */
export function getAllRateInfluencers(): RateInfluencer[] {
  return [...RATE_INFLUENCERS];
}
