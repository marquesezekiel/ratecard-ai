# IMPLEMENTATION_PLAN_V6a: Data Infrastructure & Analytics

## Overview

This plan addresses three partially-implemented features that represent technical debt:

| Issue | Current State | Risk if Unaddressed |
|-------|---------------|---------------------|
| localStorage Migration | Partial - fallback still used | Data loss, sync issues, no cross-device support |
| Production Analytics | Stub only - console logs | No user insights, can't optimize conversion |
| Internal Analytics Dashboard | Backend done, no UI | Unused database tables, no market intelligence |

**Philosophy:** These are infrastructure investments that enable data-driven decisions. They're not user-facing features but are critical for product growth.

---

## Issue 1: Complete localStorage to Server Migration

### Current State

localStorage is used in **17 files** as either primary storage or fallback:

| File | Usage | Risk Level |
|------|-------|------------|
| `dashboard/profile/page.tsx` | Fallback after API | Low ✅ |
| `dashboard/page.tsx` | Primary read | **High** |
| `dashboard/analyze/page.tsx` | Primary read | **High** |
| `dashboard/generate/page.tsx` | Primary read | **High** |
| `dashboard/gifts/page.tsx` | Primary read/write | **High** |
| `onboarding/page.tsx` | Write after save | Medium |
| `sign-up/page.tsx` | Clear on signup | Low ✅ |
| `components/forms/profile-form.tsx` | Save on change | **High** |
| `components/rate-card/saved-rates.tsx` | Primary storage | **High** |
| `components/dashboard/profile-completion-banner.tsx` | Dismiss state | Low (OK for UI state) |
| `lib/celebrations.ts` | Milestone tracking | Low (OK for UI state) |

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
├─────────────────────────────────────────────────────────────┤
│  React Query / SWR Cache                                    │
│  ├── Automatic background refetch                           │
│  ├── Optimistic updates                                     │
│  └── Offline support via cache                              │
├─────────────────────────────────────────────────────────────┤
│  localStorage (UI State Only)                               │
│  ├── Banner dismiss timestamps                              │
│  ├── Celebration milestones seen                            │
│  ├── UI preferences (theme, collapsed sections)             │
│  └── Tour completion status (also in DB for cross-device)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  /api/profile          - CreatorProfile CRUD                │
│  /api/rate-cards       - SavedRateCard CRUD (NEW)           │
│  /api/gifts            - GiftDeal CRUD (exists)             │
│  /api/outcomes         - Outcome CRUD (exists)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Prisma)                        │
├─────────────────────────────────────────────────────────────┤
│  CreatorProfile    - User profile data                      │
│  SavedRateCard     - Generated rate cards (NEW MODEL)       │
│  GiftDeal          - Gift tracking                          │
│  Outcome           - Deal outcomes                          │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1.1: Add React Query / SWR for Data Fetching
**Estimated:** 2 hours

Choose SWR (simpler, Vercel-maintained) or React Query (more features).

```bash
pnpm add swr
```

Create data fetching hooks:

```typescript
// src/hooks/use-profile.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    profile: data?.data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
```

#### Step 1.2: Create SavedRateCard Database Model
**Estimated:** 1 hour

```prisma
// Add to prisma/schema.prisma
model SavedRateCard {
  id              String    @id @default(cuid())
  creatorId       String
  creator         User      @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  // Rate card data
  name            String    @default("Untitled Rate Card")
  platform        String
  contentFormat   String
  baseRate        Float
  finalRate       Float
  adjustments     Json      // Array of PricingAdjustment
  dealQuality     Json?     // DealQualityResult

  // Brief data (if from brief upload)
  briefId         String?
  brandName       String?
  campaignName    String?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastAccessedAt  DateTime  @default(now())

  @@index([creatorId])
  @@index([creatorId, createdAt])
}
```

#### Step 1.3: Create Rate Cards API Routes
**Estimated:** 2 hours

```typescript
// src/app/api/rate-cards/route.ts
// GET - List all rate cards for user
// POST - Create new rate card

// src/app/api/rate-cards/[id]/route.ts
// GET - Get single rate card
// PUT - Update rate card
// DELETE - Delete rate card
```

#### Step 1.4: Migrate Components to Use Server Data
**Estimated:** 4 hours

Priority order:

1. **`saved-rates.tsx`** - Currently 100% localStorage
   - Replace with `useRateCards()` hook
   - Add optimistic updates for delete

2. **`dashboard/page.tsx`** - Reads profile from localStorage
   - Replace with `useProfile()` hook
   - Remove localStorage read

3. **`dashboard/analyze/page.tsx`** - Reads profile for rate preview
   - Replace with `useProfile()` hook

4. **`dashboard/generate/page.tsx`** - Reads profile for PDF generation
   - Replace with `useProfile()` hook

5. **`profile-form.tsx`** - Saves to localStorage on every change
   - Keep local state for form
   - Save to API on blur/submit only
   - Remove localStorage writes

6. **`gifts/page.tsx`** - Already has API, but may have localStorage remnants
   - Audit and remove any localStorage usage

#### Step 1.5: Add Offline Support
**Estimated:** 2 hours

Use SWR's built-in cache persistence:

```typescript
// src/lib/swr-config.tsx
import { SWRConfig } from 'swr';

function localStorageProvider() {
  const map = new Map(JSON.parse(localStorage.getItem('swr-cache') || '[]'));

  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem('swr-cache', appCache);
  });

  return map;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      {children}
    </SWRConfig>
  );
}
```

#### Step 1.6: Cleanup & Documentation
**Estimated:** 1 hour

- Remove all non-UI-state localStorage usage
- Document which localStorage keys are intentionally kept
- Add migration script for existing users (one-time sync)

### Acceptance Criteria

- [ ] All profile data fetched from API
- [ ] All rate cards stored in database
- [ ] localStorage only used for UI state (banner dismiss, theme, etc.)
- [ ] Data syncs across devices when logged in
- [ ] Offline graceful degradation (shows cached data)
- [ ] No data loss for existing users

---

## Issue 2: Production Analytics Integration

### Current State

`src/lib/analytics.ts` is a stub that:
- Defines typed event names
- Console logs in development
- Has TODO comments for production integration

### Analytics Service Selection

**Recommended: PostHog** (self-hostable, generous free tier, product analytics focused)

| Service | Free Tier | Self-Host | Best For |
|---------|-----------|-----------|----------|
| **PostHog** | 1M events/mo | Yes | Product analytics, feature flags |
| Mixpanel | 100K users/mo | No | User behavior, funnels |
| Amplitude | 10M events/mo | No | Product intelligence |
| Plausible | Paid only | Yes | Privacy-focused, simple |

PostHog advantages:
- EU hosting available (GDPR)
- Session recordings (useful for UX research)
- Feature flags (future A/B testing)
- Self-hostable if needed

### Implementation Steps

#### Step 2.1: Set Up PostHog
**Estimated:** 1 hour

```bash
pnpm add posthog-js
```

```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // We'll do this manually for SPA
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  });
}

export { posthog };
```

#### Step 2.2: Create PostHog Provider
**Estimated:** 0.5 hours

```typescript
// src/components/providers/posthog-provider.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/hooks/use-auth';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Track page views
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  // Identify user
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    }
  }, [user]);

  return <>{children}</>;
}
```

#### Step 2.3: Update analytics.ts for Production
**Estimated:** 1 hour

```typescript
// src/lib/analytics.ts
import { posthog } from './posthog';

export type AnalyticsEvent =
  // Acquisition
  | 'landing_page_view'
  | 'cta_click'
  | 'signup_start'
  | 'signup_complete'
  | 'onboarding_start'
  | 'onboarding_complete'

  // Activation
  | 'quick_calculate_submit'
  | 'quick_calculate_result_view'
  | 'first_rate_card_generated'
  | 'first_dm_analyzed'

  // Engagement
  | 'rate_card_generated'
  | 'rate_card_downloaded'
  | 'dm_analyzed'
  | 'gift_evaluated'
  | 'brand_vetted'
  | 'contract_scanned'

  // Retention
  | 'return_visit'
  | 'profile_updated'
  | 'rate_saved'

  // Revenue (future)
  | 'premium_cta_click'
  | 'subscription_start';

export function trackEvent(
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', { event, properties, timestamp });
    return;
  }

  posthog.capture(event, {
    ...properties,
    timestamp,
  });
}

export function trackPageView(page: string, properties?: Record<string, unknown>): void {
  // PostHog handles this via provider, but keep for explicit calls
  posthog.capture('$pageview', { $current_url: page, ...properties });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Identify:', { userId, traits });
    return;
  }

  posthog.identify(userId, traits);
}

export function setUserProperties(properties: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Set Properties:', properties);
    return;
  }

  posthog.people.set(properties);
}
```

#### Step 2.4: Add Event Tracking Throughout App
**Estimated:** 3 hours

Key events to track:

**Acquisition Funnel:**
```typescript
// Homepage CTA click
trackEvent('cta_click', { location: 'hero', destination: '/quick-calculate' });

// Sign up flow
trackEvent('signup_start');
trackEvent('signup_complete', { source: 'quick_calculator' });

// Onboarding
trackEvent('onboarding_start');
trackEvent('onboarding_complete', { platform: 'instagram', followers: 15000 });
```

**Core Feature Usage:**
```typescript
// Rate calculator
trackEvent('quick_calculate_submit', {
  platform: 'tiktok',
  followers: 12000,
  format: 'reel',
});
trackEvent('quick_calculate_result_view', {
  minRate: 400,
  maxRate: 600,
  tier: 'micro',
});

// Rate card generation
trackEvent('rate_card_generated', {
  platform: 'instagram',
  format: 'reel',
  rate: 450,
  dealQuality: 85,
});
trackEvent('rate_card_downloaded');

// DM Analysis
trackEvent('dm_analyzed', {
  source: 'instagram_dm',
  compensationType: 'paid',
  hasGiftOffer: false,
});
```

**User Properties to Set:**
```typescript
setUserProperties({
  tier: 'micro',
  primaryPlatform: 'instagram',
  totalFollowers: 15000,
  profileCompleteness: 85,
  rateCardsGenerated: 5,
  dmsAnalyzed: 12,
});
```

#### Step 2.5: Create Analytics Dashboard in PostHog
**Estimated:** 2 hours (in PostHog UI)

Create dashboards for:

1. **Acquisition Dashboard**
   - Signup funnel (landing → calculator → signup → onboarding)
   - Conversion rates by source
   - Time to first value

2. **Engagement Dashboard**
   - Daily/weekly active users
   - Feature usage breakdown
   - Rate cards generated per user

3. **Retention Dashboard**
   - Return visit rate
   - Feature stickiness
   - Cohort analysis

### Acceptance Criteria

- [ ] PostHog integrated and tracking in production
- [ ] All key events tracked (see list above)
- [ ] User identification working
- [ ] Page views tracked automatically
- [ ] Dashboard created in PostHog
- [ ] Development still uses console.log

---

## Issue 3: Internal Analytics Dashboard

### Current State

The backend is fully implemented:
- `Outcome` database model exists with full schema
- `src/lib/outcome-analytics.ts` has comprehensive analytics functions
- API routes exist at `/api/outcomes/*`

**What's Missing:** UI to visualize this data.

### Dashboard Requirements

**Purpose:** Internal tool for us to understand:
1. What rates are being accepted?
2. How often do creators negotiate?
3. Gift-to-paid conversion rates
4. Market benchmarks by platform/niche

**NOT a user-facing feature** - This is for internal product decisions.

### Implementation Steps

#### Step 3.1: Create Admin/Internal Route Structure
**Estimated:** 1 hour

```
src/app/(internal)/
├── layout.tsx          # Admin layout with auth check
├── analytics/
│   ├── page.tsx        # Main analytics dashboard
│   ├── outcomes/
│   │   └── page.tsx    # Detailed outcomes view
│   └── benchmarks/
│       └── page.tsx    # Market benchmarks
```

```typescript
// src/app/(internal)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const ADMIN_EMAILS = ['your-email@example.com']; // Configure in env

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <h1 className="text-lg font-semibold">RateCard.AI Internal</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

#### Step 3.2: Add Charting Library
**Estimated:** 0.5 hours

```bash
pnpm add recharts
```

Recharts is React-native, lightweight, and composable.

#### Step 3.3: Create Analytics API Routes
**Estimated:** 2 hours

```typescript
// src/app/api/internal/analytics/route.ts
// GET - Aggregate analytics across all users

// src/app/api/internal/analytics/outcomes/route.ts
// GET - Detailed outcome data with filters

// src/app/api/internal/analytics/benchmarks/route.ts
// GET - Market benchmark data
```

#### Step 3.4: Build Analytics Dashboard UI
**Estimated:** 6 hours

**Main Dashboard (`/analytics`):**

```typescript
// Key metrics cards
- Total Outcomes Tracked
- Overall Acceptance Rate
- Avg Negotiation Delta
- Gift Conversion Rate

// Charts
- Outcomes by Status (pie chart)
- Acceptance Rate Over Time (line chart)
- Rate Distribution by Platform (bar chart)
- Gift Conversion Funnel (funnel chart)
```

**Outcomes Detail (`/analytics/outcomes`):**

```typescript
// Filters
- Date range
- Platform
- Niche
- Outcome status
- Proposed type (paid/gift)

// Table
- Sortable columns
- Pagination
- Export to CSV
```

**Benchmarks (`/analytics/benchmarks`):**

```typescript
// Segment selector
- Platform dropdown
- Niche dropdown
- Tier dropdown

// Benchmark cards
- Avg Rate for Segment
- Acceptance Rate
- Negotiation Success Rate
- Sample Size
```

#### Step 3.5: Sample Dashboard Component

```typescript
// src/app/(internal)/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';

interface AnalyticsData {
  totalOutcomes: number;
  acceptanceRate: number;
  avgNegotiationDelta: number;
  giftConversionRate: number;
  byStatus: Record<string, number>;
  byPlatform: Array<{ platform: string; count: number; avgRate: number }>;
  overTime: Array<{ date: string; accepted: number; rejected: number }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/internal/analytics')
      .then(res => res.json())
      .then(result => {
        setData(result.data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  const statusData = Object.entries(data.byStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#6b7280'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalOutcomes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(data.acceptanceRate * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg Negotiation Δ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.avgNegotiationDelta > 0 ? '+' : ''}
              {Math.round(data.avgNegotiationDelta)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Gift Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(data.giftConversionRate * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Outcomes by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Outcomes by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rates by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Average Rate by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byPlatform}>
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Acceptance Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Acceptance Rate Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.overTime}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accepted"
                stroke="#10b981"
                name="Accepted"
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke="#ef4444"
                name="Rejected"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Step 3.6: Create Internal Analytics API

```typescript
// src/app/api/internal/analytics/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',');

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Aggregate all outcomes
  const outcomes = await db.outcome.findMany();

  const totalOutcomes = outcomes.length;

  // Calculate acceptance rate
  const closed = outcomes.filter(o => o.outcome !== 'pending');
  const accepted = closed.filter(o =>
    ['accepted', 'negotiated', 'gift_accepted', 'gift_converted'].includes(o.outcome)
  );
  const acceptanceRate = closed.length > 0 ? accepted.length / closed.length : 0;

  // Calculate negotiation delta
  const negotiated = outcomes.filter(o =>
    o.outcome === 'negotiated' && o.negotiationDelta !== null
  );
  const avgNegotiationDelta = negotiated.length > 0
    ? negotiated.reduce((sum, o) => sum + (o.negotiationDelta || 0), 0) / negotiated.length
    : 0;

  // Calculate gift conversion
  const gifts = outcomes.filter(o => o.proposedType === 'gift');
  const converted = gifts.filter(o => o.outcome === 'gift_converted');
  const giftConversionRate = gifts.length > 0 ? converted.length / gifts.length : 0;

  // Group by status
  const byStatus: Record<string, number> = {};
  outcomes.forEach(o => {
    byStatus[o.outcome] = (byStatus[o.outcome] || 0) + 1;
  });

  // Group by platform
  const platformMap = new Map<string, { count: number; totalRate: number }>();
  outcomes.forEach(o => {
    const current = platformMap.get(o.platform) || { count: 0, totalRate: 0 };
    platformMap.set(o.platform, {
      count: current.count + 1,
      totalRate: current.totalRate + (o.finalRate || o.proposedRate || 0),
    });
  });
  const byPlatform = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform,
    count: data.count,
    avgRate: data.count > 0 ? Math.round(data.totalRate / data.count) : 0,
  }));

  return NextResponse.json({
    success: true,
    data: {
      totalOutcomes,
      acceptanceRate,
      avgNegotiationDelta,
      giftConversionRate,
      byStatus,
      byPlatform,
      overTime: [], // TODO: Implement time series
    },
  });
}
```

### Acceptance Criteria

- [ ] Internal routes protected by admin email list
- [ ] Analytics dashboard shows key metrics
- [ ] Charts visualize outcome data
- [ ] Can filter by date range, platform, niche
- [ ] Can export data to CSV
- [ ] No public access to internal routes

---

## Summary & Priorities

| Issue | Priority | Effort | Dependencies |
|-------|----------|--------|--------------|
| 1. localStorage Migration | **High** | 12 hrs | None |
| 2. Production Analytics | **High** | 8 hrs | PostHog account |
| 3. Internal Dashboard | Medium | 10 hrs | Issue 1 (data in DB) |

**Recommended Order:**
1. **Issue 1** - Migrate localStorage → Enables reliable data for analytics
2. **Issue 2** - Add PostHog → Start collecting user behavior data
3. **Issue 3** - Build internal dashboard → Visualize outcome data

### Prompt Sequence

#### Prompt V6a-1: localStorage Migration Setup
```
Implement Issue 1, Steps 1.1-1.3 from IMPLEMENTATION_PLAN_V6a:
1. Add SWR for data fetching
2. Create useProfile hook
3. Add SavedRateCard model to Prisma schema
4. Create rate-cards API routes (CRUD)
5. Run prisma db push

Do not migrate components yet - just set up infrastructure.
```

#### Prompt V6a-2: Component Migration
```
Implement Issue 1, Steps 1.4-1.6 from IMPLEMENTATION_PLAN_V6a:
1. Migrate saved-rates.tsx to use API instead of localStorage
2. Migrate dashboard pages to use useProfile hook
3. Update profile-form.tsx to save to API
4. Add SWR cache persistence for offline support
5. Audit and remove remaining localStorage profile reads
6. Document which localStorage keys are intentionally kept
```

#### Prompt V6a-3: PostHog Integration
```
Implement Issue 2 from IMPLEMENTATION_PLAN_V6a:
1. Install and configure PostHog
2. Create PostHog provider component
3. Update analytics.ts to use PostHog in production
4. Add key event tracking to:
   - Homepage CTA clicks
   - Quick calculator submit/result
   - Sign up flow
   - Rate card generation
   - DM analysis
5. Add user identification on login
```

#### Prompt V6a-4: Internal Analytics Dashboard
```
Implement Issue 3 from IMPLEMENTATION_PLAN_V6a:
1. Create (internal) route group with admin auth
2. Install recharts
3. Create /api/internal/analytics route
4. Build analytics dashboard page with:
   - Key metric cards
   - Outcomes by status pie chart
   - Rates by platform bar chart
   - Acceptance rate over time line chart
5. Add basic filters (date range, platform)
```

---

## Environment Variables Required

```bash
# .env.local additions

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Admin access
ADMIN_EMAILS=you@example.com,cofounder@example.com
```

---

## Future Considerations

1. **Real-time sync** - WebSocket for multi-device instant updates
2. **Data export** - Allow users to export their data (GDPR)
3. **Anonymized benchmarks** - Surface aggregate data back to users
4. **A/B testing** - Use PostHog feature flags for experiments
