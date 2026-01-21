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
