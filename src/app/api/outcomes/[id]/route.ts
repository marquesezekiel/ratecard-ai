import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getOutcome,
  updateOutcome,
  deleteOutcome,
} from "@/lib/outcome-analytics";
import type {
  ApiResponse,
  Outcome,
  OutcomeUpdateInput,
  OutcomeStatus,
  GiftOutcomeStatus,
} from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/outcomes/:id
 *
 * Get a single outcome by ID.
 *
 * Returns: ApiResponse<Outcome>
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Outcome>>> {
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

    // Get the outcome
    const outcome = await getOutcome(session.user.id, id);

    if (!outcome) {
      return NextResponse.json(
        { success: false, error: "Outcome not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    console.error("Get outcome error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch outcome. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/outcomes/:id
 *
 * Update an outcome record.
 *
 * Accepts: application/json with OutcomeUpdateInput
 * Returns: ApiResponse<Outcome>
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Outcome>>> {
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

    // Check if outcome exists
    const existing = await getOutcome(session.user.id, id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Outcome not found." },
        { status: 404 }
      );
    }

    // Parse JSON body
    const body = (await request.json()) as OutcomeUpdateInput;

    // Validate outcome status if provided
    if (body.outcome) {
      const validOutcomes: OutcomeStatus[] = [
        "accepted",
        "negotiated",
        "rejected",
        "ghosted",
        "pending",
        "gift_accepted",
        "gift_converted",
      ];
      if (!validOutcomes.includes(body.outcome)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid outcome status. Must be one of: ${validOutcomes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate gift outcome if provided
    if (body.giftOutcome) {
      const validGiftOutcomes: GiftOutcomeStatus[] = [
        "accepted_gift",
        "countered_to_paid",
        "declined",
        "converted_later",
      ];
      if (!validGiftOutcomes.includes(body.giftOutcome)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid gift outcome. Must be one of: ${validGiftOutcomes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields
    if (body.finalRate !== undefined && typeof body.finalRate !== "number") {
      return NextResponse.json(
        { success: false, error: "Final rate must be a number." },
        { status: 400 }
      );
    }

    if (body.negotiationDelta !== undefined && typeof body.negotiationDelta !== "number") {
      return NextResponse.json(
        { success: false, error: "Negotiation delta must be a number." },
        { status: 400 }
      );
    }

    if (body.giftConversionDays !== undefined && typeof body.giftConversionDays !== "number") {
      return NextResponse.json(
        { success: false, error: "Gift conversion days must be a number." },
        { status: 400 }
      );
    }

    // Update the outcome
    const outcome = await updateOutcome(session.user.id, id, body);

    return NextResponse.json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    console.error("Update outcome error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update outcome. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/outcomes/:id
 *
 * Delete an outcome record.
 *
 * Returns: ApiResponse<{ deleted: true }>
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
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

    // Check if outcome exists
    const existing = await getOutcome(session.user.id, id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Outcome not found." },
        { status: 404 }
      );
    }

    // Delete the outcome
    await deleteOutcome(session.user.id, id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Delete outcome error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete outcome. Please try again." },
      { status: 500 }
    );
  }
}
