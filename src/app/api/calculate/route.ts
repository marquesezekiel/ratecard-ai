import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateFitScore } from "@/lib/fit-score";
import { calculatePrice } from "@/lib/pricing-engine";
import type { ApiResponse, CreatorProfile, ParsedBrief, FitScoreResult, PricingResult } from "@/lib/types";
import { headers } from "next/headers";

interface CalculationResult {
  fitScore: FitScoreResult;
  pricing: PricingResult;
}

/**
 * POST /api/calculate
 *
 * Calculate fit score and pricing for a creator-brand match.
 *
 * Accepts: application/json with { profile: CreatorProfile, brief: ParsedBrief }
 *
 * Returns: ApiResponse<CalculationResult> with both fitScore and pricing
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CalculationResult>>> {
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
    const body = await request.json();
    const { profile, brief } = body as {
      profile: CreatorProfile | undefined;
      brief: ParsedBrief | undefined;
    };

    // Validate required inputs
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Missing creator profile. Please complete your profile first." },
        { status: 400 }
      );
    }

    if (!brief) {
      return NextResponse.json(
        { success: false, error: "Missing brief data. Please upload a brief first." },
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
    console.error("Calculation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during calculation.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
