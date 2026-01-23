import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  vetBrand,
  createCacheKey,
  isValidVettingInput,
  type BrandVettingInput,
  type BrandVettingResult,
} from "@/lib/brand-vetter";
import type { ApiResponse } from "@/lib/types";

// =============================================================================
// SIMPLE IN-MEMORY CACHE
// =============================================================================

interface CacheEntry {
  result: BrandVettingResult;
  expiresAt: number;
}

// In-memory cache for same-day brand vetting
// In production, consider using Redis or similar for persistence across instances
const brandCache = new Map<string, CacheEntry>();

// Cache entries expire at midnight (same-day caching)
function getCacheExpirationTime(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * Get cached result if available and not expired.
 */
function getCachedResult(key: string): BrandVettingResult | null {
  const entry = brandCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    brandCache.delete(key);
    return null;
  }

  return { ...entry.result, cached: true };
}

/**
 * Cache a vetting result.
 */
function cacheResult(key: string, result: BrandVettingResult): void {
  brandCache.set(key, {
    result,
    expiresAt: getCacheExpirationTime(),
  });

  // Clean up old entries periodically (keep cache size reasonable)
  if (brandCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of brandCache.entries()) {
      if (v.expiresAt < now) {
        brandCache.delete(k);
      }
    }
  }
}

// =============================================================================
// API ROUTE
// =============================================================================

/**
 * POST /api/vet-brand
 *
 * Vet a brand for legitimacy and trustworthiness.
 *
 * Request body:
 * {
 *   brandName: string (required),
 *   brandHandle?: string,
 *   brandWebsite?: string,
 *   brandEmail?: string,
 *   platform: Platform (required)
 * }
 *
 * Returns: ApiResponse<BrandVettingResult>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BrandVettingResult>>> {
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

    // Parse request body
    const body = await request.json();

    // Validate input
    if (!isValidVettingInput(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input. Brand name and platform are required.",
        },
        { status: 400 }
      );
    }

    const input: BrandVettingInput = {
      brandName: body.brandName.trim(),
      brandHandle: body.brandHandle?.trim() || undefined,
      brandWebsite: body.brandWebsite?.trim() || undefined,
      brandEmail: body.brandEmail?.trim() || undefined,
      platform: body.platform,
    };

    // Check cache
    const cacheKey = createCacheKey(input);
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
      });
    }

    // Vet the brand
    const result = await vetBrand(input);

    // Cache the result
    cacheResult(cacheKey, result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Brand vetting error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while vetting the brand.";

    // Return 400 for known validation errors
    if (
      errorMessage.includes("must be at least") ||
      errorMessage.includes("required")
    ) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to vet brand. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vet-brand
 *
 * Returns information about the brand vetting API.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      description: "Brand vetting API - assess brand legitimacy for creator partnerships",
      endpoint: "/api/vet-brand",
      method: "POST",
      authentication: "Required",
      requestBody: {
        brandName: "string (required) - Brand or company name",
        brandHandle: "string (optional) - Social media handle, e.g., @glowskinco",
        brandWebsite: "string (optional) - Brand website URL",
        brandEmail: "string (optional) - Brand contact email",
        platform: "Platform (required) - Where the brand reached out",
      },
      response: {
        trustScore: "number (0-100) - Overall trust score",
        trustLevel: "verified | likely_legit | caution | high_risk",
        breakdown: {
          socialPresence: "CategoryScore (0-25 pts)",
          websiteVerification: "CategoryScore (0-25 pts)",
          collaborationHistory: "CategoryScore (0-25 pts)",
          scamIndicators: "CategoryScore (0-25 pts, inverse scoring)",
        },
        findings: "Array of brand findings",
        redFlags: "Array of red flags detected",
        recommendations: "Array of actionable advice",
        checkedAt: "Date of vetting",
        cached: "boolean - Whether result was from cache",
      },
      trustLevels: {
        verified: "80-100 - Safe to proceed",
        likely_legit: "60-79 - Probably fine, do basic due diligence",
        caution: "40-59 - Proceed carefully, ask questions",
        high_risk: "0-39 - Likely scam, consider avoiding",
      },
      caching: "Results are cached for the same brand name on the same day",
    },
  });
}
