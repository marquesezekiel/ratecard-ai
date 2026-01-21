import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseDMText } from "@/lib/dm-parser";
import type { ApiResponse, DMAnalysis, CreatorProfile } from "@/lib/types";
import { headers } from "next/headers";

/**
 * POST /api/parse-dm
 *
 * Parse a brand DM to extract opportunity details, detect gift offers,
 * and generate recommended responses.
 *
 * Accepts: application/json with { dmText: string, profile: CreatorProfile }
 *
 * Returns: ApiResponse<DMAnalysis>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DMAnalysis>>> {
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
    const { dmText, profile } = body as {
      dmText: string | undefined;
      profile: CreatorProfile | undefined;
    };

    // Validate required inputs
    if (!dmText || typeof dmText !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing DM text. Please provide the DM content to analyze." },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Missing creator profile. Please complete your profile first." },
        { status: 400 }
      );
    }

    // Parse the DM
    const analysis = await parseDMText(dmText, profile);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("DM parsing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while analyzing the DM.";

    // Return 400 for known validation errors
    if (errorMessage.includes("characters long") || errorMessage.includes("Invalid")) {
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: "Failed to analyze DM. Please try again or contact support." },
      { status: 500 }
    );
  }
}
