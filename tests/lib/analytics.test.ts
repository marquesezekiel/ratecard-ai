import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent, trackPageView, identifyUser } from "@/lib/analytics";

describe("analytics", () => {
  // Store original NODE_ENV and console.log
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
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
  });

  // ==========================================================================
  // PRODUCTION MODE TESTS
  // ==========================================================================

  describe("production mode", () => {
    it("does not log events in production (placeholder for real analytics)", () => {
      process.env.NODE_ENV = "production";

      trackEvent("quick_calculate_submit", { followerCount: 25000 });

      // In production, console.log should NOT be called
      // (real analytics service would be called instead)
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("does not log identify in production", () => {
      process.env.NODE_ENV = "production";

      identifyUser("user-123", { tier: "micro" });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
