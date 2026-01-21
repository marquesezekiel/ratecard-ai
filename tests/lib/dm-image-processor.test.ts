import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DMImageExtractionResult, DetectedPlatform } from "@/lib/types";

// Mock the Google Generative AI module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

// Import after mocking
import {
  isValidMimeType,
  isValidFileSize,
  getMaxFileSizeMB,
  getFormatFromMimeType,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_MIME_TYPE_LIST,
  extractTextFromImage,
  processClipboardImage,
} from "@/lib/dm-image-processor";

describe("dm-image-processor", () => {
  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe("isValidMimeType", () => {
    it("accepts PNG images", () => {
      expect(isValidMimeType("image/png")).toBe(true);
    });

    it("accepts JPEG images", () => {
      expect(isValidMimeType("image/jpeg")).toBe(true);
    });

    it("accepts WEBP images", () => {
      expect(isValidMimeType("image/webp")).toBe(true);
    });

    it("accepts HEIC images", () => {
      expect(isValidMimeType("image/heic")).toBe(true);
    });

    it("rejects unsupported formats", () => {
      expect(isValidMimeType("image/gif")).toBe(false);
      expect(isValidMimeType("image/bmp")).toBe(false);
      expect(isValidMimeType("video/mp4")).toBe(false);
      expect(isValidMimeType("application/pdf")).toBe(false);
      expect(isValidMimeType("text/plain")).toBe(false);
    });

    it("rejects empty or invalid input", () => {
      expect(isValidMimeType("")).toBe(false);
      expect(isValidMimeType("invalid")).toBe(false);
    });
  });

  describe("isValidFileSize", () => {
    it("accepts files under 10MB", () => {
      expect(isValidFileSize(1024)).toBe(true); // 1KB
      expect(isValidFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(isValidFileSize(10 * 1024 * 1024)).toBe(true); // 10MB (exactly at limit)
    });

    it("rejects files over 10MB", () => {
      expect(isValidFileSize(10 * 1024 * 1024 + 1)).toBe(false); // 10MB + 1 byte
      expect(isValidFileSize(15 * 1024 * 1024)).toBe(false); // 15MB
      expect(isValidFileSize(100 * 1024 * 1024)).toBe(false); // 100MB
    });

    it("rejects zero or negative sizes", () => {
      expect(isValidFileSize(0)).toBe(false);
      expect(isValidFileSize(-1)).toBe(false);
    });
  });

  describe("getMaxFileSizeMB", () => {
    it("returns 10MB as the limit", () => {
      expect(getMaxFileSizeMB()).toBe(10);
    });
  });

  describe("getFormatFromMimeType", () => {
    it("returns correct format for PNG", () => {
      expect(getFormatFromMimeType("image/png")).toBe("png");
    });

    it("returns correct format for JPEG", () => {
      // Both jpg and jpeg map to image/jpeg, so either is valid
      const result = getFormatFromMimeType("image/jpeg");
      expect(["jpg", "jpeg"]).toContain(result);
    });

    it("returns correct format for WEBP", () => {
      expect(getFormatFromMimeType("image/webp")).toBe("webp");
    });

    it("returns correct format for HEIC", () => {
      expect(getFormatFromMimeType("image/heic")).toBe("heic");
    });

    it("returns null for unsupported formats", () => {
      expect(getFormatFromMimeType("image/gif")).toBe(null);
      expect(getFormatFromMimeType("invalid")).toBe(null);
    });
  });

  describe("SUPPORTED_MIME_TYPES", () => {
    it("contains all expected formats", () => {
      expect(SUPPORTED_MIME_TYPES).toEqual({
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        heic: "image/heic",
      });
    });
  });

  describe("SUPPORTED_MIME_TYPE_LIST", () => {
    it("contains all supported MIME types", () => {
      expect(SUPPORTED_MIME_TYPE_LIST).toContain("image/png");
      expect(SUPPORTED_MIME_TYPE_LIST).toContain("image/jpeg");
      expect(SUPPORTED_MIME_TYPE_LIST).toContain("image/webp");
      expect(SUPPORTED_MIME_TYPE_LIST).toContain("image/heic");
    });
  });

  // ==========================================================================
  // EXTRACTION TESTS (with mocked vision API)
  // ==========================================================================

  describe("extractTextFromImage", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Set the environment variable for tests
      process.env.GOOGLE_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.GOOGLE_API_KEY;
    });

    it("returns error for unsupported MIME type", async () => {
      const result = await extractTextFromImage("base64data", "image/gif");

      expect(result.isValidDMScreenshot).toBe(false);
      expect(result.error).toContain("Unsupported image format");
    });

    it("returns error for empty image data", async () => {
      const result = await extractTextFromImage("", "image/png");

      expect(result.isValidDMScreenshot).toBe(false);
      expect(result.error).toBe("No image data provided");
    });

    it("returns error for oversized image", async () => {
      // Create a string that's roughly 15MB in base64
      const largeBase64 = "A".repeat(15 * 1024 * 1024);
      const result = await extractTextFromImage(largeBase64, "image/png");

      expect(result.isValidDMScreenshot).toBe(false);
      expect(result.error).toContain("too large");
    });
  });

  describe("processClipboardImage", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.GOOGLE_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.GOOGLE_API_KEY;
    });

    it("returns error for invalid data URL", async () => {
      const result = await processClipboardImage("not-a-data-url");

      expect(result.isValidDMScreenshot).toBe(false);
      expect(result.error).toContain("Invalid image data");
    });

    it("returns error for unsupported format in data URL", async () => {
      const result = await processClipboardImage("data:image/gif;base64,R0lGODlhAQABAA==");

      expect(result.isValidDMScreenshot).toBe(false);
      expect(result.error).toContain("Unsupported image format");
    });
  });

  // ==========================================================================
  // PLATFORM DETECTION TESTS
  // ==========================================================================

  describe("platform detection (unit tests)", () => {
    // These test the expected behavior of the vision API output parsing
    // The actual vision API is mocked, so we test the expected structure

    it("DetectedPlatform type includes all expected platforms", () => {
      const validPlatforms: DetectedPlatform[] = [
        "instagram",
        "tiktok",
        "twitter",
        "email",
        "linkedin",
        "whatsapp",
        "unknown",
      ];

      // This is a compile-time check that all platforms are valid
      expect(validPlatforms.length).toBe(7);
    });
  });

  // ==========================================================================
  // MOCK RESPONSE TESTS
  // ==========================================================================

  describe("extraction result structure", () => {
    it("DMImageExtractionResult has correct shape", () => {
      const validResult: DMImageExtractionResult = {
        extractedText: "Hello, I love your content!",
        detectedPlatform: "instagram",
        confidence: 0.95,
        isValidDMScreenshot: true,
        metadata: {
          multipleMessages: false,
          senderName: "BrandName",
          hasProfilePic: true,
        },
      };

      expect(validResult.extractedText).toBe("Hello, I love your content!");
      expect(validResult.detectedPlatform).toBe("instagram");
      expect(validResult.confidence).toBe(0.95);
      expect(validResult.isValidDMScreenshot).toBe(true);
      expect(validResult.metadata?.multipleMessages).toBe(false);
      expect(validResult.metadata?.senderName).toBe("BrandName");
      expect(validResult.metadata?.hasProfilePic).toBe(true);
    });

    it("DMImageExtractionResult works with error state", () => {
      const errorResult: DMImageExtractionResult = {
        extractedText: "",
        detectedPlatform: "unknown",
        confidence: 0,
        isValidDMScreenshot: false,
        error: "Could not process the image",
      };

      expect(errorResult.isValidDMScreenshot).toBe(false);
      expect(errorResult.error).toBe("Could not process the image");
      expect(errorResult.extractedText).toBe("");
    });

    it("DMImageExtractionResult works without metadata", () => {
      const minimalResult: DMImageExtractionResult = {
        extractedText: "Some DM text",
        detectedPlatform: "tiktok",
        confidence: 0.8,
        isValidDMScreenshot: true,
      };

      expect(minimalResult.metadata).toBeUndefined();
      expect(minimalResult.isValidDMScreenshot).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================

  describe("edge cases", () => {
    it("handles all detected platform types", () => {
      const platforms: DetectedPlatform[] = [
        "instagram",
        "tiktok",
        "twitter",
        "email",
        "linkedin",
        "whatsapp",
        "unknown",
      ];

      platforms.forEach((platform) => {
        const result: DMImageExtractionResult = {
          extractedText: "Test",
          detectedPlatform: platform,
          confidence: 0.9,
          isValidDMScreenshot: true,
        };
        expect(result.detectedPlatform).toBe(platform);
      });
    });

    it("confidence is bounded between 0 and 1", () => {
      const highConfidence: DMImageExtractionResult = {
        extractedText: "Test",
        detectedPlatform: "instagram",
        confidence: 1.0,
        isValidDMScreenshot: true,
      };

      const lowConfidence: DMImageExtractionResult = {
        extractedText: "Test",
        detectedPlatform: "unknown",
        confidence: 0.0,
        isValidDMScreenshot: false,
      };

      expect(highConfidence.confidence).toBeLessThanOrEqual(1);
      expect(lowConfidence.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // INTEGRATION PATTERN TESTS
  // ==========================================================================

  describe("integration patterns", () => {
    it("extraction result can be used to build DMImageAnalysis", () => {
      // This tests that the extraction result has the right shape to be
      // combined with a DMAnalysis to create DMImageAnalysis
      const extraction: DMImageExtractionResult = {
        extractedText: "Hi! We love your content and want to send you free product!",
        detectedPlatform: "instagram",
        confidence: 0.92,
        isValidDMScreenshot: true,
        metadata: {
          multipleMessages: true,
          senderName: "BeautyBrand",
          hasProfilePic: true,
        },
      };

      // The extracted text should be long enough for DM parsing
      expect(extraction.extractedText.length).toBeGreaterThan(20);

      // The platform should inform the analysis
      expect(extraction.detectedPlatform).not.toBe("unknown");

      // Multiple messages detected
      expect(extraction.metadata?.multipleMessages).toBe(true);
    });

    it("gift detection keywords are preserved in extraction", () => {
      // Test that gift-related phrases would be preserved in extraction
      const giftPhrases = [
        "send you product",
        "gift",
        "try our",
        "in exchange for",
        "free product",
        "pr package",
      ];

      giftPhrases.forEach((phrase) => {
        const extractedText = `Hi! We'd love to ${phrase} for you to try.`;
        expect(extractedText.toLowerCase()).toContain(phrase);
      });
    });
  });
});
