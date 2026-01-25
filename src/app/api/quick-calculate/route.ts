import { NextRequest, NextResponse } from "next/server";
import { calculateQuickEstimate } from "@/lib/quick-calculator";
import { trackEvent } from "@/lib/analytics";
import type {
  ApiResponse,
  QuickCalculatorInput,
  QuickEstimateResult,
  Platform,
  ContentFormat,
} from "@/lib/types";

// =============================================================================
// RATE LIMITING (In-Memory Store)
// =============================================================================

/**
 * Simple in-memory rate limiter.
 * Upgrade to Redis for production scale.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

/**
 * Reset rate limit store. Used for testing.
 * @internal
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}

function getRateLimitKey(request: NextRequest): string {
  // Get IP from headers (works with Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ratelimit:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetIn: entry.resetTime - now };
}

// =============================================================================
// VALIDATION
// =============================================================================

const MAX_FOLLOWER_COUNT = 10_000_000; // 10M
const MIN_FOLLOWER_COUNT = 1_000; // 1K

const VALID_PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "youtube_shorts",
  "twitter",
  "threads",
  "pinterest",
  "linkedin",
  "snapchat",
  "twitch",
  "bluesky",
  "lemon8",
];

const VALID_FORMATS: ContentFormat[] = [
  "static",
  "carousel",
  "story",
  "reel",
  "video",
  "live",
  "ugc",
];

interface ValidationError {
  field: string;
  message: string;
}

function validateInput(input: unknown): { valid: true; data: QuickCalculatorInput } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const data = input as Record<string, unknown>;

  // Check follower count
  const followerCount = data?.followerCount;
  if (typeof followerCount !== "number" || !Number.isFinite(followerCount)) {
    errors.push({ field: "followerCount", message: "Follower count must be a number" });
  } else if (followerCount < MIN_FOLLOWER_COUNT) {
    errors.push({ field: "followerCount", message: `Minimum follower count is ${MIN_FOLLOWER_COUNT.toLocaleString()}` });
  } else if (followerCount > MAX_FOLLOWER_COUNT) {
    errors.push({ field: "followerCount", message: `For creators with ${MAX_FOLLOWER_COUNT.toLocaleString()}+ followers, we recommend a custom consultation` });
  }

  // Check platform
  const platform = data?.platform;
  if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
    errors.push({ field: "platform", message: "Invalid platform" });
  }

  // Check content format
  const contentFormat = data?.contentFormat;
  if (!contentFormat || !VALID_FORMATS.includes(contentFormat as ContentFormat)) {
    errors.push({ field: "contentFormat", message: "Invalid content format" });
  }

  // Niche is optional, defaults to "lifestyle"
  const niche = typeof data?.niche === "string" ? data.niche : "lifestyle";

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      followerCount: followerCount as number,
      platform: platform as Platform,
      contentFormat: contentFormat as ContentFormat,
      niche,
    },
  };
}

// =============================================================================
// API ROUTE
// =============================================================================

/**
 * POST /api/quick-calculate
 *
 * Public endpoint for quick rate estimation.
 * No authentication required.
 *
 * Rate limited: 10 requests per minute per IP.
 *
 * Accepts: { followerCount, platform, contentFormat, niche? }
 * Returns: ApiResponse<QuickEstimateResult>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<QuickEstimateResult>>> {
  // Check rate limit
  const rateLimitKey = getRateLimitKey(request);
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    trackEvent("quick_calculate_rate_limited", {
      ip: rateLimitKey,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(rateLimit.resetIn / 1000).toString(),
          "Retry-After": Math.ceil(rateLimit.resetIn / 1000).toString(),
        },
      }
    );
  }

  try {
    // Parse JSON body
    const body = await request.json();

    // Validate input
    const validation = validateInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.map((e) => e.message).join(". "),
        },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    const input = validation.data;

    // Track analytics
    trackEvent("quick_calculate_submit", {
      followerCount: input.followerCount,
      platform: input.platform,
      contentFormat: input.contentFormat,
      niche: input.niche,
    });

    // Calculate estimate
    const result = calculateQuickEstimate(input);

    // Track result view
    trackEvent("quick_calculate_result_view", {
      minRate: result.minRate,
      maxRate: result.maxRate,
      tier: result.tier,
      platform: result.platform,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Quick calculate error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
