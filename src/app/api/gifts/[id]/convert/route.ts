import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getGiftDeal,
  markAsConverted,
  markAsRejected,
} from "@/lib/gift-tracker";
import type {
  ApiResponse,
  GiftDeal,
  GiftDealConvertInput,
} from "@/lib/types";

/**
 * POST /api/gifts/[id]/convert
 *
 * Mark a gift deal as converted to a paid partnership.
 *
 * Accepts: application/json with GiftDealConvertInput
 * Returns: ApiResponse<GiftDeal>
 */
export async function POST(
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

    // Validate current status allows conversion
    const allowedStatuses = ["content_created", "followed_up", "received"];
    if (!allowedStatuses.includes(existingDeal.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot convert a deal with status "${existingDeal.status}". Deal may already be converted or archived.` },
        { status: 400 }
      );
    }

    // Parse JSON body
    const body = await request.json() as GiftDealConvertInput;

    // Validate required fields
    if (typeof body.convertedAmount !== "number" || body.convertedAmount < 0) {
      return NextResponse.json(
        { success: false, error: "Valid converted amount is required (must be a non-negative number)." },
        { status: 400 }
      );
    }

    // Mark as converted
    const giftDeal = await markAsConverted(session.user.id, id, body);

    return NextResponse.json({
      success: true,
      data: giftDeal,
    });
  } catch (error) {
    console.error("Convert gift deal error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to mark gift deal as converted. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gifts/[id]/convert
 *
 * Mark a conversion attempt as rejected (brand declined paid partnership).
 *
 * Accepts: application/json with { notes?: string }
 * Returns: ApiResponse<GiftDeal>
 */
export async function DELETE(
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

    // Validate current status allows rejection
    const allowedStatuses = ["followed_up", "content_created"];
    if (!allowedStatuses.includes(existingDeal.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot mark as rejected with status "${existingDeal.status}". Must have followed up first.` },
        { status: 400 }
      );
    }

    // Parse JSON body for optional notes
    let notes: string | undefined;
    try {
      const body = await request.json() as { notes?: string };
      notes = body.notes;
    } catch {
      // Body is optional, ignore parse errors
    }

    // Mark as rejected
    const giftDeal = await markAsRejected(session.user.id, id, notes);

    return NextResponse.json({
      success: true,
      data: giftDeal,
    });
  } catch (error) {
    console.error("Reject conversion error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to mark conversion as rejected. Please try again." },
      { status: 500 }
    );
  }
}
