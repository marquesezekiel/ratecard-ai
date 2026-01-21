import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createGiftDeal,
  getGiftDeals,
  getGiftsByStatus,
  getGiftAnalytics,
} from "@/lib/gift-tracker";
import type {
  ApiResponse,
  GiftDeal,
  GiftDealCreateInput,
  GiftDealStatus,
  GiftAnalytics,
} from "@/lib/types";

/**
 * POST /api/gifts
 *
 * Create a new gift deal record.
 *
 * Accepts: application/json with GiftDealCreateInput
 * Returns: ApiResponse<GiftDeal>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GiftDeal>>> {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json() as GiftDealCreateInput;

    // Validate required fields
    if (!body.brandName || typeof body.brandName !== "string" || !body.brandName.trim()) {
      return NextResponse.json(
        { success: false, error: "Brand name is required." },
        { status: 400 }
      );
    }

    if (!body.productDescription || typeof body.productDescription !== "string" || !body.productDescription.trim()) {
      return NextResponse.json(
        { success: false, error: "Product description is required." },
        { status: 400 }
      );
    }

    if (typeof body.productValue !== "number" || body.productValue < 0) {
      return NextResponse.json(
        { success: false, error: "Valid product value is required (must be a non-negative number)." },
        { status: 400 }
      );
    }

    // Create the gift deal
    const giftDeal = await createGiftDeal(session.user.id, body);

    return NextResponse.json({
      success: true,
      data: giftDeal,
    });
  } catch (error) {
    console.error("Create gift deal error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create gift deal. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gifts
 *
 * List all gift deals for the authenticated creator.
 * Supports optional filtering by status via query parameter.
 *
 * Query params:
 * - status: Filter by status (received, content_created, followed_up, converted, declined, archived)
 * - analytics: If "true", return analytics instead of gift list
 *
 * Returns: ApiResponse<GiftDeal[]> or ApiResponse<GiftAnalytics>
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GiftDeal[]> | ApiResponse<GiftAnalytics>>> {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const analytics = searchParams.get("analytics");

    // Return analytics if requested
    if (analytics === "true") {
      const analyticsData = await getGiftAnalytics(session.user.id);
      return NextResponse.json({
        success: true,
        data: analyticsData,
      });
    }

    // Validate status if provided
    const validStatuses: GiftDealStatus[] = [
      "received",
      "content_created",
      "followed_up",
      "converted",
      "declined",
      "archived",
    ];

    if (status && !validStatuses.includes(status as GiftDealStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get gift deals (with optional status filter)
    const giftDeals = status
      ? await getGiftsByStatus(session.user.id, status as GiftDealStatus)
      : await getGiftDeals(session.user.id);

    return NextResponse.json({
      success: true,
      data: giftDeals,
    });
  } catch (error) {
    console.error("List gift deals error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch gift deals. Please try again." },
      { status: 500 }
    );
  }
}
