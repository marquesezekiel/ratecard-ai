import { NextRequest, NextResponse } from "next/server";
import { calculateFitScore } from "@/lib/fit-score";
import { calculatePrice } from "@/lib/pricing-engine";
import type { ApiResponse, CreatorProfile, ParsedBrief, FitScoreResult, PricingResult } from "@/lib/types";

interface CalculationResult {
  fitScore: FitScoreResult;
  pricing: PricingResult;
}

/**
 * POST /api/public-calculate
 *
 * Public endpoint for calculating fit score and pricing.
 * No authentication required - used by the public /quote page.
 * Does not save to database.
 *
 * Accepts: application/json with { profile: CreatorProfile, brief: ParsedBrief }
 * Returns: ApiResponse<CalculationResult> with both fitScore and pricing
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CalculationResult>>> {
  try {
    // Parse JSON body
    const body = await request.json();
    const { profile, brief } = body as {
      profile: CreatorProfile | undefined;
      brief: ParsedBrief | undefined;
    };

    // Validate required inputs
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Missing creator profile data." },
        { status: 400 }
      );
    }

    if (!brief) {
      return NextResponse.json(
        { success: false, error: "Missing brief data." },
        { status: 400 }
      );
    }

    // Calculate fit score (must run first - pricing depends on it)
    const fitScore = calculateFitScore(profile, brief);

    // Calculate pricing using fit score result
    const pricing = calculatePrice(profile, brief, fitScore);

    return NextResponse.json({
      success: true,
      data: {
        fitScore,
        pricing,
      },
    });
  } catch (error) {
    console.error("Public calculation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
