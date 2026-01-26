'use client';

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthog } from '@/lib/posthog';
import { useSession } from '@/lib/auth-client';

/**
 * Tracks page views on route changes.
 * Must be wrapped in Suspense due to useSearchParams.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && process.env.NODE_ENV === 'production') {
      // Construct URL for tracking
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += '?' + searchParams.toString();
      }
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Identifies logged-in users with PostHog.
 */
function PostHogIdentify() {
  const { data: session } = useSession();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const userId = session?.user?.id;

    // Only identify if we have a user and haven't identified this user yet
    if (userId && identifiedRef.current !== userId) {
      posthog.identify(userId, {
        email: session?.user?.email,
        name: session?.user?.name,
      });
      identifiedRef.current = userId;
    }

    // Reset if user logs out
    if (!userId && identifiedRef.current) {
      posthog.reset();
      identifiedRef.current = null;
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return null;
}

interface PostHogProviderProps {
  children: React.ReactNode;
}

/**
 * PostHog Analytics Provider.
 *
 * Initializes PostHog, tracks page views on navigation, and identifies users.
 * Only active in production environment.
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify />
      {children}
    </>
  );
}
