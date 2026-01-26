'use client';

import { type ReactNode, useEffect } from 'react';
import { SWRProvider } from '@/lib/swr-config';
import { PostHogProvider } from './posthog-provider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper.
 * Includes all providers that need to be client components:
 * - SWRProvider: Data fetching and caching
 * - PostHogProvider: Analytics tracking (production only)
 *
 * Add additional providers here as needed (e.g., theme, auth).
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Initialize axe-core for accessibility testing in development
    import('@/lib/axe-dev').then(({ initAxe }) => initAxe());
  }, []);

  return (
    <PostHogProvider>
      <SWRProvider>
        {children}
      </SWRProvider>
    </PostHogProvider>
  );
}
