import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getGiftDeal,
  logFollowUp,
  getConversionScript,
  suggestFollowUpScript,
} from "@/lib/gift-tracker";
import type {
  ApiResponse,
  GiftDeal,
  GiftDealFollowUpInput,
  ConversionScriptStage,
} from "@/lib/types";

/**
 * Response type for follow-up with script suggestion.
 */
interface FollowUpResponse {
  giftDeal: GiftDeal;
  suggestedScript: {
    stage: ConversionScriptStage;
    reason: string;
    script: string;
  };
}

/**
 * POST /api/gifts/[id]/follow-up
 *
 * Log a follow-up attempt on a gift deal.
 * Updates the gift deal status to "followed_up" and marks conversion as "attempting".
 *
 * Accepts: application/json with GiftDealFollowUpInput
 * Returns: ApiResponse<FollowUpResponse>
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FollowUpResponse>>> {
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

    // Validate current status allows follow-up
    if (!["content_created", "received"].includes(existingDeal.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot follow up on a deal with status "${existingDeal.status}". Must be "received" or "content_created".` },
        { status: 400 }
      );
    }

    // Parse JSON body
    const body = await request.json() as GiftDealFollowUpInput;

    // Log the follow-up
    const giftDeal = await logFollowUp(session.user.id, id, body);

    // Get suggested script
    const suggestion = suggestFollowUpScript(giftDeal);
    const script = getConversionScript(giftDeal, suggestion.stage);

    return NextResponse.json({
      success: true,
      data: {
        giftDeal,
        suggestedScript: {
          stage: suggestion.stage,
          reason: suggestion.reason,
          script,
        },
      },
    });
  } catch (error) {
    console.error("Follow-up error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to log follow-up. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gifts/[id]/follow-up
 *
 * Get follow-up script suggestions without logging.
 * Useful for previewing scripts before sending.
 *
 * Query params:
 * - stage: Override the suggested stage (performance_share, follow_up_30_day, new_launch_pitch, returning_brand_offer)
 *
 * Returns: ApiResponse<{ stage: string, reason: string, script: string }>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ stage: ConversionScriptStage; reason: string; script: string }>>> {
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
    const giftDeal = await getGiftDeal(session.user.id, id);
    if (!giftDeal) {
      return NextResponse.json(
        { success: false, error: "Gift deal not found." },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get("stage");

    // Validate stage if provided
    const validStages: ConversionScriptStage[] = [
      "performance_share",
      "follow_up_30_day",
      "new_launch_pitch",
      "returning_brand_offer",
    ];

    if (stageParam && !validStages.includes(stageParam as ConversionScriptStage)) {
      return NextResponse.json(
        { success: false, error: `Invalid stage. Must be one of: ${validStages.join(", ")}` },
        { status: 400 }
      );
    }

    // Get suggestion or use override
    const suggestion = suggestFollowUpScript(giftDeal);
    const stage = (stageParam as ConversionScriptStage) || suggestion.stage;
    const reason = stageParam ? `Using ${stageParam} as requested.` : suggestion.reason;

    const script = getConversionScript(giftDeal, stage);

    return NextResponse.json({
      success: true,
      data: {
        stage,
        reason,
        script,
      },
    });
  } catch (error) {
    console.error("Get follow-up script error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to get follow-up script. Please try again." },
      { status: 500 }
    );
  }
}
