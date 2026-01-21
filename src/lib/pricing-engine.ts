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
  DealQualityResult,
  DealQualityLevel,
  PricingResult,
  PricingLayer,
  ExclusivityLevel,
  UGCFormat,
  WhitelistingType,
  Region,
  Platform,
  AffiliateCategory,
  AffiliateConfig,
  PerformanceConfig,
  AffiliateEarningsBreakdown,
  PerformanceBonusBreakdown,
  HybridPricingBreakdown,
  PricingModel,
  DealLength,
  RetainerConfig,
  MonthlyDeliverables,
  AmbassadorPerks,
  AmbassadorExclusivityType,
  RetainerPricingBreakdown,
  DeliverableRates,
  AmbassadorPerksBreakdown,
} from "./types";
import { CURRENCIES } from "./types";

// =============================================================================
// SCORE INPUT TYPE (Accepts both FitScore and DealQuality)
// =============================================================================

/**
 * Union type that accepts either the legacy FitScoreResult or new DealQualityResult.
 * This allows the pricing engine to work with both systems during transition.
 */
export type ScoreInput = FitScoreResult | DealQualityResult;

/**
 * Type guard to check if a score input is the new DealQualityResult.
 */
function isDealQualityResult(score: ScoreInput): score is DealQualityResult {
  return "qualityLevel" in score && "recommendation" in score;
}

/**
 * Get the appropriate fit level from either score type.
 * Maps DealQualityLevel to FitLevel for pricing calculations.
 */
function getFitLevelFromScore(score: ScoreInput): FitLevel {
  if (isDealQualityResult(score)) {
    // Map DealQualityLevel to FitLevel
    const levelMap: Record<DealQualityLevel, FitLevel> = {
      excellent: "perfect",
      good: "high",
      fair: "medium",
      caution: "low",
    };
    return levelMap[score.qualityLevel];
  }
  return score.fitLevel;
}

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

/**
 * UGC (User-Generated Content) base rates.
 * UGC is priced as a SERVICE, not based on audience size.
 * These are flat rates per deliverable.
 */
const UGC_BASE_RATES: Record<UGCFormat, number> = {
  video: 175, // UGC video content
  photo: 100, // UGC photo content
};

// =============================================================================
// LAYER 1.5: REGIONAL MULTIPLIERS
// =============================================================================

/**
 * Regional rate multipliers based on creator's primary market.
 * These reflect differences in advertiser budgets and creator earning
 * potential across different geographic regions.
 *
 * United States is the baseline (1.0x). Other regions are adjusted
 * relative to US market rates.
 */
const REGIONAL_MULTIPLIERS: Record<Region, number> = {
  united_states: 1.0, // Baseline
  united_kingdom: 0.95,
  canada: 0.9,
  australia: 0.9,
  western_europe: 0.85, // Germany, France, Netherlands, etc.
  uae_gulf: 1.1, // UAE, Saudi Arabia, Qatar, etc.
  singapore_hk: 0.95, // Singapore, Hong Kong
  japan: 0.8,
  south_korea: 0.75,
  brazil: 0.6,
  mexico: 0.55,
  india: 0.4,
  southeast_asia: 0.5, // Thailand, Vietnam, Philippines, Indonesia, etc.
  eastern_europe: 0.5, // Poland, Romania, Czech Republic, etc.
  africa: 0.4,
  other: 0.7, // Default for unknown regions
};

/** Default region when not specified */
const DEFAULT_REGION: Region = "united_states";

/**
 * Human-readable display names for regions.
 */
const REGION_DISPLAY_NAMES: Record<Region, string> = {
  united_states: "United States",
  united_kingdom: "United Kingdom",
  canada: "Canada",
  australia: "Australia",
  western_europe: "Western Europe",
  uae_gulf: "UAE/Gulf States",
  singapore_hk: "Singapore/Hong Kong",
  japan: "Japan",
  south_korea: "South Korea",
  brazil: "Brazil",
  mexico: "Mexico",
  india: "India",
  southeast_asia: "Southeast Asia",
  eastern_europe: "Eastern Europe",
  africa: "Africa",
  other: "Other",
};

// =============================================================================
// LAYER 1.25: PLATFORM MULTIPLIERS
// =============================================================================

/**
 * Platform-specific base rate multipliers.
 * Different platforms have different monetization potential and advertiser demand.
 *
 * Instagram is the baseline (1.0x). Other platforms are adjusted relative
 * to Instagram's proven advertising ROI and creator monetization ecosystem.
 */
const PLATFORM_MULTIPLIERS: Record<Platform, number> = {
  instagram: 1.0, // Baseline - most established creator economy
  tiktok: 0.9, // High reach but lower conversion rates
  youtube: 1.4, // Long-form premium, high watch time
  youtube_shorts: 0.7, // Short-form, separate from long-form YouTube
  twitter: 0.7, // Lower engagement, text-focused
  threads: 0.6, // Newer platform, less proven ROI
  pinterest: 0.8, // High purchase intent, visual discovery
  linkedin: 1.3, // B2B premium, professional audience
  bluesky: 0.5, // Emerging platform, small audience
  lemon8: 0.6, // Emerging, shopping-focused
  snapchat: 0.75, // Younger demo, disappearing content
  twitch: 1.1, // Live streaming premium, high engagement
};

/** Default platform multiplier for unknown platforms */
const DEFAULT_PLATFORM_MULTIPLIER = 1.0;

/**
 * Human-readable display names for platforms.
 */
const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  youtube_shorts: "YouTube Shorts",
  twitter: "Twitter/X",
  threads: "Threads",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  bluesky: "Bluesky",
  lemon8: "Lemon8",
  snapchat: "Snapchat",
  twitch: "Twitch",
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
  ugc: 0, // Deprecated: UGC is now a deal type, not a format
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
// LAYER 5.5: WHITELISTING PREMIUM
// =============================================================================

/**
 * Whitelisting premiums based on how brand can use creator content.
 * This is separate from usage rights (duration + exclusivity) because
 * whitelisting represents additional value when brands use creator content
 * in their own channels/ads.
 *
 * - none: Content stays on creator's channels only (0%)
 * - organic: Brand can repost organically (+50%)
 * - paid_social: Brand can run as paid social ads (+100%)
 * - full_media: Full media buy - TV, OOH, digital ads (+200%)
 */
const WHITELISTING_PREMIUMS: Record<WhitelistingType, number> = {
  none: 0, // No whitelisting
  organic: 0.5, // Brand reposts (+50%)
  paid_social: 1.0, // Brand runs as paid ads (+100%)
  full_media: 2.0, // Full media buy (+200%)
};

/** Default whitelisting type */
const DEFAULT_WHITELISTING_TYPE: WhitelistingType = "none";

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
  ugc: "simple", // Deprecated: UGC is now a deal type
  carousel: "standard",
  reel: "standard",
  video: "production",
  live: "complex",
};

/**
 * Map UGC format to complexity level.
 * UGC complexity is generally simpler than sponsored content.
 */
const UGC_FORMAT_COMPLEXITY: Record<UGCFormat, ComplexityLevel> = {
  photo: "simple",
  video: "standard",
};

// =============================================================================
// LAYER 6.5: SEASONAL PRICING
// =============================================================================

/**
 * Seasonal period type for pricing adjustments.
 * Brands pay more during high-demand periods.
 */
type SeasonalPeriod = "q4_holiday" | "back_to_school" | "valentines" | "summer" | "default";

/**
 * Seasonal pricing premiums.
 * These represent demand-based adjustments for peak advertising periods.
 *
 * - Q4 Holiday (Nov 1 - Dec 31): +25% (highest demand period)
 * - Back to School (Aug 1 - Sep 15): +15% (major retail period)
 * - Valentine's (Feb 1-14): +10% (romance/gifting period)
 * - Summer (Jun 1 - Aug 31): +5% (moderate increase)
 * - Default (rest of year): 0%
 */
const SEASONAL_PREMIUMS: Record<SeasonalPeriod, number> = {
  q4_holiday: 0.25, // Nov 1 - Dec 31: +25%
  back_to_school: 0.15, // Aug 1 - Sep 15: +15%
  valentines: 0.10, // Feb 1-14: +10%
  summer: 0.05, // Jun 1 - Aug 31: +5%
  default: 0, // Rest of year: 0%
};

/**
 * Human-readable display names for seasonal periods.
 */
const SEASONAL_DISPLAY_NAMES: Record<SeasonalPeriod, string> = {
  q4_holiday: "Q4 Holiday Season (Nov-Dec)",
  back_to_school: "Back to School (Aug-Sep)",
  valentines: "Valentine's Day (Feb)",
  summer: "Summer Season (Jun-Aug)",
  default: "Standard Period",
};

// =============================================================================
// LAYER 7: AFFILIATE/PERFORMANCE PRICING
// =============================================================================

/**
 * Affiliate commission rate ranges by product category.
 * Min and max represent typical industry ranges.
 * Default rate is the midpoint recommendation.
 */
const AFFILIATE_COMMISSION_RATES: Record<AffiliateCategory, { min: number; max: number; default: number }> = {
  fashion_apparel: { min: 10, max: 20, default: 15 },
  beauty_skincare: { min: 15, max: 25, default: 20 },
  tech_electronics: { min: 5, max: 10, default: 7 },
  home_lifestyle: { min: 8, max: 15, default: 12 },
  food_beverage: { min: 10, max: 15, default: 12 },
  health_supplements: { min: 15, max: 30, default: 22 },
  digital_products: { min: 20, max: 40, default: 30 },
  services_subscriptions: { min: 15, max: 25, default: 20 },
  other: { min: 10, max: 15, default: 12 },
};

/**
 * Display names for affiliate categories.
 */
const AFFILIATE_CATEGORY_DISPLAY_NAMES: Record<AffiliateCategory, string> = {
  fashion_apparel: "Fashion/Apparel",
  beauty_skincare: "Beauty/Skincare",
  tech_electronics: "Tech/Electronics",
  home_lifestyle: "Home/Lifestyle",
  food_beverage: "Food/Beverage",
  health_supplements: "Health/Supplements",
  digital_products: "Digital Products/Courses",
  services_subscriptions: "Services/Subscriptions",
  other: "Other",
};

/**
 * Hybrid pricing base fee discount (50% of normal rate).
 */
const HYBRID_BASE_FEE_DISCOUNT = 0.5;

// =============================================================================
// LAYER 8: RETAINER/AMBASSADOR PRICING
// =============================================================================

/**
 * Volume discounts for retainer deals based on contract length.
 * Longer commitments receive better per-deliverable rates.
 */
const VOLUME_DISCOUNTS: Record<DealLength, number> = {
  one_time: 0, // No discount for single projects
  monthly: 0, // No discount for month-to-month (no commitment)
  "3_month": 0.15, // 15% discount for 3-month commitment
  "6_month": 0.25, // 25% discount for 6-month commitment
  "12_month": 0.35, // 35% discount for 12-month ambassador deals
};

/**
 * Contract months for each deal length.
 */
const CONTRACT_MONTHS: Record<DealLength, number> = {
  one_time: 1,
  monthly: 1,
  "3_month": 3,
  "6_month": 6,
  "12_month": 12,
};

/**
 * Ambassador exclusivity premiums.
 * These are multiplied by the base monthly rate.
 */
const AMBASSADOR_EXCLUSIVITY_PREMIUMS: Record<AmbassadorExclusivityType, number> = {
  none: 0, // No exclusivity premium
  category: 0.5, // +50% for category exclusivity
  full: 1.0, // +100% for full exclusivity
};

/**
 * Event day rates by creator tier.
 * Ambassadors may include event appearances in their deals.
 */
const EVENT_DAY_RATES: Record<CreatorTier, number> = {
  nano: 500,
  micro: 750,
  mid: 1000,
  rising: 1250,
  macro: 1500,
  mega: 1750,
  celebrity: 2000,
};

/**
 * Content format multipliers for per-deliverable rates.
 * Applied to base rate to get per-piece pricing.
 */
const DELIVERABLE_FORMAT_MULTIPLIERS: Record<keyof MonthlyDeliverables, number> = {
  posts: 1.0, // Static posts = base rate
  stories: 0.3, // Stories = 30% of base (ephemeral)
  reels: 1.25, // Reels = 125% of base (video premium)
  videos: 1.5, // Long-form videos = 150% of base
};

// =============================================================================
// AFFILIATE/PERFORMANCE PRICING FUNCTIONS
// =============================================================================

/**
 * Get affiliate commission rate range for a category.
 * Returns min, max, and default rates for the category.
 *
 * @param category - The affiliate product category
 * @returns Commission rate range object
 */
export function getAffiliateCategoryRates(category: AffiliateCategory | string | undefined): {
  min: number;
  max: number;
  default: number;
  displayName: string;
} {
  const normalizedCategory = (category?.toLowerCase().trim() || "other") as AffiliateCategory;
  const rates = AFFILIATE_COMMISSION_RATES[normalizedCategory] || AFFILIATE_COMMISSION_RATES.other;
  const displayName = AFFILIATE_CATEGORY_DISPLAY_NAMES[normalizedCategory] || "Other";
  return { ...rates, displayName };
}

/**
 * Calculate affiliate earnings based on commission configuration.
 *
 * Formula: (estimatedSales × averageOrderValue × commissionRate) / 100
 *
 * @param config - Affiliate configuration with rate, sales, and AOV
 * @returns Affiliate earnings breakdown
 */
export function calculateAffiliateEarnings(config: AffiliateConfig): AffiliateEarningsBreakdown {
  const { affiliateRate, estimatedSales, averageOrderValue, category } = config;

  // Calculate estimated earnings
  const estimatedEarnings = (estimatedSales * averageOrderValue * affiliateRate) / 100;

  // Get category rate range for context
  const categoryRates = category ? getAffiliateCategoryRates(category) : undefined;

  return {
    commissionRate: affiliateRate,
    estimatedSales,
    averageOrderValue,
    estimatedEarnings: roundToNearestFive(estimatedEarnings),
    categoryRateRange: categoryRates
      ? { min: categoryRates.min, max: categoryRates.max }
      : undefined,
  };
}

/**
 * Calculate hybrid pricing combining base fee with affiliate commission.
 *
 * Hybrid deals provide:
 * - 50% of the normal flat fee as guaranteed payment
 * - Plus commission on sales for additional upside
 *
 * This balances risk between creator (guaranteed income) and
 * brand (performance-based component).
 *
 * @param fullRate - The full flat fee rate (before discount)
 * @param affiliateConfig - Affiliate configuration for commission component
 * @returns Hybrid pricing breakdown
 */
export function calculateHybridPrice(
  fullRate: number,
  affiliateConfig: AffiliateConfig
): HybridPricingBreakdown {
  // Calculate discounted base fee (50% of normal rate)
  const baseFee = roundToNearestFive(fullRate * HYBRID_BASE_FEE_DISCOUNT);

  // Calculate affiliate earnings component
  const affiliateEarnings = calculateAffiliateEarnings(affiliateConfig);

  // Combined estimate (base + affiliate)
  const combinedEstimate = baseFee + affiliateEarnings.estimatedEarnings;

  return {
    baseFee,
    fullRate: roundToNearestFive(fullRate),
    baseDiscount: HYBRID_BASE_FEE_DISCOUNT * 100, // 50%
    affiliateEarnings,
    combinedEstimate: roundToNearestFive(combinedEstimate),
  };
}

/**
 * Calculate performance pricing with base fee and bonus.
 *
 * Performance deals provide:
 * - Full base fee as guaranteed payment
 * - Bonus payment when specific targets are met
 *
 * @param baseFee - The base fee (full flat fee rate)
 * @param performanceConfig - Performance configuration with threshold and bonus
 * @returns Performance bonus breakdown
 */
export function calculatePerformancePrice(
  baseFee: number,
  performanceConfig: PerformanceConfig
): PerformanceBonusBreakdown {
  const { bonusThreshold, bonusMetric, bonusAmount } = performanceConfig;

  return {
    baseFee: roundToNearestFive(baseFee),
    bonusThreshold,
    bonusMetric,
    bonusAmount: roundToNearestFive(bonusAmount),
    potentialTotal: roundToNearestFive(baseFee + bonusAmount),
  };
}

/**
 * Calculate pure affiliate pricing (commission only, no base fee).
 *
 * For affiliate-only deals, there's no guaranteed payment.
 * The creator earns entirely based on sales performance.
 *
 * @param brief - Parsed brief with affiliate configuration
 * @param profile - Creator profile (for currency)
 * @returns Complete pricing result for affiliate deal
 */
export function calculateAffiliatePricing(
  brief: ParsedBrief,
  profile: CreatorProfile
): PricingResult {
  const affiliateConfig = brief.affiliateConfig;

  if (!affiliateConfig) {
    throw new Error("Affiliate configuration required for affiliate pricing model");
  }

  const affiliateBreakdown = calculateAffiliateEarnings(affiliateConfig);
  const categoryRates = getAffiliateCategoryRates(affiliateConfig.category);

  // Get currency info from profile
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  // Build layers for display
  const layers: PricingLayer[] = [
    {
      name: "Commission Rate",
      description: `${affiliateConfig.affiliateRate}% commission on sales`,
      baseValue: `${affiliateConfig.affiliateRate}%`,
      multiplier: affiliateConfig.affiliateRate / 100,
      adjustment: 0,
    },
    {
      name: "Estimated Sales",
      description: `${affiliateConfig.estimatedSales} projected sales`,
      baseValue: affiliateConfig.estimatedSales,
      multiplier: 1,
      adjustment: 0,
    },
    {
      name: "Average Order Value",
      description: `${currencyInfo.symbol}${affiliateConfig.averageOrderValue} per order`,
      baseValue: `${currencyInfo.symbol}${affiliateConfig.averageOrderValue}`,
      multiplier: 1,
      adjustment: 0,
    },
    {
      name: "Estimated Earnings",
      description: `${categoryRates.displayName} category (typical: ${categoryRates.min}-${categoryRates.max}%)`,
      baseValue: `${currencyInfo.symbol}${affiliateBreakdown.estimatedEarnings}`,
      multiplier: 1,
      adjustment: affiliateBreakdown.estimatedEarnings,
    },
  ];

  const formula = `${affiliateConfig.estimatedSales} sales × ${currencyInfo.symbol}${affiliateConfig.averageOrderValue} AOV × ${affiliateConfig.affiliateRate}% = ${currencyInfo.symbol}${affiliateBreakdown.estimatedEarnings}`;

  return {
    pricePerDeliverable: 0, // No flat fee for pure affiliate
    quantity: brief.content.quantity,
    totalPrice: affiliateBreakdown.estimatedEarnings,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers,
    formula,
    pricingModel: "affiliate",
    affiliateBreakdown,
  };
}

/**
 * Calculate hybrid pricing (50% base fee + affiliate commission).
 *
 * Takes a standard pricing result and converts it to hybrid model:
 * - Reduces base fee to 50%
 * - Adds affiliate commission component
 * - Shows combined estimated earnings
 *
 * @param basePricing - Standard flat fee pricing result
 * @param brief - Parsed brief with affiliate configuration
 * @param profile - Creator profile (for currency)
 * @returns Complete pricing result for hybrid deal
 */
function calculateHybridPricing(
  basePricing: PricingResult,
  brief: ParsedBrief,
  profile: CreatorProfile
): PricingResult {
  const affiliateConfig = brief.affiliateConfig!;
  const hybridBreakdown = calculateHybridPrice(basePricing.totalPrice, affiliateConfig);

  // Get currency info from profile
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  // Add hybrid-specific layers
  const hybridLayers: PricingLayer[] = [
    ...basePricing.layers,
    {
      name: "Hybrid Discount",
      description: `Base fee reduced to ${100 - hybridBreakdown.baseDiscount}% for hybrid model`,
      baseValue: `-${hybridBreakdown.baseDiscount}%`,
      multiplier: HYBRID_BASE_FEE_DISCOUNT,
      adjustment: -(basePricing.totalPrice * HYBRID_BASE_FEE_DISCOUNT),
    },
    {
      name: "Affiliate Commission",
      description: `${affiliateConfig.affiliateRate}% on ${affiliateConfig.estimatedSales} est. sales`,
      baseValue: `${affiliateConfig.affiliateRate}%`,
      multiplier: 1,
      adjustment: hybridBreakdown.affiliateEarnings.estimatedEarnings,
    },
  ];

  const formula = `(${currencyInfo.symbol}${hybridBreakdown.fullRate} × 50%) + (${affiliateConfig.estimatedSales} × ${currencyInfo.symbol}${affiliateConfig.averageOrderValue} × ${affiliateConfig.affiliateRate}%) = ${currencyInfo.symbol}${hybridBreakdown.combinedEstimate}`;

  return {
    pricePerDeliverable: hybridBreakdown.baseFee,
    quantity: brief.content.quantity,
    totalPrice: hybridBreakdown.combinedEstimate,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers: hybridLayers,
    formula,
    pricingModel: "hybrid",
    hybridBreakdown,
    affiliateBreakdown: hybridBreakdown.affiliateEarnings,
  };
}

/**
 * Calculate performance pricing (base fee + performance bonus).
 *
 * Takes a standard pricing result and adds performance bonus component:
 * - Full base fee as guaranteed payment
 * - Bonus when performance targets are met
 * - Shows potential total earnings
 *
 * @param basePricing - Standard flat fee pricing result
 * @param brief - Parsed brief with performance configuration
 * @param profile - Creator profile (for currency)
 * @returns Complete pricing result for performance deal
 */
function calculatePerformancePricing(
  basePricing: PricingResult,
  brief: ParsedBrief,
  profile: CreatorProfile
): PricingResult {
  const performanceConfig = brief.performanceConfig!;
  const performanceBreakdown = calculatePerformancePrice(basePricing.totalPrice, performanceConfig);

  // Get currency info from profile
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  // Add performance-specific layer
  const performanceLayers: PricingLayer[] = [
    ...basePricing.layers,
    {
      name: "Performance Bonus",
      description: `+${currencyInfo.symbol}${performanceConfig.bonusAmount} if ${performanceConfig.bonusThreshold.toLocaleString()} ${performanceConfig.bonusMetric} reached`,
      baseValue: `${performanceConfig.bonusThreshold} ${performanceConfig.bonusMetric}`,
      multiplier: 1,
      adjustment: performanceConfig.bonusAmount,
    },
  ];

  const formula = `${currencyInfo.symbol}${performanceBreakdown.baseFee} base + ${currencyInfo.symbol}${performanceBreakdown.bonusAmount} bonus (at ${performanceBreakdown.bonusThreshold} ${performanceBreakdown.bonusMetric}) = ${currencyInfo.symbol}${performanceBreakdown.potentialTotal} potential`;

  return {
    pricePerDeliverable: basePricing.pricePerDeliverable,
    quantity: brief.content.quantity,
    totalPrice: performanceBreakdown.baseFee, // Guaranteed amount
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers: performanceLayers,
    formula,
    pricingModel: "performance",
    performanceBreakdown,
  };
}

// =============================================================================
// RETAINER/AMBASSADOR PRICING FUNCTIONS
// =============================================================================

/**
 * Get volume discount percentage for a deal length.
 *
 * @param dealLength - The deal length
 * @returns Discount percentage (0-0.35)
 */
export function getVolumeDiscount(dealLength: DealLength): number {
  return VOLUME_DISCOUNTS[dealLength] ?? 0;
}

/**
 * Get event day rate for a creator tier.
 *
 * @param tier - Creator tier
 * @returns Day rate for event appearances
 */
export function getEventDayRate(tier: CreatorTier): number {
  return EVENT_DAY_RATES[tier] ?? EVENT_DAY_RATES.micro;
}

/**
 * Calculate per-deliverable rates based on a base rate.
 * Applies format multipliers for different content types.
 *
 * @param baseRate - The base rate for a single deliverable
 * @returns Rates for each deliverable type
 */
export function calculateDeliverableRates(baseRate: number): DeliverableRates {
  return {
    postRate: roundToNearestFive(baseRate * DELIVERABLE_FORMAT_MULTIPLIERS.posts),
    storyRate: roundToNearestFive(baseRate * DELIVERABLE_FORMAT_MULTIPLIERS.stories),
    reelRate: roundToNearestFive(baseRate * DELIVERABLE_FORMAT_MULTIPLIERS.reels),
    videoRate: roundToNearestFive(baseRate * DELIVERABLE_FORMAT_MULTIPLIERS.videos),
  };
}

/**
 * Apply volume discount to deliverable rates.
 *
 * @param rates - Full deliverable rates
 * @param discountPercent - Discount percentage (0-1)
 * @returns Discounted rates
 */
function applyVolumeDiscount(rates: DeliverableRates, discountPercent: number): DeliverableRates {
  const multiplier = 1 - discountPercent;
  return {
    postRate: roundToNearestFive(rates.postRate * multiplier),
    storyRate: roundToNearestFive(rates.storyRate * multiplier),
    reelRate: roundToNearestFive(rates.reelRate * multiplier),
    videoRate: roundToNearestFive(rates.videoRate * multiplier),
  };
}

/**
 * Calculate monthly content value from deliverables and rates.
 *
 * @param deliverables - Monthly deliverables configuration
 * @param rates - Per-deliverable rates
 * @returns Total monthly content value
 */
function calculateMonthlyContentValue(
  deliverables: MonthlyDeliverables,
  rates: DeliverableRates
): number {
  return (
    deliverables.posts * rates.postRate +
    deliverables.stories * rates.storyRate +
    deliverables.reels * rates.reelRate +
    deliverables.videos * rates.videoRate
  );
}

/**
 * Calculate ambassador perks breakdown.
 *
 * @param perks - Ambassador perks configuration
 * @param tier - Creator tier (for event day rate)
 * @param monthlyContentValue - Base monthly content value (for exclusivity calculation)
 * @param contractMonths - Number of months in contract
 * @returns Ambassador perks breakdown
 */
export function calculateAmbassadorPerks(
  perks: AmbassadorPerks,
  tier: CreatorTier,
  monthlyContentValue: number,
  contractMonths: number
): AmbassadorPerksBreakdown {
  // Calculate exclusivity premium
  const exclusivityMultiplier = perks.exclusivityRequired
    ? AMBASSADOR_EXCLUSIVITY_PREMIUMS[perks.exclusivityType]
    : 0;
  const exclusivityPremium = roundToNearestFive(monthlyContentValue * exclusivityMultiplier * contractMonths);

  // Product seeding value
  const productSeedingValue = perks.productSeeding ? perks.productValue : 0;

  // Event appearances
  const eventDayRate = perks.eventsIncluded > 0 ? (perks.eventDayRate || getEventDayRate(tier)) : 0;
  const eventAppearancesValue = roundToNearestFive(perks.eventsIncluded * eventDayRate);

  // Total perks value
  const totalPerksValue = exclusivityPremium + eventAppearancesValue;

  return {
    exclusivityPremium,
    exclusivityType: perks.exclusivityType,
    productSeedingValue,
    eventsIncluded: perks.eventsIncluded,
    eventDayRate,
    eventAppearancesValue,
    totalPerksValue,
  };
}

/**
 * Calculate retainer pricing with volume discounts.
 *
 * @param baseRate - Base rate per deliverable
 * @param retainerConfig - Retainer configuration
 * @param tier - Creator tier
 * @returns Retainer pricing breakdown
 */
export function calculateRetainerPrice(
  baseRate: number,
  retainerConfig: RetainerConfig,
  tier: CreatorTier
): RetainerPricingBreakdown {
  const { dealLength, monthlyDeliverables, ambassadorPerks } = retainerConfig;

  // Get discount and contract months
  const volumeDiscount = getVolumeDiscount(dealLength);
  const contractMonths = CONTRACT_MONTHS[dealLength];

  // Calculate per-deliverable rates
  const fullRates = calculateDeliverableRates(baseRate);
  const discountedRates = applyVolumeDiscount(fullRates, volumeDiscount);

  // Calculate monthly content values
  const monthlyContentValueFull = calculateMonthlyContentValue(monthlyDeliverables, fullRates);
  const monthlyContentValueDiscounted = calculateMonthlyContentValue(monthlyDeliverables, discountedRates);
  const monthlySavings = monthlyContentValueFull - monthlyContentValueDiscounted;

  // Base monthly rate (content only)
  const monthlyRate = roundToNearestFive(monthlyContentValueDiscounted);

  // Calculate ambassador perks if present
  let ambassadorBreakdown: AmbassadorPerksBreakdown | undefined;
  if (ambassadorPerks) {
    ambassadorBreakdown = calculateAmbassadorPerks(
      ambassadorPerks,
      tier,
      monthlyContentValueDiscounted,
      contractMonths
    );
  }

  // Total contract value
  const contentContractValue = monthlyRate * contractMonths;
  const perksValue = ambassadorBreakdown?.totalPerksValue ?? 0;
  const totalContractValue = roundToNearestFive(contentContractValue + perksValue);

  return {
    dealLength,
    contractMonths,
    volumeDiscount: volumeDiscount * 100, // Convert to percentage
    fullRates,
    discountedRates,
    monthlyDeliverables,
    monthlyContentValueFull: roundToNearestFive(monthlyContentValueFull),
    monthlyContentValueDiscounted: roundToNearestFive(monthlyContentValueDiscounted),
    monthlySavings: roundToNearestFive(monthlySavings),
    monthlyRate,
    totalContractValue,
    ambassadorBreakdown,
  };
}

/**
 * Calculate retainer pricing result for the full pricing flow.
 *
 * @param basePricing - Standard flat fee pricing result
 * @param brief - Parsed brief with retainer configuration
 * @param profile - Creator profile
 * @returns Complete pricing result for retainer deal
 */
function calculateRetainerPricing(
  basePricing: PricingResult,
  brief: ParsedBrief,
  profile: CreatorProfile
): PricingResult {
  const retainerConfig = brief.retainerConfig!;
  const retainerBreakdown = calculateRetainerPrice(
    basePricing.pricePerDeliverable,
    retainerConfig,
    profile.tier
  );

  // Get currency info
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  // Build retainer-specific layers
  const retainerLayers: PricingLayer[] = [
    {
      name: "Base Rate",
      description: `${profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} tier base rate`,
      baseValue: `${currencyInfo.symbol}${basePricing.pricePerDeliverable}`,
      multiplier: 1,
      adjustment: basePricing.pricePerDeliverable,
    },
    {
      name: "Volume Discount",
      description: `${retainerBreakdown.volumeDiscount}% discount for ${retainerBreakdown.contractMonths}-month commitment`,
      baseValue: `-${retainerBreakdown.volumeDiscount}%`,
      multiplier: 1 - retainerBreakdown.volumeDiscount / 100,
      adjustment: -retainerBreakdown.monthlySavings,
    },
    {
      name: "Monthly Deliverables",
      description: `${retainerConfig.monthlyDeliverables.posts} posts, ${retainerConfig.monthlyDeliverables.stories} stories, ${retainerConfig.monthlyDeliverables.reels} reels, ${retainerConfig.monthlyDeliverables.videos} videos`,
      baseValue: `${currencyInfo.symbol}${retainerBreakdown.monthlyRate}/mo`,
      multiplier: 1,
      adjustment: retainerBreakdown.monthlyRate,
    },
    {
      name: "Contract Length",
      description: `${retainerBreakdown.contractMonths} month${retainerBreakdown.contractMonths > 1 ? 's' : ''}`,
      baseValue: `×${retainerBreakdown.contractMonths}`,
      multiplier: retainerBreakdown.contractMonths,
      adjustment: retainerBreakdown.monthlyRate * retainerBreakdown.contractMonths,
    },
  ];

  // Add ambassador perks layer if present
  if (retainerBreakdown.ambassadorBreakdown) {
    const { ambassadorBreakdown: ab } = retainerBreakdown;
    const perksDescription: string[] = [];

    if (ab.exclusivityPremium > 0) {
      perksDescription.push(`${ab.exclusivityType} exclusivity (+${currencyInfo.symbol}${ab.exclusivityPremium})`);
    }
    if (ab.eventsIncluded > 0) {
      perksDescription.push(`${ab.eventsIncluded} event${ab.eventsIncluded > 1 ? 's' : ''} (+${currencyInfo.symbol}${ab.eventAppearancesValue})`);
    }
    if (ab.productSeedingValue > 0) {
      perksDescription.push(`product seeding (${currencyInfo.symbol}${ab.productSeedingValue} value)`);
    }

    retainerLayers.push({
      name: "Ambassador Perks",
      description: perksDescription.join(', ') || 'No additional perks',
      baseValue: `+${currencyInfo.symbol}${ab.totalPerksValue}`,
      multiplier: 1,
      adjustment: ab.totalPerksValue,
    });
  }

  const formula = retainerBreakdown.ambassadorBreakdown
    ? `${currencyInfo.symbol}${retainerBreakdown.monthlyRate}/mo × ${retainerBreakdown.contractMonths} months + ${currencyInfo.symbol}${retainerBreakdown.ambassadorBreakdown.totalPerksValue} perks = ${currencyInfo.symbol}${retainerBreakdown.totalContractValue}`
    : `${currencyInfo.symbol}${retainerBreakdown.monthlyRate}/mo × ${retainerBreakdown.contractMonths} months = ${currencyInfo.symbol}${retainerBreakdown.totalContractValue}`;

  return {
    pricePerDeliverable: basePricing.pricePerDeliverable,
    quantity: retainerBreakdown.contractMonths,
    totalPrice: retainerBreakdown.totalContractValue,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers: retainerLayers,
    formula,
    pricingModel: "flat_fee",
    retainerBreakdown,
  };
}

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
 * Get regional rate multiplier based on creator's primary market.
 * Returns the multiplier for the specified region, or default (0.7x) for unknown regions.
 *
 * @param region - The creator's region identifier
 * @returns Multiplier value (e.g., 1.0 for US, 0.95 for UK, 0.4 for India)
 */
export function getRegionalMultiplier(region: string | undefined): number {
  if (!region) return REGIONAL_MULTIPLIERS[DEFAULT_REGION];
  const normalizedRegion = region.toLowerCase().trim().replace(/\s+/g, "_") as Region;
  return REGIONAL_MULTIPLIERS[normalizedRegion] ?? REGIONAL_MULTIPLIERS.other;
}

/**
 * Get display name for a region.
 */
function getRegionDisplayName(region: Region | undefined): string {
  return REGION_DISPLAY_NAMES[region || DEFAULT_REGION];
}

/**
 * Get platform-specific rate multiplier.
 * Returns the multiplier for the specified platform, or default (1.0x) for unknown platforms.
 *
 * @param platform - The target platform identifier
 * @returns Multiplier value (e.g., 1.0 for Instagram, 1.4 for YouTube, 0.5 for Bluesky)
 */
export function getPlatformMultiplier(platform: string | undefined): number {
  if (!platform) return DEFAULT_PLATFORM_MULTIPLIER;
  const normalizedPlatform = platform.toLowerCase().trim().replace(/\s+/g, "_") as Platform;
  return PLATFORM_MULTIPLIERS[normalizedPlatform] ?? DEFAULT_PLATFORM_MULTIPLIER;
}

/**
 * Get display name for a platform.
 */
function getPlatformDisplayName(platform: Platform | string | undefined): string {
  if (!platform) return "Unknown Platform";
  const normalizedPlatform = platform.toLowerCase().trim().replace(/\s+/g, "_") as Platform;
  return PLATFORM_DISPLAY_NAMES[normalizedPlatform] || platform;
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
 * Get whitelisting premium based on type.
 * Returns the premium multiplier for how brand can use creator content
 * in their own channels.
 *
 * @param type - The whitelisting type
 * @returns Premium value (e.g., 0 for none, 0.5 for organic, 1.0 for paid_social, 2.0 for full_media)
 */
export function getWhitelistingPremium(type: string | undefined): number {
  if (!type) return WHITELISTING_PREMIUMS[DEFAULT_WHITELISTING_TYPE];
  const normalizedType = type.toLowerCase().trim() as WhitelistingType;
  return WHITELISTING_PREMIUMS[normalizedType] ?? WHITELISTING_PREMIUMS[DEFAULT_WHITELISTING_TYPE];
}

/**
 * Get display name for whitelisting type.
 * Maps the whitelisting type to a human-readable description.
 */
function getWhitelistingDisplayName(type: WhitelistingType | undefined): string {
  const displayNames: Record<WhitelistingType, string> = {
    none: "No whitelisting",
    organic: "Organic reposts only",
    paid_social: "Paid social ads",
    full_media: "Full media buy (TV, OOH, digital)",
  };
  return displayNames[type || DEFAULT_WHITELISTING_TYPE];
}

/**
 * Determine the seasonal period for a given date.
 * Returns the appropriate seasonal period based on date ranges.
 *
 * Priority order (for overlapping dates like Aug 1-31):
 * 1. Back to School (Aug 1 - Sep 15) takes priority in Aug
 * 2. Summer (Jun 1 - Aug 31) applies Jun 1 - Jul 31 only due to overlap
 *
 * @param date - The date to check (defaults to current date)
 * @returns The seasonal period identifier
 */
function getSeasonalPeriod(date: Date): SeasonalPeriod {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const day = date.getDate();

  // Q4 Holiday: Nov 1 - Dec 31 (months 10-11)
  if (month === 10 || month === 11) {
    return "q4_holiday";
  }

  // Back to School: Aug 1 - Sep 15 (month 7 or month 8 day 1-15)
  if (month === 7 || (month === 8 && day <= 15)) {
    return "back_to_school";
  }

  // Valentine's: Feb 1-14 (month 1, days 1-14)
  if (month === 1 && day <= 14) {
    return "valentines";
  }

  // Summer: Jun 1 - Jul 31 (months 5-6, Aug is handled by back_to_school)
  if (month === 5 || month === 6) {
    return "summer";
  }

  // Default: Rest of year
  return "default";
}

/**
 * Get seasonal pricing premium based on campaign date.
 * Auto-detects the current season and returns appropriate premium.
 *
 * Seasonal periods and premiums:
 * - Q4 Holiday (Nov 1 - Dec 31): +25%
 * - Back to School (Aug 1 - Sep 15): +15%
 * - Valentine's (Feb 1-14): +10%
 * - Summer (Jun 1 - Aug 31): +5% (Note: Aug overlaps with Back to School)
 * - Default (rest of year): 0%
 *
 * @param date - Optional date for seasonal calculation (defaults to current date)
 * @returns Object containing the premium value and period info
 */
export function getSeasonalPremium(date?: Date | string): {
  premium: number;
  period: SeasonalPeriod;
  displayName: string;
} {
  // Parse date if string, default to current date if not provided
  let targetDate: Date;
  if (date instanceof Date) {
    targetDate = date;
  } else if (typeof date === "string") {
    targetDate = new Date(date);
    // If invalid date, default to now
    if (isNaN(targetDate.getTime())) {
      targetDate = new Date();
    }
  } else {
    targetDate = new Date();
  }

  const period = getSeasonalPeriod(targetDate);
  return {
    premium: SEASONAL_PREMIUMS[period],
    period,
    displayName: SEASONAL_DISPLAY_NAMES[period],
  };
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
// UGC PRICING FUNCTION
// =============================================================================

/**
 * Calculate pricing for UGC (User-Generated Content) deals.
 *
 * UGC is a SERVICE, not audience-based content. Pricing is based on:
 * - Base rate per deliverable type (video $175, photo $100)
 * - Usage rights (duration + exclusivity)
 * - Complexity
 *
 * UGC pricing does NOT consider:
 * - Follower count (audience size is irrelevant)
 * - Engagement rate
 * - Niche premium
 * - Fit score
 *
 * @param brief - Parsed brand brief with UGC requirements
 * @param profile - Creator profile (only used for currency)
 * @returns Complete pricing result with layer-by-layer breakdown
 */
export function calculateUGCPrice(
  brief: ParsedBrief,
  profile: CreatorProfile
): PricingResult {
  const layers: PricingLayer[] = [];

  // -------------------------------------------------------------------------
  // Layer 1: UGC Base Rate (deliverable-based)
  // -------------------------------------------------------------------------
  const ugcFormat = brief.ugcFormat || "video";
  const baseRate = UGC_BASE_RATES[ugcFormat];

  layers.push({
    name: "UGC Base Rate",
    description: `${ugcFormat.charAt(0).toUpperCase() + ugcFormat.slice(1)} content base rate`,
    baseValue: `$${baseRate}`,
    multiplier: 1,
    adjustment: baseRate,
  });

  let currentPrice = baseRate;

  // -------------------------------------------------------------------------
  // Layer 2: Usage Rights
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
  // Layer 2.5: Whitelisting Premium (UGC)
  // -------------------------------------------------------------------------
  const whitelistingType = brief.usageRights.whitelistingType || "none";
  const whitelistingPremium = getWhitelistingPremium(whitelistingType);
  const whitelistingDisplayName = getWhitelistingDisplayName(whitelistingType);

  layers.push({
    name: "Whitelisting",
    description: whitelistingDisplayName,
    baseValue: whitelistingType,
    multiplier: 1 + whitelistingPremium,
    adjustment: currentPrice * whitelistingPremium,
  });

  currentPrice *= 1 + whitelistingPremium;

  // -------------------------------------------------------------------------
  // Layer 3: Complexity
  // -------------------------------------------------------------------------
  const complexityLevel = UGC_FORMAT_COMPLEXITY[ugcFormat];
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
  // Layer 3.5: Seasonal Premium (UGC)
  // -------------------------------------------------------------------------
  let seasonalPremium = 0;
  let seasonalDisplayName = "Standard Period";

  // Only apply seasonal pricing if not disabled
  if (!brief.disableSeasonalPricing) {
    const seasonalInfo = getSeasonalPremium(brief.campaignDate);
    seasonalPremium = seasonalInfo.premium;
    seasonalDisplayName = seasonalInfo.displayName;
  }

  layers.push({
    name: "Seasonal",
    description: seasonalDisplayName,
    baseValue: brief.disableSeasonalPricing ? "disabled" : "auto",
    multiplier: 1 + seasonalPremium,
    adjustment: currentPrice * seasonalPremium,
  });

  currentPrice *= 1 + seasonalPremium;

  // -------------------------------------------------------------------------
  // Final Calculations
  // -------------------------------------------------------------------------
  const pricePerDeliverable = roundToNearestFive(currentPrice);
  const quantity = brief.content.quantity;
  const totalPrice = pricePerDeliverable * quantity;

  // Build formula string (simpler for UGC)
  const formula =
    `$${baseRate} × (1 ${formatPremium(totalRightsPremium)}) × (1 ${formatPremium(whitelistingPremium)}) × (1 ${formatPremium(complexityPremium)}) × (1 ${formatPremium(seasonalPremium)})`;

  // Get currency info from profile
  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  return {
    pricePerDeliverable,
    quantity,
    totalPrice,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers,
    formula,
  };
}

// =============================================================================
// MAIN PRICING FUNCTION
// =============================================================================

/**
 * Calculate the complete pricing breakdown for a creator-brand partnership.
 *
 * Routes to the appropriate pricing function based on deal type:
 * - "sponsored" (default): Audience-based pricing using the 7-layer engine
 * - "ugc": Deliverable-based pricing using flat rates
 *
 * @param profile - Creator's profile with platform metrics
 * @param brief - Parsed brand brief with campaign requirements
 * @param score - Either FitScoreResult (legacy) or DealQualityResult (new)
 * @returns Complete pricing result with layer-by-layer breakdown
 */
export function calculatePrice(
  profile: CreatorProfile,
  brief: ParsedBrief,
  score: ScoreInput
): PricingResult {
  // Route to UGC pricing if deal type is "ugc"
  if (brief.dealType === "ugc") {
    return calculateUGCPrice(brief, profile);
  }

  // Route to pure affiliate pricing if pricing model is "affiliate"
  if (brief.pricingModel === "affiliate") {
    return calculateAffiliatePricing(brief, profile);
  }

  // For hybrid and performance models, we need to calculate the base flat fee first,
  // then wrap with the respective model. Calculate standard pricing and then enhance.
  const basePricingResult = calculateStandardSponsoredPrice(profile, brief, score);

  // Route to hybrid pricing (50% base + affiliate)
  if (brief.pricingModel === "hybrid" && brief.affiliateConfig) {
    return calculateHybridPricing(basePricingResult, brief, profile);
  }

  // Route to performance pricing (base + bonus)
  if (brief.pricingModel === "performance" && brief.performanceConfig) {
    return calculatePerformancePricing(basePricingResult, brief, profile);
  }

  // Route to retainer pricing if retainer config is present
  if (brief.retainerConfig) {
    return calculateRetainerPricing(basePricingResult, brief, profile);
  }

  // Default: return standard sponsored pricing (flat_fee or unspecified)
  return {
    ...basePricingResult,
    pricingModel: "flat_fee",
  };
}

/**
 * Calculate standard sponsored content pricing (flat fee model).
 * This is the core 11-layer pricing engine used for flat fee and as the base for hybrid/performance.
 *
 * @param profile - Creator's profile
 * @param brief - Parsed brand brief
 * @param score - Either FitScoreResult (legacy) or DealQualityResult (new)
 */
function calculateStandardSponsoredPrice(
  profile: CreatorProfile,
  brief: ParsedBrief,
  score: ScoreInput
): PricingResult {
  // Standard sponsored content pricing
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
  // Layer 1.25: Platform Multiplier
  // -------------------------------------------------------------------------
  const platform = brief.content.platform;
  const platformMultiplier = getPlatformMultiplier(platform);
  const platformDisplayName = getPlatformDisplayName(platform);

  layers.push({
    name: "Platform",
    description: `${platformDisplayName} content rate`,
    baseValue: platform,
    multiplier: platformMultiplier,
    adjustment: currentPrice * platformMultiplier - currentPrice,
  });

  currentPrice *= platformMultiplier;

  // -------------------------------------------------------------------------
  // Layer 1.5: Regional Multiplier
  // -------------------------------------------------------------------------
  const region = profile.region || DEFAULT_REGION;
  const regionalMultiplier = getRegionalMultiplier(region);
  const regionDisplayName = getRegionDisplayName(region);

  layers.push({
    name: "Regional",
    description: `${regionDisplayName} market rate`,
    baseValue: region,
    multiplier: regionalMultiplier,
    adjustment: currentPrice * regionalMultiplier - currentPrice,
  });

  currentPrice *= regionalMultiplier;

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
  // Layer 4: Deal Quality / Fit Score Adjustment
  // -------------------------------------------------------------------------
  const fitLevel = getFitLevelFromScore(score);
  const fitAdjustment = FIT_ADJUSTMENTS[fitLevel];

  // Determine the label based on score type
  const isNewScore = isDealQualityResult(score);
  const scoreLabel = isNewScore ? "Deal Quality" : "Fit Score";
  const levelLabel = isNewScore
    ? (score as DealQualityResult).qualityLevel.charAt(0).toUpperCase() +
      (score as DealQualityResult).qualityLevel.slice(1)
    : fitLevel.charAt(0).toUpperCase() + fitLevel.slice(1);

  layers.push({
    name: scoreLabel,
    description: `${score.totalScore}/100 - ${levelLabel} ${isNewScore ? "opportunity" : "alignment"}`,
    baseValue: `${score.totalScore}/100`,
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
  // Layer 5.5: Whitelisting Premium
  // -------------------------------------------------------------------------
  const whitelistingType = brief.usageRights.whitelistingType || "none";
  const whitelistingPremium = getWhitelistingPremium(whitelistingType);
  const whitelistingDisplayName = getWhitelistingDisplayName(whitelistingType);

  layers.push({
    name: "Whitelisting",
    description: whitelistingDisplayName,
    baseValue: whitelistingType,
    multiplier: 1 + whitelistingPremium,
    adjustment: currentPrice * whitelistingPremium,
  });

  currentPrice *= 1 + whitelistingPremium;

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
  // Layer 6.5: Seasonal Premium
  // -------------------------------------------------------------------------
  let seasonalPremium = 0;
  let seasonalDisplayName = "Standard Period";

  // Only apply seasonal pricing if not disabled
  if (!brief.disableSeasonalPricing) {
    const seasonalInfo = getSeasonalPremium(brief.campaignDate);
    seasonalPremium = seasonalInfo.premium;
    seasonalDisplayName = seasonalInfo.displayName;
  }

  layers.push({
    name: "Seasonal",
    description: seasonalDisplayName,
    baseValue: brief.disableSeasonalPricing ? "disabled" : "auto",
    multiplier: 1 + seasonalPremium,
    adjustment: currentPrice * seasonalPremium,
  });

  currentPrice *= 1 + seasonalPremium;

  // -------------------------------------------------------------------------
  // Final Calculations
  // -------------------------------------------------------------------------
  const pricePerDeliverable = roundToNearestFive(currentPrice);
  const quantity = brief.content.quantity;
  const totalPrice = pricePerDeliverable * quantity;

  // Build formula string
  const formula =
    `($${baseRate} × ${platformMultiplier.toFixed(2)} × ${regionalMultiplier.toFixed(2)} × ${engagementMultiplier.toFixed(1)} × ${nichePremiumMultiplier.toFixed(1)}) ` +
    `× (1 ${formatPremium(formatPremiumValue)}) ` +
    `× (1 ${formatPremium(fitAdjustment)}) ` +
    `× (1 ${formatPremium(totalRightsPremium)}) ` +
    `× (1 ${formatPremium(whitelistingPremium)}) ` +
    `× (1 ${formatPremium(complexityPremium)}) ` +
    `× (1 ${formatPremium(seasonalPremium)})`;

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
