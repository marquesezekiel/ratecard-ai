import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { ApiResponse, SavedRateCard, SavedRateCardCreateInput } from "@/lib/types";

/**
 * GET /api/rate-cards
 *
 * List all saved rate cards for the authenticated user.
 * Returns cards sorted by lastAccessedAt (most recent first).
 */
export async function GET(): Promise<NextResponse<ApiResponse<SavedRateCard[]>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    const rateCards = await db.savedRateCard.findMany({
      where: { creatorId: session.user.id },
      orderBy: { lastAccessedAt: "desc" },
    });

    // Transform Prisma objects to match TypeScript types
    const transformedCards: SavedRateCard[] = rateCards.map((card) => ({
      id: card.id,
      creatorId: card.creatorId,
      name: card.name,
      platform: card.platform,
      contentFormat: card.contentFormat,
      baseRate: card.baseRate,
      finalRate: card.finalRate,
      adjustments: card.adjustments as unknown as SavedRateCard["adjustments"],
      dealQuality: card.dealQuality as unknown as SavedRateCard["dealQuality"],
      briefId: card.briefId,
      brandName: card.brandName,
      campaignName: card.campaignName,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      lastAccessedAt: card.lastAccessedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCards,
    });
  } catch (error) {
    console.error("List rate cards error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch rate cards. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rate-cards
 *
 * Create a new saved rate card.
 *
 * Accepts: application/json with SavedRateCardCreateInput
 * Returns: ApiResponse<SavedRateCard>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SavedRateCard>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SavedRateCardCreateInput;

    // Validate required fields
    if (!body.platform || typeof body.platform !== "string" || !body.platform.trim()) {
      return NextResponse.json(
        { success: false, error: "Platform is required." },
        { status: 400 }
      );
    }

    if (
      !body.contentFormat ||
      typeof body.contentFormat !== "string" ||
      !body.contentFormat.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Content format is required." },
        { status: 400 }
      );
    }

    if (typeof body.baseRate !== "number" || body.baseRate < 0) {
      return NextResponse.json(
        { success: false, error: "Valid base rate is required (must be a non-negative number)." },
        { status: 400 }
      );
    }

    if (typeof body.finalRate !== "number" || body.finalRate < 0) {
      return NextResponse.json(
        { success: false, error: "Valid final rate is required (must be a non-negative number)." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.adjustments)) {
      return NextResponse.json(
        { success: false, error: "Adjustments must be an array." },
        { status: 400 }
      );
    }

    // Create the rate card
    const rateCard = await db.savedRateCard.create({
      data: {
        creatorId: session.user.id,
        name: body.name ?? "Untitled Rate Card",
        platform: body.platform.trim(),
        contentFormat: body.contentFormat.trim(),
        baseRate: body.baseRate,
        finalRate: body.finalRate,
        adjustments: body.adjustments as unknown as Parameters<typeof db.savedRateCard.create>[0]["data"]["adjustments"],
        dealQuality: (body.dealQuality ?? null) as unknown as Parameters<typeof db.savedRateCard.create>[0]["data"]["dealQuality"],
        briefId: body.briefId ?? null,
        brandName: body.brandName ?? null,
        campaignName: body.campaignName ?? null,
      },
    });

    // Transform to match TypeScript type
    const transformedCard: SavedRateCard = {
      id: rateCard.id,
      creatorId: rateCard.creatorId,
      name: rateCard.name,
      platform: rateCard.platform,
      contentFormat: rateCard.contentFormat,
      baseRate: rateCard.baseRate,
      finalRate: rateCard.finalRate,
      adjustments: rateCard.adjustments as unknown as SavedRateCard["adjustments"],
      dealQuality: rateCard.dealQuality as unknown as SavedRateCard["dealQuality"],
      briefId: rateCard.briefId,
      brandName: rateCard.brandName,
      campaignName: rateCard.campaignName,
      createdAt: rateCard.createdAt,
      updatedAt: rateCard.updatedAt,
      lastAccessedAt: rateCard.lastAccessedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCard,
    });
  } catch (error) {
    console.error("Create rate card error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create rate card. Please try again." },
      { status: 500 }
    );
  }
}
