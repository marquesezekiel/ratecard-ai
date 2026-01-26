'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

/**
 * localStorage-backed cache provider for SWR.
 * Persists the SWR cache to localStorage for offline support.
 * This allows the app to show cached data immediately while fetching fresh data.
 */
function localStorageProvider() {
  // Server-side: return empty Map
  if (typeof window === 'undefined') {
    return new Map();
  }

  // Initialize the Map with data from localStorage
  const cacheKey = 'swr-cache';
  let map: Map<string, unknown>;

  try {
    const stored = localStorage.getItem(cacheKey);
    map = new Map(stored ? JSON.parse(stored) : []);
  } catch {
    // If parsing fails, start fresh
    map = new Map();
  }

  // Save cache to localStorage before page unload
  const saveCache = () => {
    try {
      const appCache = JSON.stringify(Array.from(map.entries()));
      localStorage.setItem(cacheKey, appCache);
    } catch (error) {
      // Ignore quota exceeded errors
      console.warn('Failed to save SWR cache:', error);
    }
  };

  window.addEventListener('beforeunload', saveCache);

  // Also save periodically to handle cases where beforeunload doesn't fire
  const intervalId = setInterval(saveCache, 30000); // Every 30 seconds

  // Clean up interval on page hide (mobile browsers)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveCache();
    }
  });

  // Return cleanup function when the provider is unmounted
  // Note: SWR doesn't call cleanup, so we rely on beforeunload/visibilitychange
  return {
    get: (key: string) => map.get(key),
    set: (key: string, value: unknown) => {
      map.set(key, value);
    },
    delete: (key: string) => {
      map.delete(key);
    },
    keys: () => map.keys(),
    // Cleanup function (for potential future SWR versions that support it)
    _cleanup: () => {
      window.removeEventListener('beforeunload', saveCache);
      clearInterval(intervalId);
    },
  };
}

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * SWR Provider with localStorage cache persistence.
 * Wrap your app with this provider to enable:
 * - Automatic cache persistence to localStorage
 * - Offline support (shows cached data when offline)
 * - Faster initial loads (hydrates from cache)
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        // Default options for all SWR hooks
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
      }}
    >
      {children}
    </SWRConfig>
  );
}
