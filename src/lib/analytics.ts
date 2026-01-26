/**
 * Analytics Module
 *
 * Simple event tracking utility.
 * - Development: Console logs for debugging
 * - Production: PostHog analytics
 */

import { posthog } from './posthog';

type AnalyticsProperties = Record<string, unknown>;

/**
 * Known event names for type safety and discoverability.
 */
export type AnalyticsEvent =
  // CTA & Navigation
  | "cta_click"
  // Quick Calculator
  | "quick_calculate_submit"
  | "quick_calculate_result_view"
  | "quick_calculate_cta_click"
  // Auth Flow
  | "signup_start"
  | "signup_complete"
  | "signup_from_calculator"
  | "login_complete"
  // Onboarding
  | "onboarding_start"
  | "onboarding_complete"
  // Rate Card
  | "rate_card_generated"
  | "rate_card_downloaded"
  | "rate_saved"
  | "rate_deleted"
  | "brief_uploaded"
  // Message Analyzer
  | "dm_analyzed"
  // Gift System
  | "gift_evaluated"
  // Brand Vetter
  | "brand_vetted"
  // Contract Scanner
  | "contract_scanned"
  // Page Views (handled by provider, but kept for manual use)
  | "page_view";

/**
 * Track an analytics event.
 *
 * In development, logs to console.
 * In production, sends to PostHog.
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

  // Production: send to PostHog
  posthog.capture(event, properties);
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

  // Production: identify user in PostHog
  posthog.identify(userId, traits);
}

/**
 * Set user properties for segmentation.
 *
 * @param properties - User properties to set
 */
export function setUserProperties(properties: AnalyticsProperties): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Set User Properties:", properties);
    return;
  }

  // Production: set user properties in PostHog
  posthog.people.set(properties);
}

/**
 * Reset analytics (e.g., on logout).
 * Clears the identified user.
 */
export function resetAnalytics(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Reset");
    return;
  }

  // Production: reset PostHog identity
  posthog.reset();
}
