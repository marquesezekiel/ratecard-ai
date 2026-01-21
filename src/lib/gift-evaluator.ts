/**
 * Gift Evaluator
 *
 * Helps creators decide if a gift offer is worth their time by calculating
 * the true value exchange and providing smart recommendations.
 *
 * The evaluator considers:
 * - Monetary value (product vs time + audience value)
 * - Strategic value (portfolio, conversion potential, brand reputation)
 * - Risk factors (brand quality, content expectations)
 */

import type {
  CreatorProfile,
  CreatorTier,
  GiftEvaluationInput,
  GiftEvaluation,
  GiftAnalysisBreakdown,
  GiftStrategicValue,
  GiftAcceptanceBoundaries,
  GiftRecommendation,
  GiftBrandQuality,
  GiftContentRequired,
  GiftConversionPotential,
} from "./types";

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Effective hourly rates by creator tier.
 * Used to calculate the value of creator's time.
 */
const HOURLY_RATES: Record<CreatorTier, number> = {
  nano: 30,
  micro: 50,
  mid: 75,
  rising: 100,
  macro: 125,
  mega: 150,
  celebrity: 200,
};

/**
 * CPM (Cost Per Mille) estimate for calculating audience value.
 * This is a conservative estimate for micro/nano influencer reach.
 */
const ESTIMATED_CPM = 5;

/**
 * Engagement rate multiplier for audience value.
 * Higher engagement = more valuable audience.
 */
const ENGAGEMENT_VALUE_MULTIPLIER = 0.001;

/**
 * Content type effort multipliers.
 * Reflects the relative effort required for different content types.
 */
const CONTENT_EFFORT_MULTIPLIERS: Record<GiftContentRequired, number> = {
  organic_mention: 0.5, // Quick mention, minimal effort
  dedicated_post: 1.0, // Standard post effort
  multiple_posts: 2.0, // Multiple pieces of content
  video_content: 1.5, // Video requires more production
};

/**
 * Content type display names.
 */
const CONTENT_TYPE_DISPLAY: Record<GiftContentRequired, string> = {
  organic_mention: "organic story/mention",
  dedicated_post: "dedicated post",
  multiple_posts: "multiple posts",
  video_content: "video content",
};

/**
 * Brand quality strategic scores.
 */
const BRAND_QUALITY_SCORES: Record<GiftBrandQuality, number> = {
  major_brand: 3, // Major brand adds +3 to strategic score
  established_indie: 2, // Established indie adds +2
  new_unknown: 0, // New/unknown adds nothing
  suspicious: -5, // Suspicious deducts -5
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the effective hourly rate for a creator tier.
 */
export function getHourlyRate(tier: CreatorTier): number {
  return HOURLY_RATES[tier] ?? HOURLY_RATES.micro;
}

/**
 * Calculate the value of creator's time.
 *
 * @param hours - Estimated hours to create content
 * @param tier - Creator's tier
 * @returns Time value in dollars
 */
export function calculateTimeValue(hours: number, tier: CreatorTier): number {
  const hourlyRate = getHourlyRate(tier);
  return Math.round(hours * hourlyRate);
}

/**
 * Calculate the value of creator's audience.
 * Based on reach and engagement, using CPM-style calculation.
 *
 * @param followers - Creator's follower count
 * @param engagementRate - Creator's engagement rate as percentage
 * @returns Audience value in dollars
 */
export function calculateAudienceValue(
  followers: number,
  engagementRate: number
): number {
  // Formula: (followers × engagement rate × 0.001) × $5 CPM estimate
  const reachValue = followers * (engagementRate / 100) * ENGAGEMENT_VALUE_MULTIPLIER * ESTIMATED_CPM;
  return Math.round(reachValue);
}

/**
 * Calculate the effective hourly rate for a gift deal.
 *
 * @param productValue - Value of the gifted product
 * @param hours - Hours required to create content
 * @returns Effective hourly rate
 */
export function calculateEffectiveHourlyRate(
  productValue: number,
  hours: number
): number {
  if (hours <= 0) return 0;
  return Math.round(productValue / hours);
}

/**
 * Calculate strategic score (0-10) based on various factors.
 *
 * Scoring:
 * - Major brand: +3
 * - Established indie: +2
 * - Would buy product anyway: +2
 * - Has previous creator collabs: +2
 * - High conversion potential: +2
 * - Portfolio worthy: +1
 * - Suspicious signals: -5
 */
export function calculateStrategicScore(input: GiftEvaluationInput): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Brand quality scoring
  const brandScore = BRAND_QUALITY_SCORES[input.brandQuality];
  score += brandScore;
  if (brandScore > 0) {
    reasons.push(
      input.brandQuality === "major_brand"
        ? "Major brand adds portfolio credibility"
        : "Established indie brand is trustworthy"
    );
  } else if (brandScore < 0) {
    reasons.push("Suspicious brand signals detected - proceed with caution");
  }

  // Would buy product
  if (input.wouldYouBuyIt) {
    score += 2;
    reasons.push("Product you'd genuinely use adds authenticity");
  }

  // Previous creator collaborations
  if (input.previousCreatorCollabs) {
    score += 2;
    reasons.push("Brand has creator collab history (higher conversion potential)");
  }

  // Has website
  if (input.hasWebsite) {
    score += 1;
    reasons.push("Legitimate website confirms brand credibility");
  }

  // Follower count (indicates potential for ongoing work)
  if (input.brandFollowers !== null) {
    if (input.brandFollowers >= 100000) {
      score += 1;
      reasons.push("Large brand following suggests marketing budget");
    }
  }

  // Clamp score to 0-10
  score = Math.max(0, Math.min(10, score));

  return { score, reasons };
}

/**
 * Determine conversion potential based on brand signals.
 */
export function getConversionPotential(
  input: GiftEvaluationInput
): GiftConversionPotential {
  // High: Major brand with website and previous collabs
  if (
    input.brandQuality === "major_brand" &&
    input.hasWebsite &&
    input.previousCreatorCollabs
  ) {
    return "high";
  }

  // High: Established indie with good signals
  if (
    input.brandQuality === "established_indie" &&
    input.hasWebsite &&
    (input.previousCreatorCollabs || (input.brandFollowers ?? 0) >= 50000)
  ) {
    return "high";
  }

  // Low: Suspicious or new unknown without signals
  if (
    input.brandQuality === "suspicious" ||
    (input.brandQuality === "new_unknown" && !input.hasWebsite)
  ) {
    return "low";
  }

  // Default: medium
  return "medium";
}

/**
 * Determine if deal is portfolio-worthy.
 */
export function isPortfolioWorthy(input: GiftEvaluationInput): boolean {
  // Major brands are always portfolio-worthy
  if (input.brandQuality === "major_brand") return true;

  // Established indie with good signals
  if (
    input.brandQuality === "established_indie" &&
    input.hasWebsite &&
    input.previousCreatorCollabs
  ) {
    return true;
  }

  return false;
}

/**
 * Determine brand reputation boost.
 */
export function hasBrandReputationBoost(input: GiftEvaluationInput): boolean {
  return input.brandQuality === "major_brand";
}

/**
 * Get acceptance boundaries based on deal analysis.
 */
export function getAcceptanceBoundaries(
  input: GiftEvaluationInput,
  valueGapPercentage: number
): GiftAcceptanceBoundaries {
  // For gift-only deals, limit what you provide based on value gap
  const contentRequired = input.contentRequired;

  // Determine max content type based on value gap
  let maxContentType: string;
  if (valueGapPercentage > 50) {
    // Huge gap - only offer minimal content
    maxContentType = "Organic story mention only (not a feed post)";
  } else if (valueGapPercentage > 25) {
    // Moderate gap - one story or one post, not both
    maxContentType =
      contentRequired === "video_content"
        ? "One short-form video (under 30 seconds)"
        : "One story OR one feed post (not both)";
  } else {
    // Small gap - can provide what's asked
    maxContentType = `${CONTENT_TYPE_DISPLAY[contentRequired]} as requested`;
  }

  // Time limit recommendations
  let timeLimit: string;
  if (contentRequired === "organic_mention" || valueGapPercentage > 25) {
    timeLimit = "24-hour story only, not a permanent feed post";
  } else {
    timeLimit = "Standard post duration (can archive after 30 days if desired)";
  }

  // Rights limit
  const rightsLimit =
    "No usage rights beyond your own post. Brand cannot repost or use in ads.";

  return {
    maxContentType,
    timeLimit,
    rightsLimit,
  };
}

/**
 * Generate walk-away point message.
 */
export function getWalkAwayPoint(
  worthScore: number,
  recommendation: GiftRecommendation
): string {
  if (recommendation === "run_away") {
    return "This deal has too many red flags. Politely decline and move on.";
  }

  if (recommendation === "decline_politely") {
    return "If they won't add any budget, thank them and decline. Your time is worth more.";
  }

  if (recommendation === "counter_hybrid") {
    return "If they reject the hybrid offer and insist on gift-only, limit your deliverable to a story mention.";
  }

  if (recommendation === "ask_budget_first") {
    return "If there's no budget at all and the product value doesn't justify your time, politely pass.";
  }

  // accept_with_hook
  return "If they become demanding about deliverables or usage rights, revisit the conversation about paid work.";
}

/**
 * Generate suggested counter-offer based on analysis.
 */
export function generateCounterOffer(
  input: GiftEvaluationInput,
  analysis: GiftAnalysisBreakdown,
  minimumAddOn: number,
  tier: CreatorTier
): string {
  const hourlyRate = getHourlyRate(tier);
  const fullRate = hourlyRate * input.estimatedHoursToCreate;
  const contentDisplay = CONTENT_TYPE_DISPLAY[input.contentRequired];

  if (minimumAddOn <= 0) {
    return "No counter needed - this gift is fair value for the content requested.";
  }

  return `I'd love to work together! For a ${contentDisplay}, I typically charge $${fullRate}. I'd be happy to do a hybrid collaboration:\n\n→ Product gifted + $${minimumAddOn} = ${contentDisplay} with my authentic review\n\nThis lets me create the quality content your brand deserves. Would that work?`;
}

// =============================================================================
// MAIN EVALUATION FUNCTION
// =============================================================================

/**
 * Evaluate a gift deal and provide recommendations.
 *
 * This is the core function that:
 * 1. Calculates the true value exchange (what creator gives vs receives)
 * 2. Assesses strategic value beyond money
 * 3. Determines the appropriate recommendation
 * 4. Provides counter-offer guidance and boundaries
 *
 * Decision matrix:
 * | Worth Score | Strategic Score | Recommendation |
 * |-------------|-----------------|----------------|
 * | 70+         | 7+              | Accept with conversion hook |
 * | 50-70       | 5+              | Counter with hybrid |
 * | 50-70       | <5              | Ask about budget first |
 * | 30-50       | Any             | Decline politely |
 * | <30         | Any             | Run away |
 *
 * @param input - Gift evaluation input with deal details
 * @param creatorProfile - Creator's profile for tier and audience info
 * @returns Complete gift evaluation with recommendations
 */
export function evaluateGiftDeal(
  input: GiftEvaluationInput,
  creatorProfile: CreatorProfile
): GiftEvaluation {
  const tier = creatorProfile.tier;
  const followers = creatorProfile.totalReach;
  const engagementRate = creatorProfile.avgEngagementRate;

  // -------------------------------------------------------------------------
  // Step 1: Calculate monetary analysis
  // -------------------------------------------------------------------------

  // Product value
  const productValue = input.estimatedProductValue;

  // Time value
  const yourTimeValue = calculateTimeValue(input.estimatedHoursToCreate, tier);

  // Audience value
  const audienceValue = calculateAudienceValue(followers, engagementRate);

  // Apply content effort multiplier to audience value
  const adjustedAudienceValue = Math.round(
    audienceValue * CONTENT_EFFORT_MULTIPLIERS[input.contentRequired]
  );

  // Total value creator is providing
  const totalValueProviding = yourTimeValue + adjustedAudienceValue;

  // Value gap (negative = creator giving more than receiving)
  const valueGap = productValue - totalValueProviding;

  // Effective hourly rate
  const effectiveHourlyRate = calculateEffectiveHourlyRate(
    productValue,
    input.estimatedHoursToCreate
  );

  const analysis: GiftAnalysisBreakdown = {
    productValue,
    yourTimeValue,
    audienceValue: adjustedAudienceValue,
    totalValueProviding,
    valueGap,
    effectiveHourlyRate,
  };

  // -------------------------------------------------------------------------
  // Step 2: Calculate strategic value
  // -------------------------------------------------------------------------

  const { score: strategicScore, reasons: strategicReasons } =
    calculateStrategicScore(input);
  const conversionPotential = getConversionPotential(input);
  const portfolioWorth = isPortfolioWorthy(input);
  const brandReputationBoost = hasBrandReputationBoost(input);

  // Add conversion potential to reasons
  if (conversionPotential === "high") {
    strategicReasons.push("High potential to convert to paid partnership");
  } else if (conversionPotential === "low") {
    strategicReasons.push("Low likelihood of becoming a paid partnership");
  }

  const strategicValue: GiftStrategicValue = {
    score: strategicScore,
    portfolioWorth,
    conversionPotential,
    brandReputationBoost,
    reasons: strategicReasons,
  };

  // -------------------------------------------------------------------------
  // Step 3: Calculate worth score (0-100)
  // -------------------------------------------------------------------------

  // Base score starts at 50 (neutral)
  let worthScore = 50;

  // Value gap scoring (-25 to +25 based on gap)
  const valueGapPercentage =
    totalValueProviding > 0
      ? ((totalValueProviding - productValue) / totalValueProviding) * 100
      : 100;

  if (valueGap >= 0) {
    // Product worth more than what creator provides - good deal
    worthScore += Math.min(25, (valueGap / totalValueProviding) * 50);
  } else {
    // Creator providing more than product value - bad deal
    worthScore -= Math.min(25, (Math.abs(valueGap) / totalValueProviding) * 50);
  }

  // Strategic score adds 0-20 points
  worthScore += strategicScore * 2;

  // Brand quality bonuses/penalties
  if (input.brandQuality === "suspicious") {
    worthScore -= 30; // Major penalty for suspicious brands
  } else if (input.brandQuality === "major_brand") {
    worthScore += 10; // Bonus for major brands
  }

  // Effective hourly rate bonus (if it's reasonable)
  const creatorHourlyRate = getHourlyRate(tier);
  if (effectiveHourlyRate >= creatorHourlyRate) {
    worthScore += 10; // Meets your rate
  } else if (effectiveHourlyRate >= creatorHourlyRate * 0.5) {
    worthScore += 5; // At least half your rate
  }

  // Clamp to 0-100
  worthScore = Math.max(0, Math.min(100, Math.round(worthScore)));

  // -------------------------------------------------------------------------
  // Step 4: Determine recommendation
  // -------------------------------------------------------------------------

  let recommendation: GiftRecommendation;

  if (worthScore < 30) {
    recommendation = "run_away";
  } else if (worthScore < 50) {
    recommendation = "decline_politely";
  } else if (worthScore < 70) {
    if (strategicScore >= 5) {
      recommendation = "counter_hybrid";
    } else {
      recommendation = "ask_budget_first";
    }
  } else {
    // worthScore >= 70
    if (strategicScore >= 7) {
      recommendation = "accept_with_hook";
    } else if (strategicScore >= 5) {
      recommendation = "counter_hybrid";
    } else {
      recommendation = "ask_budget_first";
    }
  }

  // -------------------------------------------------------------------------
  // Step 5: Calculate minimum acceptable add-on
  // -------------------------------------------------------------------------

  // Minimum add-on to make this a fair deal
  let minimumAcceptableAddOn = 0;
  if (valueGap < 0) {
    // Creator is giving more than receiving
    // Add-on should cover at least 50% of the gap
    minimumAcceptableAddOn = Math.round(Math.abs(valueGap) * 0.5);
    // Round to nearest $25 for professional appearance
    minimumAcceptableAddOn = Math.ceil(minimumAcceptableAddOn / 25) * 25;
  }

  // -------------------------------------------------------------------------
  // Step 6: Generate counter-offer and walk-away point
  // -------------------------------------------------------------------------

  const suggestedCounterOffer = generateCounterOffer(
    input,
    analysis,
    minimumAcceptableAddOn,
    tier
  );

  const walkAwayPoint = getWalkAwayPoint(worthScore, recommendation);

  // -------------------------------------------------------------------------
  // Step 7: Get acceptance boundaries
  // -------------------------------------------------------------------------

  const acceptanceBoundaries = getAcceptanceBoundaries(input, valueGapPercentage);

  return {
    worthScore,
    recommendation,
    analysis,
    strategicValue,
    minimumAcceptableAddOn,
    suggestedCounterOffer,
    walkAwayPoint,
    acceptanceBoundaries,
  };
}
