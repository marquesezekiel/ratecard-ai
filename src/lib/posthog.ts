/**
 * PostHog Analytics Configuration
 *
 * Initializes PostHog for production analytics tracking.
 * Only runs in production environment and in the browser.
 */

import posthog from 'posthog-js';

let initialized = false;

/**
 * Initialize PostHog analytics.
 * Only initializes once and only in production browser environment.
 */
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (initialized) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // We'll capture page views manually for SPA navigation
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    loaded: () => {
      initialized = true;
    },
  });
}

export { posthog };
