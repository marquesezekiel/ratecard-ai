/**
 * RateCard.AI Type Definitions
 *
 * This file contains all shared TypeScript interfaces used throughout the application.
 * Types are organized by domain: Platform, Creator, Brief, Scoring, Pricing, and API.
 */

// =============================================================================
// CURRENCY TYPES
// =============================================================================

/**
 * Supported currency codes for rate card generation.
 */
export type CurrencyCode = "USD" | "GBP" | "EUR" | "CAD" | "AUD" | "BRL" | "INR" | "MXN";

/**
 * Currency configuration with symbol and display name.
 */
export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
];

// =============================================================================
// PLATFORM TYPES
// =============================================================================

/**
 * Metrics for a single social media platform.
 * Used to track creator performance across Instagram, TikTok, YouTube, and Twitter.
 */
export interface PlatformMetrics {
  /** Total number of followers on this platform */
  followers: number;
  /** Engagement rate as a percentage (e.g., 4.2 means 4.2%) */
  engagementRate: number;
  /** Average likes per post */
  avgLikes: number;
  /** Average comments per post */
  avgComments: number;
  /** Average views per post (primarily for video content) */
  avgViews: number;
}

/**
 * Supported social media platforms for rate card generation.
 * Each platform has different base rate multipliers in the pricing engine.
 *
 * Platform multipliers (relative to Instagram baseline):
 * - instagram: 1.0x (baseline)
 * - tiktok: 0.9x
 * - youtube: 1.4x (long-form premium)
 * - youtube_shorts: 0.7x (short-form, separate from long-form)
 * - twitter: 0.7x
 * - threads: 0.6x (newer, less proven ROI)
 * - pinterest: 0.8x (high purchase intent)
 * - linkedin: 1.3x (B2B premium)
 * - bluesky: 0.5x (emerging)
 * - lemon8: 0.6x (emerging, shopping-focused)
 * - snapchat: 0.75x
 * - twitch: 1.1x (live streaming premium)
 */
export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "youtube_shorts"
  | "twitter"
  | "threads"
  | "pinterest"
  | "linkedin"
  | "bluesky"
  | "lemon8"
  | "snapchat"
  | "twitch";

/**
 * Content format types supported for deliverables.
 * Each format has different pricing premiums in the 6-Layer Pricing Engine.
 */
export type ContentFormat =
  | "static"
  | "carousel"
  | "story"
  | "reel"
  | "video"
  | "live"
  | "ugc";

// =============================================================================
// CREATOR TYPES
// =============================================================================

/**
 * Audience demographic breakdown for a creator's followers.
 * Used in fit score calculations to match creator audiences with brand targets.
 */
export interface AudienceDemographics {
  /** Primary age range of the audience (e.g., "18-24", "25-34") */
  ageRange: string;
  /** Gender distribution as percentages (should sum to 100) */
  genderSplit: {
    male: number;
    female: number;
    other: number;
  };
  /** Top geographic locations of the audience (up to 5) */
  topLocations: string[];
  /** Primary interests/categories of the audience */
  interests: string[];
}

/**
 * Creator tier based on total follower count.
 * Determines the base rate in Layer 1 of the pricing engine.
 *
 * Tier boundaries (2025 industry standards):
 * - nano: 1K-10K followers ($150)
 * - micro: 10K-50K followers ($400)
 * - mid: 50K-100K followers ($800)
 * - rising: 100K-250K followers ($1,500)
 * - macro: 250K-500K followers ($3,000)
 * - mega: 500K-1M followers ($6,000)
 * - celebrity: 1M+ followers ($12,000)
 */
export type CreatorTier = "nano" | "micro" | "mid" | "rising" | "macro" | "mega" | "celebrity";

/**
 * Geographic region for regional rate adjustments.
 * Determines the regional multiplier in Layer 1.5 of the pricing engine.
 *
 * Regional multipliers reflect market differences in advertiser budgets
 * and creator earning potential by geography.
 */
export type Region =
  | "united_states"
  | "united_kingdom"
  | "canada"
  | "australia"
  | "western_europe"
  | "uae_gulf"
  | "singapore_hk"
  | "japan"
  | "south_korea"
  | "brazil"
  | "mexico"
  | "india"
  | "southeast_asia"
  | "eastern_europe"
  | "africa"
  | "other";

/**
 * Complete creator profile with platform metrics and audience data.
 * Core entity used for fit score and pricing calculations.
 */
export interface CreatorProfile {
  /** Unique identifier for the profile */
  id: string;
  /** Reference to the authenticated user */
  userId: string;
  /** Public display name (e.g., "Maya Creates") */
  displayName: string;
  /** Primary social handle without @ (e.g., "maya.creates") */
  handle: string;
  /** Short bio/description */
  bio: string;
  /** Geographic location (e.g., "United States") */
  location: string;
  /**
   * Geographic region for rate adjustments.
   * Defaults to "united_states" if not specified.
   * Used in Layer 1.5 of the pricing engine.
   */
  region?: Region;
  /** Content niches/categories (max 5, e.g., ["lifestyle", "fashion"]) */
  niches: string[];
  /** Instagram platform metrics (optional) */
  instagram?: PlatformMetrics;
  /** TikTok platform metrics (optional) */
  tiktok?: PlatformMetrics;
  /** YouTube platform metrics (optional) */
  youtube?: PlatformMetrics;
  /** Twitter/X platform metrics (optional) */
  twitter?: PlatformMetrics;
  /** Audience demographic information */
  audience: AudienceDemographics;
  /** Calculated tier based on total followers */
  tier: CreatorTier;
  /** Sum of followers across all platforms */
  totalReach: number;
  /** Weighted average engagement rate across platforms */
  avgEngagementRate: number;
  /** Preferred currency for rate cards */
  currency: CurrencyCode;
  /** Profile creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

// =============================================================================
// BRIEF TYPES
// =============================================================================

/**
 * Exclusivity level for usage rights.
 * Affects Layer 5 of the pricing engine.
 */
export type ExclusivityLevel = "none" | "category" | "full";

/**
 * Deal type determines the pricing model used.
 * - "sponsored": Audience-based pricing (follower count, engagement, niche matter)
 * - "ugc": Deliverable-based pricing (flat rate per asset, audience size irrelevant)
 */
export type DealType = "sponsored" | "ugc";

/**
 * Pricing model determines how compensation is structured.
 * - "flat_fee": Standard one-time payment (default)
 * - "affiliate": Commission-only based on sales
 * - "hybrid": Base fee + commission on sales
 * - "performance": Base fee + bonus for hitting targets
 */
export type PricingModel = "flat_fee" | "affiliate" | "hybrid" | "performance";

/**
 * Deal length determines volume discounts for retainer/ambassador deals.
 * Longer commitments receive better per-deliverable rates.
 *
 * Volume discounts:
 * - one_time: 0% discount (single project)
 * - monthly: 0% discount (month-to-month, no commitment)
 * - 3_month: 15% discount per deliverable
 * - 6_month: 25% discount per deliverable
 * - 12_month: 35% discount per deliverable (ambassador level)
 */
export type DealLength = "one_time" | "monthly" | "3_month" | "6_month" | "12_month";

/**
 * Exclusivity type for ambassador deals.
 * Determines additional compensation for exclusivity requirements.
 *
 * - "none": No exclusivity required
 * - "category": Cannot work with competing brands in same category
 * - "full": Cannot work with any other brands
 */
export type AmbassadorExclusivityType = "none" | "category" | "full";

/**
 * Monthly deliverables configuration for retainer deals.
 * Specifies the number of each content type per month.
 */
export interface MonthlyDeliverables {
  /** Number of static posts per month */
  posts: number;
  /** Number of stories per month */
  stories: number;
  /** Number of reels/short videos per month */
  reels: number;
  /** Number of long-form videos per month */
  videos: number;
}

/**
 * Ambassador perks configuration for long-term partnerships.
 * These additional benefits affect total deal value.
 */
export interface AmbassadorPerks {
  /** Whether exclusivity is required for this deal */
  exclusivityRequired: boolean;
  /** Type of exclusivity if required */
  exclusivityType: AmbassadorExclusivityType;
  /** Whether product seeding is included */
  productSeeding: boolean;
  /** Estimated retail value of seeded products */
  productValue: number;
  /** Number of event appearances included */
  eventsIncluded: number;
  /** Day rate for event appearances */
  eventDayRate: number;
}

/**
 * Retainer deal configuration for ongoing partnerships.
 */
export interface RetainerConfig {
  /** Duration of the retainer agreement */
  dealLength: DealLength;
  /** Monthly deliverables breakdown */
  monthlyDeliverables: MonthlyDeliverables;
  /** Ambassador perks (optional, typically for 12-month deals) */
  ambassadorPerks?: AmbassadorPerks;
}

/**
 * Affiliate product category for commission rate lookup.
 * Different categories have different typical commission rates.
 */
export type AffiliateCategory =
  | "fashion_apparel"
  | "beauty_skincare"
  | "tech_electronics"
  | "home_lifestyle"
  | "food_beverage"
  | "health_supplements"
  | "digital_products"
  | "services_subscriptions"
  | "other";

/**
 * Affiliate deal configuration for commission-based earnings.
 */
export interface AffiliateConfig {
  /** Commission rate as a percentage (e.g., 15 means 15%) */
  affiliateRate: number;
  /** Estimated number of sales to project earnings */
  estimatedSales: number;
  /** Average order value in currency units */
  averageOrderValue: number;
  /** Product category for commission rate benchmarks */
  category?: AffiliateCategory;
}

/**
 * Performance deal configuration for bonus-based compensation.
 */
export interface PerformanceConfig {
  /** Threshold to trigger bonus (e.g., 1000 clicks, 500 sales) */
  bonusThreshold: number;
  /** Type of metric for the threshold */
  bonusMetric: "clicks" | "sales" | "conversions" | "views";
  /** Bonus amount when threshold is met */
  bonusAmount: number;
}

/**
 * UGC content format for deliverable-based pricing.
 * Used when dealType is "ugc".
 */
export type UGCFormat = "video" | "photo";

/**
 * Whitelisting type determines how the brand can use creator content in their own channels.
 * This is separate from usage rights (duration + exclusivity) and represents additional value.
 *
 * - "none": No whitelisting, content stays on creator's channels only
 * - "organic": Brand can repost content organically (no paid amplification)
 * - "paid_social": Brand can run content as paid social ads
 * - "full_media": Full media buy rights (TV, OOH, digital ads, all channels)
 */
export type WhitelistingType = "none" | "organic" | "paid_social" | "full_media";

/**
 * Parsed and structured brand brief data.
 * Extracted from uploaded PDF/DOCX files or pasted text using LLM parsing.
 */
export interface ParsedBrief {
  /** Unique identifier (set after database persistence) */
  id?: string;
  /**
   * Deal type determines pricing model.
   * - "sponsored": Audience-based (default, current behavior)
   * - "ugc": Deliverable-based (flat rate per asset)
   */
  dealType?: DealType;
  /**
   * UGC format when dealType is "ugc".
   * Determines base rate: video ($175) or photo ($100).
   */
  ugcFormat?: UGCFormat;
  /**
   * Pricing model determines compensation structure.
   * - "flat_fee": Standard one-time payment (default)
   * - "affiliate": Commission-only based on sales
   * - "hybrid": Base fee (50%) + commission
   * - "performance": Base fee + bonus for hitting targets
   */
  pricingModel?: PricingModel;
  /**
   * Affiliate configuration for "affiliate" and "hybrid" pricing models.
   * Required when pricingModel is "affiliate" or "hybrid".
   */
  affiliateConfig?: AffiliateConfig;
  /**
   * Performance configuration for "performance" pricing model.
   * Required when pricingModel is "performance".
   */
  performanceConfig?: PerformanceConfig;
  /**
   * Retainer configuration for ongoing/ambassador deals.
   * When present, enables retainer pricing with volume discounts.
   */
  retainerConfig?: RetainerConfig;
  /** Brand/company information */
  brand: {
    /** Company or brand name */
    name: string;
    /** Industry vertical (e.g., "beauty", "fashion", "tech") */
    industry: string;
    /** Specific product or service being promoted */
    product: string;
  };
  /** Campaign details */
  campaign: {
    /** Primary campaign goal (e.g., "awareness", "conversion") */
    objective: string;
    /** Description of the target audience */
    targetAudience: string;
    /** Budget range if specified (e.g., "$500-1000") */
    budgetRange: string;
  };
  /** Content deliverable requirements */
  content: {
    /** Target platform for the content */
    platform: Platform;
    /** Content format type */
    format: ContentFormat;
    /** Number of deliverables requested */
    quantity: number;
    /** Creative direction or guidelines */
    creativeDirection: string;
  };
  /** Usage and licensing terms */
  usageRights: {
    /** Duration in days for content usage (0 = content only, 365+ = perpetual) */
    durationDays: number;
    /** Exclusivity level for the creator */
    exclusivity: ExclusivityLevel;
    /** Whether brand can use content in paid ads */
    paidAmplification: boolean;
    /**
     * Whitelisting type - how brand can use content in their own channels.
     * Separate from usage rights duration/exclusivity. Defaults to "none".
     */
    whitelistingType?: WhitelistingType;
  };
  /** Timeline information */
  timeline: {
    /** Content delivery deadline */
    deadline: string;
  };
  /**
   * Campaign date for seasonal pricing calculation.
   * If not specified, defaults to current date.
   * Used to determine if Q4 holiday, Back to School, etc. premiums apply.
   */
  campaignDate?: Date | string;
  /**
   * If true, disables automatic seasonal pricing adjustments.
   * Useful when creator wants to offer consistent year-round rates.
   */
  disableSeasonalPricing?: boolean;
  /** Original unprocessed text from the brief */
  rawText: string;
}

// =============================================================================
// FIT SCORE TYPES (DEPRECATED - Use Deal Quality Score)
// =============================================================================

/**
 * Fit level category based on total score.
 * Determines the price adjustment in Layer 4.
 * @deprecated Use DealQualityLevel instead
 */
export type FitLevel = "perfect" | "high" | "medium" | "low";

/**
 * Individual component score within the fit score breakdown.
 * @deprecated Use DealQualityComponent instead
 */
export interface FitScoreComponent {
  /** Raw score for this component (0-100) */
  score: number;
  /** Weight applied to this component (sums to 1.0 across all components) */
  weight: number;
  /** Human-readable explanation of the score */
  insight: string;
}

/**
 * Complete fit score calculation result.
 * Measures creator-brand compatibility across 5 weighted dimensions.
 * @deprecated Use DealQualityResult instead
 */
export interface FitScoreResult {
  /** Final weighted score (0-100) */
  totalScore: number;
  /** Categorical fit level */
  fitLevel: FitLevel;
  /** Price adjustment multiplier from Layer 4 (-0.10 to +0.25) */
  priceAdjustment: number;
  /** Detailed breakdown of all 5 scoring components */
  breakdown: {
    /** Industry/niche alignment (30% weight) */
    nicheMatch: FitScoreComponent;
    /** Audience age/gender/location overlap (25% weight) */
    demographicMatch: FitScoreComponent;
    /** Target platform presence (20% weight) */
    platformMatch: FitScoreComponent;
    /** Engagement rate vs tier benchmarks (15% weight) */
    engagementQuality: FitScoreComponent;
    /** Format production capability (10% weight) */
    contentCapability: FitScoreComponent;
  };
  /** Top actionable insights for the creator (max 5) */
  insights: string[];
}

// =============================================================================
// DEAL QUALITY SCORE TYPES
// =============================================================================

/**
 * Deal Quality Level - Creator-centric assessment of how good a deal is.
 *
 * Unlike FitLevel (brand-centric), this answers: "How good is this deal FOR the creator?"
 *
 * - excellent: 85-100 - Take this deal! Excellent opportunity.
 * - good: 70-84 - Good deal worth pursuing.
 * - fair: 50-69 - Fair deal, consider negotiating terms.
 * - caution: 0-49 - Proceed with caution, significant concerns.
 */
export type DealQualityLevel = "excellent" | "good" | "fair" | "caution";

/**
 * Individual component in the Deal Quality Score breakdown.
 */
export interface DealQualityComponent {
  /** Component name for display */
  name: string;
  /** Raw score for this component (0 to maxPoints) */
  score: number;
  /** Maximum points possible for this component */
  maxPoints: number;
  /** Weight as a fraction of total (for display) */
  weight: number;
  /** Human-readable explanation of the score */
  insight: string;
  /** Optional tips for improving this dimension */
  tips?: string[];
}

/**
 * Recommendation for the creator based on Deal Quality Score.
 */
export type DealRecommendation =
  | "take_deal"      // 85+: Excellent opportunity, accept it
  | "good_deal"      // 70-84: Good deal, worth accepting
  | "negotiate"      // 50-69: Fair deal but negotiate for better terms
  | "decline"        // Below 50: Consider declining or major renegotiation
  | "ask_questions"; // When key info is missing

/**
 * Complete Deal Quality Score result.
 *
 * This is the creator-centric replacement for FitScoreResult.
 * Instead of "How well does this creator fit the brand?", it answers
 * "How good is this deal FOR the creator?"
 *
 * 6 Scoring Dimensions (100 points total):
 * 1. Rate Fairness (25 points) - Is the rate at/above market?
 * 2. Brand Legitimacy (20 points) - Is this a real, trustworthy brand?
 * 3. Portfolio Value (20 points) - Will this look good in portfolio?
 * 4. Growth Potential (15 points) - Ongoing partnership opportunity?
 * 5. Terms Fairness (10 points) - Are contract terms reasonable?
 * 6. Creative Freedom (10 points) - How much creative control?
 */
export interface DealQualityResult {
  /** Final score (0-100) */
  totalScore: number;
  /** Deal quality level category */
  qualityLevel: DealQualityLevel;
  /** Price adjustment multiplier for pricing engine compatibility (-0.10 to +0.25) */
  priceAdjustment: number;
  /** Recommendation for the creator */
  recommendation: DealRecommendation;
  /** Human-readable recommendation text */
  recommendationText: string;
  /** Detailed breakdown of all 6 scoring dimensions */
  breakdown: {
    /** Is the offered/calculated rate at or above market? (25 points) */
    rateFairness: DealQualityComponent;
    /** Is this a real brand with real followers? (20 points) */
    brandLegitimacy: DealQualityComponent;
    /** Will this look good in creator's portfolio? (20 points) */
    portfolioValue: DealQualityComponent;
    /** Is there ongoing partnership potential? (15 points) */
    growthPotential: DealQualityComponent;
    /** Are payment/usage terms reasonable? (10 points) */
    termsFairness: DealQualityComponent;
    /** How much creative control does creator have? (10 points) */
    creativeFreedom: DealQualityComponent;
  };
  /** Top actionable insights for the creator (max 5) */
  insights: string[];
  /** Red flags detected in the deal */
  redFlags: string[];
  /** Green flags (positive signals) detected */
  greenFlags: string[];
}

/**
 * Input for Deal Quality Score calculation.
 * Additional signals beyond the standard brief that affect deal quality.
 */
export interface DealQualityInput {
  /** Brand's social following (if known) */
  brandFollowers?: number;
  /** Does brand have a website? */
  brandHasWebsite?: boolean;
  /** Has brand worked with creators before? */
  brandHasCreatorHistory?: boolean;
  /** Payment terms (e.g., "net_15", "net_30", "net_60", "upfront") */
  paymentTerms?: "upfront" | "net_15" | "net_30" | "net_60" | "net_90" | "unknown";
  /** Does brand mention ongoing partnership? */
  mentionsOngoingPartnership?: boolean;
  /** Is there a strict script/rigid guidelines? */
  hasStrictScript?: boolean;
  /** Number of revision rounds allowed */
  revisionRounds?: number;
  /** Approval process complexity ("simple" | "moderate" | "complex") */
  approvalProcess?: "simple" | "moderate" | "complex";
  /** Offered rate (if brand specified a budget) */
  offeredRate?: number;
  /** Is this brand a category leader? */
  isCategoryLeader?: boolean;
  /** Brand reputation tier */
  brandTier?: "major" | "established" | "emerging" | "unknown";
}

// =============================================================================
// PRICING TYPES
// =============================================================================

/**
 * Single layer in the 6-Layer Pricing Engine.
 * Each layer transforms the price sequentially.
 */
export interface PricingLayer {
  /** Layer name (e.g., "Base Rate", "Engagement Multiplier") */
  name: string;
  /** Explanation of what this layer represents */
  description: string;
  /** Base value before adjustment (e.g., "$250" or "4.2%") */
  baseValue: number | string;
  /** Multiplier applied by this layer (1.0 = no change) */
  multiplier: number;
  /** Dollar or percentage adjustment from this layer */
  adjustment: number;
}

/**
 * Affiliate earnings breakdown for commission-based deals.
 */
export interface AffiliateEarningsBreakdown {
  /** Commission rate as percentage */
  commissionRate: number;
  /** Estimated number of sales */
  estimatedSales: number;
  /** Average order value */
  averageOrderValue: number;
  /** Total estimated commission earnings */
  estimatedEarnings: number;
  /** Category commission rate range for context */
  categoryRateRange?: { min: number; max: number };
}

/**
 * Performance bonus breakdown for performance-based deals.
 */
export interface PerformanceBonusBreakdown {
  /** Base fee before bonus */
  baseFee: number;
  /** Threshold to trigger bonus */
  bonusThreshold: number;
  /** Type of metric for threshold */
  bonusMetric: string;
  /** Bonus amount when threshold is met */
  bonusAmount: number;
  /** Total potential earnings (base + bonus) */
  potentialTotal: number;
}

/**
 * Hybrid pricing breakdown showing both base fee and affiliate components.
 */
export interface HybridPricingBreakdown {
  /** Reduced base fee (50% of normal rate) */
  baseFee: number;
  /** Full rate for reference */
  fullRate: number;
  /** Discount percentage applied to base fee */
  baseDiscount: number;
  /** Affiliate earnings component */
  affiliateEarnings: AffiliateEarningsBreakdown;
  /** Combined estimated total */
  combinedEstimate: number;
}

/**
 * Per-deliverable rate breakdown for retainer pricing.
 */
export interface DeliverableRates {
  /** Rate per static post */
  postRate: number;
  /** Rate per story */
  storyRate: number;
  /** Rate per reel/short video */
  reelRate: number;
  /** Rate per long-form video */
  videoRate: number;
}

/**
 * Retainer pricing breakdown showing monthly and total contract values.
 */
export interface RetainerPricingBreakdown {
  /** Deal length (e.g., "3_month", "12_month") */
  dealLength: DealLength;
  /** Number of months in the contract */
  contractMonths: number;
  /** Volume discount percentage applied (0, 15, 25, or 35) */
  volumeDiscount: number;
  /** Per-deliverable rates before discount */
  fullRates: DeliverableRates;
  /** Per-deliverable rates after volume discount */
  discountedRates: DeliverableRates;
  /** Monthly deliverables configuration */
  monthlyDeliverables: MonthlyDeliverables;
  /** Value of monthly content at full rates */
  monthlyContentValueFull: number;
  /** Value of monthly content after discount */
  monthlyContentValueDiscounted: number;
  /** Savings per month from volume discount */
  monthlySavings: number;
  /** Monthly rate (content value after discount) */
  monthlyRate: number;
  /** Total contract value (monthly rate × months) */
  totalContractValue: number;
  /** Ambassador perks breakdown (if applicable) */
  ambassadorBreakdown?: AmbassadorPerksBreakdown;
}

/**
 * Ambassador perks value breakdown.
 */
export interface AmbassadorPerksBreakdown {
  /** Exclusivity premium amount */
  exclusivityPremium: number;
  /** Exclusivity type */
  exclusivityType: AmbassadorExclusivityType;
  /** Value of product seeding */
  productSeedingValue: number;
  /** Number of events included */
  eventsIncluded: number;
  /** Day rate per event */
  eventDayRate: number;
  /** Total event appearances value */
  eventAppearancesValue: number;
  /** Total ambassador perks value */
  totalPerksValue: number;
}

/**
 * Complete pricing calculation result from the 6-Layer Engine.
 * Formula: (Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)
 */
export interface PricingResult {
  /** Price per single deliverable (rounded to nearest $5) */
  pricePerDeliverable: number;
  /** Number of deliverables requested */
  quantity: number;
  /** Total price (pricePerDeliverable × quantity) */
  totalPrice: number;
  /** Currency code (e.g., "USD", "GBP") */
  currency: string;
  /** Currency symbol for display (e.g., "$", "£") */
  currencySymbol: string;
  /** Number of days this quote is valid */
  validDays: number;
  /** Detailed breakdown of all 6 pricing layers */
  layers: PricingLayer[];
  /** Human-readable formula representation */
  formula: string;
  /** Original calculated price if user adjusted (for reference on PDF) */
  originalTotal?: number;
  /** Pricing model used for this calculation */
  pricingModel?: PricingModel;
  /** Affiliate earnings breakdown (for affiliate and hybrid models) */
  affiliateBreakdown?: AffiliateEarningsBreakdown;
  /** Performance bonus breakdown (for performance model) */
  performanceBreakdown?: PerformanceBonusBreakdown;
  /** Hybrid pricing breakdown (for hybrid model) */
  hybridBreakdown?: HybridPricingBreakdown;
  /** Retainer pricing breakdown (for retainer/ambassador deals) */
  retainerBreakdown?: RetainerPricingBreakdown;
}

// =============================================================================
// NEGOTIATION TALKING POINTS TYPES
// =============================================================================

/**
 * A single bullet point justifying the rate.
 */
export interface RateJustification {
  /** The main point */
  point: string;
  /** Supporting data or explanation */
  supporting?: string;
}

/**
 * Counter-offer script for negotiation.
 */
export interface CounterOfferScript {
  /** Scenario when this counter applies */
  scenario: string;
  /** What to say to the brand */
  script: string;
  /** What the creator gives up in this scenario */
  concession?: string;
  /** New rate or description of adjustment */
  adjustedRate?: string;
}

/**
 * "Why This Rate" section - professional justification to share with brands.
 */
export interface WhyThisRateSection {
  /** 3-4 bullet points justifying the rate */
  bulletPoints: RateJustification[];
  /** One-liner summary */
  summary: string;
}

/**
 * "Confidence Boosters" section - internal encouragement for the creator.
 */
export interface ConfidenceBoostersSection {
  /** Comparison to market (e.g., "This is 10% below average for your tier") */
  marketComparison: string;
  /** Percentage relative to market average */
  marketPercentage: number;
  /** Whether rate is above, at, or below market */
  marketPosition: "above" | "at" | "below";
  /** Reminder of creator's specific value */
  valueReminders: string[];
  /** Encouraging message (non-cheesy) */
  encouragement: string;
}

/**
 * "If They Push Back" section - negotiation scripts and walk-away points.
 */
export interface PushBackSection {
  /** 2-3 counter-offer scripts */
  counterOfferScripts: CounterOfferScript[];
  /** Minimum acceptable rate (floor) */
  minimumRate: number;
  /** Percentage of original rate that's the minimum */
  minimumRatePercentage: number;
  /** When to walk away */
  walkAwayPoint: string;
  /** Things that can be reduced to meet budget */
  negotiationLevers: string[];
}

/**
 * "Quick Response Template" section - ready-to-copy message.
 */
export interface QuickResponseSection {
  /** Professional opening */
  greeting: string;
  /** The complete response message */
  fullMessage: string;
  /** Just the rate portion for quick reference */
  rateStatement: string;
  /** Call-to-action to close */
  closingCTA: string;
}

/**
 * Complete Negotiation Talking Points result.
 *
 * The "Confidence Stack" that helps creators negotiate with confidence.
 * Includes both brand-facing and creator-only sections.
 */
export interface NegotiationTalkingPoints {
  /** "Why This Rate" - to share with brand */
  whyThisRate: WhyThisRateSection;
  /** "Confidence Boosters" - for creator's eyes only */
  confidenceBoosters: ConfidenceBoostersSection;
  /** "If They Push Back" - negotiation scripts */
  pushBack: PushBackSection;
  /** "Quick Response Template" - ready-to-copy message */
  quickResponse: QuickResponseSection;
  /** Generated timestamp */
  generatedAt: Date;
}

/**
 * PDF export mode - determines what content to include.
 */
export type PDFExportMode = "brand" | "creator";

// =============================================================================
// FTC GUIDANCE TYPES
// =============================================================================

/**
 * Compensation type for FTC disclosure purposes.
 * Determines which disclosure rules apply.
 */
export type CompensationType = "paid" | "gifted" | "affiliate" | "hybrid";

/**
 * Platform-specific disclosure guidance.
 */
export interface PlatformDisclosureGuidance {
  /** The platform this guidance applies to */
  platform: Platform;
  /** Platform display name */
  platformName: string;
  /** Built-in disclosure tools (e.g., "Paid partnership" tag) */
  builtInTools: string[];
  /** Required hashtags/text */
  requiredDisclosure: string;
  /** Additional recommendations */
  recommendations: string[];
  /** Common mistakes to avoid */
  mistakes: string[];
}

/**
 * Content-specific disclosure rules.
 */
export interface ContentDisclosureRule {
  /** Type of content/compensation */
  type: CompensationType;
  /** What must be disclosed */
  requirement: string;
  /** Acceptable disclosure formats */
  acceptableFormats: string[];
  /** Formats to avoid */
  unacceptableFormats: string[];
}

/**
 * AI content disclosure guidance (new 2025).
 */
export interface AIDisclosureGuidance {
  /** Whether AI disclosure is recommended */
  recommended: boolean;
  /** Explanation of when AI disclosure is needed */
  explanation: string;
  /** Suggested disclosure text */
  suggestedText: string;
}

/**
 * Single checklist item for FTC compliance.
 */
export interface FTCChecklistItem {
  /** Checklist item ID */
  id: string;
  /** Item text */
  text: string;
  /** Priority: critical items must be done */
  priority: "critical" | "important" | "recommended";
  /** Why this matters */
  reason: string;
}

/**
 * Complete FTC guidance result.
 */
export interface FTCGuidance {
  /** Platform-specific guidance */
  platformGuidance: PlatformDisclosureGuidance;
  /** Content-specific rules */
  contentRules: ContentDisclosureRule;
  /** AI content disclosure (if applicable) */
  aiDisclosure: AIDisclosureGuidance | null;
  /** Quick reference summary */
  summary: {
    /** One-line summary */
    headline: string;
    /** Required disclosure text */
    requiredText: string;
    /** Where to place it */
    placement: string;
  };
  /** Compliance checklist */
  checklist: FTCChecklistItem[];
  /** General reminders applicable to all deals */
  generalReminders: string[];
}

// =============================================================================
// CONTRACT CHECKLIST TYPES
// =============================================================================

/**
 * Priority level for contract checklist items.
 */
export type ChecklistPriority = "critical" | "important" | "recommended";

/**
 * Category for organizing contract checklist items.
 */
export type ChecklistCategory = "payment" | "content_rights" | "exclusivity" | "legal";

/**
 * Single contract checklist item with explanation.
 */
export interface ContractChecklistItem {
  /** Unique identifier */
  id: string;
  /** Category this item belongs to */
  category: ChecklistCategory;
  /** The term to look for */
  term: string;
  /** Why this matters */
  explanation: string;
  /** Recommended standard (e.g., "Net-30 or better") */
  recommendation: string;
  /** Priority level */
  priority: ChecklistPriority;
  /** Whether this item is applicable based on the deal */
  applicable: boolean;
  /** Whether this item is highlighted based on brief data */
  highlighted: boolean;
}

/**
 * Red flag warning for problematic contract terms.
 */
export interface ContractRedFlag {
  /** Unique identifier */
  id: string;
  /** The problematic term */
  flag: string;
  /** Why this is a problem */
  reason: string;
  /** What to do about it */
  action: string;
  /** Severity: how bad is this? */
  severity: "high" | "medium" | "low";
  /** Whether this flag is detected based on brief data */
  detected: boolean;
}

/**
 * Complete contract checklist result.
 */
export interface ContractChecklist {
  /** All checklist items organized by category */
  items: ContractChecklistItem[];
  /** Detected red flags */
  redFlags: ContractRedFlag[];
  /** Summary statistics */
  summary: {
    /** Total checklist items */
    totalItems: number;
    /** Critical items count */
    criticalItems: number;
    /** Highlighted items (applicable to this deal) */
    highlightedItems: number;
    /** Detected red flags count */
    detectedRedFlags: number;
  };
  /** Category-specific item counts */
  byCategory: {
    payment: number;
    content_rights: number;
    exclusivity: number;
    legal: number;
  };
  /** Deal-specific notes */
  dealNotes: string[];
}

// =============================================================================
// RATE CARD TYPES
// =============================================================================

/**
 * Persisted rate card record.
 * Combines creator profile, brief, fit score, and pricing into a single entity.
 */
export interface RateCard {
  /** Unique identifier */
  id: string;
  /** Reference to the creator who generated this rate card */
  creatorId: string;
  /** Reference to the parsed brief (optional, may be manual entry) */
  briefId?: string;
  /** Brand name for display */
  brandName: string;
  /** Campaign name for display (optional) */
  campaignName?: string;
  /** Fit score (0-100) */
  fitScore: number;
  /** Fit level category */
  fitLevel: string;
  /** Price per deliverable in cents */
  pricePerDeliverable: number;
  /** Number of deliverables */
  quantity: number;
  /** Total price in cents */
  totalPrice: number;
  /** URL to generated PDF (if saved) */
  pdfUrl?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Expiration timestamp (quote validity) */
  expiresAt: Date;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Standard API response wrapper.
 * All API routes return this shape for consistent error handling.
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response payload (only present on success) */
  data?: T;
  /** Error message (only present on failure) */
  error?: string;
}

/**
 * Combined calculation result from /api/calculate endpoint.
 */
export interface CalculationResult {
  /** Fit score calculation result */
  fitScore: FitScoreResult;
  /** Pricing calculation result */
  pricing: PricingResult;
}

// =============================================================================
// FORM INPUT TYPES
// =============================================================================

/**
 * Profile form input shape (before database IDs are assigned).
 * Used for form validation and submission.
 */
export type ProfileFormInput = Omit<
  CreatorProfile,
  "id" | "userId" | "tier" | "totalReach" | "avgEngagementRate" | "createdAt" | "updatedAt"
>;

/**
 * Brief parser input options.
 */
export interface BriefParserInput {
  /** Raw text content (for paste mode) */
  text?: string;
  /** File buffer (for upload mode) */
  file?: Buffer;
  /** Original filename (for upload mode) */
  filename?: string;
}

// =============================================================================
// DM PARSER TYPES
// =============================================================================

/**
 * Compensation type detected in a DM.
 */
export type DMCompensationType = "paid" | "gifted" | "hybrid" | "unclear" | "none_mentioned";

/**
 * Tone detected in a DM.
 */
export type DMTone = "professional" | "casual" | "mass_outreach" | "scam_likely";

/**
 * Urgency level detected in a DM.
 */
export type DMUrgency = "high" | "medium" | "low";

/**
 * Content expectation for gift offers.
 */
export type GiftContentExpectation = "explicit" | "implied" | "none";

/**
 * Conversion potential for gift offers.
 */
export type GiftConversionPotential = "high" | "medium" | "low";

/**
 * Recommended approach for gift offers.
 */
export type GiftRecommendedApproach =
  | "accept_and_convert"
  | "counter_with_hybrid"
  | "decline"
  | "ask_budget";

/**
 * Gift-specific analysis extracted from a DM.
 * Present when isGiftOffer is true.
 */
export interface GiftAnalysis {
  /** Product mentioned in the gift offer */
  productMentioned: string | null;
  /** Whether content is explicitly expected, implied, or not mentioned */
  contentExpectation: GiftContentExpectation;
  /** Potential to convert this gift offer to paid partnership */
  conversionPotential: GiftConversionPotential;
  /** Recommended approach for responding to this gift offer */
  recommendedApproach: GiftRecommendedApproach;
}

/**
 * Complete analysis result from DM parsing.
 * Contains brand identification, request analysis, tone/quality signals,
 * flags, gift-specific analysis, and recommendations.
 */
export interface DMAnalysis {
  // Brand identification
  /** Detected brand name (null if not found) */
  brandName: string | null;
  /** Detected brand social handle (null if not found) */
  brandHandle: string | null;

  // Request analysis
  /** What the brand is asking for */
  deliverableRequest: string | null;
  /** Type of compensation offered */
  compensationType: DMCompensationType;
  /** Offered payment amount (null if not specified or gift-only) */
  offeredAmount: number | null;
  /** Estimated product value for gift offers */
  estimatedProductValue: number | null;

  // Tone & quality signals
  /** Detected tone of the message */
  tone: DMTone;
  /** Urgency level of the request */
  urgency: DMUrgency;

  // Flags
  /** Red flags detected in the DM */
  redFlags: string[];
  /** Green flags detected in the DM */
  greenFlags: string[];

  // Gift-specific analysis
  /** Whether this is a gift offer */
  isGiftOffer: boolean;
  /** Detailed gift analysis (present when isGiftOffer is true) */
  giftAnalysis: GiftAnalysis | null;

  // Extracted data for rate card generation
  /** Partial brief data extracted from the DM */
  extractedRequirements: Partial<ParsedBrief>;

  // Recommendations
  /** Recommended response message to send to the brand */
  recommendedResponse: string;
  /** Suggested rate based on analysis */
  suggestedRate: number;
  /** Estimated deal quality score (0-100) */
  dealQualityEstimate: number;
  /** Next steps for the creator */
  nextSteps: string[];
}

/**
 * Input for the DM parser API.
 */
export interface DMParserInput {
  /** The DM text to parse */
  dmText: string;
}

/**
 * Response from the DM parser API.
 */
export type DMParserResponse = ApiResponse<DMAnalysis>;

// =============================================================================
// MESSAGE ANALYZER TYPES (Unified DM + Email)
// =============================================================================

/**
 * Message source type - identifies where the brand message originated.
 * Used by the unified Message Analyzer to handle both DMs and emails.
 */
export type MessageSource =
  | "instagram_dm"
  | "tiktok_dm"
  | "twitter_dm"
  | "linkedin_dm"
  | "email"
  | "other";

/**
 * Input for the Message Analyzer.
 * Supports text content with optional source hints and image data.
 */
export interface MessageAnalysisInput {
  /** The message text content (pasted or extracted from image) */
  content: string;
  /** Optional hint about the message source (if user knows) */
  sourceHint?: MessageSource;
  /** Base64 image data if parsing from screenshot */
  imageData?: string;
}

/**
 * Email-specific metadata extracted from email messages.
 * Only present when the message is detected as an email.
 */
export interface EmailMetadata {
  /** Email subject line */
  subject?: string;
  /** Sender's name */
  senderName?: string;
  /** Sender's email address */
  senderEmail?: string;
  /** Company signature block */
  companySignature?: string;
  /** Whether attachments were mentioned */
  hasAttachments?: boolean;
}

/**
 * Complete analysis result from Message Analyzer.
 * Extends DMAnalysis with email support and source detection.
 *
 * This unified type handles both DMs and emails, detecting the source
 * automatically and extracting appropriate metadata.
 */
export interface MessageAnalysis {
  // Source detection
  /** Detected message source (DM platform or email) */
  detectedSource: MessageSource;
  /** Confidence level of source detection */
  sourceConfidence: "high" | "medium" | "low";

  // Brand identification (same as DMAnalysis)
  /** Detected brand name (null if not found) */
  brandName: string | null;
  /** Detected brand social handle (null if not found) */
  brandHandle: string | null;
  /** Detected brand email (extracted from email messages) */
  brandEmail?: string | null;
  /** Detected brand website (extracted from signature) */
  brandWebsite?: string | null;

  // Request analysis (same as DMAnalysis)
  /** What the brand is asking for */
  deliverableRequest: string | null;
  /** Type of compensation offered */
  compensationType: DMCompensationType;
  /** Offered payment amount (null if not specified or gift-only) */
  offeredAmount: number | null;
  /** Estimated product value for gift offers */
  estimatedProductValue: number | null;

  // Tone & quality signals (same as DMAnalysis)
  /** Detected tone of the message */
  tone: DMTone;
  /** Urgency level of the request */
  urgency: DMUrgency;

  // Flags (same as DMAnalysis)
  /** Red flags detected in the message */
  redFlags: string[];
  /** Green flags detected in the message */
  greenFlags: string[];

  // Gift-specific analysis (same as DMAnalysis)
  /** Whether this is a gift offer */
  isGiftOffer: boolean;
  /** Detailed gift analysis (present when isGiftOffer is true) */
  giftAnalysis: GiftAnalysis | null;

  // Email-specific fields (NEW)
  /** Email metadata (only present for email messages) */
  emailMetadata?: EmailMetadata;

  // Extracted data for rate card generation (same as DMAnalysis)
  /** Partial brief data extracted from the message */
  extractedRequirements: Partial<ParsedBrief>;

  // Recommendations (same as DMAnalysis)
  /** Recommended response message to send to the brand */
  recommendedResponse: string;
  /** Suggested rate based on analysis */
  suggestedRate: number;
  /** Estimated deal quality score (0-100) */
  dealQualityEstimate: number;
  /** Next steps for the creator */
  nextSteps: string[];
}

/**
 * Input for the Message Analyzer API.
 */
export interface MessageAnalyzerInput {
  /** The message text to analyze */
  content: string;
  /** Optional source hint */
  sourceHint?: MessageSource;
}

/**
 * Response from the Message Analyzer API.
 */
export type MessageAnalyzerResponse = ApiResponse<MessageAnalysis>;

// =============================================================================
// GIFT EVALUATOR TYPES
// =============================================================================

/**
 * Brand quality level for gift evaluation.
 */
export type GiftBrandQuality = "major_brand" | "established_indie" | "new_unknown" | "suspicious";

/**
 * Content required for a gift deal.
 */
export type GiftContentRequired = "organic_mention" | "dedicated_post" | "multiple_posts" | "video_content";

/**
 * Recommendation for how to respond to a gift offer.
 */
export type GiftRecommendation =
  | "accept_with_hook"
  | "counter_hybrid"
  | "decline_politely"
  | "ask_budget_first"
  | "run_away";

/**
 * Input for evaluating a gift deal.
 */
export interface GiftEvaluationInput {
  /** Description of the product being offered */
  productDescription: string;
  /** Estimated retail value of the product in dollars */
  estimatedProductValue: number;
  /** Type of content the brand expects */
  contentRequired: GiftContentRequired;
  /** Estimated hours to create the content */
  estimatedHoursToCreate: number;
  /** Quality/legitimacy of the brand */
  brandQuality: GiftBrandQuality;
  /** Would the creator buy this product themselves? */
  wouldYouBuyIt: boolean;
  /** Brand's follower count (if known) */
  brandFollowers: number | null;
  /** Does the brand have a legitimate website? */
  hasWebsite: boolean;
  /** Has the brand worked with creators before? */
  previousCreatorCollabs: boolean;
}

/**
 * Analysis breakdown of the value exchange in a gift deal.
 */
export interface GiftAnalysisBreakdown {
  /** Retail value of the product */
  productValue: number;
  /** Value of creator's time (hours × hourly rate) */
  yourTimeValue: number;
  /** Value of creator's audience reach */
  audienceValue: number;
  /** Total value the creator is providing */
  totalValueProviding: number;
  /** Gap between what creator provides vs receives (negative = bad deal) */
  valueGap: number;
  /** Effective hourly rate if accepting (product value / hours) */
  effectiveHourlyRate: number;
}

/**
 * Strategic assessment of a gift deal beyond monetary value.
 */
export interface GiftStrategicValue {
  /** Strategic score (0-10) */
  score: number;
  /** Is this deal worth adding to portfolio? */
  portfolioWorth: boolean;
  /** Likelihood of converting to paid partnership */
  conversionPotential: GiftConversionPotential;
  /** Does this brand add credibility to creator's profile? */
  brandReputationBoost: boolean;
  /** Reasons supporting the strategic assessment */
  reasons: string[];
}

/**
 * Boundaries for accepting a gift-only deal.
 * Helps creators protect themselves when accepting gifts.
 */
export interface GiftAcceptanceBoundaries {
  /** Maximum content type to provide (e.g., "organic story only") */
  maxContentType: string;
  /** Time limit for content (e.g., "24-hour story, not permanent post") */
  timeLimit: string;
  /** Usage rights limit (e.g., "no usage rights beyond your post") */
  rightsLimit: string;
}

/**
 * Complete evaluation result for a gift deal.
 */
export interface GiftEvaluation {
  /** Worth score (0-100) - overall assessment of the deal */
  worthScore: number;
  /** Recommendation for how to respond */
  recommendation: GiftRecommendation;
  /** Detailed math breakdown of the value exchange */
  analysis: GiftAnalysisBreakdown;
  /** Strategic value assessment beyond monetary */
  strategicValue: GiftStrategicValue;
  /** Minimum $ amount to add for a hybrid deal */
  minimumAcceptableAddOn: number;
  /** Suggested counter-offer message */
  suggestedCounterOffer: string;
  /** When to walk away from this deal */
  walkAwayPoint: string;
  /** If accepting gift-only, these boundaries apply */
  acceptanceBoundaries: GiftAcceptanceBoundaries;
}

/**
 * Response type for gift response templates.
 */
export type GiftResponseType =
  | "accept_with_hook"
  | "counter_hybrid"
  | "ask_budget_first"
  | "decline_politely"
  | "run_away";

/**
 * Context for generating a gift response.
 */
export interface GiftResponseContext {
  /** Brand name (if known) */
  brandName?: string;
  /** Product name/description */
  productName?: string;
  /** Creator's normal rate for reference */
  creatorRate?: number;
  /** Suggested hybrid rate (reduced + product) */
  hybridRate?: number;
  /** Type of content requested */
  contentType?: string;
}

/**
 * Generated response for a gift offer.
 */
export interface GiftResponse {
  /** Type of response being generated */
  responseType: GiftResponseType;
  /** The main response message to send */
  message: string;
  /** Follow-up reminder (for accepted gifts) */
  followUpReminder: string | null;
  /** Conversion script (for use after successful gift collab) */
  conversionScript: string | null;
}

/**
 * Input for the gift evaluator API.
 */
export interface GiftEvaluatorInput {
  /** The gift evaluation input data */
  evaluation: GiftEvaluationInput;
}

/**
 * Response from the gift evaluator API.
 */
export type GiftEvaluatorResponse = ApiResponse<{
  evaluation: GiftEvaluation;
  response: GiftResponse;
}>;

// =============================================================================
// GIFT TRACKER TYPES
// =============================================================================

/**
 * Status of a gift deal in the tracker.
 * Represents the lifecycle of a gift relationship.
 */
export type GiftDealStatus =
  | "received"       // Gift has been received, no content created yet
  | "content_created" // Content has been posted
  | "followed_up"    // Follow-up message has been sent
  | "converted"      // Successfully converted to paid partnership
  | "declined"       // Brand declined paid conversion
  | "archived";      // No longer actively tracking

/**
 * Conversion status for gift deals attempting paid conversion.
 */
export type GiftDealConversionStatus = "attempting" | "converted" | "rejected" | null;

/**
 * Content type created for a gift deal.
 */
export type GiftDealContentType = "post" | "reel" | "story" | "video";

/**
 * Performance metrics for content created from a gift deal.
 */
export interface GiftDealPerformance {
  /** Number of views */
  views?: number;
  /** Number of likes */
  likes?: number;
  /** Number of comments */
  comments?: number;
  /** Number of saves */
  saves?: number;
  /** Number of shares */
  shares?: number;
}

/**
 * Complete gift deal record.
 * Represents a tracked gift relationship with a brand.
 */
export interface GiftDeal {
  /** Unique identifier */
  id: string;
  /** Reference to the creator who received the gift */
  creatorId: string;

  // Brand info
  /** Brand name */
  brandName: string;
  /** Brand's social handle (optional) */
  brandHandle?: string | null;
  /** Brand's website (optional) */
  brandWebsite?: string | null;
  /** Brand's follower count (optional) */
  brandFollowers?: number | null;

  // Gift details
  /** Description of the product received */
  productDescription: string;
  /** Estimated retail value of the product */
  productValue: number;
  /** Date the gift was received */
  dateReceived: Date;

  // Content created
  /** Type of content created (optional) */
  contentType?: GiftDealContentType | null;
  /** URL to the created content (optional) */
  contentUrl?: string | null;
  /** Date content was posted (optional) */
  contentDate?: Date | null;

  // Performance metrics
  /** Number of views on the content */
  views?: number | null;
  /** Number of likes on the content */
  likes?: number | null;
  /** Number of comments on the content */
  comments?: number | null;
  /** Number of saves on the content */
  saves?: number | null;
  /** Number of shares on the content */
  shares?: number | null;

  // Conversion tracking
  /** Current status in the gift lifecycle */
  status: GiftDealStatus;
  /** Status of conversion attempt (null if not attempting) */
  conversionStatus?: GiftDealConversionStatus;
  /** ID of the RateCard if converted to paid deal */
  convertedDealId?: string | null;
  /** Amount of the converted paid deal */
  convertedAmount?: number | null;

  // Follow-up
  /** Scheduled date for follow-up */
  followUpDate?: Date | null;
  /** Whether follow-up has been sent */
  followUpSent: boolean;
  /** Creator's notes about this gift deal */
  notes?: string | null;

  // Timestamps
  /** When this record was created */
  createdAt: Date;
  /** When this record was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new gift deal.
 */
export interface GiftDealCreateInput {
  // Brand info (required)
  /** Brand name */
  brandName: string;
  /** Brand's social handle (optional) */
  brandHandle?: string;
  /** Brand's website (optional) */
  brandWebsite?: string;
  /** Brand's follower count (optional) */
  brandFollowers?: number;

  // Gift details (required)
  /** Description of the product received */
  productDescription: string;
  /** Estimated retail value of the product */
  productValue: number;
  /** Date the gift was received (defaults to now) */
  dateReceived?: Date | string;

  // Optional initial notes
  /** Creator's notes about this gift deal */
  notes?: string;
}

/**
 * Input for updating an existing gift deal.
 */
export interface GiftDealUpdateInput {
  // Brand info
  /** Brand name */
  brandName?: string;
  /** Brand's social handle */
  brandHandle?: string | null;
  /** Brand's website */
  brandWebsite?: string | null;
  /** Brand's follower count */
  brandFollowers?: number | null;

  // Gift details
  /** Description of the product received */
  productDescription?: string;
  /** Estimated retail value of the product */
  productValue?: number;
  /** Date the gift was received */
  dateReceived?: Date | string;

  // Content created
  /** Type of content created */
  contentType?: GiftDealContentType | null;
  /** URL to the created content */
  contentUrl?: string | null;
  /** Date content was posted */
  contentDate?: Date | string | null;

  // Performance metrics
  /** Number of views on the content */
  views?: number | null;
  /** Number of likes on the content */
  likes?: number | null;
  /** Number of comments on the content */
  comments?: number | null;
  /** Number of saves on the content */
  saves?: number | null;
  /** Number of shares on the content */
  shares?: number | null;

  // Status and conversion
  /** Current status in the gift lifecycle */
  status?: GiftDealStatus;
  /** Status of conversion attempt */
  conversionStatus?: GiftDealConversionStatus;
  /** ID of the RateCard if converted to paid deal */
  convertedDealId?: string | null;
  /** Amount of the converted paid deal */
  convertedAmount?: number | null;

  // Follow-up
  /** Scheduled date for follow-up */
  followUpDate?: Date | string | null;
  /** Whether follow-up has been sent */
  followUpSent?: boolean;
  /** Creator's notes about this gift deal */
  notes?: string | null;
}

/**
 * Input for adding content to a gift deal.
 */
export interface GiftDealAddContentInput {
  /** Type of content created */
  contentType: GiftDealContentType;
  /** URL to the created content */
  contentUrl?: string;
  /** Date content was posted (defaults to now) */
  contentDate?: Date | string;
}

/**
 * Input for adding performance metrics to a gift deal.
 */
export interface GiftDealAddPerformanceInput {
  /** Number of views on the content */
  views?: number;
  /** Number of likes on the content */
  likes?: number;
  /** Number of comments on the content */
  comments?: number;
  /** Number of saves on the content */
  saves?: number;
  /** Number of shares on the content */
  shares?: number;
}

/**
 * Input for logging a follow-up attempt.
 */
export interface GiftDealFollowUpInput {
  /** Notes about the follow-up */
  notes?: string;
  /** Script type used for follow-up */
  scriptType?: ConversionScriptStage;
}

/**
 * Input for marking a gift deal as converted.
 */
export interface GiftDealConvertInput {
  /** Amount of the converted paid deal */
  convertedAmount: number;
  /** ID of the RateCard if one was created */
  convertedDealId?: string;
  /** Notes about the conversion */
  notes?: string;
}

/**
 * Stage in the conversion playbook for follow-up scripts.
 */
export type ConversionScriptStage =
  | "performance_share"     // Share results after content posted
  | "follow_up_30_day"     // 30-day check-in
  | "new_launch_pitch"     // Pitch when brand has new product
  | "returning_brand_offer"; // Offer returning brand discount

/**
 * Analytics for a creator's gift deals.
 */
export interface GiftAnalytics {
  /** Total number of gifts received */
  totalGiftsReceived: number;
  /** Total value of products received */
  totalProductValue: number;
  /** Number of gifts that converted to paid */
  giftsConverted: number;
  /** Conversion rate (giftsConverted / totalGiftsReceived) */
  conversionRate: number;
  /** Total revenue from converted deals */
  revenueFromConverted: number;
  /** ROI on gift work (revenue / product value) */
  roiOnGiftWork: number;
  /** Average days from gift to conversion */
  avgTimeToConversion: number | null;
  /** Which brand category converts best */
  topConvertingCategory: string | null;
  /** Number of follow-ups due */
  followUpsDue: number;
  /** Number of gifts with content created */
  giftsWithContent: number;
  /** Number of gifts ready to convert (good performance, no follow-up yet) */
  readyToConvert: number;
}

/**
 * Response from the gift tracker API for listing gifts.
 */
export type GiftListResponse = ApiResponse<GiftDeal[]>;

/**
 * Response from the gift tracker API for a single gift.
 */
export type GiftDealResponse = ApiResponse<GiftDeal>;

/**
 * Response from the gift tracker API for analytics.
 */
export type GiftAnalyticsResponse = ApiResponse<GiftAnalytics>;

// =============================================================================
// OUTCOME TRACKING TYPES
// =============================================================================

/**
 * Source type for outcomes - what generated this outcome record.
 */
export type OutcomeSourceType = "rate_card" | "dm_analysis" | "gift_evaluation";

/**
 * Proposed deal type for outcomes.
 */
export type OutcomeProposedType = "paid" | "gift" | "hybrid" | "affiliate";

/**
 * Outcome status - what happened with the deal.
 */
export type OutcomeStatus =
  | "accepted"
  | "negotiated"
  | "rejected"
  | "ghosted"
  | "pending"
  | "gift_accepted"
  | "gift_converted";

/**
 * Gift-specific outcome - detailed status for gift deals.
 */
export type GiftOutcomeStatus =
  | "accepted_gift"
  | "countered_to_paid"
  | "declined"
  | "converted_later";

/**
 * Complete outcome record for tracking deal results.
 *
 * This tracks what happens after a rate card is sent, DM is analyzed,
 * or gift evaluation is completed. Essential for building market intelligence
 * and the data flywheel.
 */
export interface Outcome {
  /** Unique identifier */
  id: string;
  /** Reference to the creator who tracked this outcome */
  creatorId: string;

  // Source tracking
  /** What generated this outcome (rate_card, dm_analysis, gift_evaluation) */
  sourceType: OutcomeSourceType;
  /** ID of the source record (rate card ID, DM ID, or gift ID) */
  sourceId: string | null;

  // What was proposed
  /** Proposed rate in dollars (null for gift-only offers) */
  proposedRate: number | null;
  /** Type of deal proposed */
  proposedType: OutcomeProposedType;
  /** Platform for the deal */
  platform: string;
  /** Deal type (sponsored, ugc) */
  dealType: string;
  /** Niche/industry for benchmarking */
  niche: string | null;

  // What happened
  /** Final outcome status */
  outcome: OutcomeStatus;
  /** Final rate if different from proposed */
  finalRate: number | null;
  /** Percentage change from proposed to final (positive = increased) */
  negotiationDelta: number | null;

  // Gift-specific outcomes
  /** Detailed gift outcome (for gift deals only) */
  giftOutcome: GiftOutcomeStatus | null;
  /** Days from gift to paid conversion (for converted gifts) */
  giftConversionDays: number | null;

  // Metadata
  /** Brand name for tracking */
  brandName: string | null;
  /** Brand's follower count */
  brandFollowers: number | null;
  /** Deal length (one_time, monthly, 3_month, etc.) */
  dealLength: string | null;
  /** Whether this deal started as a gift before converting */
  wasGiftFirst: boolean;

  // Timestamps
  /** When this outcome record was created */
  createdAt: Date;
  /** When this outcome record was last updated */
  updatedAt: Date;
  /** When the deal was closed/finalized */
  closedAt: Date | null;
}

/**
 * Input for creating a new outcome record.
 */
export interface OutcomeCreateInput {
  // Source tracking (required)
  /** What generated this outcome */
  sourceType: OutcomeSourceType;
  /** ID of the source record */
  sourceId?: string;

  // What was proposed (required)
  /** Proposed rate in dollars */
  proposedRate?: number;
  /** Type of deal proposed */
  proposedType: OutcomeProposedType;
  /** Platform for the deal */
  platform: string;
  /** Deal type (sponsored, ugc) */
  dealType: string;
  /** Niche/industry */
  niche?: string;

  // Initial outcome (defaults to "pending")
  /** Initial outcome status */
  outcome?: OutcomeStatus;

  // Metadata (optional)
  /** Brand name */
  brandName?: string;
  /** Brand's follower count */
  brandFollowers?: number;
  /** Deal length */
  dealLength?: string;
  /** Did this start as a gift? */
  wasGiftFirst?: boolean;
}

/**
 * Input for updating an outcome record.
 */
export interface OutcomeUpdateInput {
  // Update outcome
  /** New outcome status */
  outcome?: OutcomeStatus;
  /** Final rate achieved */
  finalRate?: number;
  /** Percentage change from proposed */
  negotiationDelta?: number;

  // Gift-specific updates
  /** Gift outcome status */
  giftOutcome?: GiftOutcomeStatus;
  /** Days to conversion */
  giftConversionDays?: number;

  // Metadata updates
  /** Brand name */
  brandName?: string;
  /** Brand followers */
  brandFollowers?: number;
  /** Deal length */
  dealLength?: string;

  // Close the outcome
  /** When the deal was closed */
  closedAt?: Date | string;
}

/**
 * Acceptance rate breakdown by deal type.
 */
export interface AcceptanceRates {
  /** Acceptance rate for paid deals (0-1) */
  paid: number;
  /** Acceptance rate for gift deals (0-1) */
  gift: number;
  /** Overall acceptance rate (0-1) */
  overall: number;
  /** Total outcomes tracked for each type */
  counts: {
    paid: number;
    gift: number;
    total: number;
  };
}

/**
 * Market benchmark data for comparison.
 * Aggregated from all creators in the same segment.
 */
export interface MarketBenchmark {
  /** Average acceptance rate for this segment */
  avgAcceptanceRate: number;
  /** Average rate for this segment */
  avgRate: number;
  /** Average negotiation delta (how much rates change) */
  avgNegotiationDelta: number;
  /** Gift to paid conversion rate */
  giftConversionRate: number;
  /** Number of data points used */
  sampleSize: number;
  /** Segment criteria */
  segment: {
    platform: string | null;
    niche: string | null;
    tier: string | null;
  };
}

/**
 * Comprehensive outcome analytics for a creator.
 */
export interface OutcomeAnalytics {
  // Overview stats
  /** Total number of outcomes tracked */
  totalOutcomes: number;
  /** Outcomes by status */
  byStatus: Record<OutcomeStatus, number>;

  // Acceptance rates
  /** Acceptance rates by deal type */
  acceptanceRates: AcceptanceRates;

  // Negotiation metrics
  /** Average negotiation delta (percentage) */
  avgNegotiationDelta: number;
  /** Outcomes where rate was negotiated */
  negotiatedCount: number;

  // Gift-specific metrics
  /** Gift to paid conversion rate (0-1) */
  giftConversionRate: number;
  /** Average days from gift to conversion */
  avgGiftConversionDays: number | null;
  /** Total gifts tracked */
  totalGifts: number;
  /** Gifts that converted to paid */
  giftsConverted: number;

  // Revenue metrics (for closed deals)
  /** Total revenue from accepted/negotiated deals */
  totalRevenue: number;
  /** Average deal value */
  avgDealValue: number;

  // Time-based metrics
  /** Outcomes in the last 30 days */
  last30Days: number;
  /** Outcomes in the last 90 days */
  last90Days: number;

  // Comparison to market (if benchmark available)
  benchmark: MarketBenchmark | null;

  // Insights based on data
  insights: OutcomeInsight[];
}

/**
 * A single insight generated from outcome data.
 */
export interface OutcomeInsight {
  /** Type of insight */
  type: "positive" | "negative" | "neutral" | "suggestion";
  /** The insight message */
  message: string;
  /** Supporting data */
  data?: {
    value: number;
    comparison?: number;
    unit?: string;
  };
}

/**
 * Filter options for querying outcomes.
 */
export interface OutcomeFilters {
  /** Filter by source type */
  sourceType?: OutcomeSourceType;
  /** Filter by proposed type */
  proposedType?: OutcomeProposedType;
  /** Filter by outcome status */
  outcome?: OutcomeStatus;
  /** Filter by platform */
  platform?: string;
  /** Filter by niche */
  niche?: string;
  /** Filter by date range - start */
  startDate?: Date | string;
  /** Filter by date range - end */
  endDate?: Date | string;
  /** Include only closed outcomes */
  closedOnly?: boolean;
}

/**
 * Response from the outcome API for listing outcomes.
 */
export type OutcomeListResponse = ApiResponse<Outcome[]>;

/**
 * Response from the outcome API for a single outcome.
 */
export type OutcomeResponse = ApiResponse<Outcome>;

/**
 * Response from the outcome API for analytics.
 */
export type OutcomeAnalyticsResponse = ApiResponse<OutcomeAnalytics>;

// =============================================================================
// DM IMAGE PARSING TYPES
// =============================================================================

/**
 * Supported image formats for DM screenshot parsing.
 */
export type SupportedImageFormat = "png" | "jpg" | "jpeg" | "webp" | "heic";

/**
 * Detected platform from screenshot UI elements.
 */
export type DetectedPlatform =
  | "instagram"
  | "tiktok"
  | "twitter"
  | "email"
  | "linkedin"
  | "whatsapp"
  | "unknown";

/**
 * Result of extracting text from a DM screenshot.
 */
export interface DMImageExtractionResult {
  /** Extracted text content from the image */
  extractedText: string;
  /** Platform detected from UI elements */
  detectedPlatform: DetectedPlatform;
  /** Confidence level of the extraction (0-1) */
  confidence: number;
  /** Whether the image appears to be a valid DM screenshot */
  isValidDMScreenshot: boolean;
  /** Error message if extraction failed */
  error?: string;
  /** Additional metadata about the extraction */
  metadata?: {
    /** Whether multiple messages were detected */
    multipleMessages: boolean;
    /** Sender name if detected */
    senderName?: string;
    /** Any profile picture or brand logo detected */
    hasProfilePic: boolean;
  };
}

/**
 * Input for parsing a DM image.
 */
export interface DMImageParseInput {
  /** Base64 encoded image data */
  imageData: string;
  /** MIME type of the image */
  mimeType: string;
  /** Original filename (optional) */
  filename?: string;
}

/**
 * Extended DM analysis result that includes image parsing info.
 */
export interface DMImageAnalysis extends DMAnalysis {
  /** Source of the analysis */
  source: "text" | "image";
  /** Image extraction details (only present for image source) */
  imageExtraction?: DMImageExtractionResult;
}

/**
 * Response from the DM parsing API that supports both text and image.
 */
export type DMParseResponse = ApiResponse<DMImageAnalysis>;

// =============================================================================
// CONTRACT SCANNER TYPES
// =============================================================================

/**
 * Contract category for organizing analysis results.
 */
export type ContractScanCategory = "payment" | "contentRights" | "exclusivity" | "legal";

/**
 * Health level based on contract score.
 */
export type ContractHealthLevel = "excellent" | "good" | "fair" | "poor";

/**
 * Input for the contract scanner.
 */
export interface ContractScanInput {
  /** The full contract text to analyze */
  contractText: string;
  /** Optional deal context for enhanced analysis */
  dealContext?: {
    platform?: Platform;
    dealType?: DealType;
    offeredRate?: number;
  };
}

/**
 * Analysis result for a single category.
 */
export interface ContractCategoryAnalysis {
  /** Score for this category (0-25) */
  score: number;
  /** Status of coverage in this category */
  status: "complete" | "partial" | "missing";
  /** Key findings for this category */
  findings: string[];
}

/**
 * A clause found in the contract.
 */
export interface FoundClause {
  /** Category this clause belongs to */
  category: ContractScanCategory;
  /** Name of the clause item */
  item: string;
  /** Direct quote from the contract */
  quote: string;
  /** Assessment of this clause */
  assessment: "good" | "concerning" | "red_flag";
  /** Optional note about this clause */
  note?: string;
}

/**
 * A clause that is missing from the contract.
 */
export interface MissingClause {
  /** Category this clause belongs to */
  category: ContractScanCategory;
  /** Name of the missing item */
  item: string;
  /** How important this clause is */
  importance: "critical" | "important" | "recommended";
  /** Suggested language to add */
  suggestion: string;
}

/**
 * A red flag detected in the contract.
 */
export interface ContractScanRedFlag {
  /** Severity of the red flag */
  severity: "high" | "medium" | "low";
  /** Name of the problematic clause */
  clause: string;
  /** Quote from the contract (if applicable) */
  quote?: string;
  /** Why this is a problem */
  explanation: string;
  /** What to do about it */
  suggestion: string;
}

/**
 * Complete result from scanning a contract.
 */
export interface ContractScanResult {
  /** Overall health score (0-100) */
  healthScore: number;
  /** Health level category */
  healthLevel: ContractHealthLevel;

  /** Breakdown by category */
  categories: {
    payment: ContractCategoryAnalysis;
    contentRights: ContractCategoryAnalysis;
    exclusivity: ContractCategoryAnalysis;
    legal: ContractCategoryAnalysis;
  };

  /** Clauses found in the contract */
  foundClauses: FoundClause[];
  /** Important clauses missing from the contract */
  missingClauses: MissingClause[];
  /** Red flags detected */
  redFlags: ContractScanRedFlag[];

  /** Recommendations for the creator */
  recommendations: string[];
  /** Pre-generated change request email template */
  changeRequestTemplate: string;
}

/**
 * Response from the contract scanner API.
 */
export type ContractScanResponse = ApiResponse<ContractScanResult>;

// =============================================================================
// QUICK CALCULATOR TYPES
// =============================================================================

/**
 * Input for the Quick Calculator - minimal info needed for a rate estimate.
 * Used on landing page without requiring authentication.
 */
export interface QuickCalculatorInput {
  /** Total follower count */
  followerCount: number;
  /** Target platform for content */
  platform: Platform;
  /** Content format type */
  contentFormat: ContentFormat;
  /** Creator's primary niche (optional, defaults to "lifestyle") */
  niche?: string;
}

/**
 * A factor that could influence the final rate.
 * Shown to users to encourage signup for full rate card.
 */
export interface RateInfluencer {
  /** Factor name (e.g., "High Engagement") */
  name: string;
  /** Description of why this matters */
  description: string;
  /** Potential increase (e.g., "+20%") */
  potentialIncrease: string;
}

/**
 * Result from the Quick Calculator.
 * Provides a rate range estimate without full profile data.
 */
export interface QuickEstimateResult {
  /** Minimum estimated rate (baseRate - 20%) */
  minRate: number;
  /** Maximum estimated rate (baseRate + 20%) */
  maxRate: number;
  /** Base calculated rate (before range adjustment) */
  baseRate: number;
  /** Creator tier name (e.g., "Micro", "Mid-tier") */
  tierName: string;
  /** Creator tier value */
  tier: CreatorTier;
  /** Factors that could increase the rate */
  factors: RateInfluencer[];
  /** Platform used in calculation */
  platform: Platform;
  /** Format used in calculation */
  contentFormat: ContentFormat;
  /** Niche used in calculation */
  niche: string;
}
