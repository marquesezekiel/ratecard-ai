import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, _resetRateLimitStore } from "@/app/api/quick-calculate/route";

// Mock console.log for analytics
vi.spyOn(console, "log").mockImplementation(() => {});

// Helper to create NextRequest with JSON body
function createRequest(body: unknown, ip: string = "192.168.1.1"): NextRequest {
  const request = new NextRequest("http://localhost:3000/api/quick-calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
  return request;
}

describe("/api/quick-calculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limit store before each test
    _resetRateLimitStore();
  });

  // ==========================================================================
  // VALID REQUEST TESTS
  // ==========================================================================

  describe("valid requests", () => {
    it("returns valid QuickEstimateResult for valid input", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
        niche: "lifestyle",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();

      // Verify QuickEstimateResult structure
      expect(data.data).toHaveProperty("minRate");
      expect(data.data).toHaveProperty("maxRate");
      expect(data.data).toHaveProperty("baseRate");
      expect(data.data).toHaveProperty("tierName");
      expect(data.data).toHaveProperty("tier");
      expect(data.data).toHaveProperty("factors");
      expect(data.data).toHaveProperty("platform");
      expect(data.data).toHaveProperty("contentFormat");
      expect(data.data).toHaveProperty("niche");
      expect(data.data).toHaveProperty("percentile");
      expect(data.data).toHaveProperty("topPerformerRange");
      expect(data.data).toHaveProperty("potentialWithFullProfile");
      expect(data.data).toHaveProperty("missingFactors");
    });

    it("calculates correct rate for micro tier Instagram static post", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
        niche: "lifestyle",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.tier).toBe("micro");
      expect(data.data.tierName).toBe("Micro");
      expect(data.data.baseRate).toBe(400); // Micro base rate
      expect(data.data.minRate).toBe(320); // -20%
      expect(data.data.maxRate).toBe(480); // +20%
    });

    it("applies platform multiplier correctly", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "youtube",
        contentFormat: "static",
        niche: "lifestyle",
      });

      const response = await POST(request);
      const data = await response.json();

      // YouTube has 1.4x multiplier: $400 * 1.4 = $560
      expect(data.data.baseRate).toBe(560);
    });

    it("defaults niche to lifestyle when not provided", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
        // niche not provided
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.niche).toBe("lifestyle");
    });

    it("includes rate limit headers in response", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe("validation", () => {
    it("returns 400 for follower count below minimum (1,000)", async () => {
      const request = createRequest({
        followerCount: 500,
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("1,000");
    });

    it("returns 400 for follower count above maximum (10M)", async () => {
      const request = createRequest({
        followerCount: 15000000, // 15M
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("10,000,000");
      expect(data.error).toContain("custom consultation");
    });

    it("returns 400 for exactly 10M followers (boundary)", async () => {
      const request = createRequest({
        followerCount: 10000001, // Just over 10M
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      await response.json(); // Consume body

      expect(response.status).toBe(400);
    });

    it("accepts exactly 10M followers", async () => {
      const request = createRequest({
        followerCount: 10000000, // Exactly 10M
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("returns 400 for invalid platform", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "invalidplatform",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Invalid platform");
    });

    it("returns 400 for invalid content format", async () => {
      const request = createRequest({
        followerCount: 25000,
        platform: "instagram",
        contentFormat: "invalidformat",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Invalid content format");
    });

    it("returns 400 for missing follower count", async () => {
      const request = createRequest({
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("returns 400 for non-numeric follower count", async () => {
      const request = createRequest({
        followerCount: "not-a-number",
        platform: "instagram",
        contentFormat: "static",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // RATE LIMITING TESTS
  // ==========================================================================

  describe("rate limiting", () => {
    it("allows 10 requests within the rate limit window", async () => {
      const uniqueIp = `rate-limit-test-${Date.now()}`;

      // Make 10 requests (should all succeed)
      for (let i = 0; i < 10; i++) {
        const request = createRequest(
          {
            followerCount: 25000,
            platform: "instagram",
            contentFormat: "static",
          },
          uniqueIp
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it("returns 429 after exceeding rate limit (10+ requests)", async () => {
      const uniqueIp = `rate-limit-exceed-${Date.now()}`;

      // Make 10 requests to exhaust the limit
      for (let i = 0; i < 10; i++) {
        const request = createRequest(
          {
            followerCount: 25000,
            platform: "instagram",
            contentFormat: "static",
          },
          uniqueIp
        );
        await POST(request);
      }

      // 11th request should be rate limited
      const request = createRequest(
        {
          followerCount: 25000,
          platform: "instagram",
          contentFormat: "static",
        },
        uniqueIp
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Too many requests");
    });

    it("includes Retry-After header when rate limited", async () => {
      const uniqueIp = `retry-after-test-${Date.now()}`;

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        const request = createRequest(
          {
            followerCount: 25000,
            platform: "instagram",
            contentFormat: "static",
          },
          uniqueIp
        );
        await POST(request);
      }

      // Next request should have Retry-After header
      const request = createRequest(
        {
          followerCount: 25000,
          platform: "instagram",
          contentFormat: "static",
        },
        uniqueIp
      );

      const response = await POST(request);

      expect(response.headers.get("Retry-After")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("rate limits are per-IP", async () => {
      const ip1 = `per-ip-test-1-${Date.now()}`;
      const ip2 = `per-ip-test-2-${Date.now()}`;

      // Exhaust rate limit for IP1
      for (let i = 0; i < 10; i++) {
        const request = createRequest(
          {
            followerCount: 25000,
            platform: "instagram",
            contentFormat: "static",
          },
          ip1
        );
        await POST(request);
      }

      // IP2 should still work
      const request = createRequest(
        {
          followerCount: 25000,
          platform: "instagram",
          contentFormat: "static",
        },
        ip2
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // TIER CALCULATION TESTS
  // ==========================================================================

  describe("tier calculations", () => {
    const tierTests = [
      { followers: 5000, expectedTier: "nano", tierName: "Nano" },
      { followers: 25000, expectedTier: "micro", tierName: "Micro" },
      { followers: 75000, expectedTier: "mid", tierName: "Mid-Tier" },
      { followers: 175000, expectedTier: "rising", tierName: "Rising" },
      { followers: 375000, expectedTier: "macro", tierName: "Macro" },
      { followers: 750000, expectedTier: "mega", tierName: "Mega" },
      { followers: 2000000, expectedTier: "celebrity", tierName: "Celebrity" },
    ];

    tierTests.forEach(({ followers, expectedTier, tierName }) => {
      it(`assigns ${tierName} tier for ${followers.toLocaleString()} followers`, async () => {
        const request = createRequest({
          followerCount: followers,
          platform: "instagram",
          contentFormat: "static",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.data.tier).toBe(expectedTier);
        expect(data.data.tierName).toBe(tierName);
      });
    });
  });

  // ==========================================================================
  // PLATFORM TESTS
  // ==========================================================================

  describe("all platforms supported", () => {
    const platforms = [
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

    platforms.forEach((platform) => {
      it(`accepts ${platform} as valid platform`, async () => {
        const request = createRequest({
          followerCount: 25000,
          platform,
          contentFormat: "static",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.platform).toBe(platform);
      });
    });
  });

  // ==========================================================================
  // CONTENT FORMAT TESTS
  // ==========================================================================

  describe("all content formats supported", () => {
    const formats = ["static", "carousel", "story", "reel", "video", "live", "ugc"];

    formats.forEach((contentFormat) => {
      it(`accepts ${contentFormat} as valid content format`, async () => {
        const request = createRequest({
          followerCount: 25000,
          platform: "instagram",
          contentFormat,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.contentFormat).toBe(contentFormat);
      });
    });
  });
});
