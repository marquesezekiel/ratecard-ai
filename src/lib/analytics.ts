/**
 * Analytics Module
 *
 * Simple event tracking utility. Console logs in development,
 * ready for integration with real analytics service in production.
 */

type AnalyticsProperties = Record<string, unknown>;

/**
 * Known event names for type safety and discoverability.
 */
export type AnalyticsEvent =
  | "quick_calculate_submit"
  | "quick_calculate_result_view"
  | "quick_calculate_cta_click"
  | "signup_from_calculator"
  | "rate_card_generated"
  | "rate_saved"
  | "rate_deleted"
  | "brief_uploaded"
  | "dm_analyzed"
  | "gift_evaluated";

/**
 * Track an analytics event.
 *
 * In development, logs to console.
 * In production, sends to analytics service (TODO).
 *
 * @param event - The event name
 * @param properties - Optional properties for the event
 */
export function trackEvent(
  event: AnalyticsEvent | string,
  properties?: AnalyticsProperties
): void {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", {
      event,
      properties,
      timestamp,
    });
    return;
  }

  // TODO: Add real analytics service integration
  // Examples: PostHog, Mixpanel, Amplitude, etc.
  // posthog.capture(event, properties);
}

/**
 * Track a page view.
 *
 * @param page - The page path
 * @param properties - Optional additional properties
 */
export function trackPageView(
  page: string,
  properties?: AnalyticsProperties
): void {
  trackEvent("page_view", { page, ...properties });
}

/**
 * Identify a user for analytics.
 *
 * @param userId - The user's unique ID
 * @param traits - Optional user traits (tier, platform, etc.)
 */
export function identifyUser(
  userId: string,
  traits?: AnalyticsProperties
): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Identify:", { userId, traits });
    return;
  }

  // TODO: Add real analytics service integration
  // posthog.identify(userId, traits);
}
