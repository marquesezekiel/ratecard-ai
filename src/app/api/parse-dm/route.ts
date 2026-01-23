import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeMessage } from "@/lib/message-analyzer";
import {
  parseDMImage,
  isValidMimeType,
  getMaxFileSizeMB,
  SUPPORTED_MIME_TYPE_LIST,
} from "@/lib/dm-parser";
import type {
  ApiResponse,
  DMImageAnalysis,
  CreatorProfile,
  MessageAnalysis,
  MessageSource,
} from "@/lib/types";
import { headers } from "next/headers";

/**
 * POST /api/parse-dm
 *
 * Unified Brand Message Analyzer - parses DMs and emails to extract
 * opportunity details, detect gift offers, and generate recommended responses.
 *
 * Supports three input modes:
 *
 * 1. Text input (application/json):
 *    { dmText: string, profile: CreatorProfile, sourceHint?: MessageSource }
 *
 * 2. Image input (multipart/form-data):
 *    - image: File (PNG, JPG, WEBP, or HEIC)
 *    - profile: JSON string of CreatorProfile
 *
 * 3. Base64 image input (application/json):
 *    { imageData: string, mimeType: string, profile: CreatorProfile }
 *
 * Returns: ApiResponse<MessageAnalysis | DMImageAnalysis>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MessageAnalysis | DMImageAnalysis>>> {
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

    // Determine content type
    const contentType = request.headers.get("content-type") || "";

    // Handle multipart/form-data (file upload)
    if (contentType.includes("multipart/form-data")) {
      return await handleImageUpload(request);
    }

    // Handle application/json (text or base64 image)
    return await handleJsonInput(request);
  } catch (error) {
    console.error("Message parsing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while analyzing the message.";

    // Return 400 for known validation errors
    if (
      errorMessage.includes("characters long") ||
      errorMessage.includes("Invalid") ||
      errorMessage.includes("Unsupported") ||
      errorMessage.includes("too large") ||
      errorMessage.includes("doesn't appear") ||
      errorMessage.includes("Could not extract")
    ) {
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: "Failed to analyze message. Please try again or contact support." },
      { status: 500 }
    );
  }
}

/**
 * Handle JSON input (text or base64 image).
 */
async function handleJsonInput(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MessageAnalysis | DMImageAnalysis>>> {
  const body = await request.json();

  // Check if this is a base64 image input
  if (body.imageData && body.mimeType) {
    return await handleBase64Image(body);
  }

  // Otherwise treat as text input
  return await handleTextInput(body);
}

/**
 * Handle text input.
 */
async function handleTextInput(
  body: Record<string, unknown>
): Promise<NextResponse<ApiResponse<MessageAnalysis>>> {
  const { dmText, profile, sourceHint } = body as {
    dmText: string | undefined;
    profile: CreatorProfile | undefined;
    sourceHint?: MessageSource;
  };

  // Validate required inputs
  if (!dmText || typeof dmText !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing message text. Please provide the message content to analyze." },
      { status: 400 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Missing creator profile. Please complete your profile first." },
      { status: 400 }
    );
  }

  // Analyze the message using unified analyzer
  const analysis = await analyzeMessage(
    {
      content: dmText,
      sourceHint: sourceHint,
    },
    profile
  );

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

/**
 * Handle base64 image input.
 */
async function handleBase64Image(
  body: Record<string, unknown>
): Promise<NextResponse<ApiResponse<DMImageAnalysis>>> {
  const { imageData, mimeType, profile } = body as {
    imageData: string | undefined;
    mimeType: string | undefined;
    profile: CreatorProfile | undefined;
  };

  // Validate required inputs
  if (!imageData || typeof imageData !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing image data. Please provide the screenshot to analyze." },
      { status: 400 }
    );
  }

  if (!mimeType || typeof mimeType !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing MIME type. Please provide the image format." },
      { status: 400 }
    );
  }

  if (!isValidMimeType(mimeType)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported image format: ${mimeType}. Supported formats: PNG, JPG, WEBP, HEIC`,
      },
      { status: 400 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Missing creator profile. Please complete your profile first." },
      { status: 400 }
    );
  }

  // Remove data URL prefix if present
  let cleanImageData = imageData;
  if (imageData.startsWith("data:")) {
    const matches = imageData.match(/^data:[^;]+;base64,(.+)$/);
    if (matches) {
      cleanImageData = matches[1];
    }
  }

  // Parse the DM image
  const analysis = await parseDMImage(cleanImageData, mimeType, profile);

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

/**
 * Handle multipart/form-data image upload.
 */
async function handleImageUpload(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DMImageAnalysis>>> {
  const formData = await request.formData();

  // Get the image file
  const imageFile = formData.get("image") as File | null;
  if (!imageFile) {
    return NextResponse.json(
      { success: false, error: "Missing image file. Please upload a DM screenshot." },
      { status: 400 }
    );
  }

  // Validate file type
  if (!isValidMimeType(imageFile.type)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported image format: ${imageFile.type}. Supported formats: PNG, JPG, WEBP, HEIC`,
      },
      { status: 400 }
    );
  }

  // Validate file size
  const maxSizeBytes = getMaxFileSizeMB() * 1024 * 1024;
  if (imageFile.size > maxSizeBytes) {
    return NextResponse.json(
      {
        success: false,
        error: `Image too large. Maximum size is ${getMaxFileSizeMB()}MB`,
      },
      { status: 400 }
    );
  }

  // Get the profile
  const profileJson = formData.get("profile") as string | null;
  if (!profileJson) {
    return NextResponse.json(
      { success: false, error: "Missing creator profile. Please complete your profile first." },
      { status: 400 }
    );
  }

  let profile: CreatorProfile;
  try {
    profile = JSON.parse(profileJson) as CreatorProfile;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid profile data. Please try again." },
      { status: 400 }
    );
  }

  // Convert file to base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64 = Buffer.from(uint8Array).toString("base64");

  // Parse the DM image
  const analysis = await parseDMImage(base64, imageFile.type, profile);

  return NextResponse.json({
    success: true,
    data: analysis,
  });
}

/**
 * GET /api/parse-dm
 *
 * Returns information about supported formats and limits.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: SUPPORTED_MIME_TYPE_LIST,
      maxFileSizeMB: getMaxFileSizeMB(),
      supportedSources: [
        "instagram_dm",
        "tiktok_dm",
        "twitter_dm",
        "linkedin_dm",
        "email",
        "other",
      ],
      inputModes: [
        {
          mode: "text",
          contentType: "application/json",
          description: "Paste DM or email text directly",
          body: { dmText: "string", profile: "CreatorProfile", sourceHint: "MessageSource (optional)" },
        },
        {
          mode: "image",
          contentType: "multipart/form-data",
          description: "Upload a DM screenshot",
          body: { image: "File", profile: "JSON string of CreatorProfile" },
        },
        {
          mode: "base64",
          contentType: "application/json",
          description: "Send base64 encoded image (for clipboard paste)",
          body: { imageData: "base64 string", mimeType: "string", profile: "CreatorProfile" },
        },
      ],
    },
  });
}
