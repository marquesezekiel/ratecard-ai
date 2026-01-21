/**
 * DM Image Processor
 *
 * Extracts text from DM screenshots using Google Gemini's vision capability.
 * Detects platform from UI elements and validates that the image is a valid DM.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  DMImageExtractionResult,
  DetectedPlatform,
  SupportedImageFormat,
} from "./types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_VISION_MODEL = "gemini-2.0-flash";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_EXTRACTED_TEXT_LENGTH = 10;

/**
 * Supported MIME types for image uploads.
 */
export const SUPPORTED_MIME_TYPES: Record<SupportedImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

/**
 * All supported MIME types as an array.
 */
export const SUPPORTED_MIME_TYPE_LIST = Object.values(SUPPORTED_MIME_TYPES);

// =============================================================================
// GEMINI CLIENT
// =============================================================================

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

// =============================================================================
// VISION PROMPT
// =============================================================================

const VISION_EXTRACTION_PROMPT = `You are an expert at extracting text from DM (Direct Message) screenshots.

Analyze this image and determine:
1. Is this a DM/message screenshot? (could be Instagram, TikTok, Twitter, Email, LinkedIn, WhatsApp, etc.)
2. What platform is it from based on UI elements?
3. Extract ALL the text content from the messages.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "isValidDMScreenshot": boolean,
  "detectedPlatform": "instagram" | "tiktok" | "twitter" | "email" | "linkedin" | "whatsapp" | "unknown",
  "extractedText": "string with all message text",
  "confidence": number between 0 and 1,
  "metadata": {
    "multipleMessages": boolean,
    "senderName": "string or null",
    "hasProfilePic": boolean
  }
}

PLATFORM DETECTION GUIDELINES:
- Instagram: Purple/pink gradient, rounded message bubbles, "Message" header
- TikTok: Black/dark UI, red accents, distinctive message style
- Twitter/X: Blue accents, "Message" or "DM" header, rounded profile pics
- Email: Formal header with To/From/Subject, longer format
- LinkedIn: Blue accents, professional styling, "Messaging" header
- WhatsApp: Green accents, double check marks, phone-style UI
- unknown: If you can't determine the platform

TEXT EXTRACTION RULES:
- Extract the COMPLETE text of all messages visible
- Preserve paragraph breaks and formatting where possible
- Include any brand names, handles, or usernames mentioned
- Include any numbers (prices, follower counts, etc.)
- If multiple messages, concatenate with newlines
- Focus on the BRAND's message to the creator, not the creator's responses

VALIDATION:
- Set isValidDMScreenshot to false if:
  - The image is not a messaging interface
  - The image is too blurry/low quality to read
  - The image contains no text
  - The image is a meme, photo, or non-DM content`;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate that the MIME type is supported.
 */
export function isValidMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPE_LIST.includes(mimeType);
}

/**
 * Get the format from a MIME type.
 */
export function getFormatFromMimeType(mimeType: string): SupportedImageFormat | null {
  const entry = Object.entries(SUPPORTED_MIME_TYPES).find(
    ([, mime]) => mime === mimeType
  );
  return entry ? (entry[0] as SupportedImageFormat) : null;
}

/**
 * Validate image data size.
 */
export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Get max file size in MB for display.
 */
export function getMaxFileSizeMB(): number {
  return MAX_FILE_SIZE_BYTES / (1024 * 1024);
}

// =============================================================================
// IMAGE EXTRACTION
// =============================================================================

/**
 * Extract text and metadata from a DM screenshot using Gemini Vision.
 *
 * @param imageData - Base64 encoded image data (without data URL prefix)
 * @param mimeType - MIME type of the image
 * @returns Extraction result with text, platform, and metadata
 */
export async function extractTextFromImage(
  imageData: string,
  mimeType: string
): Promise<DMImageExtractionResult> {
  // Validate MIME type
  if (!isValidMimeType(mimeType)) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `Unsupported image format: ${mimeType}. Supported formats: PNG, JPG, WEBP, HEIC`,
    };
  }

  // Validate image data exists
  if (!imageData || imageData.length === 0) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: "No image data provided",
    };
  }

  // Estimate file size from base64 (base64 is ~4/3 the size of binary)
  const estimatedSize = Math.ceil((imageData.length * 3) / 4);
  if (!isValidFileSize(estimatedSize)) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `Image too large. Maximum size is ${getMaxFileSizeMB()}MB`,
    };
  }

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: GEMINI_VISION_MODEL,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    // Create the image part for Gemini
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType,
      },
    };

    // Call Gemini Vision API
    const result = await model.generateContent([VISION_EXTRACTION_PROMPT, imagePart]);
    const response = result.response;
    const content = response.text();

    if (!content) {
      return {
        extractedText: "",
        detectedPlatform: "unknown",
        confidence: 0,
        isValidDMScreenshot: false,
        error: "Empty response from vision API",
      };
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as {
      isValidDMScreenshot?: boolean;
      detectedPlatform?: string;
      extractedText?: string;
      confidence?: number;
      metadata?: {
        multipleMessages?: boolean;
        senderName?: string | null;
        hasProfilePic?: boolean;
      };
    };

    // Validate the response
    const isValidDMScreenshot = Boolean(parsed.isValidDMScreenshot);
    const extractedText = String(parsed.extractedText || "").trim();

    // Additional validation: if we got very little text, it's probably not valid
    if (isValidDMScreenshot && extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
      return {
        extractedText,
        detectedPlatform: "unknown",
        confidence: 0.2,
        isValidDMScreenshot: false,
        error: "Could not extract sufficient text from the image. Please ensure the screenshot is clear and readable.",
      };
    }

    // Validate detected platform
    const validPlatforms: DetectedPlatform[] = [
      "instagram",
      "tiktok",
      "twitter",
      "email",
      "linkedin",
      "whatsapp",
      "unknown",
    ];
    const detectedPlatform: DetectedPlatform = validPlatforms.includes(
      parsed.detectedPlatform as DetectedPlatform
    )
      ? (parsed.detectedPlatform as DetectedPlatform)
      : "unknown";

    // Normalize confidence
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));

    return {
      extractedText,
      detectedPlatform,
      confidence,
      isValidDMScreenshot,
      metadata: parsed.metadata
        ? {
            multipleMessages: Boolean(parsed.metadata.multipleMessages),
            senderName: parsed.metadata.senderName || undefined,
            hasProfilePic: Boolean(parsed.metadata.hasProfilePic),
          }
        : undefined,
    };
  } catch (error) {
    console.error("Vision API error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return {
        extractedText: "",
        detectedPlatform: "unknown",
        confidence: 0,
        isValidDMScreenshot: false,
        error: "Failed to parse vision API response. Please try again.",
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check for rate limiting or quota errors
    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return {
        extractedText: "",
        detectedPlatform: "unknown",
        confidence: 0,
        isValidDMScreenshot: false,
        error: "Vision API rate limit reached. Please try again in a moment.",
      };
    }

    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `Failed to process image: ${errorMessage}`,
    };
  }
}

/**
 * Process an uploaded image file and extract text.
 *
 * @param file - The uploaded file (from FormData)
 * @returns Extraction result
 */
export async function processUploadedImage(
  file: File
): Promise<DMImageExtractionResult> {
  // Validate file type
  if (!isValidMimeType(file.type)) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `Unsupported file type: ${file.type}. Please upload a PNG, JPG, WEBP, or HEIC image.`,
    };
  }

  // Validate file size
  if (!isValidFileSize(file.size)) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `File too large. Maximum size is ${getMaxFileSizeMB()}MB`,
    };
  }

  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = Buffer.from(uint8Array).toString("base64");

    // Extract text from the image
    return await extractTextFromImage(base64, file.type);
  } catch (error) {
    console.error("File processing error:", error);
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: "Failed to process the uploaded file. Please try again.",
    };
  }
}

/**
 * Process base64 image data from clipboard paste.
 *
 * @param dataUrl - The data URL (e.g., "data:image/png;base64,...")
 * @returns Extraction result
 */
export async function processClipboardImage(
  dataUrl: string
): Promise<DMImageExtractionResult> {
  // Parse the data URL
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: "Invalid image data. Please paste a valid image from your clipboard.",
    };
  }

  const [, mimeType, base64Data] = matches;

  // Validate MIME type
  if (!isValidMimeType(mimeType)) {
    return {
      extractedText: "",
      detectedPlatform: "unknown",
      confidence: 0,
      isValidDMScreenshot: false,
      error: `Unsupported image format: ${mimeType}. Supported formats: PNG, JPG, WEBP, HEIC`,
    };
  }

  // Extract text from the image
  return await extractTextFromImage(base64Data, mimeType);
}
