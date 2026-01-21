/**
 * Gift Relationship Tracker
 *
 * Utility functions for tracking gift deals and converting them to paid partnerships.
 * This creates a CRM-lite for gift relationships, enabling systematic conversion.
 */

import { db } from "./db";
import type {
  GiftDeal,
  GiftDealStatus,
  GiftDealCreateInput,
  GiftDealUpdateInput,
  GiftDealAddContentInput,
  GiftDealAddPerformanceInput,
  GiftDealFollowUpInput,
  GiftDealConvertInput,
  GiftAnalytics,
  ConversionScriptStage,
  GiftResponseContext,
} from "./types";
import { getConversionPlaybookScript } from "./gift-responses";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Minimum engagement score to be considered "ready to convert".
 * Calculated as: views * 0.001 + likes * 0.1 + comments * 0.5 + saves * 0.3 + shares * 0.2
 */
const MIN_ENGAGEMENT_SCORE_FOR_CONVERSION = 50;

/**
 * Default follow-up date offset in days after content is created.
 */
const DEFAULT_FOLLOWUP_DAYS = 14;

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Create a new gift deal record.
 *
 * @param creatorId - The creator's user ID
 * @param input - The gift deal data
 * @returns The created gift deal
 */
export async function createGiftDeal(
  creatorId: string,
  input: GiftDealCreateInput
): Promise<GiftDeal> {
  const dateReceived = input.dateReceived
    ? new Date(input.dateReceived)
    : new Date();

  const giftDeal = await db.giftDeal.create({
    data: {
      creatorId,
      brandName: input.brandName,
      brandHandle: input.brandHandle || null,
      brandWebsite: input.brandWebsite || null,
      brandFollowers: input.brandFollowers || null,
      productDescription: input.productDescription,
      productValue: input.productValue,
      dateReceived,
      notes: input.notes || null,
      status: "received",
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Get all gift deals for a creator.
 *
 * @param creatorId - The creator's user ID
 * @returns Array of gift deals
 */
export async function getGiftDeals(creatorId: string): Promise<GiftDeal[]> {
  const giftDeals = await db.giftDeal.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  });

  return giftDeals.map(mapPrismaToGiftDeal);
}

/**
 * Get a single gift deal by ID.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @returns The gift deal or null if not found
 */
export async function getGiftDeal(
  creatorId: string,
  giftId: string
): Promise<GiftDeal | null> {
  const giftDeal = await db.giftDeal.findFirst({
    where: { id: giftId, creatorId },
  });

  if (!giftDeal) return null;

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Update a gift deal.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param input - The fields to update
 * @returns The updated gift deal
 */
export async function updateGiftDeal(
  creatorId: string,
  giftId: string,
  input: GiftDealUpdateInput
): Promise<GiftDeal> {
  // Build update data, only including defined fields
  const updateData: Record<string, unknown> = {};

  if (input.brandName !== undefined) updateData.brandName = input.brandName;
  if (input.brandHandle !== undefined) updateData.brandHandle = input.brandHandle;
  if (input.brandWebsite !== undefined) updateData.brandWebsite = input.brandWebsite;
  if (input.brandFollowers !== undefined) updateData.brandFollowers = input.brandFollowers;
  if (input.productDescription !== undefined) updateData.productDescription = input.productDescription;
  if (input.productValue !== undefined) updateData.productValue = input.productValue;
  if (input.dateReceived !== undefined) {
    updateData.dateReceived = input.dateReceived ? new Date(input.dateReceived) : null;
  }
  if (input.contentType !== undefined) updateData.contentType = input.contentType;
  if (input.contentUrl !== undefined) updateData.contentUrl = input.contentUrl;
  if (input.contentDate !== undefined) {
    updateData.contentDate = input.contentDate ? new Date(input.contentDate) : null;
  }
  if (input.views !== undefined) updateData.views = input.views;
  if (input.likes !== undefined) updateData.likes = input.likes;
  if (input.comments !== undefined) updateData.comments = input.comments;
  if (input.saves !== undefined) updateData.saves = input.saves;
  if (input.shares !== undefined) updateData.shares = input.shares;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.conversionStatus !== undefined) updateData.conversionStatus = input.conversionStatus;
  if (input.convertedDealId !== undefined) updateData.convertedDealId = input.convertedDealId;
  if (input.convertedAmount !== undefined) updateData.convertedAmount = input.convertedAmount;
  if (input.followUpDate !== undefined) {
    updateData.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
  }
  if (input.followUpSent !== undefined) updateData.followUpSent = input.followUpSent;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: updateData,
  });

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Delete a gift deal.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 */
export async function deleteGiftDeal(
  creatorId: string,
  giftId: string
): Promise<void> {
  await db.giftDeal.delete({
    where: { id: giftId, creatorId },
  });
}

// =============================================================================
// CONTENT & PERFORMANCE OPERATIONS
// =============================================================================

/**
 * Add content information to a gift deal.
 * Automatically updates status to "content_created" and sets follow-up date.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param input - Content information
 * @returns The updated gift deal
 */
export async function addContentToGiftDeal(
  creatorId: string,
  giftId: string,
  input: GiftDealAddContentInput
): Promise<GiftDeal> {
  const contentDate = input.contentDate ? new Date(input.contentDate) : new Date();
  const followUpDate = new Date(contentDate);
  followUpDate.setDate(followUpDate.getDate() + DEFAULT_FOLLOWUP_DAYS);

  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: {
      contentType: input.contentType,
      contentUrl: input.contentUrl || null,
      contentDate,
      status: "content_created",
      followUpDate,
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Add performance metrics to a gift deal.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param input - Performance metrics
 * @returns The updated gift deal
 */
export async function addPerformanceToGiftDeal(
  creatorId: string,
  giftId: string,
  input: GiftDealAddPerformanceInput
): Promise<GiftDeal> {
  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: {
      views: input.views ?? null,
      likes: input.likes ?? null,
      comments: input.comments ?? null,
      saves: input.saves ?? null,
      shares: input.shares ?? null,
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

// =============================================================================
// FOLLOW-UP & CONVERSION OPERATIONS
// =============================================================================

/**
 * Log a follow-up attempt on a gift deal.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param input - Follow-up information
 * @returns The updated gift deal
 */
export async function logFollowUp(
  creatorId: string,
  giftId: string,
  input: GiftDealFollowUpInput
): Promise<GiftDeal> {
  const existingDeal = await db.giftDeal.findFirst({
    where: { id: giftId, creatorId },
  });

  if (!existingDeal) {
    throw new Error("Gift deal not found");
  }

  // Append to existing notes if present
  const newNotes = input.notes
    ? existingDeal.notes
      ? `${existingDeal.notes}\n\n[Follow-up ${new Date().toLocaleDateString()}]: ${input.notes}`
      : `[Follow-up ${new Date().toLocaleDateString()}]: ${input.notes}`
    : existingDeal.notes;

  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: {
      status: "followed_up",
      followUpSent: true,
      conversionStatus: "attempting",
      notes: newNotes,
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Mark a gift deal as converted to paid partnership.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param input - Conversion information
 * @returns The updated gift deal
 */
export async function markAsConverted(
  creatorId: string,
  giftId: string,
  input: GiftDealConvertInput
): Promise<GiftDeal> {
  const existingDeal = await db.giftDeal.findFirst({
    where: { id: giftId, creatorId },
  });

  if (!existingDeal) {
    throw new Error("Gift deal not found");
  }

  // Append conversion note if provided
  const newNotes = input.notes
    ? existingDeal.notes
      ? `${existingDeal.notes}\n\n[Converted ${new Date().toLocaleDateString()}]: ${input.notes}`
      : `[Converted ${new Date().toLocaleDateString()}]: ${input.notes}`
    : existingDeal.notes;

  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: {
      status: "converted",
      conversionStatus: "converted",
      convertedAmount: input.convertedAmount,
      convertedDealId: input.convertedDealId || null,
      notes: newNotes,
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

/**
 * Mark a gift deal as conversion rejected.
 *
 * @param creatorId - The creator's user ID
 * @param giftId - The gift deal ID
 * @param notes - Optional notes about the rejection
 * @returns The updated gift deal
 */
export async function markAsRejected(
  creatorId: string,
  giftId: string,
  notes?: string
): Promise<GiftDeal> {
  const existingDeal = await db.giftDeal.findFirst({
    where: { id: giftId, creatorId },
  });

  if (!existingDeal) {
    throw new Error("Gift deal not found");
  }

  // Append rejection note if provided
  const newNotes = notes
    ? existingDeal.notes
      ? `${existingDeal.notes}\n\n[Declined ${new Date().toLocaleDateString()}]: ${notes}`
      : `[Declined ${new Date().toLocaleDateString()}]: ${notes}`
    : existingDeal.notes;

  const giftDeal = await db.giftDeal.update({
    where: { id: giftId, creatorId },
    data: {
      status: "declined",
      conversionStatus: "rejected",
      notes: newNotes,
    },
  });

  return mapPrismaToGiftDeal(giftDeal);
}

// =============================================================================
// QUERY OPERATIONS
// =============================================================================

/**
 * Get gift deals filtered by status.
 *
 * @param creatorId - The creator's user ID
 * @param status - The status to filter by
 * @returns Array of gift deals with the specified status
 */
export async function getGiftsByStatus(
  creatorId: string,
  status: GiftDealStatus
): Promise<GiftDeal[]> {
  const giftDeals = await db.giftDeal.findMany({
    where: { creatorId, status },
    orderBy: { createdAt: "desc" },
  });

  return giftDeals.map(mapPrismaToGiftDeal);
}

/**
 * Get gift deals that are ready to convert (good performance, no follow-up yet).
 *
 * @param creatorId - The creator's user ID
 * @returns Array of gift deals ready for conversion
 */
export async function getReadyToConvert(creatorId: string): Promise<GiftDeal[]> {
  const giftDeals = await db.giftDeal.findMany({
    where: {
      creatorId,
      status: "content_created",
      followUpSent: false,
      // Has some performance metrics
      OR: [
        { views: { not: null } },
        { likes: { not: null } },
        { comments: { not: null } },
        { saves: { not: null } },
        { shares: { not: null } },
      ],
    },
    orderBy: { contentDate: "desc" },
  });

  // Filter to only include deals with good engagement
  return giftDeals
    .map(mapPrismaToGiftDeal)
    .filter((deal) => calculateEngagementScore(deal) >= MIN_ENGAGEMENT_SCORE_FOR_CONVERSION);
}

/**
 * Get gift deals with follow-ups due (past follow-up date, not yet sent).
 *
 * @param creatorId - The creator's user ID
 * @returns Array of gift deals with overdue follow-ups
 */
export async function getFollowUpsDue(creatorId: string): Promise<GiftDeal[]> {
  const now = new Date();

  const giftDeals = await db.giftDeal.findMany({
    where: {
      creatorId,
      followUpDate: { lte: now },
      followUpSent: false,
      status: { in: ["content_created"] },
    },
    orderBy: { followUpDate: "asc" },
  });

  return giftDeals.map(mapPrismaToGiftDeal);
}

/**
 * Get the conversion rate for a creator.
 *
 * @param creatorId - The creator's user ID
 * @returns Conversion rate as a decimal (0-1)
 */
export async function getConversionRate(creatorId: string): Promise<number> {
  const [totalCount, convertedCount] = await Promise.all([
    db.giftDeal.count({
      where: {
        creatorId,
        status: { notIn: ["archived"] },
      },
    }),
    db.giftDeal.count({
      where: {
        creatorId,
        status: "converted",
      },
    }),
  ]);

  if (totalCount === 0) return 0;
  return convertedCount / totalCount;
}

/**
 * Get comprehensive analytics for a creator's gift deals.
 *
 * @param creatorId - The creator's user ID
 * @returns Gift analytics
 */
export async function getGiftAnalytics(creatorId: string): Promise<GiftAnalytics> {
  const giftDeals = await db.giftDeal.findMany({
    where: { creatorId },
  });

  const mapped = giftDeals.map(mapPrismaToGiftDeal);

  // Calculate basic counts
  const totalGiftsReceived = mapped.filter((g) => g.status !== "archived").length;
  const giftsConverted = mapped.filter((g) => g.status === "converted").length;
  const giftsWithContent = mapped.filter((g) => g.contentType !== null).length;

  // Calculate financial metrics
  const totalProductValue = mapped
    .filter((g) => g.status !== "archived")
    .reduce((sum, g) => sum + g.productValue, 0);

  const revenueFromConverted = mapped
    .filter((g) => g.status === "converted" && g.convertedAmount)
    .reduce((sum, g) => sum + (g.convertedAmount || 0), 0);

  // Calculate conversion rate
  const conversionRate = totalGiftsReceived > 0 ? giftsConverted / totalGiftsReceived : 0;

  // Calculate ROI
  const roiOnGiftWork = totalProductValue > 0 ? revenueFromConverted / totalProductValue : 0;

  // Calculate average time to conversion
  const conversionsWithTime = mapped.filter(
    (g) => g.status === "converted" && g.dateReceived && g.updatedAt
  );
  const avgTimeToConversion =
    conversionsWithTime.length > 0
      ? conversionsWithTime.reduce((sum, g) => {
          const days = Math.floor(
            (g.updatedAt.getTime() - g.dateReceived.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / conversionsWithTime.length
      : null;

  // Count follow-ups due
  const now = new Date();
  const followUpsDue = mapped.filter(
    (g) =>
      g.followUpDate &&
      g.followUpDate <= now &&
      !g.followUpSent &&
      g.status === "content_created"
  ).length;

  // Count ready to convert
  const readyToConvert = mapped.filter(
    (g) =>
      g.status === "content_created" &&
      !g.followUpSent &&
      calculateEngagementScore(g) >= MIN_ENGAGEMENT_SCORE_FOR_CONVERSION
  ).length;

  return {
    totalGiftsReceived,
    totalProductValue,
    giftsConverted,
    conversionRate,
    revenueFromConverted,
    roiOnGiftWork,
    avgTimeToConversion,
    topConvertingCategory: null, // Would need brand categorization to implement
    followUpsDue,
    giftsWithContent,
    readyToConvert,
  };
}

// =============================================================================
// CONVERSION SCRIPTS
// =============================================================================

/**
 * Get a conversion script for a gift deal.
 *
 * @param giftDeal - The gift deal to generate a script for
 * @param stage - The conversion stage
 * @returns The generated script
 */
export function getConversionScript(
  giftDeal: GiftDeal,
  stage: ConversionScriptStage
): string {
  const context: GiftResponseContext = {
    brandName: giftDeal.brandName,
    productName: giftDeal.productDescription,
  };

  let script = getConversionPlaybookScript(stage, context);

  // Replace performance placeholders if metrics are available
  if (stage === "performance_share" && giftDeal.views) {
    script = script
      .replace("[X]", formatNumber(giftDeal.views))
      .replace("[Y]", formatNumber(giftDeal.likes || 0))
      .replace("[Z]", formatNumber(giftDeal.saves || 0));
  }

  return script;
}

/**
 * Suggest the best follow-up script based on the gift deal's timeline.
 *
 * @param giftDeal - The gift deal
 * @returns Suggested script stage and reasoning
 */
export function suggestFollowUpScript(giftDeal: GiftDeal): {
  stage: ConversionScriptStage;
  reason: string;
} {
  if (!giftDeal.contentDate) {
    return {
      stage: "performance_share",
      reason: "Content not yet posted - wait until you have metrics to share.",
    };
  }

  const daysSinceContent = Math.floor(
    (Date.now() - giftDeal.contentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceContent < 14) {
    return {
      stage: "performance_share",
      reason: "Perfect timing to share your content performance with the brand.",
    };
  } else if (daysSinceContent < 45) {
    return {
      stage: "follow_up_30_day",
      reason: "Great time for a 30-day check-in and pitch for paid work.",
    };
  } else {
    return {
      stage: "returning_brand_offer",
      reason: "Enough time has passed - offer a returning brand discount.",
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate engagement score from performance metrics.
 * Higher score = better engagement.
 */
function calculateEngagementScore(giftDeal: GiftDeal): number {
  const views = giftDeal.views || 0;
  const likes = giftDeal.likes || 0;
  const comments = giftDeal.comments || 0;
  const saves = giftDeal.saves || 0;
  const shares = giftDeal.shares || 0;

  return views * 0.001 + likes * 0.1 + comments * 0.5 + saves * 0.3 + shares * 0.2;
}

/**
 * Format a number for display in scripts.
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Map Prisma GiftDeal to our GiftDeal type.
 */
function mapPrismaToGiftDeal(prismaGift: {
  id: string;
  creatorId: string;
  brandName: string;
  brandHandle: string | null;
  brandWebsite: string | null;
  brandFollowers: number | null;
  productDescription: string;
  productValue: number;
  dateReceived: Date;
  contentType: string | null;
  contentUrl: string | null;
  contentDate: Date | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  status: string;
  conversionStatus: string | null;
  convertedDealId: string | null;
  convertedAmount: number | null;
  followUpDate: Date | null;
  followUpSent: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GiftDeal {
  return {
    id: prismaGift.id,
    creatorId: prismaGift.creatorId,
    brandName: prismaGift.brandName,
    brandHandle: prismaGift.brandHandle,
    brandWebsite: prismaGift.brandWebsite,
    brandFollowers: prismaGift.brandFollowers,
    productDescription: prismaGift.productDescription,
    productValue: prismaGift.productValue,
    dateReceived: prismaGift.dateReceived,
    contentType: prismaGift.contentType as GiftDeal["contentType"],
    contentUrl: prismaGift.contentUrl,
    contentDate: prismaGift.contentDate,
    views: prismaGift.views,
    likes: prismaGift.likes,
    comments: prismaGift.comments,
    saves: prismaGift.saves,
    shares: prismaGift.shares,
    status: prismaGift.status as GiftDeal["status"],
    conversionStatus: prismaGift.conversionStatus as GiftDeal["conversionStatus"],
    convertedDealId: prismaGift.convertedDealId,
    convertedAmount: prismaGift.convertedAmount,
    followUpDate: prismaGift.followUpDate,
    followUpSent: prismaGift.followUpSent,
    notes: prismaGift.notes,
    createdAt: prismaGift.createdAt,
    updatedAt: prismaGift.updatedAt,
  };
}
