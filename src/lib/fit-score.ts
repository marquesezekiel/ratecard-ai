/**
 * RateCard.AI Fit Score Calculator
 *
 * Calculates creator-brand compatibility across 5 weighted dimensions.
 * The fit score affects Layer 4 of the pricing engine.
 *
 * Weights:
 * - Niche Match (30%) - Industry/niche alignment
 * - Demographic Match (25%) - Audience age/gender/location overlap
 * - Platform Match (20%) - Target platform presence
 * - Engagement Quality (15%) - Rate vs tier benchmarks
 * - Content Capability (10%) - Format production ability
 */

import type {
  CreatorProfile,
  ParsedBrief,
  FitScoreResult,
  FitScoreComponent,
  FitLevel,
  Platform,
  ContentFormat,
  CreatorTier,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Industry to related niches mapping.
 * Used to calculate niche match score.
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
  entertainment: [
    "entertainment",
    "movies",
    "music",
    "celebrity",
    "pop culture",
  ],
  parenting: ["parenting", "family", "kids", "motherhood", "fatherhood"],
  automotive: ["automotive", "cars", "vehicles", "racing", "motorcycles"],
  gaming: ["gaming", "esports", "games", "streaming", "twitch"],
  home: ["home", "decor", "diy", "interior", "garden", "renovation"],
  pets: ["pets", "dogs", "cats", "animals", "pet care"],
};

/**
 * Engagement rate benchmarks by tier.
 * These represent "good" engagement for each tier.
 * Engagement typically decreases as follower count increases.
 */
const ENGAGEMENT_BENCHMARKS: Record<CreatorTier, number> = {
  nano: 5.0, // 1K-10K followers
  micro: 3.5, // 10K-50K followers
  mid: 2.5, // 50K-100K followers
  rising: 2.0, // 100K-250K followers
  macro: 1.5, // 250K-500K followers
  mega: 1.2, // 500K-1M followers
  celebrity: 1.0, // 1M+ followers
};

/**
 * Component weights for fit score calculation.
 * Must sum to 1.0.
 */
const WEIGHTS = {
  nicheMatch: 0.3,
  demographicMatch: 0.25,
  platformMatch: 0.2,
  engagementQuality: 0.15,
  contentCapability: 0.1,
};

/**
 * Fit level thresholds and price adjustments.
 */
const FIT_LEVELS: { minScore: number; level: FitLevel; adjustment: number }[] =
  [
    { minScore: 85, level: "perfect", adjustment: 0.25 },
    { minScore: 65, level: "high", adjustment: 0.15 },
    { minScore: 40, level: "medium", adjustment: 0 },
    { minScore: 0, level: "low", adjustment: -0.1 },
  ];

/**
 * Video-based content formats that need views metric.
 */
const VIDEO_FORMATS: ContentFormat[] = ["reel", "video", "live", "story"];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize a string for comparison (lowercase, trim).
 */
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Get related niches for an industry.
 */
function getRelatedNiches(industry: string): string[] {
  const normalized = normalize(industry);
  return INDUSTRY_NICHES[normalized] || [];
}

/**
 * Get fit level and price adjustment for a score.
 */
function getFitLevelInfo(score: number): {
  level: FitLevel;
  adjustment: number;
} {
  for (const tier of FIT_LEVELS) {
    if (score >= tier.minScore) {
      return { level: tier.level, adjustment: tier.adjustment };
    }
  }
  return { level: "low", adjustment: -0.1 };
}

/**
 * Clamp a value between 0 and 100.
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Get platform metrics from profile.
 */
function getPlatformMetrics(profile: CreatorProfile, platform: Platform) {
  switch (platform) {
    case "instagram":
      return profile.instagram;
    case "tiktok":
      return profile.tiktok;
    case "youtube":
      return profile.youtube;
    case "twitter":
      return profile.twitter;
    default:
      return undefined;
  }
}

// =============================================================================
// COMPONENT SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate niche match score (30% weight).
 * Measures industry/niche alignment between creator and brand.
 */
function calculateNicheMatch(
  profile: CreatorProfile,
  brief: ParsedBrief
): FitScoreComponent {
  const creatorNiches = profile.niches.map(normalize);
  const relatedNiches = getRelatedNiches(brief.brand.industry);

  if (relatedNiches.length === 0) {
    // Unknown industry - give benefit of the doubt
    return {
      score: 50,
      weight: WEIGHTS.nicheMatch,
      insight: `Industry "${brief.brand.industry}" not in our database. Consider if your content aligns.`,
    };
  }

  // Count matching niches
  const matches = creatorNiches.filter((niche) =>
    relatedNiches.some(
      (related) => related.includes(niche) || niche.includes(related)
    )
  );

  const matchRatio = matches.length / Math.max(creatorNiches.length, 1);
  let score: number;
  let insight: string;

  if (matches.length >= 2) {
    score = 100;
    insight = `Excellent niche alignment! Your ${matches.join(", ")} content matches ${brief.brand.industry} perfectly.`;
  } else if (matches.length === 1) {
    score = 75;
    insight = `Good niche match through your ${matches[0]} content for this ${brief.brand.industry} brand.`;
  } else if (matchRatio > 0) {
    score = 50;
    insight = `Partial niche overlap. Consider how your content can serve ${brief.brand.industry}.`;
  } else {
    score = 20;
    insight = `Low niche alignment with ${brief.brand.industry}. This may affect partnership authenticity.`;
  }

  return { score: clamp(score), weight: WEIGHTS.nicheMatch, insight };
}

/**
 * Calculate demographic match score (25% weight).
 * Compares audience demographics with brand's target audience.
 */
function calculateDemographicMatch(
  profile: CreatorProfile,
  brief: ParsedBrief
): FitScoreComponent {
  const targetAudience = normalize(brief.campaign.targetAudience);
  const audience = profile.audience;

  let score = 50; // Base score
  const factors: string[] = [];

  // Age range detection
  const agePatterns: { pattern: RegExp; ranges: string[] }[] = [
    { pattern: /18-24|gen.?z|young|college|teen/i, ranges: ["18-24"] },
    { pattern: /25-34|millennial|young.?adult/i, ranges: ["25-34"] },
    { pattern: /35-44|adult|parent/i, ranges: ["35-44"] },
    { pattern: /45\+|older|mature|senior/i, ranges: ["45-54", "55+"] },
  ];

  for (const { pattern, ranges } of agePatterns) {
    if (pattern.test(targetAudience)) {
      if (ranges.includes(audience.ageRange)) {
        score += 20;
        factors.push("age range");
      }
      break;
    }
  }

  // Gender detection
  if (/women|female|her|she/i.test(targetAudience)) {
    if (audience.genderSplit.female >= 60) {
      score += 15;
      factors.push("female-skewing audience");
    } else if (audience.genderSplit.female >= 40) {
      score += 5;
    }
  } else if (/men|male|him|he\b/i.test(targetAudience)) {
    if (audience.genderSplit.male >= 60) {
      score += 15;
      factors.push("male-skewing audience");
    } else if (audience.genderSplit.male >= 40) {
      score += 5;
    }
  } else {
    // No specific gender target - balanced is good
    const balance = Math.abs(audience.genderSplit.male - audience.genderSplit.female);
    if (balance < 20) {
      score += 10;
      factors.push("balanced audience");
    }
  }

  // Location hints
  if (/us|united.?states|america/i.test(targetAudience)) {
    if (
      audience.topLocations.some((loc) =>
        /us|united.?states|america/i.test(loc)
      )
    ) {
      score += 10;
      factors.push("US audience");
    }
  }

  score = clamp(score);

  let insight: string;
  if (factors.length >= 2) {
    insight = `Strong demographic alignment: ${factors.join(", ")}.`;
  } else if (factors.length === 1) {
    insight = `Good demographic match on ${factors[0]}.`;
  } else if (score >= 50) {
    insight = `Demographics appear compatible with target audience.`;
  } else {
    insight = `Limited demographic overlap with "${brief.campaign.targetAudience}".`;
  }

  return { score, weight: WEIGHTS.demographicMatch, insight };
}

/**
 * Calculate platform match score (20% weight).
 * Checks if creator has strong presence on target platform.
 */
function calculatePlatformMatch(
  profile: CreatorProfile,
  brief: ParsedBrief
): FitScoreComponent {
  const targetPlatform = brief.content.platform;
  const platformMetrics = getPlatformMetrics(profile, targetPlatform);

  if (!platformMetrics) {
    return {
      score: 10,
      weight: WEIGHTS.platformMatch,
      insight: `You don't have ${targetPlatform} metrics. Consider adding this platform to your profile.`,
    };
  }

  const { followers, engagementRate } = platformMetrics;
  let score = 50; // Base for having the platform

  // Strong presence bonuses
  if (followers >= 10000) {
    score += 20;
  } else if (followers >= 5000) {
    score += 10;
  }

  if (engagementRate >= 3) {
    score += 20;
  } else if (engagementRate >= 2) {
    score += 10;
  }

  // Check if this is their primary platform
  const allPlatforms = [
    profile.instagram,
    profile.tiktok,
    profile.youtube,
    profile.twitter,
  ].filter(Boolean);

  const maxFollowers = Math.max(
    ...allPlatforms.map((p) => p?.followers || 0)
  );

  if (followers === maxFollowers) {
    score += 10;
  }

  score = clamp(score);

  let insight: string;
  if (score >= 90) {
    insight = `Excellent ${targetPlatform} presence with ${followers.toLocaleString()} followers and ${engagementRate}% engagement.`;
  } else if (score >= 70) {
    insight = `Strong ${targetPlatform} presence. This is a good platform match.`;
  } else if (score >= 50) {
    insight = `You have ${targetPlatform} presence. Consider if your audience there matches the brand.`;
  } else {
    insight = `Limited ${targetPlatform} presence. Growing this platform could improve fit.`;
  }

  return { score, weight: WEIGHTS.platformMatch, insight };
}

/**
 * Calculate engagement quality score (15% weight).
 * Compares creator's engagement rate to tier benchmarks.
 */
function calculateEngagementQuality(
  profile: CreatorProfile
): FitScoreComponent {
  const { avgEngagementRate, tier } = profile;
  const benchmark = ENGAGEMENT_BENCHMARKS[tier];

  const ratio = avgEngagementRate / benchmark;
  let score: number;
  let insight: string;

  if (ratio >= 1.5) {
    score = 100;
    insight = `Exceptional engagement (${avgEngagementRate.toFixed(1)}%) - 50%+ above ${tier} tier average.`;
  } else if (ratio >= 1.2) {
    score = 85;
    insight = `Strong engagement (${avgEngagementRate.toFixed(1)}%) - above ${tier} tier benchmark of ${benchmark}%.`;
  } else if (ratio >= 1.0) {
    score = 70;
    insight = `Good engagement (${avgEngagementRate.toFixed(1)}%) - meeting ${tier} tier standards.`;
  } else if (ratio >= 0.7) {
    score = 50;
    insight = `Engagement (${avgEngagementRate.toFixed(1)}%) is slightly below ${tier} tier benchmark of ${benchmark}%.`;
  } else {
    score = 30;
    insight = `Engagement (${avgEngagementRate.toFixed(1)}%) is below ${tier} tier average. Focus on audience engagement.`;
  }

  return { score: clamp(score), weight: WEIGHTS.engagementQuality, insight };
}

/**
 * Calculate content capability score (10% weight).
 * Assesses ability to produce the requested content format.
 */
function calculateContentCapability(
  profile: CreatorProfile,
  brief: ParsedBrief
): FitScoreComponent {
  const format = brief.content.format;
  const platform = brief.content.platform;
  const platformMetrics = getPlatformMetrics(profile, platform);

  let score = 60; // Base capability score
  let insight: string;

  // Check if video format and creator has video metrics
  if (VIDEO_FORMATS.includes(format)) {
    if (platformMetrics?.avgViews && platformMetrics.avgViews > 0) {
      score = 85;
      insight = `You have video experience with ${platformMetrics.avgViews.toLocaleString()} average views.`;

      // Bonus for high view counts
      if (platformMetrics.avgViews >= 10000) {
        score = 100;
        insight = `Strong video performance with ${platformMetrics.avgViews.toLocaleString()} average views. Perfect for ${format} content.`;
      }
    } else {
      score = 50;
      insight = `Video content requested but no view metrics available. Add video stats to strengthen your profile.`;
    }
  } else {
    // Static/carousel formats are generally easier
    score = 80;
    insight = `${format.charAt(0).toUpperCase() + format.slice(1)} format is well-suited to your content style.`;
  }

  // Format-specific adjustments
  if (format === "live") {
    score = Math.min(score, 70);
    insight = `Live content requires real-time engagement. ${platformMetrics ? "Your metrics suggest you can handle this." : "Consider your comfort with live streaming."}`;
  } else if (format === "ugc") {
    score = Math.max(score, 75);
    insight = `UGC format gives creative flexibility. Your authentic style is valuable here.`;
  }

  return { score: clamp(score), weight: WEIGHTS.contentCapability, insight };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Calculate the complete fit score for a creator-brand partnership.
 *
 * @param profile - Creator's profile with platform metrics and audience data
 * @param brief - Parsed brand brief with campaign requirements
 * @returns Complete fit score result with breakdown and insights
 */
export function calculateFitScore(
  profile: CreatorProfile,
  brief: ParsedBrief
): FitScoreResult {
  // Calculate each component
  const nicheMatch = calculateNicheMatch(profile, brief);
  const demographicMatch = calculateDemographicMatch(profile, brief);
  const platformMatch = calculatePlatformMatch(profile, brief);
  const engagementQuality = calculateEngagementQuality(profile);
  const contentCapability = calculateContentCapability(profile, brief);

  // Calculate weighted total score
  const totalScore = clamp(
    nicheMatch.score * nicheMatch.weight +
      demographicMatch.score * demographicMatch.weight +
      platformMatch.score * platformMatch.weight +
      engagementQuality.score * engagementQuality.weight +
      contentCapability.score * contentCapability.weight
  );

  // Determine fit level and price adjustment
  const { level: fitLevel, adjustment: priceAdjustment } =
    getFitLevelInfo(totalScore);

  // Sort by relevance (lower scores = more actionable)
  const componentScores = [
    { insight: nicheMatch.insight, score: nicheMatch.score },
    { insight: demographicMatch.insight, score: demographicMatch.score },
    { insight: platformMatch.insight, score: platformMatch.score },
    { insight: engagementQuality.insight, score: engagementQuality.score },
    { insight: contentCapability.insight, score: contentCapability.score },
  ].sort((a, b) => a.score - b.score);

  // Take top 3 insights (prioritizing areas for improvement)
  const insights = componentScores.slice(0, 3).map((c) => c.insight);

  // Add a summary insight based on overall fit
  if (fitLevel === "perfect") {
    insights.unshift(
      `Excellent match! Your profile aligns strongly with ${brief.brand.name}'s campaign.`
    );
  } else if (fitLevel === "high") {
    insights.unshift(
      `Strong fit with ${brief.brand.name}. Minor optimizations could boost your rate.`
    );
  } else if (fitLevel === "medium") {
    insights.unshift(
      `Moderate fit. Review the breakdown below to improve alignment.`
    );
  } else {
    insights.unshift(
      `Consider if this campaign aligns with your brand and audience.`
    );
  }

  return {
    totalScore,
    fitLevel,
    priceAdjustment,
    breakdown: {
      nicheMatch,
      demographicMatch,
      platformMatch,
      engagementQuality,
      contentCapability,
    },
    insights: insights.slice(0, 5), // Max 5 insights
  };
}
