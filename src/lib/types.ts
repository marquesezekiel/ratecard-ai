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
// FIT SCORE TYPES
// =============================================================================

/**
 * Fit level category based on total score.
 * Determines the price adjustment in Layer 4.
 */
export type FitLevel = "perfect" | "high" | "medium" | "low";

/**
 * Individual component score within the fit score breakdown.
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
