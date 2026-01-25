import { NextRequest, NextResponse } from "next/server";
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

interface CalculationResult {
  /** Creator-centric deal quality score */
  dealQuality: DealQualityResult;
  pricing: PricingResult;
}

/**
 * POST /api/public-calculate
 *
 * Public endpoint for calculating deal quality score and pricing.
 * No authentication required - used by the public /quick-calculate page.
 * Does not save to database.
 *
 * Accepts: application/json with { profile: CreatorProfile, brief: ParsedBrief, dealQualityInput?: DealQualityInput }
 * Returns: ApiResponse<CalculationResult> with dealQuality, fitScore (deprecated), and pricing
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CalculationResult>>> {
  try {
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

    // Calculate deal quality score
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
    console.error("Public calculation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
