import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getGiftDeal,
  updateGiftDeal,
  deleteGiftDeal,
  addContentToGiftDeal,
  addPerformanceToGiftDeal,
} from "@/lib/gift-tracker";
import type {
  ApiResponse,
  GiftDeal,
  GiftDealUpdateInput,
  GiftDealAddContentInput,
  GiftDealAddPerformanceInput,
  GiftDealStatus,
  GiftDealContentType,
} from "@/lib/types";

/**
 * GET /api/gifts/[id]
 *
 * Get a single gift deal by ID.
 *
 * Returns: ApiResponse<GiftDeal>
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Get the gift deal
    const giftDeal = await getGiftDeal(session.user.id, id);

    if (!giftDeal) {
      return NextResponse.json(
        { success: false, error: "Gift deal not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: giftDeal,
    });
  } catch (error) {
    console.error("Get gift deal error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch gift deal. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gifts/[id]
 *
 * Update a gift deal. Supports multiple update operations:
 * - General updates (pass GiftDealUpdateInput)
 * - Add content (pass { action: "add_content", ...GiftDealAddContentInput })
 * - Add performance (pass { action: "add_performance", ...GiftDealAddPerformanceInput })
 *
 * Returns: ApiResponse<GiftDeal>
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Check if gift exists
    const existingDeal = await getGiftDeal(session.user.id, id);
    if (!existingDeal) {
      return NextResponse.json(
        { success: false, error: "Gift deal not found." },
        { status: 404 }
      );
    }

    // Parse JSON body
    const body = await request.json() as GiftDealUpdateInput & {
      action?: "add_content" | "add_performance";
      contentType?: GiftDealContentType;
      contentUrl?: string;
      contentDate?: string | Date;
      views?: number;
      likes?: number;
      comments?: number;
      saves?: number;
      shares?: number;
    };

    // Handle special actions
    if (body.action === "add_content") {
      // Validate content type
      const validContentTypes: GiftDealContentType[] = ["post", "reel", "story", "video"];
      if (!body.contentType || !validContentTypes.includes(body.contentType)) {
        return NextResponse.json(
          { success: false, error: `Content type is required. Must be one of: ${validContentTypes.join(", ")}` },
          { status: 400 }
        );
      }

      const contentInput: GiftDealAddContentInput = {
        contentType: body.contentType,
        contentUrl: body.contentUrl,
        contentDate: body.contentDate,
      };

      const giftDeal = await addContentToGiftDeal(session.user.id, id, contentInput);
      return NextResponse.json({ success: true, data: giftDeal });
    }

    if (body.action === "add_performance") {
      const performanceInput: GiftDealAddPerformanceInput = {
        views: body.views,
        likes: body.likes,
        comments: body.comments,
        saves: body.saves,
        shares: body.shares,
      };

      // Ensure at least one metric is provided
      if (!performanceInput.views && !performanceInput.likes &&
          !performanceInput.comments && !performanceInput.saves && !performanceInput.shares) {
        return NextResponse.json(
          { success: false, error: "At least one performance metric is required." },
          { status: 400 }
        );
      }

      const giftDeal = await addPerformanceToGiftDeal(session.user.id, id, performanceInput);
      return NextResponse.json({ success: true, data: giftDeal });
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses: GiftDealStatus[] = [
        "received",
        "content_created",
        "followed_up",
        "converted",
        "declined",
        "archived",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Remove action field before passing to update
     
    const { action: _, ...updateData } = body;

    // Update the gift deal
    const giftDeal = await updateGiftDeal(session.user.id, id, updateData);

    return NextResponse.json({
      success: true,
      data: giftDeal,
    });
  } catch (error) {
    console.error("Update gift deal error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update gift deal. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gifts/[id]
 *
 * Delete a gift deal.
 *
 * Returns: ApiResponse<{ deleted: true }>
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: true }>>> {
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

    const { id } = await params;

    // Check if gift exists
    const existingDeal = await getGiftDeal(session.user.id, id);
    if (!existingDeal) {
      return NextResponse.json(
        { success: false, error: "Gift deal not found." },
        { status: 404 }
      );
    }

    // Delete the gift deal
    await deleteGiftDeal(session.user.id, id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Delete gift deal error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete gift deal. Please try again." },
      { status: 500 }
    );
  }
}
