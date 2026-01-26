/**
 * INTENTIONALLY KEPT localStorage KEYS
 *
 * These are UI state only and don't need server sync.
 * All persistent user data should be stored in the database via API.
 *
 * localStorage keys:
 *
 * - swr-cache: SWR's cache persistence for offline support
 *   Used by src/lib/swr-config.tsx to persist API responses
 *   Automatically managed by SWR
 *
 * - profile-banner-dismissed: Timestamp when profile completion banner was dismissed
 *   Used by src/components/dashboard/profile-completion-banner.tsx
 *   UI preference, doesn't affect functionality
 *
 * - celebration-milestones: Object tracking which milestones user has seen
 *   Used by src/lib/celebrations.ts
 *   UI preference to avoid showing celebration animations multiple times
 *
 * - theme: User's theme preference (light/dark/system)
 *   Used by theme provider (if implemented)
 *   Standard UI preference
 *
 * - tour-completed: Whether user has completed the dashboard tour
 *   Used by onboarding tour components
 *   Can also be synced to DB for cross-device consistency
 *
 * DEPRECATED/REMOVED keys (no longer used):
 *
 * - creatorProfile: Migrated to /api/profile - use useProfile() hook
 * - savedRates: Migrated to /api/rate-cards - use useRateCards() hook
 * - giftDeals: Should be migrated to /api/gifts
 *
 * TEMPORARY/SESSION keys:
 *
 * - currentBrief: Stores the current brief being analyzed
 *   Temporary session data, cleared after rate card generation
 *   Stored in localStorage for persistence across page refreshes
 *
 * - giftAnalysis: Stores gift analysis from DM parser
 *   Stored in sessionStorage (not localStorage)
 *   Cleared after reading
 */

/**
 * UI state localStorage keys - these are safe to use and won't be migrated.
 */
export const UI_STATE_KEYS = {
  SWR_CACHE: 'swr-cache',
  PROFILE_BANNER_DISMISSED: 'profile-banner-dismissed',
  CELEBRATION_MILESTONES: 'celebration-milestones',
  THEME: 'theme',
  TOUR_COMPLETED: 'tour-completed',
} as const;

/**
 * Temporary session keys - these are cleared after use.
 */
export const SESSION_KEYS = {
  CURRENT_BRIEF: 'currentBrief',
} as const;

/**
 * Session storage keys (not localStorage).
 */
export const SESSION_STORAGE_KEYS = {
  GIFT_ANALYSIS: 'giftAnalysis',
} as const;

/**
 * DEPRECATED keys - these should NOT be used.
 * Data is now stored in the database via API.
 */
export const DEPRECATED_KEYS = {
  /** @deprecated Use useProfile() hook instead */
  CREATOR_PROFILE: 'creatorProfile',
  /** @deprecated Use useRateCards() hook instead */
  SAVED_RATES: 'savedRates',
  /** @deprecated Should be migrated to API */
  GIFT_DEALS: 'giftDeals',
} as const;

/**
 * Helper to clean up deprecated localStorage keys.
 * Call this during app initialization if needed.
 */
export function cleanupDeprecatedKeys(): void {
  Object.values(DEPRECATED_KEYS).forEach((key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  });
}
