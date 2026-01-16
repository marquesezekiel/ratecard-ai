import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { RateCardDocument } from "@/lib/pdf-generator";
import type {
  ApiResponse,
  CreatorProfile,
  ParsedBrief,
  FitScoreResult,
  PricingResult,
} from "@/lib/types";
import { headers } from "next/headers";

interface GeneratePdfRequest {
  profile: CreatorProfile;
  brief: ParsedBrief;
  fitScore: FitScoreResult;
  pricing: PricingResult;
}

/**
 * POST /api/generate-pdf
 *
 * Generate a professional PDF rate card from the provided data.
 *
 * Accepts: application/json with { profile, brief, fitScore, pricing }
 *
 * Returns: PDF file as downloadable attachment
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>> | Response> {
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
    const body = (await request.json()) as Partial<GeneratePdfRequest>;
    const { profile, brief, fitScore, pricing } = body;

    // Validate required inputs
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing creator profile. Please complete your profile first.",
        },
        { status: 400 }
      );
    }

    if (!brief) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing brief data. Please upload a brief first.",
        },
        { status: 400 }
      );
    }

    if (!fitScore) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing fit score. Please calculate fit score first.",
        },
        { status: 400 }
      );
    }

    if (!pricing) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing pricing data. Please calculate pricing first.",
        },
        { status: 400 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      RateCardDocument({ profile, brief, fitScore, pricing })
    );

    // Create filename with handle and timestamp
    const timestamp = Date.now();
    const sanitizedHandle = profile.handle.replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `ratecard-${sanitizedHandle}-${timestamp}.pdf`;

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF as downloadable file
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during PDF generation.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
