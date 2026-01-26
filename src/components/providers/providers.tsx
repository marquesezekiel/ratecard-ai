'use client';

import type { ReactNode } from 'react';
import { SWRProvider } from '@/lib/swr-config';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper.
 * Includes all providers that need to be client components:
 * - SWRProvider: Data fetching and caching
 *
 * Add additional providers here as needed (e.g., theme, auth).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}
