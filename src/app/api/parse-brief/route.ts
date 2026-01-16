import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseBrief, parseBriefFromText } from "@/lib/brief-parser";
import type { ApiResponse, ParsedBrief } from "@/lib/types";
import { headers } from "next/headers";

/**
 * POST /api/parse-brief
 *
 * Parse a brand brief from either a file upload or pasted text.
 *
 * Accepts:
 * - multipart/form-data with a 'file' field (PDF, DOCX, or TXT)
 * - application/json with a 'text' field
 *
 * Returns: ApiResponse<ParsedBrief>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Omit<ParsedBrief, "id">>>> {
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

    const contentType = request.headers.get("content-type") || "";

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: "No file provided. Please upload a PDF, DOCX, or TXT file." },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse the brief from the file
      const parsedBrief = await parseBrief(buffer, file.name);

      return NextResponse.json({
        success: true,
        data: parsedBrief,
      });
    }

    // Handle JSON body with text
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { text } = body;

      if (!text || typeof text !== "string") {
        return NextResponse.json(
          { success: false, error: "No text provided. Please provide brief text to parse." },
          { status: 400 }
        );
      }

      // Parse the brief from text
      const parsedBrief = await parseBriefFromText(text);

      return NextResponse.json({
        success: true,
        data: parsedBrief,
      });
    }

    // Unsupported content type
    return NextResponse.json(
      {
        success: false,
        error: "Unsupported content type. Use multipart/form-data for file upload or application/json for text.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Brief parsing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while parsing the brief.";

    // Return 400 for known parsing errors (validation, unsupported file type)
    if (
      errorMessage.includes("too short") ||
      errorMessage.includes("Unsupported file type") ||
      errorMessage.includes("Failed to extract")
    ) {
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: "Failed to parse brief. Please try again or contact support." },
      { status: 500 }
    );
  }
}
