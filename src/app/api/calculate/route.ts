import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateDealQuality } from "@/lib/deal-quality-score";
import { calculatePrice } from "@/lib/pricing-engine";
import type {
  ApiResponse,
  CreatorProfile,
  ParsedBrief,
  DealQualityResult,
  DealQualityInput,
  PricingResult,
} from "@/lib/types";
import { headers } from "next/headers";

interface CalculationResult {
  /** Creator-centric deal quality score */
  dealQuality: DealQualityResult;
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
    const { profile, brief, dealQualityInput } = body as {
      profile: CreatorProfile | undefined;
      brief: ParsedBrief | undefined;
      dealQualityInput?: DealQualityInput;
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

    // Calculate deal quality score
    // Pass empty input if not provided - the function will use sensible defaults
    const dealQuality = calculateDealQuality(
      profile,
      brief,
      dealQualityInput || {}
    );

    // Calculate pricing using the deal quality score
    const pricing = calculatePrice(profile, brief, dealQuality);

    return NextResponse.json({
      success: true,
      data: {
        dealQuality,
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
