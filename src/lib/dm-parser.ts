/**
 * DM Parser - Backwards Compatibility Module
 *
 * This module re-exports from message-analyzer.ts for backwards compatibility.
 * New code should import directly from message-analyzer.ts.
 *
 * The Message Analyzer supports both DMs and emails with unified analysis.
 *
 * @deprecated Import from "./message-analyzer" for new code
 */

// Re-export all core functions from message-analyzer
export {
  analyzeMessage,
  parseDMText,
  detectMessageSource,
  isLikelyGiftOffer,
  isLikelyMassOutreach,
  containsGiftIndicators,
  containsMassOutreachSignals,
} from "./message-analyzer";

// Re-export types (through types.ts for proper type definitions)
export type {
  MessageSource,
  MessageAnalysis,
  MessageAnalysisInput,
  EmailMetadata,
  DMAnalysis,
  DMCompensationType,
  DMTone,
  DMUrgency,
  GiftAnalysis,
  GiftContentExpectation,
  GiftConversionPotential,
  GiftRecommendedApproach,
} from "./types";

// =============================================================================
// IMAGE PARSING - Keep original implementation
// =============================================================================

import {
  extractTextFromImage,
  processUploadedImage,
  processClipboardImage,
} from "./dm-image-processor";
import { analyzeMessage } from "./message-analyzer";
import type { DMImageAnalysis, CreatorProfile, Platform } from "./types";

const MIN_DM_LENGTH = 20;

/**
 * Parse a DM screenshot image and return structured analysis with gift detection.
 *
 * Uses Gemini Vision to extract text from the screenshot, then runs the same
 * analysis as the text parser including gift detection.
 *
 * @param imageData - Base64 encoded image data (without data URL prefix)
 * @param mimeType - MIME type of the image
 * @param creatorProfile - The creator's profile for rate calculations
 * @returns Complete DM analysis with extraction details
 * @throws Error if image processing fails or no text could be extracted
 */
export async function parseDMImage(
  imageData: string,
  mimeType: string,
  creatorProfile: CreatorProfile
): Promise<DMImageAnalysis> {
  // Extract text from the image
  const extraction = await extractTextFromImage(imageData, mimeType);

  // If extraction failed or image is not a valid DM
  if (!extraction.isValidDMScreenshot) {
    throw new Error(
      extraction.error ||
        "This doesn't appear to be a DM screenshot. Please upload a clear screenshot of a brand message."
    );
  }

  // If no text was extracted
  if (!extraction.extractedText || extraction.extractedText.trim().length < MIN_DM_LENGTH) {
    throw new Error(
      "Could not extract enough text from the screenshot. Please ensure the image is clear and the text is readable."
    );
  }

  // Run the unified message analysis on the extracted text
  const textAnalysis = await analyzeMessage(
    { content: extraction.extractedText },
    creatorProfile
  );

  // Enhance the result with image-specific data
  const imageAnalysis: DMImageAnalysis = {
    // Map MessageAnalysis to DMImageAnalysis structure
    brandName: textAnalysis.brandName,
    brandHandle: textAnalysis.brandHandle,
    deliverableRequest: textAnalysis.deliverableRequest,
    compensationType: textAnalysis.compensationType,
    offeredAmount: textAnalysis.offeredAmount,
    estimatedProductValue: textAnalysis.estimatedProductValue,
    tone: textAnalysis.tone,
    urgency: textAnalysis.urgency,
    redFlags: textAnalysis.redFlags,
    greenFlags: textAnalysis.greenFlags,
    isGiftOffer: textAnalysis.isGiftOffer,
    giftAnalysis: textAnalysis.giftAnalysis,
    extractedRequirements: textAnalysis.extractedRequirements,
    recommendedResponse: textAnalysis.recommendedResponse,
    suggestedRate: textAnalysis.suggestedRate,
    dealQualityEstimate: textAnalysis.dealQualityEstimate,
    nextSteps: textAnalysis.nextSteps,
    source: "image",
    imageExtraction: extraction,
  };

  // If we detected a platform from the screenshot, use it to inform the analysis
  if (extraction.detectedPlatform !== "unknown") {
    // Map detected platform to our Platform type if applicable
    const platformMapping: Record<string, string> = {
      instagram: "instagram",
      tiktok: "tiktok",
      twitter: "twitter",
      linkedin: "linkedin",
    };

    const mappedPlatform = platformMapping[extraction.detectedPlatform];
    if (mappedPlatform && imageAnalysis.extractedRequirements) {
      if (!imageAnalysis.extractedRequirements.content) {
        imageAnalysis.extractedRequirements.content = {
          platform: mappedPlatform as Platform,
          format: "static",
          quantity: 1,
          creativeDirection: "",
        };
      } else if (!imageAnalysis.extractedRequirements.content.platform) {
        imageAnalysis.extractedRequirements.content.platform = mappedPlatform as Platform;
      }
    }
  }

  return imageAnalysis;
}

/**
 * Parse a DM from an uploaded file.
 *
 * @param file - The uploaded file
 * @param creatorProfile - The creator's profile for rate calculations
 * @returns Complete DM analysis with extraction details
 */
export async function parseDMFromFile(
  file: File,
  creatorProfile: CreatorProfile
): Promise<DMImageAnalysis> {
  // Process the uploaded file
  const extraction = await processUploadedImage(file);

  // If extraction failed or image is not a valid DM
  if (!extraction.isValidDMScreenshot) {
    throw new Error(
      extraction.error ||
        "This doesn't appear to be a DM screenshot. Please upload a clear screenshot of a brand message."
    );
  }

  // If no text was extracted
  if (!extraction.extractedText || extraction.extractedText.trim().length < MIN_DM_LENGTH) {
    throw new Error(
      "Could not extract enough text from the screenshot. Please ensure the image is clear and the text is readable."
    );
  }

  // Run the unified message analysis on the extracted text
  const textAnalysis = await analyzeMessage(
    { content: extraction.extractedText },
    creatorProfile
  );

  // Enhance the result with image-specific data
  return {
    brandName: textAnalysis.brandName,
    brandHandle: textAnalysis.brandHandle,
    deliverableRequest: textAnalysis.deliverableRequest,
    compensationType: textAnalysis.compensationType,
    offeredAmount: textAnalysis.offeredAmount,
    estimatedProductValue: textAnalysis.estimatedProductValue,
    tone: textAnalysis.tone,
    urgency: textAnalysis.urgency,
    redFlags: textAnalysis.redFlags,
    greenFlags: textAnalysis.greenFlags,
    isGiftOffer: textAnalysis.isGiftOffer,
    giftAnalysis: textAnalysis.giftAnalysis,
    extractedRequirements: textAnalysis.extractedRequirements,
    recommendedResponse: textAnalysis.recommendedResponse,
    suggestedRate: textAnalysis.suggestedRate,
    dealQualityEstimate: textAnalysis.dealQualityEstimate,
    nextSteps: textAnalysis.nextSteps,
    source: "image",
    imageExtraction: extraction,
  };
}

/**
 * Parse a DM from clipboard paste (data URL).
 *
 * @param dataUrl - The data URL from clipboard (e.g., "data:image/png;base64,...")
 * @param creatorProfile - The creator's profile for rate calculations
 * @returns Complete DM analysis with extraction details
 */
export async function parseDMFromClipboard(
  dataUrl: string,
  creatorProfile: CreatorProfile
): Promise<DMImageAnalysis> {
  // Process the clipboard data
  const extraction = await processClipboardImage(dataUrl);

  // If extraction failed or image is not a valid DM
  if (!extraction.isValidDMScreenshot) {
    throw new Error(
      extraction.error ||
        "This doesn't appear to be a DM screenshot. Please paste a clear screenshot of a brand message."
    );
  }

  // If no text was extracted
  if (!extraction.extractedText || extraction.extractedText.trim().length < MIN_DM_LENGTH) {
    throw new Error(
      "Could not extract enough text from the screenshot. Please ensure the image is clear and the text is readable."
    );
  }

  // Run the unified message analysis on the extracted text
  const textAnalysis = await analyzeMessage(
    { content: extraction.extractedText },
    creatorProfile
  );

  // Enhance the result with image-specific data
  return {
    brandName: textAnalysis.brandName,
    brandHandle: textAnalysis.brandHandle,
    deliverableRequest: textAnalysis.deliverableRequest,
    compensationType: textAnalysis.compensationType,
    offeredAmount: textAnalysis.offeredAmount,
    estimatedProductValue: textAnalysis.estimatedProductValue,
    tone: textAnalysis.tone,
    urgency: textAnalysis.urgency,
    redFlags: textAnalysis.redFlags,
    greenFlags: textAnalysis.greenFlags,
    isGiftOffer: textAnalysis.isGiftOffer,
    giftAnalysis: textAnalysis.giftAnalysis,
    extractedRequirements: textAnalysis.extractedRequirements,
    recommendedResponse: textAnalysis.recommendedResponse,
    suggestedRate: textAnalysis.suggestedRate,
    dealQualityEstimate: textAnalysis.dealQualityEstimate,
    nextSteps: textAnalysis.nextSteps,
    source: "image",
    imageExtraction: extraction,
  };
}

// Re-export image processing utilities for convenience
export {
  extractTextFromImage,
  processUploadedImage,
  processClipboardImage,
  isValidMimeType,
  isValidFileSize,
  getMaxFileSizeMB,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_MIME_TYPE_LIST,
} from "./dm-image-processor";
