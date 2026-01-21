/**
 * RateCard.AI Negotiation Talking Points Generator
 *
 * Generates the "Confidence Stack" that helps creators negotiate with confidence.
 * Includes:
 * 1. "Why This Rate" - Professional justification to share with brands
 * 2. "Confidence Boosters" - Internal encouragement for creators
 * 3. "If They Push Back" - Counter-offer scripts and walk-away points
 * 4. "Quick Response Template" - Ready-to-copy message
 */

import type {
  CreatorProfile,
  ParsedBrief,
  PricingResult,
  NegotiationTalkingPoints,
  WhyThisRateSection,
  ConfidenceBoostersSection,
  PushBackSection,
  QuickResponseSection,
  RateJustification,
  CounterOfferScript,
  CreatorTier,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Market rate benchmarks by tier (baseline rates in USD).
 * Used for market comparison calculations.
 */
const MARKET_BENCHMARKS: Record<CreatorTier, number> = {
  nano: 150,
  micro: 400,
  mid: 800,
  rising: 1500,
  macro: 3000,
  mega: 6000,
  celebrity: 12000,
};

/**
 * Minimum acceptable rate percentages by tier.
 * Lower tiers have more flexibility, higher tiers should hold firmer.
 */
const MINIMUM_RATE_PERCENTAGES: Record<CreatorTier, number> = {
  nano: 0.6, // 60% of quoted rate
  micro: 0.65, // 65%
  mid: 0.7, // 70%
  rising: 0.75, // 75%
  macro: 0.8, // 80%
  mega: 0.85, // 85%
  celebrity: 0.9, // 90%
};

/**
 * Engagement rate benchmarks by tier.
 */
const ENGAGEMENT_BENCHMARKS: Record<CreatorTier, number> = {
  nano: 5.0,
  micro: 3.5,
  mid: 2.5,
  rising: 2.0,
  macro: 1.8,
  mega: 1.5,
  celebrity: 1.2,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format a number as currency.
 */
function formatCurrency(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Capitalize first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get niche display name.
 */
function getNicheDisplay(niches: string[]): string {
  if (niches.length === 0) return "content";
  if (niches.length === 1) return niches[0];
  return `${niches.slice(0, -1).join(", ")} and ${niches[niches.length - 1]}`;
}

/**
 * Get platform display name.
 */
function getPlatformDisplay(platform: string): string {
  const platformNames: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    twitter: "Twitter/X",
    threads: "Threads",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    twitch: "Twitch",
    snapchat: "Snapchat",
  };
  return platformNames[platform.toLowerCase()] || capitalize(platform);
}

/**
 * Get format display name.
 */
function getFormatDisplay(format: string): string {
  const formatNames: Record<string, string> = {
    reel: "Reel",
    post: "Post",
    story: "Story",
    video: "Video",
    carousel: "Carousel",
    live: "Live Stream",
  };
  return formatNames[format.toLowerCase()] || capitalize(format);
}

// =============================================================================
// SECTION GENERATORS
// =============================================================================

/**
 * Generate "Why This Rate" section.
 * Professional, factual justification to share with brands.
 */
function generateWhyThisRate(
  profile: CreatorProfile,
  brief: ParsedBrief,
  _pricing: PricingResult
): WhyThisRateSection {
  const bulletPoints: RateJustification[] = [];
  const engagementBenchmark = ENGAGEMENT_BENCHMARKS[profile.tier];
  const engagementAboveBenchmark = profile.avgEngagementRate > engagementBenchmark;

  // Engagement rate point
  if (engagementAboveBenchmark) {
    const percentage = Math.round(
      ((profile.avgEngagementRate - engagementBenchmark) / engagementBenchmark) * 100
    );
    bulletPoints.push({
      point: `Above-average engagement rate of ${profile.avgEngagementRate}%`,
      supporting: `${percentage}% higher than the ${profile.tier} tier benchmark of ${engagementBenchmark}%`,
    });
  } else {
    bulletPoints.push({
      point: `Consistent engagement rate of ${profile.avgEngagementRate}%`,
      supporting: `Delivering reliable audience interaction for brand content`,
    });
  }

  // Audience size and quality point
  bulletPoints.push({
    point: `Authentic audience of ${profile.totalReach.toLocaleString()} engaged followers`,
    supporting: `Active community in the ${getNicheDisplay(profile.niches)} space`,
  });

  // Niche expertise point
  bulletPoints.push({
    point: `Established expertise in ${getNicheDisplay(profile.niches)}`,
    supporting: `Content aligns naturally with ${brief.brand.name}'s ${brief.brand.industry} focus`,
  });

  // Production value / content quality point
  const format = getFormatDisplay(brief.content.format);
  bulletPoints.push({
    point: `Professional ${format} content production`,
    supporting: `High-quality deliverables that reflect well on brand partners`,
  });

  // Summary
  const summary = `This rate reflects my ${profile.tier}-tier audience value, ${
    engagementAboveBenchmark ? "above-average" : "consistent"
  } engagement, and professional content production capabilities.`;

  return {
    bulletPoints,
    summary,
  };
}

/**
 * Generate "Confidence Boosters" section.
 * Internal encouragement for creators (not to share with brands).
 */
function generateConfidenceBoosters(
  profile: CreatorProfile,
  brief: ParsedBrief,
  pricing: PricingResult
): ConfidenceBoostersSection {
  const marketBenchmark = MARKET_BENCHMARKS[profile.tier];
  const ratePerDeliverable = pricing.pricePerDeliverable;
  const percentageOfMarket = Math.round((ratePerDeliverable / marketBenchmark) * 100);

  let marketPosition: "above" | "at" | "below";
  let marketComparison: string;

  if (percentageOfMarket >= 105) {
    marketPosition = "above";
    marketComparison = `Your rate is ${percentageOfMarket - 100}% above the market average for ${profile.tier} creators. You've earned this premium through your content quality and engagement.`;
  } else if (percentageOfMarket >= 95) {
    marketPosition = "at";
    marketComparison = `Your rate is right at market value for ${profile.tier} creators. This is a fair, competitive rate that reflects your worth.`;
  } else {
    marketPosition = "below";
    marketComparison = `Your rate is ${100 - percentageOfMarket}% below the market average for ${profile.tier} creators. Consider this a competitive offer - you could even charge more.`;
  }

  // Value reminders based on profile strengths
  const valueReminders: string[] = [];

  const engagementBenchmark = ENGAGEMENT_BENCHMARKS[profile.tier];
  if (profile.avgEngagementRate > engagementBenchmark) {
    valueReminders.push(
      `Your ${profile.avgEngagementRate}% engagement rate is ${Math.round(
        ((profile.avgEngagementRate - engagementBenchmark) / engagementBenchmark) * 100
      )}% above average - brands pay more for engaged audiences.`
    );
  }

  valueReminders.push(
    `${profile.totalReach.toLocaleString()} real followers who trust your recommendations.`
  );

  if (profile.niches.length > 0) {
    valueReminders.push(
      `Your expertise in ${getNicheDisplay(profile.niches)} makes you valuable to brands in this space.`
    );
  }

  valueReminders.push(
    `Brands approach creators because they need your authentic voice - that has real value.`
  );

  // Encouragement (professional, not cheesy)
  const encouragements = [
    `You bring unique value that ${brief.brand.name} can't get elsewhere. Own that.`,
    `This rate reflects real market data. You're not guessing - you're informed.`,
    `Remember: brands that value quality expect to pay fair rates. This is professional.`,
    `Your audience trusts you. That trust is what makes your content valuable.`,
  ];
  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return {
    marketComparison,
    marketPercentage: percentageOfMarket,
    marketPosition,
    valueReminders,
    encouragement,
  };
}

/**
 * Generate "If They Push Back" section.
 * Counter-offer scripts, minimum rates, and walk-away guidance.
 */
function generatePushBackSection(
  profile: CreatorProfile,
  brief: ParsedBrief,
  pricing: PricingResult
): PushBackSection {
  const totalRate = pricing.totalPrice;
  const perDeliverable = pricing.pricePerDeliverable;
  const symbol = pricing.currencySymbol;

  // Calculate minimum acceptable rate
  const minPercentage = MINIMUM_RATE_PERCENTAGES[profile.tier];
  const minimumRate = Math.round(totalRate * minPercentage);

  // Generate counter-offer scripts
  const counterOfferScripts: CounterOfferScript[] = [];

  // Script 1: Remove usage rights
  if (brief.usageRights.durationDays > 0 || brief.usageRights.exclusivity !== "none") {
    const reducedRate = Math.round(totalRate * 0.85);
    counterOfferScripts.push({
      scenario: "They say the rate is too high",
      script: `I understand budget constraints. If we remove the extended usage rights (keeping it to your organic post only for 30 days), I can offer ${formatCurrency(reducedRate, symbol)}. This keeps the core deliverable while fitting your budget.`,
      concession: "Remove extended usage rights",
      adjustedRate: formatCurrency(reducedRate, symbol),
    });
  }

  // Script 2: Reduce deliverables
  if (pricing.quantity > 1) {
    const reducedQuantity = Math.max(1, pricing.quantity - 1);
    const reducedRate = perDeliverable * reducedQuantity;
    counterOfferScripts.push({
      scenario: "Budget is firm and below your rate",
      script: `Let's find a middle ground. Instead of ${pricing.quantity} deliverables, we could do ${reducedQuantity} ${getFormatDisplay(brief.content.format)}${reducedQuantity > 1 ? "s" : ""} for ${formatCurrency(reducedRate, symbol)}. This maintains quality while working with your budget.`,
      concession: `Reduce to ${reducedQuantity} deliverable${reducedQuantity > 1 ? "s" : ""}`,
      adjustedRate: formatCurrency(reducedRate, symbol),
    });
  }

  // Script 3: Offer hybrid/future partnership
  counterOfferScripts.push({
    scenario: "They want to pay significantly less",
    script: `I want to make this work. My minimum for this scope is ${formatCurrency(minimumRate, symbol)}. Alternatively, we could do a smaller initial project to build the relationship, with the opportunity to expand if the content performs well.`,
    concession: "Smaller scope or performance-based bonus",
    adjustedRate: `${formatCurrency(minimumRate, symbol)} minimum`,
  });

  // Negotiation levers - things that can be reduced
  const negotiationLevers: string[] = [
    "Remove or shorten usage rights duration",
    "Remove exclusivity requirements",
    "Reduce number of deliverables",
    "Simplify content format (Reel → Post)",
    "Remove whitelisting/paid amplification rights",
    "Adjust timeline (rush fees can be removed)",
  ];

  // Walk-away point
  const walkAwayPoint = `If they can't meet ${formatCurrency(minimumRate, symbol)} (${Math.round(minPercentage * 100)}% of your quoted rate), it's likely not worth your time. A brand that significantly undervalues your work may also be difficult to work with. It's okay to politely decline.`;

  return {
    counterOfferScripts,
    minimumRate,
    minimumRatePercentage: Math.round(minPercentage * 100),
    walkAwayPoint,
    negotiationLevers,
  };
}

/**
 * Generate "Quick Response Template" section.
 * Ready-to-copy message to send to brand.
 */
function generateQuickResponse(
  profile: CreatorProfile,
  brief: ParsedBrief,
  pricing: PricingResult
): QuickResponseSection {
  const symbol = pricing.currencySymbol;
  const platform = getPlatformDisplay(brief.content.platform);
  const format = getFormatDisplay(brief.content.format);
  const quantity = pricing.quantity;
  const deliverableText = `${quantity} ${format}${quantity > 1 ? "s" : ""}`;

  const greeting = `Hi ${brief.brand.name} team,`;

  const rateStatement = `For ${deliverableText} on ${platform}, my rate is ${formatCurrency(pricing.totalPrice, symbol)}.`;

  const closingCTA = `I'd love to learn more about the campaign and discuss how we can work together. Are you available for a quick call this week?`;

  const fullMessage = `${greeting}

Thank you for reaching out! I'm excited about the opportunity to work with ${brief.brand.name}.

${rateStatement}

This includes:
- ${deliverableText}
- ${brief.usageRights.durationDays > 0 ? `${brief.usageRights.durationDays} days of usage rights` : "Standard posting rights"}
- Professional content creation and editing

${closingCTA}

Best,
${profile.displayName}`;

  return {
    greeting,
    fullMessage,
    rateStatement,
    closingCTA,
  };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Generate complete Negotiation Talking Points for a rate card.
 *
 * This creates the "Confidence Stack" that helps creators negotiate:
 * 1. "Why This Rate" - Professional justification to share with brands
 * 2. "Confidence Boosters" - Internal encouragement for creators
 * 3. "If They Push Back" - Counter-offer scripts and walk-away points
 * 4. "Quick Response Template" - Ready-to-copy message
 *
 * @param pricing - The pricing result from the pricing engine
 * @param profile - Creator's profile
 * @param brief - Parsed brand brief
 * @returns Complete NegotiationTalkingPoints object
 */
export function generateNegotiationTalkingPoints(
  pricing: PricingResult,
  profile: CreatorProfile,
  brief: ParsedBrief
): NegotiationTalkingPoints {
  return {
    whyThisRate: generateWhyThisRate(profile, brief, pricing),
    confidenceBoosters: generateConfidenceBoosters(profile, brief, pricing),
    pushBack: generatePushBackSection(profile, brief, pricing),
    quickResponse: generateQuickResponse(profile, brief, pricing),
    generatedAt: new Date(),
  };
}

/**
 * Get the minimum acceptable rate for a given tier and total rate.
 * Useful for validation and display purposes.
 *
 * @param tier - Creator's tier
 * @param totalRate - The quoted total rate
 * @returns Minimum acceptable rate
 */
export function getMinimumAcceptableRate(tier: CreatorTier, totalRate: number): number {
  const minPercentage = MINIMUM_RATE_PERCENTAGES[tier];
  return Math.round(totalRate * minPercentage);
}

/**
 * Get market benchmark rate for a tier.
 *
 * @param tier - Creator's tier
 * @returns Market benchmark rate
 */
export function getMarketBenchmark(tier: CreatorTier): number {
  return MARKET_BENCHMARKS[tier];
}
