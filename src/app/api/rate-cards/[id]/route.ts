import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { ApiResponse, SavedRateCard, SavedRateCardUpdateInput } from "@/lib/types";

/**
 * GET /api/rate-cards/[id]
 *
 * Get a single saved rate card by ID.
 * Verifies ownership before returning.
 * Updates lastAccessedAt timestamp.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Find the rate card and verify ownership
    const rateCard = await db.savedRateCard.findUnique({
      where: { id },
    });

    if (!rateCard) {
      return NextResponse.json(
        { success: false, error: "Rate card not found." },
        { status: 404 }
      );
    }

    if (rateCard.creatorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to access this rate card." },
        { status: 403 }
      );
    }

    // Update lastAccessedAt
    const updatedCard = await db.savedRateCard.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });

    // Transform to match TypeScript type
    const transformedCard: SavedRateCard = {
      id: updatedCard.id,
      creatorId: updatedCard.creatorId,
      name: updatedCard.name,
      platform: updatedCard.platform,
      contentFormat: updatedCard.contentFormat,
      baseRate: updatedCard.baseRate,
      finalRate: updatedCard.finalRate,
      adjustments: updatedCard.adjustments as SavedRateCard["adjustments"],
      dealQuality: updatedCard.dealQuality as SavedRateCard["dealQuality"],
      briefId: updatedCard.briefId,
      brandName: updatedCard.brandName,
      campaignName: updatedCard.campaignName,
      createdAt: updatedCard.createdAt,
      updatedAt: updatedCard.updatedAt,
      lastAccessedAt: updatedCard.lastAccessedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCard,
    });
  } catch (error) {
    console.error("Get rate card error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch rate card. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rate-cards/[id]
 *
 * Update an existing saved rate card.
 * Verifies ownership before updating.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Find the rate card and verify ownership
    const existingCard = await db.savedRateCard.findUnique({
      where: { id },
    });

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: "Rate card not found." },
        { status: 404 }
      );
    }

    if (existingCard.creatorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to update this rate card." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as SavedRateCardUpdateInput;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.contentFormat !== undefined) updateData.contentFormat = body.contentFormat;
    if (body.baseRate !== undefined) updateData.baseRate = body.baseRate;
    if (body.finalRate !== undefined) updateData.finalRate = body.finalRate;
    if (body.adjustments !== undefined) updateData.adjustments = body.adjustments;
    if (body.dealQuality !== undefined) updateData.dealQuality = body.dealQuality;
    if (body.brandName !== undefined) updateData.brandName = body.brandName;
    if (body.campaignName !== undefined) updateData.campaignName = body.campaignName;

    // Update lastAccessedAt
    updateData.lastAccessedAt = new Date();

    const updatedCard = await db.savedRateCard.update({
      where: { id },
      data: updateData,
    });

    // Transform to match TypeScript type
    const transformedCard: SavedRateCard = {
      id: updatedCard.id,
      creatorId: updatedCard.creatorId,
      name: updatedCard.name,
      platform: updatedCard.platform,
      contentFormat: updatedCard.contentFormat,
      baseRate: updatedCard.baseRate,
      finalRate: updatedCard.finalRate,
      adjustments: updatedCard.adjustments as SavedRateCard["adjustments"],
      dealQuality: updatedCard.dealQuality as SavedRateCard["dealQuality"],
      briefId: updatedCard.briefId,
      brandName: updatedCard.brandName,
      campaignName: updatedCard.campaignName,
      createdAt: updatedCard.createdAt,
      updatedAt: updatedCard.updatedAt,
      lastAccessedAt: updatedCard.lastAccessedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedCard,
    });
  } catch (error) {
    console.error("Update rate card error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update rate card. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rate-cards/[id]
 *
 * Delete a saved rate card.
 * Verifies ownership before deleting.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: true }>>> {
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

    const { id } = await params;

    // Find the rate card and verify ownership
    const existingCard = await db.savedRateCard.findUnique({
      where: { id },
    });

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: "Rate card not found." },
        { status: 404 }
      );
    }

    if (existingCard.creatorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to delete this rate card." },
        { status: 403 }
      );
    }

    await db.savedRateCard.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Delete rate card error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete rate card. Please try again." },
      { status: 500 }
    );
  }
}
