import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createOutcome,
  getOutcomes,
} from "@/lib/outcome-analytics";
import type {
  ApiResponse,
  Outcome,
  OutcomeCreateInput,
  OutcomeStatus,
  OutcomeSourceType,
  OutcomeProposedType,
} from "@/lib/types";

/**
 * POST /api/outcomes
 *
 * Create a new outcome record.
 *
 * Accepts: application/json with OutcomeCreateInput
 * Returns: ApiResponse<Outcome>
 */
export async function POST(
  request: NextRequest
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

    // Parse JSON body
    const body = (await request.json()) as OutcomeCreateInput;

    // Validate required fields
    const validSourceTypes: OutcomeSourceType[] = ["rate_card", "dm_analysis", "gift_evaluation"];
    if (!body.sourceType || !validSourceTypes.includes(body.sourceType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid source type. Must be one of: ${validSourceTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validProposedTypes: OutcomeProposedType[] = ["paid", "gift", "hybrid", "affiliate"];
    if (!body.proposedType || !validProposedTypes.includes(body.proposedType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid proposed type. Must be one of: ${validProposedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!body.platform || typeof body.platform !== "string" || !body.platform.trim()) {
      return NextResponse.json(
        { success: false, error: "Platform is required." },
        { status: 400 }
      );
    }

    if (!body.dealType || typeof body.dealType !== "string" || !body.dealType.trim()) {
      return NextResponse.json(
        { success: false, error: "Deal type is required." },
        { status: 400 }
      );
    }

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

    // Create the outcome
    const outcome = await createOutcome(session.user.id, body);

    return NextResponse.json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    console.error("Create outcome error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create outcome. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/outcomes
 *
 * List all outcomes for the authenticated creator.
 * Supports optional filtering via query parameters.
 *
 * Query params:
 * - sourceType: Filter by source type
 * - proposedType: Filter by proposed type
 * - outcome: Filter by outcome status
 * - platform: Filter by platform
 * - niche: Filter by niche
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - closedOnly: If "true", only return closed outcomes
 *
 * Returns: ApiResponse<Outcome[]>
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Outcome[]>>> {
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
    const filters: Record<string, unknown> = {};

    const sourceType = searchParams.get("sourceType");
    if (sourceType) {
      const validSourceTypes: OutcomeSourceType[] = ["rate_card", "dm_analysis", "gift_evaluation"];
      if (!validSourceTypes.includes(sourceType as OutcomeSourceType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid source type. Must be one of: ${validSourceTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      filters.sourceType = sourceType;
    }

    const proposedType = searchParams.get("proposedType");
    if (proposedType) {
      const validProposedTypes: OutcomeProposedType[] = ["paid", "gift", "hybrid", "affiliate"];
      if (!validProposedTypes.includes(proposedType as OutcomeProposedType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid proposed type. Must be one of: ${validProposedTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      filters.proposedType = proposedType;
    }

    const outcome = searchParams.get("outcome");
    if (outcome) {
      const validOutcomes: OutcomeStatus[] = [
        "accepted",
        "negotiated",
        "rejected",
        "ghosted",
        "pending",
        "gift_accepted",
        "gift_converted",
      ];
      if (!validOutcomes.includes(outcome as OutcomeStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid outcome status. Must be one of: ${validOutcomes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      filters.outcome = outcome;
    }

    const platform = searchParams.get("platform");
    if (platform) filters.platform = platform;

    const niche = searchParams.get("niche");
    if (niche) filters.niche = niche;

    const startDate = searchParams.get("startDate");
    if (startDate) filters.startDate = startDate;

    const endDate = searchParams.get("endDate");
    if (endDate) filters.endDate = endDate;

    const closedOnly = searchParams.get("closedOnly");
    if (closedOnly === "true") filters.closedOnly = true;

    // Get outcomes
    const outcomes = await getOutcomes(
      session.user.id,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json({
      success: true,
      data: outcomes,
    });
  } catch (error) {
    console.error("List outcomes error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch outcomes. Please try again." },
      { status: 500 }
    );
  }
}
