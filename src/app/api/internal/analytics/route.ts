import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Outcome statuses that count as "accepted"
const ACCEPTED_STATUSES = [
  "accepted",
  "negotiated",
  "gift_accepted",
  "gift_converted",
];

/**
 * Get admin emails from environment variable.
 * Read inside the function for testability.
 */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const adminEmails = getAdminEmails();
  if (!session?.user || !adminEmails.includes(session.user.email)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Parse query parameters for filters
  const searchParams = request.nextUrl.searchParams;
  const dateRange = searchParams.get("dateRange"); // "7d", "30d", "90d", "all"
  const platform = searchParams.get("platform"); // "instagram", "tiktok", etc.

  // Build date filter
  const dateFilter = getDateFilter(dateRange);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (dateFilter) {
    where.createdAt = { gte: dateFilter };
  }
  if (platform && platform !== "all") {
    where.platform = platform;
  }

  // Fetch all outcomes matching filters
  const outcomes = await db.outcome.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const totalOutcomes = outcomes.length;

  // Calculate acceptance rate (exclude pending)
  const closed = outcomes.filter((o) => o.outcome !== "pending");
  const accepted = closed.filter((o) => ACCEPTED_STATUSES.includes(o.outcome));
  const acceptanceRate = closed.length > 0 ? accepted.length / closed.length : 0;

  // Calculate average negotiation delta
  const negotiated = outcomes.filter(
    (o) => o.outcome === "negotiated" && o.negotiationDelta !== null
  );
  const avgNegotiationDelta =
    negotiated.length > 0
      ? negotiated.reduce((sum, o) => sum + (o.negotiationDelta || 0), 0) /
        negotiated.length
      : 0;

  // Calculate gift conversion rate
  const gifts = outcomes.filter((o) => o.proposedType === "gift");
  const converted = gifts.filter((o) => o.outcome === "gift_converted");
  const giftConversionRate =
    gifts.length > 0 ? converted.length / gifts.length : 0;

  // Group by status
  const byStatus: Record<string, number> = {};
  outcomes.forEach((o) => {
    byStatus[o.outcome] = (byStatus[o.outcome] || 0) + 1;
  });

  // Group by platform with average rate
  const platformMap = new Map<string, { count: number; totalRate: number }>();
  outcomes.forEach((o) => {
    const current = platformMap.get(o.platform) || { count: 0, totalRate: 0 };
    platformMap.set(o.platform, {
      count: current.count + 1,
      totalRate: current.totalRate + (o.finalRate || o.proposedRate || 0),
    });
  });
  const byPlatform = Array.from(platformMap.entries())
    .map(([platform, data]) => ({
      platform: formatPlatformName(platform),
      count: data.count,
      avgRate: data.count > 0 ? Math.round(data.totalRate / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate over time data (daily aggregation)
  const overTime = calculateOverTime(outcomes, dateRange);

  return NextResponse.json({
    success: true,
    data: {
      totalOutcomes,
      acceptanceRate,
      avgNegotiationDelta,
      giftConversionRate,
      byStatus,
      byPlatform,
      overTime,
    },
  });
}

/**
 * Get the date filter based on the range parameter.
 */
function getDateFilter(dateRange: string | null): Date | null {
  if (!dateRange || dateRange === "all") return null;

  const now = new Date();
  const days = parseInt(dateRange.replace("d", ""), 10);

  if (isNaN(days)) return null;

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Format platform name for display.
 */
function formatPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    twitter: "Twitter/X",
  };
  return platformNames[platform.toLowerCase()] || platform;
}

/**
 * Calculate time series data for acceptance rate over time.
 */
function calculateOverTime(
  outcomes: Array<{
    outcome: string;
    createdAt: Date;
  }>,
  dateRange: string | null
): Array<{ date: string; accepted: number; rejected: number }> {
  if (outcomes.length === 0) return [];

  // Determine grouping interval based on date range
  const isShortRange = dateRange === "7d" || dateRange === "30d";

  // Group outcomes by date
  const dateMap = new Map<
    string,
    { accepted: number; rejected: number }
  >();

  outcomes.forEach((o) => {
    const date = formatDateKey(o.createdAt, isShortRange);
    const current = dateMap.get(date) || { accepted: 0, rejected: 0 };

    if (ACCEPTED_STATUSES.includes(o.outcome)) {
      current.accepted++;
    } else if (o.outcome !== "pending") {
      current.rejected++;
    }

    dateMap.set(date, current);
  });

  // Convert to array and sort by date
  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      accepted: data.accepted,
      rejected: data.rejected,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format date for grouping.
 */
function formatDateKey(date: Date, useDaily: boolean): string {
  if (useDaily) {
    // Format as "Jan 15"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // Format as "Jan 2025" for longer ranges
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
