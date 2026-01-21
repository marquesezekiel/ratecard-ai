/**
 * RateCard.AI 6-Layer Pricing Engine
 *
 * This is the core intellectual property of RateCard.AI.
 * The engine calculates fair sponsorship rates using a transparent,
 * data-backed formula that creators can understand and defend.
 *
 * Formula: (Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)
 */

import type {
  CreatorProfile,
  CreatorTier,
  ParsedBrief,
  ContentFormat,
  FitScoreResult,
  FitLevel,
  PricingResult,
  PricingLayer,
  ExclusivityLevel,
} from "./types";
import { CURRENCIES } from "./types";

// =============================================================================
// LAYER 1: BASE RATES BY TIER
// =============================================================================

/**
 * Base rates in USD based on creator tier.
 * These represent the starting point for a single deliverable.
 * Updated to 2025 industry standards.
 */
const BASE_RATES: Record<CreatorTier, number> = {
  nano: 150, // 1K-10K followers
  micro: 400, // 10K-50K followers
  mid: 800, // 50K-100K followers
  rising: 1500, // 100K-250K followers
  macro: 3000, // 250K-500K followers
  mega: 6000, // 500K-1M followers
  celebrity: 12000, // 1M+ followers
};

// =============================================================================
// LAYER 2: ENGAGEMENT MULTIPLIERS
// =============================================================================

/**
 * Engagement rate thresholds and their multipliers.
 * Higher engagement = more valuable audience = higher rates.
 */
const ENGAGEMENT_THRESHOLDS = [
  { maxRate: 1, multiplier: 0.8 }, // <1%: Below average
  { maxRate: 3, multiplier: 1.0 }, // 1-3%: Average
  { maxRate: 5, multiplier: 1.3 }, // 3-5%: Good
  { maxRate: 8, multiplier: 1.6 }, // 5-8%: Great
  { maxRate: Infinity, multiplier: 2.0 }, // 8%+: Exceptional
];

// =============================================================================
// LAYER 2.5: NICHE/INDUSTRY PREMIUM
// =============================================================================

/**
 * Niche/industry premium multipliers.
 * Different niches command different rates based on advertiser demand
 * and audience purchasing power.
 */
const NICHE_PREMIUMS: Record<string, number> = {
  // High-value niches (high advertiser demand, high-intent audiences)
  finance: 2.0,
  investing: 2.0,
  "b2b": 1.8,
  business: 1.8,
  tech: 1.7,
  software: 1.7,
  technology: 1.7,
  legal: 1.7,
  medical: 1.7,
  healthcare: 1.7,
  luxury: 1.5,
  "high-end fashion": 1.5,

  // Premium niches
  beauty: 1.3,
  skincare: 1.3,
  cosmetics: 1.3,
  fitness: 1.2,
  wellness: 1.2,
  health: 1.2,

  // Standard niches
  food: 1.15,
  cooking: 1.15,
  recipes: 1.15,
  travel: 1.15,
  parenting: 1.1,
  family: 1.1,
  motherhood: 1.1,

  // Baseline niches
  lifestyle: 1.0,
  entertainment: 1.0,
  comedy: 1.0,
  music: 1.0,

  // Below baseline
  gaming: 0.95,
  esports: 0.95,
};

/** Default multiplier for unknown niches */
const DEFAULT_NICHE_PREMIUM = 1.0;

// =============================================================================
// LAYER 3: FORMAT PREMIUMS
// =============================================================================

/**
 * Content format price adjustments.
 * More complex formats command higher premiums.
 */
const FORMAT_PREMIUMS: Record<ContentFormat, number> = {
  static: 0, // Standard image post
  carousel: 0.15, // Multiple images, more effort
  story: -0.15, // Ephemeral, less production
  reel: 0.25, // Short-form video
  video: 0.35, // Long-form video
  live: 0.4, // Real-time, high effort
  ugc: -0.25, // User-generated, less polish expected
};

// =============================================================================
// LAYER 4: FIT SCORE ADJUSTMENTS
// =============================================================================

/**
 * Price adjustments based on creator-brand fit.
 * Better fit = more value = higher justified rates.
 */
const FIT_ADJUSTMENTS: Record<FitLevel, number> = {
  perfect: 0.25, // 85-100: Premium alignment
  high: 0.15, // 65-84: Strong alignment
  medium: 0, // 40-64: Acceptable alignment
  low: -0.1, // 0-39: Poor alignment
};

// =============================================================================
// LAYER 5: USAGE RIGHTS
// =============================================================================

/**
 * Duration-based usage rights premiums.
 * Longer usage = more value extracted = higher compensation.
 */
const DURATION_TIERS = [
  { maxDays: 0, premium: 0 }, // Content only, no paid usage
  { maxDays: 30, premium: 0.25 }, // 1 month
  { maxDays: 60, premium: 0.35 }, // 2 months
  { maxDays: 90, premium: 0.45 }, // 3 months
  { maxDays: 180, premium: 0.6 }, // 6 months
  { maxDays: 365, premium: 0.8 }, // 1 year
  { maxDays: Infinity, premium: 1.0 }, // Perpetual
];

/**
 * Exclusivity premiums based on competitive restrictions.
 */
const EXCLUSIVITY_PREMIUMS: Record<ExclusivityLevel, number> = {
  none: 0, // No restrictions
  category: 0.3, // Can't work with competitors
  full: 0.5, // Can't work with any other brands
};

// =============================================================================
// LAYER 6: COMPLEXITY
// =============================================================================

/**
 * Complexity levels based on production requirements.
 */
type ComplexityLevel = "simple" | "standard" | "complex" | "production";

const COMPLEXITY_PREMIUMS: Record<ComplexityLevel, number> = {
  simple: 0, // Basic content, minimal editing
  standard: 0.15, // Some editing, decent production
  complex: 0.3, // Multi-location, props, styling
  production: 0.5, // Professional crew, equipment
};

/**
 * Map content format to expected complexity level.
 */
const FORMAT_COMPLEXITY: Record<ContentFormat, ComplexityLevel> = {
  static: "simple",
  story: "simple",
  ugc: "simple",
  carousel: "standard",
  reel: "standard",
  video: "production",
  live: "complex",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate creator tier based on total follower count.
 *
 * Tier boundaries (2025 industry standards):
 * - nano: 1K-10K followers
 * - micro: 10K-50K followers
 * - mid: 50K-100K followers
 * - rising: 100K-250K followers
 * - macro: 250K-500K followers
 * - mega: 500K-1M followers
 * - celebrity: 1M+ followers
 */
export function calculateTier(followers: number): CreatorTier {
  if (followers >= 1000000) return "celebrity";
  if (followers >= 500000) return "mega";
  if (followers >= 250000) return "macro";
  if (followers >= 100000) return "rising";
  if (followers >= 50000) return "mid";
  if (followers >= 10000) return "micro";
  return "nano";
}

/**
 * Get engagement rate multiplier.
 */
function getEngagementMultiplier(engagementRate: number): number {
  for (const threshold of ENGAGEMENT_THRESHOLDS) {
    if (engagementRate < threshold.maxRate) {
      return threshold.multiplier;
    }
  }
  return ENGAGEMENT_THRESHOLDS[ENGAGEMENT_THRESHOLDS.length - 1].multiplier;
}

/**
 * Get niche/industry premium multiplier.
 * Looks up the niche in the NICHE_PREMIUMS map, returning the default if not found.
 *
 * @param niche - The creator's primary niche or content category
 * @returns Multiplier value (e.g., 2.0 for finance, 1.0 for lifestyle)
 */
export function getNichePremium(niche: string): number {
  const normalizedNiche = niche.toLowerCase().trim();
  return NICHE_PREMIUMS[normalizedNiche] ?? DEFAULT_NICHE_PREMIUM;
}

/**
 * Get the display name for a niche premium.
 * Maps the niche to a human-readable category name.
 */
function getNicheCategoryName(niche: string): string {
  const normalizedNiche = niche.toLowerCase().trim();

  // Map niches to display categories
  const categoryMap: Record<string, string> = {
    finance: "Finance/Investing",
    investing: "Finance/Investing",
    "b2b": "B2B/Business",
    business: "B2B/Business",
    tech: "Tech/Software",
    software: "Tech/Software",
    technology: "Tech/Software",
    legal: "Legal/Medical",
    medical: "Legal/Medical",
    healthcare: "Legal/Medical",
    luxury: "Luxury/High-end Fashion",
    "high-end fashion": "Luxury/High-end Fashion",
    beauty: "Beauty/Skincare",
    skincare: "Beauty/Skincare",
    cosmetics: "Beauty/Skincare",
    fitness: "Fitness/Wellness",
    wellness: "Fitness/Wellness",
    health: "Fitness/Wellness",
    food: "Food/Cooking",
    cooking: "Food/Cooking",
    recipes: "Food/Cooking",
    travel: "Travel",
    parenting: "Parenting/Family",
    family: "Parenting/Family",
    motherhood: "Parenting/Family",
    lifestyle: "Lifestyle",
    entertainment: "Entertainment/Comedy",
    comedy: "Entertainment/Comedy",
    music: "Entertainment/Comedy",
    gaming: "Gaming",
    esports: "Gaming",
  };

  return categoryMap[normalizedNiche] || "Other";
}

/**
 * Get duration-based usage rights premium.
 */
function getDurationPremium(durationDays: number): number {
  for (const tier of DURATION_TIERS) {
    if (durationDays <= tier.maxDays) {
      return tier.premium;
    }
  }
  return DURATION_TIERS[DURATION_TIERS.length - 1].premium;
}

/**
 * Get complexity level for a content format.
 */
function getComplexity(format: ContentFormat): ComplexityLevel {
  return FORMAT_COMPLEXITY[format];
}

/**
 * Round price to nearest $5 for professional appearance.
 */
function roundToNearestFive(price: number): number {
  return Math.round(price / 5) * 5;
}

/**
 * Format a premium as a percentage string (e.g., 0.25 → "+25%")
 */
function formatPremium(value: number): string {
  const percent = Math.round(value * 100);
  if (percent === 0) return "0%";
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}

// =============================================================================
// MAIN PRICING FUNCTION
// =============================================================================

/**
 * Calculate the complete pricing breakdown for a creator-brand partnership.
 *
 * @param profile - Creator's profile with platform metrics
 * @param brief - Parsed brand brief with campaign requirements
 * @param fitScore - Calculated fit score result
 * @returns Complete pricing result with layer-by-layer breakdown
 */
export function calculatePrice(
  profile: CreatorProfile,
  brief: ParsedBrief,
  fitScore: FitScoreResult
): PricingResult {
  const layers: PricingLayer[] = [];

  // -------------------------------------------------------------------------
  // Layer 1: Base Rate
  // -------------------------------------------------------------------------
  const tier = profile.tier;
  const baseRate = BASE_RATES[tier];

  layers.push({
    name: "Base Rate",
    description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier creator rate`,
    baseValue: `$${baseRate}`,
    multiplier: 1,
    adjustment: baseRate,
  });

  let currentPrice = baseRate;

  // -------------------------------------------------------------------------
  // Layer 2: Engagement Multiplier
  // -------------------------------------------------------------------------
  const engagementRate = profile.avgEngagementRate;
  const engagementMultiplier = getEngagementMultiplier(engagementRate);

  layers.push({
    name: "Engagement Multiplier",
    description: `${engagementRate.toFixed(1)}% engagement rate`,
    baseValue: `${engagementRate.toFixed(1)}%`,
    multiplier: engagementMultiplier,
    adjustment: currentPrice * engagementMultiplier - currentPrice,
  });

  currentPrice *= engagementMultiplier;

  // -------------------------------------------------------------------------
  // Layer 2.5: Niche Premium
  // -------------------------------------------------------------------------
  // Use the creator's primary niche (first in the list) for premium calculation
  const primaryNiche = profile.niches[0] || "lifestyle";
  const nichePremiumMultiplier = getNichePremium(primaryNiche);
  const nicheCategoryName = getNicheCategoryName(primaryNiche);

  layers.push({
    name: "Niche Premium",
    description: `${nicheCategoryName} content commands ${nichePremiumMultiplier}x rates`,
    baseValue: primaryNiche,
    multiplier: nichePremiumMultiplier,
    adjustment: currentPrice * nichePremiumMultiplier - currentPrice,
  });

  currentPrice *= nichePremiumMultiplier;

  // -------------------------------------------------------------------------
  // Layer 3: Format Premium
  // -------------------------------------------------------------------------
  const format = brief.content.format;
  const formatPremiumValue = FORMAT_PREMIUMS[format];

  layers.push({
    name: "Format Premium",
    description: `${format.charAt(0).toUpperCase() + format.slice(1)} content type`,
    baseValue: format,
    multiplier: 1 + formatPremiumValue,
    adjustment: currentPrice * formatPremiumValue,
  });

  currentPrice *= 1 + formatPremiumValue;

  // -------------------------------------------------------------------------
  // Layer 4: Fit Score Adjustment
  // -------------------------------------------------------------------------
  const fitLevel = fitScore.fitLevel;
  const fitAdjustment = FIT_ADJUSTMENTS[fitLevel];

  layers.push({
    name: "Fit Score",
    description: `${fitScore.totalScore}/100 - ${fitLevel.charAt(0).toUpperCase() + fitLevel.slice(1)} alignment`,
    baseValue: `${fitScore.totalScore}/100`,
    multiplier: 1 + fitAdjustment,
    adjustment: currentPrice * fitAdjustment,
  });

  currentPrice *= 1 + fitAdjustment;

  // -------------------------------------------------------------------------
  // Layer 5: Usage Rights
  // -------------------------------------------------------------------------
  const durationDays = brief.usageRights.durationDays;
  const exclusivity = brief.usageRights.exclusivity;
  const durationPremium = getDurationPremium(durationDays);
  const exclusivityPremium = EXCLUSIVITY_PREMIUMS[exclusivity];
  const totalRightsPremium = durationPremium + exclusivityPremium;

  let rightsDescription = "";
  if (durationDays === 0) {
    rightsDescription = "Content only, no paid usage";
  } else if (durationDays >= 365) {
    rightsDescription = "Perpetual usage rights";
  } else {
    rightsDescription = `${durationDays}-day usage rights`;
  }
  if (exclusivity !== "none") {
    rightsDescription += `, ${exclusivity} exclusivity`;
  }

  layers.push({
    name: "Usage Rights",
    description: rightsDescription,
    baseValue: `${durationDays} days`,
    multiplier: 1 + totalRightsPremium,
    adjustment: currentPrice * totalRightsPremium,
  });

  currentPrice *= 1 + totalRightsPremium;

  // -------------------------------------------------------------------------
  // Layer 6: Complexity
  // -------------------------------------------------------------------------
  const complexityLevel = getComplexity(format);
  const complexityPremium = COMPLEXITY_PREMIUMS[complexityLevel];

  layers.push({
    name: "Complexity",
    description: `${complexityLevel.charAt(0).toUpperCase() + complexityLevel.slice(1)} production requirements`,
    baseValue: complexityLevel,
    multiplier: 1 + complexityPremium,
    adjustment: currentPrice * complexityPremium,
  });

  currentPrice *= 1 + complexityPremium;

  // -------------------------------------------------------------------------
  // Final Calculations
  // -------------------------------------------------------------------------
  const pricePerDeliverable = roundToNearestFive(currentPrice);
  const quantity = brief.content.quantity;
  const totalPrice = pricePerDeliverable * quantity;

  // Build formula string
  const formula =
    `($${baseRate} × ${engagementMultiplier.toFixed(1)} × ${nichePremiumMultiplier.toFixed(1)}) ` +
    `× (1 ${formatPremium(formatPremiumValue)}) ` +
    `× (1 ${formatPremium(fitAdjustment)}) ` +
    `× (1 ${formatPremium(totalRightsPremium)}) ` +
    `× (1 ${formatPremium(complexityPremium)})`;

  // Get currency info from profile
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  return {
    pricePerDeliverable,
    quantity,
    totalPrice,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14, // Quote valid for 2 weeks
    layers,
    formula,
  };
}
