'use client';

import { SWRConfig, type Cache, type State } from 'swr';
import type { ReactNode } from 'react';

/**
 * localStorage-backed cache provider for SWR.
 * Persists the SWR cache to localStorage for offline support.
 * This allows the app to show cached data immediately while fetching fresh data.
 */
function localStorageProvider(): Cache {
  // Server-side: return empty Map
  if (typeof window === 'undefined') {
    return new Map() as Cache;
  }

  // Initialize the Map with data from localStorage
  const cacheKey = 'swr-cache';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: Map<string, State<any, any>>;

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

  // Return cache object
  return {
    get: (key: string) => map.get(key),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (key: string, value: State<any, any>) => {
      map.set(key, value);
    },
    delete: (key: string) => {
      map.delete(key);
      // Clean up interval when cache is deleted
      if (map.size === 0) {
        window.removeEventListener('beforeunload', saveCache);
        clearInterval(intervalId);
      }
    },
    keys: () => map.keys(),
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
