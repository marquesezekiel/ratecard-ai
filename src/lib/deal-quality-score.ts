/**
 * RateCard.AI Deal Quality Score Calculator
 *
 * This is the creator-centric replacement for the fit score system.
 *
 * Old question (FitScore): "How well does this creator fit the brand?"
 * New question (DealQuality): "How good is this deal FOR the creator?"
 *
 * 6 Scoring Dimensions (100 points total):
 * 1. Rate Fairness (25 points) - Is the rate at/above market?
 * 2. Brand Legitimacy (20 points) - Is this a real, trustworthy brand?
 * 3. Portfolio Value (20 points) - Will this look good in portfolio?
 * 4. Growth Potential (15 points) - Ongoing partnership opportunity?
 * 5. Terms Fairness (10 points) - Are contract terms reasonable?
 * 6. Creative Freedom (10 points) - How much creative control?
 *
 * Deal Quality Levels:
 * - 85-100: Excellent Opportunity (green) - "Take this deal"
 * - 70-84: Good Deal (blue) - "Good deal"
 * - 50-69: Fair/Negotiate (yellow) - "Negotiate terms"
 * - Below 50: Proceed with Caution (red) - "Consider declining"
 */

import type {
  CreatorProfile,
  ParsedBrief,
  DealQualityResult,
  DealQualityComponent,
  DealQualityLevel,
  DealRecommendation,
  DealQualityInput,
  FitScoreResult,
  FitLevel,
  CreatorTier,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Max points for each scoring dimension.
 * These determine the weight/importance of each factor.
 */
const MAX_POINTS = {
  rateFairness: 25,
  brandLegitimacy: 20,
  portfolioValue: 20,
  growthPotential: 15,
  termsFairness: 10,
  creativeFreedom: 10,
};

/**
 * Deal quality level thresholds and price adjustments.
 * Maps total score to quality level and pricing adjustment.
 */
const QUALITY_LEVELS: {
  minScore: number;
  level: DealQualityLevel;
  adjustment: number;
  recommendation: DealRecommendation;
  recommendationText: string;
}[] = [
  {
    minScore: 85,
    level: "excellent",
    adjustment: 0.25,
    recommendation: "take_deal",
    recommendationText: "Excellent opportunity! This deal is worth pursuing.",
  },
  {
    minScore: 70,
    level: "good",
    adjustment: 0.15,
    recommendation: "good_deal",
    recommendationText: "Good deal. Consider accepting with minor negotiations.",
  },
  {
    minScore: 50,
    level: "fair",
    adjustment: 0,
    recommendation: "negotiate",
    recommendationText: "Fair deal. Negotiate for better terms before accepting.",
  },
  {
    minScore: 0,
    level: "caution",
    adjustment: -0.1,
    recommendation: "decline",
    recommendationText: "Proceed with caution. Consider declining or major renegotiation.",
  },
];

/**
 * Market rate benchmarks by creator tier (USD).
 * Used for rate fairness calculation.
 */
const MARKET_RATE_BENCHMARKS: Record<CreatorTier, number> = {
  nano: 150,
  micro: 400,
  mid: 800,
  rising: 1500,
  macro: 3000,
  mega: 6000,
  celebrity: 12000,
};

/**
 * Industry niches to related niches mapping.
 * Used for portfolio value calculation.
 */
const INDUSTRY_NICHES: Record<string, string[]> = {
  fashion: ["fashion", "style", "clothing", "beauty", "lifestyle", "luxury"],
  fitness: ["fitness", "health", "wellness", "sports", "gym", "nutrition"],
  technology: ["tech", "gaming", "gadgets", "software", "apps", "ai"],
  food: ["food", "cooking", "recipes", "restaurants", "foodie", "chef"],
  travel: ["travel", "adventure", "destinations", "hotels", "wanderlust"],
  beauty: ["beauty", "makeup", "skincare", "cosmetics", "hair", "nails"],
  finance: ["finance", "investing", "money", "business", "crypto", "stocks"],
  education: ["education", "learning", "tutorials", "courses", "teaching"],
  entertainment: ["entertainment", "movies", "music", "celebrity", "pop culture"],
  parenting: ["parenting", "family", "kids", "motherhood", "fatherhood"],
  automotive: ["automotive", "cars", "vehicles", "racing", "motorcycles"],
  gaming: ["gaming", "esports", "games", "streaming", "twitch"],
  home: ["home", "decor", "diy", "interior", "garden", "renovation"],
  pets: ["pets", "dogs", "cats", "animals", "pet care"],
};

/**
 * High-prestige brand industries that boost portfolio value.
 */
const HIGH_PRESTIGE_INDUSTRIES = [
  "luxury",
  "fashion",
  "beauty",
  "technology",
  "finance",
  "automotive",
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize a string for comparison.
 */
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Get quality level info from a total score.
 */
function getQualityLevelInfo(score: number): {
  level: DealQualityLevel;
  adjustment: number;
  recommendation: DealRecommendation;
  recommendationText: string;
} {
  for (const tier of QUALITY_LEVELS) {
    if (score >= tier.minScore) {
      return {
        level: tier.level,
        adjustment: tier.adjustment,
        recommendation: tier.recommendation,
        recommendationText: tier.recommendationText,
      };
    }
  }
  return QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
}

/**
 * Get related niches for an industry.
 */
function getRelatedNiches(industry: string): string[] {
  const normalized = normalize(industry);
  return INDUSTRY_NICHES[normalized] || [];
}

/**
 * Check if creator's niches match the brand's industry.
 */
function hasNicheMatch(creatorNiches: string[], brandIndustry: string): boolean {
  const relatedNiches = getRelatedNiches(brandIndustry);
  const normalizedCreatorNiches = creatorNiches.map(normalize);

  return normalizedCreatorNiches.some((niche) =>
    relatedNiches.some(
      (related) => related.includes(niche) || niche.includes(related)
    )
  );
}

// =============================================================================
// DIMENSION SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate Rate Fairness score (25 points max).
 *
 * Evaluates whether the calculated/offered rate is at or above market rate.
 * Formula: (rate / marketRate) * 25, capped at 25.
 */
function calculateRateFairness(
  profile: CreatorProfile,
  brief: ParsedBrief,
  input: DealQualityInput,
  calculatedRate: number
): DealQualityComponent {
  const maxPoints = MAX_POINTS.rateFairness;
  const marketRate = MARKET_RATE_BENCHMARKS[profile.tier];

  // Use offered rate if provided, otherwise use calculated rate
  const effectiveRate = input.offeredRate ?? calculatedRate;

  // Calculate ratio of effective rate to market rate
  const ratio = effectiveRate / marketRate;

  let score: number;
  let insight: string;
  const tips: string[] = [];

  if (ratio >= 1.2) {
    // 20% above market or more
    score = maxPoints;
    insight = `Excellent! This rate is ${Math.round((ratio - 1) * 100)}% above market average for ${profile.tier} creators.`;
  } else if (ratio >= 1.0) {
    // At or slightly above market
    score = Math.round(maxPoints * 0.85);
    insight = `Good rate. This is at or slightly above the market average for your tier.`;
  } else if (ratio >= 0.8) {
    // 80-99% of market rate
    score = Math.round(maxPoints * 0.6);
    insight = `Fair rate, but ${Math.round((1 - ratio) * 100)}% below market average. Consider negotiating.`;
    tips.push("Counter with your calculated market rate");
    tips.push("Highlight your engagement rate and audience quality");
  } else if (ratio >= 0.6) {
    // 60-79% of market rate
    score = Math.round(maxPoints * 0.35);
    insight = `Below market rate by ${Math.round((1 - ratio) * 100)}%. Significant negotiation needed.`;
    tips.push("This rate undervalues your work significantly");
    tips.push("Request at least market rate or decline");
  } else {
    // Less than 60% of market rate
    score = Math.round(maxPoints * 0.1);
    insight = `Warning: This rate is ${Math.round((1 - ratio) * 100)}% below market value. Major red flag.`;
    tips.push("This rate is exploitative - strongly consider declining");
    tips.push("If proceeding, require significant increases");
  }

  return {
    name: "Rate Fairness",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

/**
 * Calculate Brand Legitimacy score (20 points max).
 *
 * Assesses if this is a real brand with genuine presence.
 * Factors: website, social following, creator history, brand tier.
 */
function calculateBrandLegitimacy(
  brief: ParsedBrief,
  input: DealQualityInput
): DealQualityComponent {
  const maxPoints = MAX_POINTS.brandLegitimacy;
  let score = 0;
  const factors: string[] = [];
  const tips: string[] = [];

  // Brand tier assessment (0-8 points)
  switch (input.brandTier) {
    case "major":
      score += 8;
      factors.push("major brand");
      break;
    case "established":
      score += 6;
      factors.push("established brand");
      break;
    case "emerging":
      score += 3;
      factors.push("emerging brand");
      break;
    default:
      score += 1;
      tips.push("Research this brand before committing");
  }

  // Website presence (0-4 points)
  if (input.brandHasWebsite === true) {
    score += 4;
    factors.push("has website");
  } else if (input.brandHasWebsite === false) {
    score += 0;
    tips.push("No website - verify brand legitimacy");
  } else {
    score += 2; // Unknown - give partial credit
  }

  // Social following (0-4 points)
  if (input.brandFollowers !== undefined) {
    if (input.brandFollowers >= 100000) {
      score += 4;
      factors.push(`${(input.brandFollowers / 1000).toFixed(0)}K followers`);
    } else if (input.brandFollowers >= 10000) {
      score += 3;
      factors.push(`${(input.brandFollowers / 1000).toFixed(0)}K followers`);
    } else if (input.brandFollowers >= 1000) {
      score += 2;
    } else {
      score += 0;
      tips.push("Brand has very low social presence");
    }
  } else {
    score += 2; // Unknown - give partial credit
  }

  // Creator collaboration history (0-4 points)
  if (input.brandHasCreatorHistory === true) {
    score += 4;
    factors.push("works with creators");
  } else if (input.brandHasCreatorHistory === false) {
    score += 1;
    tips.push("Brand is new to creator partnerships");
  } else {
    score += 2; // Unknown - partial credit
  }

  let insight: string;
  if (score >= 16) {
    insight = `Legitimate brand: ${factors.join(", ")}.`;
  } else if (score >= 10) {
    insight = `Brand appears legitimate. ${factors.length > 0 ? `Positive signals: ${factors.join(", ")}.` : ""}`;
  } else if (score >= 5) {
    insight = `Limited brand verification. Research before committing.`;
  } else {
    insight = `Unverified brand. Proceed with significant caution.`;
  }

  return {
    name: "Brand Legitimacy",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

/**
 * Calculate Portfolio Value score (20 points max).
 *
 * Assesses whether this deal will enhance the creator's portfolio.
 * Factors: niche alignment, brand prestige, industry reputation.
 */
function calculatePortfolioValue(
  profile: CreatorProfile,
  brief: ParsedBrief,
  input: DealQualityInput
): DealQualityComponent {
  const maxPoints = MAX_POINTS.portfolioValue;
  let score = 0;
  const factors: string[] = [];
  const tips: string[] = [];

  const brandIndustry = normalize(brief.brand.industry);

  // Niche alignment (0-8 points)
  const nicheMatch = hasNicheMatch(profile.niches, brief.brand.industry);
  if (nicheMatch) {
    score += 8;
    factors.push("niche alignment");
  } else {
    score += 2;
    tips.push("Consider if this fits your content style");
  }

  // Brand prestige (0-8 points)
  if (input.brandTier === "major") {
    score += 8;
    factors.push("major brand prestige");
  } else if (input.brandTier === "established") {
    score += 6;
    factors.push("established brand");
  } else if (HIGH_PRESTIGE_INDUSTRIES.includes(brandIndustry)) {
    score += 5;
    factors.push(`${brandIndustry} industry`);
  } else if (input.brandTier === "emerging") {
    score += 3;
  } else {
    score += 2;
  }

  // Category leader bonus (0-4 points)
  if (input.isCategoryLeader) {
    score += 4;
    factors.push("category leader");
  } else {
    score += 2; // Neutral
  }

  let insight: string;
  if (score >= 16) {
    insight = `Excellent portfolio addition: ${factors.join(", ")}.`;
  } else if (score >= 10) {
    insight = `Good for portfolio. ${factors.length > 0 ? `Benefits: ${factors.join(", ")}.` : ""}`;
  } else if (score >= 5) {
    insight = `Moderate portfolio value. May not be a standout piece.`;
  } else {
    insight = `Limited portfolio value. Consider if this aligns with your brand.`;
  }

  return {
    name: "Portfolio Value",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

/**
 * Calculate Growth Potential score (15 points max).
 *
 * Assesses potential for ongoing partnership and career growth.
 * Factors: ongoing partnership mention, category leader, brand tier.
 */
function calculateGrowthPotential(
  brief: ParsedBrief,
  input: DealQualityInput
): DealQualityComponent {
  const maxPoints = MAX_POINTS.growthPotential;
  let score = 0;
  const factors: string[] = [];
  const tips: string[] = [];

  // Ongoing partnership mention (0-6 points)
  if (input.mentionsOngoingPartnership) {
    score += 6;
    factors.push("ongoing partnership potential");
  } else {
    score += 2;
    tips.push("Ask about long-term partnership opportunities");
  }

  // Category leader or major brand (0-5 points)
  if (input.isCategoryLeader) {
    score += 5;
    factors.push("category leader opens doors");
  } else if (input.brandTier === "major") {
    score += 4;
    factors.push("major brand credibility");
  } else if (input.brandTier === "established") {
    score += 3;
  } else {
    score += 1;
  }

  // Retainer/ambassador deal type (0-4 points)
  if (brief.retainerConfig) {
    const dealLength = brief.retainerConfig.dealLength;
    if (dealLength === "12_month") {
      score += 4;
      factors.push("12-month ambassador");
    } else if (dealLength === "6_month") {
      score += 3;
      factors.push("6-month retainer");
    } else if (dealLength === "3_month") {
      score += 2;
      factors.push("3-month retainer");
    }
  } else {
    score += 1;
  }

  let insight: string;
  if (score >= 12) {
    insight = `High growth potential: ${factors.join(", ")}.`;
  } else if (score >= 8) {
    insight = `Good growth opportunity. ${factors.length > 0 ? factors.join(", ") + "." : ""}`;
  } else if (score >= 4) {
    insight = `Limited but possible growth. Consider negotiating for future opportunities.`;
  } else {
    insight = `One-off deal with limited growth potential.`;
  }

  return {
    name: "Growth Potential",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

/**
 * Calculate Terms Fairness score (10 points max).
 *
 * Evaluates if contract/payment terms are reasonable.
 * Factors: payment terms, usage rights duration, exclusivity.
 */
function calculateTermsFairness(
  brief: ParsedBrief,
  input: DealQualityInput
): DealQualityComponent {
  const maxPoints = MAX_POINTS.termsFairness;
  let score = 0;
  const factors: string[] = [];
  const tips: string[] = [];

  // Payment terms (0-4 points)
  switch (input.paymentTerms) {
    case "upfront":
      score += 4;
      factors.push("upfront payment");
      break;
    case "net_15":
      score += 4;
      factors.push("Net-15 payment");
      break;
    case "net_30":
      score += 3;
      factors.push("Net-30 payment");
      break;
    case "net_60":
      score += 1;
      tips.push("Net-60 is slow - request Net-30 or faster");
      break;
    case "net_90":
      score += 0;
      tips.push("Net-90 is unreasonable - negotiate faster payment");
      break;
    default:
      score += 2; // Unknown - partial credit
      tips.push("Clarify payment terms before signing");
  }

  // Usage rights reasonableness (0-3 points)
  const durationDays = brief.usageRights.durationDays;
  if (durationDays === 0) {
    score += 3;
    factors.push("no extended usage");
  } else if (durationDays <= 90) {
    score += 2;
  } else if (durationDays <= 365) {
    score += 1;
    tips.push("Long usage rights - ensure compensation matches");
  } else {
    score += 0;
    tips.push("Perpetual usage requires significant premium");
  }

  // Exclusivity (0-3 points)
  const exclusivity = brief.usageRights.exclusivity;
  if (exclusivity === "none") {
    score += 3;
    factors.push("no exclusivity");
  } else if (exclusivity === "category") {
    score += 1;
    tips.push("Category exclusivity limits your opportunities");
  } else if (exclusivity === "full") {
    score += 0;
    tips.push("Full exclusivity is restrictive - ensure major compensation");
  }

  let insight: string;
  if (score >= 8) {
    insight = `Fair terms: ${factors.join(", ")}.`;
  } else if (score >= 5) {
    insight = `Acceptable terms with some concerns.`;
  } else {
    insight = `Unfavorable terms. Negotiate before accepting.`;
  }

  return {
    name: "Terms Fairness",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

/**
 * Calculate Creative Freedom score (10 points max).
 *
 * Assesses how much creative control the creator has.
 * Factors: script strictness, revision limits, approval complexity.
 */
function calculateCreativeFreedom(
  brief: ParsedBrief,
  input: DealQualityInput
): DealQualityComponent {
  const maxPoints = MAX_POINTS.creativeFreedom;
  let score = 0;
  const factors: string[] = [];
  const tips: string[] = [];

  // Script strictness (0-4 points)
  if (input.hasStrictScript === false) {
    score += 4;
    factors.push("loose creative guidelines");
  } else if (input.hasStrictScript === true) {
    score += 1;
    tips.push("Strict scripts limit your authentic voice");
  } else {
    score += 2; // Unknown - partial credit
  }

  // Revision rounds (0-3 points)
  if (input.revisionRounds !== undefined) {
    if (input.revisionRounds <= 1) {
      score += 3;
      factors.push("limited revisions");
    } else if (input.revisionRounds <= 2) {
      score += 2;
    } else if (input.revisionRounds <= 3) {
      score += 1;
      tips.push("3+ revision rounds is excessive");
    } else {
      score += 0;
      tips.push("Unlimited revisions is a red flag - cap at 2");
    }
  } else {
    score += 2; // Unknown - partial credit
    tips.push("Clarify revision limits before signing");
  }

  // Approval process (0-3 points)
  switch (input.approvalProcess) {
    case "simple":
      score += 3;
      factors.push("simple approval");
      break;
    case "moderate":
      score += 2;
      break;
    case "complex":
      score += 0;
      tips.push("Complex approval processes slow you down");
      break;
    default:
      score += 1; // Unknown
  }

  let insight: string;
  if (score >= 8) {
    insight = `Good creative freedom: ${factors.join(", ")}.`;
  } else if (score >= 5) {
    insight = `Moderate creative freedom. Some brand oversight expected.`;
  } else {
    insight = `Limited creative freedom. This may feel restrictive.`;
  }

  return {
    name: "Creative Freedom",
    score: clamp(score, 0, maxPoints),
    maxPoints,
    weight: maxPoints / 100,
    insight,
    tips: tips.length > 0 ? tips : undefined,
  };
}

// =============================================================================
// RED FLAG / GREEN FLAG DETECTION
// =============================================================================

/**
 * Detect red flags in the deal.
 */
function detectRedFlags(
  brief: ParsedBrief,
  input: DealQualityInput,
  breakdown: DealQualityResult["breakdown"]
): string[] {
  const redFlags: string[] = [];

  // Rate-related red flags
  if (breakdown.rateFairness.score < MAX_POINTS.rateFairness * 0.4) {
    redFlags.push("Rate significantly below market value");
  }

  // Brand legitimacy red flags
  if (breakdown.brandLegitimacy.score < MAX_POINTS.brandLegitimacy * 0.3) {
    redFlags.push("Unverified or suspicious brand");
  }

  // Terms red flags
  if (input.paymentTerms === "net_90") {
    redFlags.push("Payment terms beyond Net-60");
  }

  if (brief.usageRights.durationDays > 365 && brief.usageRights.exclusivity !== "none") {
    redFlags.push("Perpetual usage with exclusivity");
  }

  if (input.revisionRounds !== undefined && input.revisionRounds > 3) {
    redFlags.push("Unlimited or excessive revision rounds");
  }

  if (brief.usageRights.exclusivity === "full") {
    redFlags.push("Full exclusivity restricts all other brand work");
  }

  return redFlags;
}

/**
 * Detect green flags (positive signals) in the deal.
 */
function detectGreenFlags(
  brief: ParsedBrief,
  input: DealQualityInput,
  breakdown: DealQualityResult["breakdown"]
): string[] {
  const greenFlags: string[] = [];

  // Rate-related green flags
  if (breakdown.rateFairness.score >= MAX_POINTS.rateFairness * 0.85) {
    greenFlags.push("Rate at or above market value");
  }

  // Brand green flags
  if (input.brandTier === "major") {
    greenFlags.push("Major brand opportunity");
  }

  if (input.isCategoryLeader) {
    greenFlags.push("Category-leading brand");
  }

  // Terms green flags
  if (input.paymentTerms === "upfront" || input.paymentTerms === "net_15") {
    greenFlags.push("Fast payment terms");
  }

  if (brief.usageRights.exclusivity === "none" && brief.usageRights.durationDays <= 30) {
    greenFlags.push("Minimal usage rights restrictions");
  }

  // Growth green flags
  if (input.mentionsOngoingPartnership) {
    greenFlags.push("Potential for ongoing partnership");
  }

  if (brief.retainerConfig && ["6_month", "12_month"].includes(brief.retainerConfig.dealLength)) {
    greenFlags.push("Long-term partnership commitment");
  }

  return greenFlags;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Calculate the Deal Quality Score for a creator-brand opportunity.
 *
 * This is the creator-centric replacement for calculateFitScore.
 * Instead of measuring brand-creator fit, it evaluates how good the deal
 * is FOR the creator.
 *
 * @param profile - Creator's profile
 * @param brief - Parsed brand brief
 * @param input - Additional deal quality signals
 * @param calculatedRate - The rate calculated by the pricing engine (optional)
 * @returns Complete deal quality result with breakdown and recommendations
 */
export function calculateDealQuality(
  profile: CreatorProfile,
  brief: ParsedBrief,
  input: DealQualityInput = {},
  calculatedRate?: number
): DealQualityResult {
  // Use market benchmark as fallback rate
  const effectiveRate = calculatedRate ?? MARKET_RATE_BENCHMARKS[profile.tier];

  // Calculate each dimension
  const rateFairness = calculateRateFairness(profile, brief, input, effectiveRate);
  const brandLegitimacy = calculateBrandLegitimacy(brief, input);
  const portfolioValue = calculatePortfolioValue(profile, brief, input);
  const growthPotential = calculateGrowthPotential(brief, input);
  const termsFairness = calculateTermsFairness(brief, input);
  const creativeFreedom = calculateCreativeFreedom(brief, input);

  const breakdown = {
    rateFairness,
    brandLegitimacy,
    portfolioValue,
    growthPotential,
    termsFairness,
    creativeFreedom,
  };

  // Calculate total score
  const totalScore = clamp(
    rateFairness.score +
      brandLegitimacy.score +
      portfolioValue.score +
      growthPotential.score +
      termsFairness.score +
      creativeFreedom.score,
    0,
    100
  );

  // Get quality level and recommendation
  const levelInfo = getQualityLevelInfo(totalScore);

  // Detect flags
  const redFlags = detectRedFlags(brief, input, breakdown);
  const greenFlags = detectGreenFlags(brief, input, breakdown);

  // Generate insights (prioritize lower-scoring dimensions)
  const sortedComponents = Object.values(breakdown)
    .map((c) => ({ ...c, percentage: (c.score / c.maxPoints) * 100 }))
    .sort((a, b) => a.percentage - b.percentage);

  const insights: string[] = [];

  // Add summary insight
  if (levelInfo.level === "excellent") {
    insights.push(`Excellent deal! ${greenFlags.length > 0 ? `Key strengths: ${greenFlags.slice(0, 2).join(", ")}.` : ""}`);
  } else if (levelInfo.level === "good") {
    insights.push(`Good opportunity for ${brief.brand.name}. Minor improvements possible.`);
  } else if (levelInfo.level === "fair") {
    insights.push(`Fair deal with ${brief.brand.name}. Review areas for negotiation.`);
  } else {
    insights.push(`Significant concerns with this deal. ${redFlags.length > 0 ? `Issues: ${redFlags.slice(0, 2).join(", ")}.` : ""}`);
  }

  // Add dimension-specific insights (prioritize areas needing attention)
  for (const component of sortedComponents.slice(0, 3)) {
    if (component.percentage < 70) {
      insights.push(component.insight);
    }
  }

  return {
    totalScore,
    qualityLevel: levelInfo.level,
    priceAdjustment: levelInfo.adjustment,
    recommendation: levelInfo.recommendation,
    recommendationText: levelInfo.recommendationText,
    breakdown,
    insights: insights.slice(0, 5),
    redFlags,
    greenFlags,
  };
}

/**
 * Convert a DealQualityResult to FitScoreResult for backward compatibility.
 *
 * This allows existing code that expects FitScoreResult to continue working
 * while we transition to the new Deal Quality Score system.
 *
 * @param dealQuality - The deal quality result to convert
 * @returns FitScoreResult-compatible object
 */
export function dealQualityToFitScore(dealQuality: DealQualityResult): FitScoreResult {
  // Map quality level to fit level
  const fitLevelMap: Record<DealQualityLevel, FitLevel> = {
    excellent: "perfect",
    good: "high",
    fair: "medium",
    caution: "low",
  };

  // Convert deal quality components to fit score components
  // We map the 6 dimensions to the 5 original dimensions
  return {
    totalScore: dealQuality.totalScore,
    fitLevel: fitLevelMap[dealQuality.qualityLevel],
    priceAdjustment: dealQuality.priceAdjustment,
    breakdown: {
      // Map rateFairness + termsFairness → nicheMatch (rate considerations)
      nicheMatch: {
        score: Math.round(
          ((dealQuality.breakdown.rateFairness.score / dealQuality.breakdown.rateFairness.maxPoints) * 100 +
            (dealQuality.breakdown.termsFairness.score / dealQuality.breakdown.termsFairness.maxPoints) * 100) /
            2
        ),
        weight: 0.3,
        insight: dealQuality.breakdown.rateFairness.insight,
      },
      // Map brandLegitimacy → demographicMatch
      demographicMatch: {
        score: Math.round(
          (dealQuality.breakdown.brandLegitimacy.score / dealQuality.breakdown.brandLegitimacy.maxPoints) * 100
        ),
        weight: 0.25,
        insight: dealQuality.breakdown.brandLegitimacy.insight,
      },
      // Map portfolioValue → platformMatch
      platformMatch: {
        score: Math.round(
          (dealQuality.breakdown.portfolioValue.score / dealQuality.breakdown.portfolioValue.maxPoints) * 100
        ),
        weight: 0.2,
        insight: dealQuality.breakdown.portfolioValue.insight,
      },
      // Map growthPotential → engagementQuality
      engagementQuality: {
        score: Math.round(
          (dealQuality.breakdown.growthPotential.score / dealQuality.breakdown.growthPotential.maxPoints) * 100
        ),
        weight: 0.15,
        insight: dealQuality.breakdown.growthPotential.insight,
      },
      // Map creativeFreedom → contentCapability
      contentCapability: {
        score: Math.round(
          (dealQuality.breakdown.creativeFreedom.score / dealQuality.breakdown.creativeFreedom.maxPoints) * 100
        ),
        weight: 0.1,
        insight: dealQuality.breakdown.creativeFreedom.insight,
      },
    },
    insights: dealQuality.insights,
  };
}

/**
 * Calculate Deal Quality Score and return both native result and FitScore-compatible result.
 *
 * This is the main function to use during the transition period.
 * It provides both the new DealQualityResult and a backward-compatible FitScoreResult.
 *
 * @param profile - Creator's profile
 * @param brief - Parsed brand brief
 * @param input - Additional deal quality signals
 * @param calculatedRate - The rate calculated by the pricing engine (optional)
 * @returns Object with both dealQuality and fitScore results
 */
export function calculateDealQualityWithCompat(
  profile: CreatorProfile,
  brief: ParsedBrief,
  input: DealQualityInput = {},
  calculatedRate?: number
): { dealQuality: DealQualityResult; fitScore: FitScoreResult } {
  const dealQuality = calculateDealQuality(profile, brief, input, calculatedRate);
  const fitScore = dealQualityToFitScore(dealQuality);
  return { dealQuality, fitScore };
}
