import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { evaluateGiftDeal } from "@/lib/gift-evaluator";
import { generateGiftResponse } from "@/lib/gift-responses";
import type {
  ApiResponse,
  GiftEvaluationInput,
  GiftEvaluation,
  GiftResponse,
  CreatorProfile,
  GiftResponseContext,
} from "@/lib/types";
import { headers } from "next/headers";

/**
 * Response type for the gift evaluator API.
 */
interface GiftEvaluatorResult {
  evaluation: GiftEvaluation;
  response: GiftResponse;
}

/**
 * POST /api/evaluate-gift
 *
 * Evaluate a gift offer to determine if it's worth the creator's time.
 * Returns a detailed analysis with worth score, recommendation, and
 * ready-to-use response templates.
 *
 * Accepts: application/json with { evaluation: GiftEvaluationInput, profile: CreatorProfile }
 *
 * Returns: ApiResponse<GiftEvaluatorResult>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GiftEvaluatorResult>>> {
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
    const { evaluation: evaluationInput, profile, context } = body as {
      evaluation: GiftEvaluationInput | undefined;
      profile: CreatorProfile | undefined;
      context?: GiftResponseContext;
    };

    // Validate required inputs
    if (!evaluationInput) {
      return NextResponse.json(
        { success: false, error: "Missing evaluation input. Please provide gift details." },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Missing creator profile. Please complete your profile first." },
        { status: 400 }
      );
    }

    // Validate evaluation input fields
    if (typeof evaluationInput.productDescription !== "string" || !evaluationInput.productDescription.trim()) {
      return NextResponse.json(
        { success: false, error: "Product description is required." },
        { status: 400 }
      );
    }

    if (typeof evaluationInput.estimatedProductValue !== "number" || evaluationInput.estimatedProductValue < 0) {
      return NextResponse.json(
        { success: false, error: "Valid estimated product value is required." },
        { status: 400 }
      );
    }

    if (typeof evaluationInput.estimatedHoursToCreate !== "number" || evaluationInput.estimatedHoursToCreate <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid estimated hours to create is required." },
        { status: 400 }
      );
    }

    const validContentTypes = ["organic_mention", "dedicated_post", "multiple_posts", "video_content"];
    if (!validContentTypes.includes(evaluationInput.contentRequired)) {
      return NextResponse.json(
        { success: false, error: "Valid content type is required (organic_mention, dedicated_post, multiple_posts, video_content)." },
        { status: 400 }
      );
    }

    const validBrandQualities = ["major_brand", "established_indie", "new_unknown", "suspicious"];
    if (!validBrandQualities.includes(evaluationInput.brandQuality)) {
      return NextResponse.json(
        { success: false, error: "Valid brand quality is required (major_brand, established_indie, new_unknown, suspicious)." },
        { status: 400 }
      );
    }

    // Run the evaluation
    const evaluation = evaluateGiftDeal(evaluationInput, profile);

    // Generate response with context
    const responseContext: GiftResponseContext = {
      brandName: context?.brandName,
      productName: context?.productName || evaluationInput.productDescription,
      creatorRate: context?.creatorRate,
      hybridRate: evaluation.minimumAcceptableAddOn,
      contentType: evaluationInput.contentRequired.replace(/_/g, " "),
    };

    const response = generateGiftResponse(evaluation, responseContext);

    return NextResponse.json({
      success: true,
      data: {
        evaluation,
        response,
      },
    });
  } catch (error) {
    console.error("Gift evaluation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while evaluating the gift offer.";

    // Return 400 for validation errors
    if (errorMessage.includes("Invalid") || errorMessage.includes("required")) {
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: "Failed to evaluate gift offer. Please try again or contact support." },
      { status: 500 }
    );
  }
}
