/**
 * Outcome Analytics Library
 *
 * Tracks deal outcomes to build market intelligence and provide creator insights.
 * Supports both paid deals and gift conversions with comprehensive analytics.
 */

import { db } from "./db";
import type {
  Outcome,
  OutcomeStatus,
  OutcomeSourceType,
  OutcomeProposedType,
  GiftOutcomeStatus,
  OutcomeCreateInput,
  OutcomeUpdateInput,
  OutcomeFilters,
  OutcomeAnalytics,
  AcceptanceRates,
  MarketBenchmark,
  OutcomeInsight,
} from "./types";

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Create a new outcome record.
 *
 * @param creatorId - The creator's user ID
 * @param input - The outcome data
 * @returns The created outcome
 */
export async function createOutcome(
  creatorId: string,
  input: OutcomeCreateInput
): Promise<Outcome> {
  const outcome = await db.outcome.create({
    data: {
      creatorId,
      sourceType: input.sourceType,
      sourceId: input.sourceId || null,
      proposedRate: input.proposedRate ?? null,
      proposedType: input.proposedType,
      platform: input.platform,
      dealType: input.dealType,
      niche: input.niche || null,
      outcome: input.outcome || "pending",
      brandName: input.brandName || null,
      brandFollowers: input.brandFollowers || null,
      dealLength: input.dealLength || null,
      wasGiftFirst: input.wasGiftFirst || false,
    },
  });

  return mapPrismaToOutcome(outcome);
}

/**
 * Get all outcomes for a creator with optional filters.
 *
 * @param creatorId - The creator's user ID
 * @param filters - Optional filters to apply
 * @returns Array of outcomes
 */
export async function getOutcomes(
  creatorId: string,
  filters?: OutcomeFilters
): Promise<Outcome[]> {
  const where: Record<string, unknown> = { creatorId };

  if (filters) {
    if (filters.sourceType) where.sourceType = filters.sourceType;
    if (filters.proposedType) where.proposedType = filters.proposedType;
    if (filters.outcome) where.outcome = filters.outcome;
    if (filters.platform) where.platform = filters.platform;
    if (filters.niche) where.niche = filters.niche;
    if (filters.closedOnly) where.closedAt = { not: null };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.endDate);
      }
    }
  }

  const outcomes = await db.outcome.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return outcomes.map(mapPrismaToOutcome);
}

/**
 * Get a single outcome by ID.
 *
 * @param creatorId - The creator's user ID
 * @param outcomeId - The outcome ID
 * @returns The outcome or null if not found
 */
export async function getOutcome(
  creatorId: string,
  outcomeId: string
): Promise<Outcome | null> {
  const outcome = await db.outcome.findFirst({
    where: { id: outcomeId, creatorId },
  });

  if (!outcome) return null;

  return mapPrismaToOutcome(outcome);
}

/**
 * Update an outcome record.
 *
 * @param creatorId - The creator's user ID
 * @param outcomeId - The outcome ID
 * @param input - The fields to update
 * @returns The updated outcome
 */
export async function updateOutcome(
  creatorId: string,
  outcomeId: string,
  input: OutcomeUpdateInput
): Promise<Outcome> {
  const updateData: Record<string, unknown> = {};

  if (input.outcome !== undefined) updateData.outcome = input.outcome;
  if (input.finalRate !== undefined) updateData.finalRate = input.finalRate;
  if (input.negotiationDelta !== undefined) updateData.negotiationDelta = input.negotiationDelta;
  if (input.giftOutcome !== undefined) updateData.giftOutcome = input.giftOutcome;
  if (input.giftConversionDays !== undefined) updateData.giftConversionDays = input.giftConversionDays;
  if (input.brandName !== undefined) updateData.brandName = input.brandName;
  if (input.brandFollowers !== undefined) updateData.brandFollowers = input.brandFollowers;
  if (input.dealLength !== undefined) updateData.dealLength = input.dealLength;
  if (input.closedAt !== undefined) {
    updateData.closedAt = input.closedAt ? new Date(input.closedAt) : null;
  }

  const outcome = await db.outcome.update({
    where: { id: outcomeId, creatorId },
    data: updateData,
  });

  return mapPrismaToOutcome(outcome);
}

/**
 * Delete an outcome record.
 *
 * @param creatorId - The creator's user ID
 * @param outcomeId - The outcome ID
 */
export async function deleteOutcome(
  creatorId: string,
  outcomeId: string
): Promise<void> {
  await db.outcome.delete({
    where: { id: outcomeId, creatorId },
  });
}

// =============================================================================
// ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Calculate acceptance rates for a creator's outcomes.
 * Separates paid, gift, and overall acceptance rates.
 *
 * @param outcomes - Array of outcomes to analyze
 * @returns Acceptance rates breakdown
 */
export function calculateAcceptanceRate(outcomes: Outcome[]): AcceptanceRates {
  const acceptedStatuses: OutcomeStatus[] = ["accepted", "negotiated", "gift_accepted", "gift_converted"];

  // Separate by proposed type
  const paidOutcomes = outcomes.filter((o) => o.proposedType === "paid" || o.proposedType === "hybrid");
  const giftOutcomes = outcomes.filter((o) => o.proposedType === "gift");

  // Filter out pending outcomes for rate calculation
  const paidClosed = paidOutcomes.filter((o) => o.outcome !== "pending");
  const giftClosed = giftOutcomes.filter((o) => o.outcome !== "pending");
  const allClosed = outcomes.filter((o) => o.outcome !== "pending");

  // Calculate rates
  const paidAccepted = paidClosed.filter((o) =>
    o.outcome === "accepted" || o.outcome === "negotiated"
  ).length;
  const giftAccepted = giftClosed.filter((o) =>
    o.outcome === "gift_accepted" || o.outcome === "gift_converted"
  ).length;
  const allAccepted = allClosed.filter((o) =>
    acceptedStatuses.includes(o.outcome)
  ).length;

  return {
    paid: paidClosed.length > 0 ? paidAccepted / paidClosed.length : 0,
    gift: giftClosed.length > 0 ? giftAccepted / giftClosed.length : 0,
    overall: allClosed.length > 0 ? allAccepted / allClosed.length : 0,
    counts: {
      paid: paidClosed.length,
      gift: giftClosed.length,
      total: allClosed.length,
    },
  };
}

/**
 * Calculate the average negotiation delta across outcomes.
 * Positive delta means the final rate was higher than proposed.
 *
 * @param outcomes - Array of outcomes to analyze
 * @returns Average negotiation delta as a percentage
 */
export function calculateAverageNegotiationDelta(outcomes: Outcome[]): number {
  const negotiatedOutcomes = outcomes.filter(
    (o) => o.outcome === "negotiated" && o.negotiationDelta !== null
  );

  if (negotiatedOutcomes.length === 0) return 0;

  const totalDelta = negotiatedOutcomes.reduce(
    (sum, o) => sum + (o.negotiationDelta || 0),
    0
  );

  return totalDelta / negotiatedOutcomes.length;
}

/**
 * Calculate gift-to-paid conversion rate.
 *
 * @param outcomes - Array of outcomes to analyze
 * @returns Conversion rate as a decimal (0-1)
 */
export function calculateGiftConversionRate(outcomes: Outcome[]): number {
  const giftOutcomes = outcomes.filter(
    (o) => o.proposedType === "gift" || o.wasGiftFirst
  );

  if (giftOutcomes.length === 0) return 0;

  const converted = giftOutcomes.filter(
    (o) => o.outcome === "gift_converted" || o.giftOutcome === "converted_later"
  ).length;

  return converted / giftOutcomes.length;
}

/**
 * Calculate average days from gift receipt to paid conversion.
 *
 * @param outcomes - Array of outcomes to analyze
 * @returns Average conversion time in days, or null if no data
 */
export function calculateAvgGiftConversionTime(outcomes: Outcome[]): number | null {
  const convertedGifts = outcomes.filter(
    (o) =>
      (o.outcome === "gift_converted" || o.giftOutcome === "converted_later") &&
      o.giftConversionDays !== null
  );

  if (convertedGifts.length === 0) return null;

  const totalDays = convertedGifts.reduce(
    (sum, o) => sum + (o.giftConversionDays || 0),
    0
  );

  return totalDays / convertedGifts.length;
}

/**
 * Get market benchmark data for a specific segment.
 * Aggregates anonymized data across all creators.
 *
 * @param platform - Platform to filter by (optional)
 * @param niche - Niche to filter by (optional)
 * @param tier - Creator tier to filter by (optional)
 * @returns Market benchmark data
 */
export async function getMarketBenchmark(
  platform?: string | null,
  niche?: string | null,
  tier?: string | null
): Promise<MarketBenchmark> {
  const where: Record<string, unknown> = {
    outcome: { not: "pending" },
  };

  if (platform) where.platform = platform;
  if (niche) where.niche = niche;

  // Get all matching outcomes across all creators (anonymized aggregation)
  const outcomes = await db.outcome.findMany({
    where,
  });

  const mapped = outcomes.map(mapPrismaToOutcome);
  const acceptanceRates = calculateAcceptanceRate(mapped);
  const avgNegotiationDelta = calculateAverageNegotiationDelta(mapped);
  const giftConversionRate = calculateGiftConversionRate(mapped);

  // Calculate average rate from accepted/negotiated deals
  const closedDeals = mapped.filter(
    (o) =>
      (o.outcome === "accepted" || o.outcome === "negotiated") &&
      o.finalRate !== null
  );
  const avgRate =
    closedDeals.length > 0
      ? closedDeals.reduce((sum, o) => sum + (o.finalRate || 0), 0) / closedDeals.length
      : 0;

  return {
    avgAcceptanceRate: acceptanceRates.overall,
    avgRate,
    avgNegotiationDelta,
    giftConversionRate,
    sampleSize: outcomes.length,
    segment: {
      platform: platform || null,
      niche: niche || null,
      tier: tier || null,
    },
  };
}

/**
 * Get comprehensive analytics for a creator.
 *
 * @param creatorId - The creator's user ID
 * @returns Complete outcome analytics
 */
export async function getOutcomeAnalytics(creatorId: string): Promise<OutcomeAnalytics> {
  const outcomes = await getOutcomes(creatorId);

  // Status counts
  const byStatus: Record<OutcomeStatus, number> = {
    accepted: 0,
    negotiated: 0,
    rejected: 0,
    ghosted: 0,
    pending: 0,
    gift_accepted: 0,
    gift_converted: 0,
  };

  outcomes.forEach((o) => {
    if (o.outcome in byStatus) {
      byStatus[o.outcome as OutcomeStatus]++;
    }
  });

  // Acceptance rates
  const acceptanceRates = calculateAcceptanceRate(outcomes);

  // Negotiation metrics
  const avgNegotiationDelta = calculateAverageNegotiationDelta(outcomes);
  const negotiatedCount = outcomes.filter((o) => o.outcome === "negotiated").length;

  // Gift metrics
  const giftConversionRate = calculateGiftConversionRate(outcomes);
  const avgGiftConversionDays = calculateAvgGiftConversionTime(outcomes);
  const totalGifts = outcomes.filter((o) => o.proposedType === "gift" || o.wasGiftFirst).length;
  const giftsConverted = outcomes.filter(
    (o) => o.outcome === "gift_converted" || o.giftOutcome === "converted_later"
  ).length;

  // Revenue metrics
  const closedDeals = outcomes.filter(
    (o) =>
      (o.outcome === "accepted" || o.outcome === "negotiated" || o.outcome === "gift_converted") &&
      o.finalRate !== null
  );
  const totalRevenue = closedDeals.reduce((sum, o) => sum + (o.finalRate || 0), 0);
  const avgDealValue = closedDeals.length > 0 ? totalRevenue / closedDeals.length : 0;

  // Time-based metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const last30Days = outcomes.filter((o) => o.createdAt >= thirtyDaysAgo).length;
  const last90Days = outcomes.filter((o) => o.createdAt >= ninetyDaysAgo).length;

  // Get benchmark for comparison
  // Use the most common platform and niche from this creator's outcomes
  const platformCounts = new Map<string, number>();
  const nicheCounts = new Map<string, number>();
  outcomes.forEach((o) => {
    platformCounts.set(o.platform, (platformCounts.get(o.platform) || 0) + 1);
    if (o.niche) {
      nicheCounts.set(o.niche, (nicheCounts.get(o.niche) || 0) + 1);
    }
  });

  const topPlatform = platformCounts.size > 0
    ? [...platformCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const topNiche = nicheCounts.size > 0
    ? [...nicheCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const benchmark = await getMarketBenchmark(topPlatform, topNiche, null);

  // Generate insights
  const insights = generateInsights({
    outcomes,
    acceptanceRates,
    avgNegotiationDelta,
    giftConversionRate,
    avgGiftConversionDays,
    benchmark,
  });

  return {
    totalOutcomes: outcomes.length,
    byStatus,
    acceptanceRates,
    avgNegotiationDelta,
    negotiatedCount,
    giftConversionRate,
    avgGiftConversionDays,
    totalGifts,
    giftsConverted,
    totalRevenue,
    avgDealValue,
    last30Days,
    last90Days,
    benchmark,
    insights,
  };
}

/**
 * Generate insights from outcome data.
 */
function generateInsights(data: {
  outcomes: Outcome[];
  acceptanceRates: AcceptanceRates;
  avgNegotiationDelta: number;
  giftConversionRate: number;
  avgGiftConversionDays: number | null;
  benchmark: MarketBenchmark;
}): OutcomeInsight[] {
  const insights: OutcomeInsight[] = [];
  const { acceptanceRates, avgNegotiationDelta, giftConversionRate, avgGiftConversionDays, benchmark } = data;

  // Acceptance rate insight
  if (acceptanceRates.counts.total >= 5) {
    const rateDiff = acceptanceRates.overall - benchmark.avgAcceptanceRate;
    const percentDiff = Math.round(rateDiff * 100);

    if (rateDiff > 0.1) {
      insights.push({
        type: "positive",
        message: `Your acceptance rate is ${percentDiff}% above average for your segment`,
        data: {
          value: Math.round(acceptanceRates.overall * 100),
          comparison: Math.round(benchmark.avgAcceptanceRate * 100),
          unit: "%",
        },
      });

      // If acceptance is high, suggest raising rates
      if (acceptanceRates.overall > 0.85) {
        insights.push({
          type: "suggestion",
          message: "Your high acceptance rate suggests you could increase your rates by 10-15%",
        });
      }
    } else if (rateDiff < -0.1) {
      insights.push({
        type: "negative",
        message: `Your acceptance rate is ${Math.abs(percentDiff)}% below average`,
        data: {
          value: Math.round(acceptanceRates.overall * 100),
          comparison: Math.round(benchmark.avgAcceptanceRate * 100),
          unit: "%",
        },
      });
    } else {
      insights.push({
        type: "neutral",
        message: "Your acceptance rate is in line with market average",
        data: {
          value: Math.round(acceptanceRates.overall * 100),
          unit: "%",
        },
      });
    }
  }

  // Gift conversion insight
  if (data.outcomes.filter((o) => o.proposedType === "gift").length >= 3) {
    const avgGiftRate = 0.12; // Industry average ~12% gift-to-paid conversion

    if (giftConversionRate > avgGiftRate * 1.5) {
      insights.push({
        type: "positive",
        message: `You convert ${Math.round(giftConversionRate * 100)}% of gifts to paid - well above the ${Math.round(avgGiftRate * 100)}% average!`,
        data: {
          value: Math.round(giftConversionRate * 100),
          comparison: Math.round(avgGiftRate * 100),
          unit: "%",
        },
      });
    } else if (giftConversionRate < avgGiftRate * 0.5) {
      insights.push({
        type: "suggestion",
        message: "Consider following up more consistently with gift brands - most conversions happen within 30 days",
      });
    }
  }

  // Conversion time insight
  if (avgGiftConversionDays !== null) {
    if (avgGiftConversionDays < 21) {
      insights.push({
        type: "positive",
        message: `Your average gift-to-paid conversion takes only ${Math.round(avgGiftConversionDays)} days`,
        data: {
          value: Math.round(avgGiftConversionDays),
          unit: "days",
        },
      });
    } else if (avgGiftConversionDays > 45) {
      insights.push({
        type: "neutral",
        message: `Your conversions take about ${Math.round(avgGiftConversionDays)} days on average - consider following up sooner`,
        data: {
          value: Math.round(avgGiftConversionDays),
          unit: "days",
        },
      });
    }
  }

  // Negotiation insight
  if (avgNegotiationDelta !== 0) {
    if (avgNegotiationDelta > 0) {
      insights.push({
        type: "positive",
        message: `When you negotiate, you typically get ${Math.round(avgNegotiationDelta)}% more than initially offered`,
        data: {
          value: Math.round(avgNegotiationDelta),
          unit: "%",
        },
      });
    } else {
      insights.push({
        type: "neutral",
        message: `Your negotiated rates are typically ${Math.abs(Math.round(avgNegotiationDelta))}% below your initial ask`,
        data: {
          value: Math.round(avgNegotiationDelta),
          unit: "%",
        },
      });
    }
  }

  // Ghosting insight
  const ghostedCount = data.outcomes.filter((o) => o.outcome === "ghosted").length;
  const ghostRate = data.outcomes.length > 0 ? ghostedCount / data.outcomes.length : 0;
  if (ghostRate > 0.3 && data.outcomes.length >= 5) {
    insights.push({
      type: "suggestion",
      message: "You have a high ghost rate. Consider sending a follow-up message 3-5 days after your initial response",
    });
  }

  return insights;
}

/**
 * Compare creator's stats to market benchmark.
 * Returns a formatted comparison object.
 */
export function compareToMarket(
  creatorRate: number,
  marketRate: number
): { percentDiff: number; position: "above" | "below" | "at"; message: string } {
  const diff = creatorRate - marketRate;
  const percentDiff = marketRate > 0 ? Math.round((diff / marketRate) * 100) : 0;

  let position: "above" | "below" | "at";
  let message: string;

  if (percentDiff > 5) {
    position = "above";
    message = `${percentDiff}% above average`;
  } else if (percentDiff < -5) {
    position = "below";
    message = `${Math.abs(percentDiff)}% below average`;
  } else {
    position = "at";
    message = "at market average";
  }

  return { percentDiff, position, message };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map Prisma Outcome to our Outcome type.
 */
function mapPrismaToOutcome(prismaOutcome: {
  id: string;
  creatorId: string;
  sourceType: string;
  sourceId: string | null;
  proposedRate: number | null;
  proposedType: string;
  platform: string;
  dealType: string;
  niche: string | null;
  outcome: string;
  finalRate: number | null;
  negotiationDelta: number | null;
  giftOutcome: string | null;
  giftConversionDays: number | null;
  brandName: string | null;
  brandFollowers: number | null;
  dealLength: string | null;
  wasGiftFirst: boolean;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}): Outcome {
  return {
    id: prismaOutcome.id,
    creatorId: prismaOutcome.creatorId,
    sourceType: prismaOutcome.sourceType as OutcomeSourceType,
    sourceId: prismaOutcome.sourceId,
    proposedRate: prismaOutcome.proposedRate,
    proposedType: prismaOutcome.proposedType as OutcomeProposedType,
    platform: prismaOutcome.platform,
    dealType: prismaOutcome.dealType,
    niche: prismaOutcome.niche,
    outcome: prismaOutcome.outcome as OutcomeStatus,
    finalRate: prismaOutcome.finalRate,
    negotiationDelta: prismaOutcome.negotiationDelta,
    giftOutcome: prismaOutcome.giftOutcome as GiftOutcomeStatus | null,
    giftConversionDays: prismaOutcome.giftConversionDays,
    brandName: prismaOutcome.brandName,
    brandFollowers: prismaOutcome.brandFollowers,
    dealLength: prismaOutcome.dealLength,
    wasGiftFirst: prismaOutcome.wasGiftFirst,
    createdAt: prismaOutcome.createdAt,
    updatedAt: prismaOutcome.updatedAt,
    closedAt: prismaOutcome.closedAt,
  };
}
