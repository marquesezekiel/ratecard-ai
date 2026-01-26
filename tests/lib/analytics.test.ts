import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent, trackPageView, identifyUser, setUserProperties, resetAnalytics } from "@/lib/analytics";
import { posthog } from "@/lib/posthog";

// Mock the posthog module
vi.mock("@/lib/posthog", () => ({
  posthog: {
    capture: vi.fn(),
    identify: vi.fn(),
    people: {
      set: vi.fn(),
    },
    reset: vi.fn(),
  },
}));

describe("analytics", () => {
  // Store original NODE_ENV and console.log
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  // ==========================================================================
  // trackEvent TESTS
  // ==========================================================================

  describe("trackEvent", () => {
    it("logs events in development mode", () => {
      process.env.NODE_ENV = "development";

      trackEvent("quick_calculate_submit", {
        followerCount: 25000,
        platform: "instagram",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "quick_calculate_submit",
          properties: {
            followerCount: 25000,
            platform: "instagram",
          },
          timestamp: expect.any(String),
        })
      );
    });

    it("logs event without properties", () => {
      process.env.NODE_ENV = "development";

      trackEvent("quick_calculate_cta_click");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "quick_calculate_cta_click",
          properties: undefined,
          timestamp: expect.any(String),
        })
      );
    });

    it("logs quick_calculate_result_view event with rate data", () => {
      process.env.NODE_ENV = "development";

      trackEvent("quick_calculate_result_view", {
        minRate: 320,
        maxRate: 480,
        tier: "micro",
        platform: "instagram",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "quick_calculate_result_view",
          properties: {
            minRate: 320,
            maxRate: 480,
            tier: "micro",
            platform: "instagram",
          },
        })
      );
    });

    it("includes timestamp in ISO format", () => {
      process.env.NODE_ENV = "development";

      trackEvent("signup_from_calculator");

      const logCall = consoleLogSpy.mock.calls[0];
      const logData = logCall[1] as { timestamp: string };

      // Verify timestamp is a valid ISO date string
      expect(() => new Date(logData.timestamp)).not.toThrow();
      expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("accepts string events beyond typed events", () => {
      process.env.NODE_ENV = "development";

      trackEvent("custom_event_name", { customProp: "value" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "custom_event_name",
        })
      );
    });

    it("calls posthog.capture in production mode", () => {
      process.env.NODE_ENV = "production";

      trackEvent("rate_card_generated", {
        platform: "instagram",
        format: "reel",
        rate: 500,
      });

      expect(posthog.capture).toHaveBeenCalledWith("rate_card_generated", {
        platform: "instagram",
        format: "reel",
        rate: 500,
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // trackPageView TESTS
  // ==========================================================================

  describe("trackPageView", () => {
    it("tracks page view with page path", () => {
      process.env.NODE_ENV = "development";

      trackPageView("/quick-calculate");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "page_view",
          properties: expect.objectContaining({
            page: "/quick-calculate",
          }),
        })
      );
    });

    it("includes additional properties in page view", () => {
      process.env.NODE_ENV = "development";

      trackPageView("/dashboard/profile", { referrer: "/sign-in" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Analytics]",
        expect.objectContaining({
          event: "page_view",
          properties: expect.objectContaining({
            page: "/dashboard/profile",
            referrer: "/sign-in",
          }),
        })
      );
    });
  });

  // ==========================================================================
  // identifyUser TESTS
  // ==========================================================================

  describe("identifyUser", () => {
    it("logs user identification in development", () => {
      process.env.NODE_ENV = "development";

      identifyUser("user-123", { tier: "micro", platform: "instagram" });

      expect(consoleLogSpy).toHaveBeenCalledWith("[Analytics] Identify:", {
        userId: "user-123",
        traits: { tier: "micro", platform: "instagram" },
      });
    });

    it("identifies user without traits", () => {
      process.env.NODE_ENV = "development";

      identifyUser("user-456");

      expect(consoleLogSpy).toHaveBeenCalledWith("[Analytics] Identify:", {
        userId: "user-456",
        traits: undefined,
      });
    });

    it("calls posthog.identify in production mode", () => {
      process.env.NODE_ENV = "production";

      identifyUser("user-789", { tier: "micro", email: "test@example.com" });

      expect(posthog.identify).toHaveBeenCalledWith("user-789", {
        tier: "micro",
        email: "test@example.com",
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // setUserProperties TESTS
  // ==========================================================================

  describe("setUserProperties", () => {
    it("logs user properties in development", () => {
      process.env.NODE_ENV = "development";

      setUserProperties({
        tier: "micro",
        primaryPlatform: "instagram",
        totalFollowers: 15000,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith("[Analytics] Set User Properties:", {
        tier: "micro",
        primaryPlatform: "instagram",
        totalFollowers: 15000,
      });
    });

    it("calls posthog.people.set in production mode", () => {
      process.env.NODE_ENV = "production";

      setUserProperties({
        tier: "nano",
        primaryPlatform: "tiktok",
        totalFollowers: 8000,
        profileCompleteness: 80,
      });

      expect(posthog.people.set).toHaveBeenCalledWith({
        tier: "nano",
        primaryPlatform: "tiktok",
        totalFollowers: 8000,
        profileCompleteness: 80,
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // resetAnalytics TESTS
  // ==========================================================================

  describe("resetAnalytics", () => {
    it("logs reset in development", () => {
      process.env.NODE_ENV = "development";

      resetAnalytics();

      expect(consoleLogSpy).toHaveBeenCalledWith("[Analytics] Reset");
    });

    it("calls posthog.reset in production mode", () => {
      process.env.NODE_ENV = "production";

      resetAnalytics();

      expect(posthog.reset).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PRODUCTION MODE TESTS (additional)
  // ==========================================================================

  describe("production mode", () => {
    it("does not log events in production", () => {
      process.env.NODE_ENV = "production";

      trackEvent("quick_calculate_submit", { followerCount: 25000 });

      // In production, console.log should NOT be called
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("does not log identify in production", () => {
      process.env.NODE_ENV = "production";

      identifyUser("user-123", { tier: "micro" });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
