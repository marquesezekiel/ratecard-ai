# Explicit Prompt Sequence for Implementation

This document contains copy-paste-ready prompts for implementing V6a (Data Infrastructure) and V7 (Accessibility).

**Status:** Prompt 0 (V7 Phase 0 - Critical Accessibility) is COMPLETE and committed.

---

## How to Use This Document

1. Copy the entire prompt block (including the code fences)
2. Paste into Claude Code
3. Follow the instructions exactly
4. When you see `/clear`, run that command to clear context before the next prompt
5. Commit at the designated commit points

---

## PROMPT 1: localStorage Migration Infrastructure

```
Read IMPLEMENTATION_PLAN_V6a.md and implement Issue 1, Steps 1.1-1.3 exactly as written.

## Requirements

### 1. Install SWR
```bash
pnpm add swr
```

### 2. Create Data Fetching Hooks
Create `src/hooks/use-profile.ts`:
- Use SWR for fetching /api/profile
- Include revalidateOnFocus: false
- Include dedupingInterval: 60000
- Return { profile, isLoading, isError, mutate }

Create `src/hooks/use-rate-cards.ts`:
- Use SWR for fetching /api/rate-cards
- Include optimistic update helpers for create/update/delete
- Return { rateCards, isLoading, isError, createRateCard, updateRateCard, deleteRateCard }

### 3. Add SavedRateCard Model to Prisma
Add to prisma/schema.prisma:
```prisma
model SavedRateCard {
  id              String    @id @default(cuid())
  creatorId       String
  creator         User      @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  name            String    @default("Untitled Rate Card")
  platform        String
  contentFormat   String
  baseRate        Float
  finalRate       Float
  adjustments     Json
  dealQuality     Json?
  briefId         String?
  brandName       String?
  campaignName    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastAccessedAt  DateTime  @default(now())

  @@index([creatorId])
  @@index([creatorId, createdAt])
}
```

Add relation to User model:
```prisma
savedRateCards  SavedRateCard[]
```

### 4. Create Rate Cards API Routes
Create `src/app/api/rate-cards/route.ts`:
- GET: List all rate cards for authenticated user
- POST: Create new rate card

Create `src/app/api/rate-cards/[id]/route.ts`:
- GET: Get single rate card (verify ownership)
- PUT: Update rate card (verify ownership)
- DELETE: Delete rate card (verify ownership)

### 5. Run Database Migration
```bash
pnpm prisma generate
pnpm prisma db push
```

## Testing Requirements

### Write Tests
Create `tests/hooks/use-profile.test.ts`:
- Test successful profile fetch
- Test loading state
- Test error handling
- Test cache behavior

Create `tests/hooks/use-rate-cards.test.ts`:
- Test listing rate cards
- Test creating rate card
- Test updating rate card
- Test deleting rate card
- Test optimistic updates

Create `tests/api/rate-cards.test.ts`:
- Test GET /api/rate-cards (authenticated)
- Test GET /api/rate-cards (unauthenticated - should 401)
- Test POST /api/rate-cards
- Test GET /api/rate-cards/[id]
- Test PUT /api/rate-cards/[id]
- Test DELETE /api/rate-cards/[id]
- Test ownership verification (can't access other user's cards)

### Run Tests
```bash
pnpm test
```

Ensure all tests pass before continuing.

## Accessibility Requirements
- Ensure any new UI components include proper ARIA attributes
- All loading states should have role="status" aria-label="Loading..."

## Do NOT migrate components yet - just set up infrastructure.

When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: add SWR infrastructure and SavedRateCard model"
```

---

## COMMIT POINT 1

After completing Prompt 1:
```bash
git add -A
git commit -m "feat: add SWR infrastructure and SavedRateCard model

- Add SWR for data fetching with cache persistence
- Create useProfile and useRateCards hooks
- Add SavedRateCard model to Prisma schema
- Create rate-cards API routes (CRUD)
- Add comprehensive tests for hooks and API"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 2: Core WCAG AA Compliance

```
Read IMPLEMENTATION_PLAN_V7.md and implement Issues 6-11 exactly as written (Phase 1 - Core Compliance).

## Requirements

### 1. Color Contrast Verification (Issue 6)
Verify these color combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text):
- `--muted-foreground` against `--background`
- `--primary` against `--primary-foreground`
- `text-money` (oklch(0.60 0.17 155)) against `--background`
- `text-energy` (oklch(0.75 0.15 70)) against `--background`
- `text-coral` (oklch(0.72 0.16 45)) against `--background`

Document findings in a comment at the top of globals.css. Fix any colors that don't meet contrast requirements.

### 2. Required Field Indicators (Issue 7)
Update `src/components/ui/label.tsx`:
- Add `required` prop
- Show visual asterisk (*) with `text-destructive`
- Add sr-only "(required)" text for screen readers

Update all forms to use the required prop:
- Profile form
- Quick calculator form
- Message analyzer form

Add form instructions: "Fields marked with * are required."

### 3. Live Regions for Dynamic Content (Issue 8)
Add aria-live regions to:

`src/components/forms/message-analyzer-form.tsx`:
- Add `<div role="status" aria-live="polite">` for loading state
- Add `<div role="alert" aria-live="assertive">` for errors

`src/components/forms/quick-calculator-form.tsx`:
- Add status announcements for loading/calculating

`src/components/quick-calculator-result.tsx`:
- Add sr-only announcement when results appear
- Format: "Your estimated rate is $X to $Y"

### 4. Focus Management Verification (Issue 9)
Verify these components trap focus correctly:
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/onboarding/dashboard-tour.tsx`

Test:
- Focus moves to modal when opened
- Tab cycles within modal only
- Escape closes modal
- Focus returns to trigger on close

Fix any issues found.

### 5. Heading Hierarchy Audit (Issue 10)
Audit all pages in `src/app/` for:
- Each page has exactly one h1
- No heading levels skipped (h1 -> h2 -> h3)
- Headings reflect content structure

Key files to check:
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/analyze/page.tsx`
- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/rates/page.tsx`
- `src/app/quick-calculate/page.tsx`

Fix any violations.

### 6. Link Purpose Clarity (Issue 11)
Search for and fix:
- "click here" links
- "read more" links without context
- "learn more" links without context

Either make link text descriptive or add aria-label.

## Testing Requirements

### Write Tests
Create `tests/accessibility/wcag-aa.test.tsx`:
- Test required field indicators render correctly
- Test sr-only text is present for required fields
- Test aria-live regions exist for dynamic content
- Test heading hierarchy (one h1 per page)

### Run Tests
```bash
pnpm test
```

### Run Lighthouse
```bash
# In browser, run Lighthouse accessibility audit
# Target score: 95+
```

## Browser Verification (Chrome MCP)
Use Chrome MCP to verify:
1. Navigate to /dashboard
2. Check heading structure in accessibility tree
3. Navigate to /quick-calculate
4. Submit form and verify live region announces results
5. Check color contrast in DevTools

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: implement WCAG AA core compliance"
```

---

## COMMIT POINT 2

After completing Prompt 2:
```bash
git add -A
git commit -m "feat: implement WCAG AA core compliance

- Verify and document color contrast ratios
- Add required field indicators with sr-only text
- Add aria-live regions for dynamic content
- Verify focus management in modals
- Audit and fix heading hierarchy
- Fix unclear link text"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 3: Component Migration to Server Data

```
Read IMPLEMENTATION_PLAN_V6a.md and implement Issue 1, Steps 1.4-1.6 exactly as written.

## Requirements

### 1. Migrate saved-rates.tsx
Update `src/components/rate-card/saved-rates.tsx`:
- Remove all localStorage reads/writes for rate data
- Import and use `useRateCards` hook from `src/hooks/use-rate-cards.ts`
- Add optimistic updates for delete operation
- Handle loading and error states
- Ensure accessibility: loading state has role="status" aria-label="Loading saved rates"

### 2. Migrate Dashboard Pages
Update `src/app/dashboard/page.tsx`:
- Remove localStorage.getItem("creatorProfile")
- Import and use `useProfile` hook
- Handle loading state with skeleton UI
- Ensure profile data comes from server

Update `src/app/dashboard/analyze/page.tsx`:
- Remove any localStorage profile reads
- Use `useProfile` hook for rate preview calculations
- Handle loading state appropriately

Update `src/app/dashboard/generate/page.tsx`:
- Remove any localStorage profile reads
- Use `useProfile` hook for PDF generation data
- Handle loading state

### 3. Update Profile Form
Update `src/components/forms/profile-form.tsx`:
- Keep local state for form editing (for UX)
- Remove localStorage writes on every change
- Save to API on blur/submit only
- Use `useProfile` hook's mutate for cache invalidation
- Remove fallback to localStorage

### 4. Audit Gifts Page
Check `src/app/dashboard/gifts/page.tsx`:
- Verify it uses API only
- Remove any localStorage remnants
- Ensure proper loading states

### 5. Add SWR Cache Persistence
Create `src/lib/swr-config.tsx`:
```tsx
'use client';

import { SWRConfig } from 'swr';

function localStorageProvider() {
  if (typeof window === 'undefined') return new Map();

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

Add SWRProvider to `src/app/layout.tsx` wrapping the app.

### 6. Document Kept localStorage Keys
Create a comment block in `src/lib/local-storage-keys.ts`:
```typescript
/**
 * INTENTIONALLY KEPT localStorage KEYS
 * These are UI state only and don't need server sync:
 *
 * - profile-banner-dismissed: Timestamp when profile completion banner was dismissed
 * - celebration-milestones: Object tracking which milestones user has seen
 * - theme: User's theme preference (light/dark/system)
 * - tour-completed: Whether user has completed the dashboard tour
 * - swr-cache: SWR's cache persistence for offline support
 */
```

## Testing Requirements

### Write Tests
Create `tests/components/saved-rates.test.tsx`:
- Test loading state renders correctly
- Test rate cards display from API
- Test delete with optimistic update
- Test error state handling
- Mock useRateCards hook

Update `tests/components/dashboard/` tests:
- Test profile data loads from hook
- Test loading skeleton appears
- Test error handling

### Run Tests
```bash
pnpm test
```

## Browser Verification (Chrome MCP)
Use Chrome MCP to verify:
1. Navigate to /dashboard
2. Check Network tab - profile loads from /api/profile
3. Navigate to /dashboard/rates
4. Check saved rates load from /api/rate-cards
5. Delete a rate card - verify optimistic update (instant removal)
6. Refresh - verify rate is still deleted
7. Open DevTools Application tab - verify localStorage no longer has creatorProfile

## Analytics Tracking
Add tracking for rate card operations:
```typescript
trackEvent('rate_saved', { platform, format, rate });
trackEvent('rate_deleted', { rateId });
```

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: migrate components from localStorage to server data"
```

---

## COMMIT POINT 3

After completing Prompt 3:
```bash
git add -A
git commit -m "feat: migrate components from localStorage to server data

- Migrate saved-rates.tsx to useRateCards hook
- Migrate dashboard pages to useProfile hook
- Update profile-form to save to API only
- Add SWR cache persistence for offline support
- Document intentionally kept localStorage keys
- Add analytics tracking for rate card operations"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 4: PostHog Analytics Integration

```
Read IMPLEMENTATION_PLAN_V6a.md and implement Issue 2 exactly as written.

## Requirements

### 1. Install PostHog
```bash
pnpm add posthog-js
```

### 2. Create PostHog Configuration
Create `src/lib/posthog.ts`:
```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  });
}

export { posthog };
```

### 3. Create PostHog Provider
Create `src/components/providers/posthog-provider.tsx`:
- Track page views on pathname change
- Identify user on login
- Wrap in Suspense for useSearchParams

Add PostHogProvider to `src/app/layout.tsx`.

### 4. Update analytics.ts
Update `src/lib/analytics.ts`:
- Import posthog from './posthog'
- In production: use posthog.capture()
- In development: keep console.log
- Add all event types from V6a

### 5. Add Event Tracking
Add tracking calls to these locations:

**Homepage (src/app/page.tsx or landing):**
- `trackEvent('cta_click', { location: 'hero', destination: '/quick-calculate' })`

**Quick Calculator:**
- `trackEvent('quick_calculate_submit', { platform, followers, format })`
- `trackEvent('quick_calculate_result_view', { minRate, maxRate, tier })`

**Auth Flow (src/app/sign-up/, src/app/sign-in/):**
- `trackEvent('signup_start')`
- `trackEvent('signup_complete', { source })`

**Onboarding (src/app/onboarding/):**
- `trackEvent('onboarding_start')`
- `trackEvent('onboarding_complete', { platform, followers })`

**Rate Card Generation:**
- `trackEvent('rate_card_generated', { platform, format, rate, dealQuality })`
- `trackEvent('rate_card_downloaded')`

**Message Analyzer:**
- `trackEvent('dm_analyzed', { source, compensationType, hasGiftOffer })`

**Gift Evaluator:**
- `trackEvent('gift_evaluated', { productValue, recommendation })`

**Brand Vetter:**
- `trackEvent('brand_vetted', { trustLevel })`

**Contract Scanner:**
- `trackEvent('contract_scanned', { healthScore })`

### 6. Add User Properties
On profile save or login, call:
```typescript
setUserProperties({
  tier: profile.tier,
  primaryPlatform: profile.primaryPlatform,
  totalFollowers: profile.totalFollowers,
  profileCompleteness: calculateCompleteness(profile),
  rateCardsGenerated: count,
  dmsAnalyzed: count,
});
```

## Environment Variables
Add to `.env.local.example`:
```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Testing Requirements

### Write Tests
Create `tests/lib/analytics.test.ts`:
- Test trackEvent in development logs to console
- Test trackEvent in production calls posthog.capture
- Test identifyUser calls posthog.identify
- Test setUserProperties calls posthog.people.set

Mock posthog module in tests.

### Run Tests
```bash
pnpm test
```

## Browser Verification (Chrome MCP)
In development:
1. Navigate to /quick-calculate
2. Open Console
3. Submit the form
4. Verify console shows: [Analytics] { event: 'quick_calculate_submit', ... }

## Accessibility Requirements
- PostHog provider should not affect accessibility
- No new UI elements that need ARIA attributes

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: integrate PostHog analytics for production"
```

---

## COMMIT POINT 4

After completing Prompt 4:
```bash
git add -A
git commit -m "feat: integrate PostHog analytics for production

- Add PostHog configuration and provider
- Update analytics.ts to use PostHog in production
- Add event tracking to all key user flows
- Track user properties for segmentation
- Add environment variables documentation"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 5: Enhanced Accessibility (Phase 2)

```
Read IMPLEMENTATION_PLAN_V7.md and implement Issues 12-15 exactly as written (Phase 2 - Enhanced Experience).

## Requirements

### 1. Breadcrumb Navigation (Issue 12)
Create `src/components/ui/breadcrumb.tsx`:
```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

Add breadcrumbs to nested pages:
- `/dashboard/tools/brand-vetter`
- `/dashboard/tools/contract-scanner`
- `/dashboard/profile`
- `/dashboard/rates`

### 2. Keyboard Shortcuts (Issue 13)
Create `src/hooks/use-keyboard-shortcuts.ts`:
```typescript
const SHORTCUTS = {
  '?': 'showHelp',
  'g h': 'goHome',
  'g i': 'goInbox',
  'g r': 'goRates',
  'n': 'newRateCard',
};
```

Create `src/components/ui/keyboard-shortcuts-modal.tsx`:
- List all available shortcuts
- Accessible modal with proper focus management

Add hook to `src/app/dashboard/layout.tsx`:
- Don't trigger when in form fields
- Support multi-key shortcuts (g h)

### 3. Error Prevention (Issue 14)
Add confirmation dialogs for:
- Deleting a saved rate (saved-rates.tsx)
- Deleting a gift deal (gifts/page.tsx)
- Signing out (menu-sheet.tsx)

Use `AlertDialog` from shadcn/ui with:
- Clear title explaining the action
- Description of consequences
- Cancel and Confirm buttons
- Confirm button focused by default

### 4. Touch Target Size (Issue 15)
Audit and fix these components for 44x44px minimum:
- Mobile navigation buttons (BottomNavLink)
- Close buttons on modals/sheets
- Copy buttons (CopyIconButton)
- Delete buttons in saved-rates.tsx
- Menu button trigger

Add `min-h-[44px] min-w-[44px]` to icon buttons on mobile.

## Testing Requirements

### Write Tests
Create `tests/accessibility/enhanced.test.tsx`:
- Test breadcrumb renders with correct structure
- Test breadcrumb has aria-label="Breadcrumb"
- Test aria-current="page" on current item
- Test keyboard shortcuts modal opens with ?
- Test confirmation dialogs have accessible structure
- Test touch targets are at least 44x44px

### Run Tests
```bash
pnpm test
```

## Browser Verification (Chrome MCP)
1. Navigate to /dashboard/tools/brand-vetter
2. Verify breadcrumb appears: Home / Tools / Brand Vetter
3. Press ? key - verify help modal opens
4. Press Escape - verify modal closes
5. Navigate to /dashboard/rates
6. Try to delete a rate - verify confirmation appears
7. On mobile viewport, inspect touch targets - verify 44px minimum

## Accessibility Requirements
- All new modals must trap focus
- All new interactive elements must have focus states
- Keyboard shortcuts must not interfere with screen readers

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: implement enhanced accessibility features"
```

---

## COMMIT POINT 5

After completing Prompt 5:
```bash
git add -A
git commit -m "feat: implement enhanced accessibility features

- Add breadcrumb navigation component
- Implement keyboard shortcuts with help modal
- Add confirmation dialogs for destructive actions
- Ensure 44x44px touch targets on mobile"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 6: Internal Analytics Dashboard

```
Read IMPLEMENTATION_PLAN_V6a.md and implement Issue 3 exactly as written.

## Requirements

### 1. Create Internal Route Structure
Create `src/app/(internal)/layout.tsx`:
- Check for admin email (from ADMIN_EMAILS env var)
- Redirect non-admins to /dashboard
- Simple admin header with "RateCard.AI Internal" title

### 2. Install Recharts
```bash
pnpm add recharts
```

### 3. Create Internal Analytics API
Create `src/app/api/internal/analytics/route.ts`:
- Verify admin email before returning data
- Aggregate all outcomes from database
- Return:
  - totalOutcomes
  - acceptanceRate
  - avgNegotiationDelta
  - giftConversionRate
  - byStatus (Record<string, number>)
  - byPlatform (Array<{ platform, count, avgRate }>)
  - overTime (Array<{ date, accepted, rejected }>)

### 4. Build Analytics Dashboard
Create `src/app/(internal)/analytics/page.tsx`:

**Key Metric Cards:**
- Total Outcomes
- Acceptance Rate (%)
- Avg Negotiation Delta (+/- %)
- Gift Conversion Rate (%)

**Charts:**
- Pie chart: Outcomes by status
- Bar chart: Average rate by platform
- Line chart: Acceptance rate over time

Use Recharts components:
- ResponsiveContainer
- PieChart, Pie, Cell
- BarChart, Bar, XAxis, YAxis
- LineChart, Line
- Tooltip

### 5. Add Filters
Add filter UI:
- Date range picker (last 7, 30, 90 days, all time)
- Platform dropdown (All, Instagram, TikTok, YouTube, etc.)
- Update API to accept filter params

## Environment Variables
Add to `.env.local.example`:
```bash
# Admin Access
ADMIN_EMAILS=you@example.com,cofounder@example.com
```

## Testing Requirements

### Write Tests
Create `tests/api/internal/analytics.test.ts`:
- Test unauthorized access returns 401
- Test admin email access returns data
- Test aggregation calculations are correct
- Test filter parameters work

### Run Tests
```bash
pnpm test
```

## Browser Verification (Chrome MCP)
1. Set your email in ADMIN_EMAILS env var
2. Navigate to /analytics
3. Verify dashboard loads with charts
4. Verify key metrics display correctly
5. Change date filter - verify data updates
6. Log out, log in as non-admin - verify redirect to /dashboard

## Accessibility Requirements
- Charts must have accessible descriptions
- Add aria-label to chart containers
- Ensure color choices in charts have sufficient contrast
- Filters must be keyboard accessible

## Analytics Tracking
Track internal dashboard usage:
```typescript
trackEvent('internal_dashboard_view', { admin: true });
trackEvent('internal_filter_change', { filter, value });
```

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "feat: build internal analytics dashboard"
```

---

## COMMIT POINT 6

After completing Prompt 6:
```bash
git add -A
git commit -m "feat: build internal analytics dashboard

- Create protected internal route with admin auth
- Add internal analytics API with aggregations
- Build dashboard with Recharts visualizations
- Add date range and platform filters
- Ensure chart accessibility"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## /clear

---

## PROMPT 7: Accessibility Testing & Documentation

```
Read IMPLEMENTATION_PLAN_V7.md and implement the Testing & Documentation section exactly as written.

## Requirements

### 1. Install Testing Tools
```bash
pnpm add -D @axe-core/react eslint-plugin-jsx-a11y
```

### 2. Configure axe-core for Development
Create `src/lib/axe-dev.ts`:
```typescript
export async function initAxe() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const axe = await import('@axe-core/react');

    axe.default(React, ReactDOM, 1000);
  }
}
```

Call `initAxe()` in a client component that mounts on app load.

### 3. Add jsx-a11y to ESLint
Update `eslint.config.mjs`:
```javascript
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Add to config:
{
  plugins: {
    'jsx-a11y': jsxA11y,
  },
  rules: {
    ...jsxA11y.configs.recommended.rules,
  },
}
```

Run `pnpm lint` and fix any new a11y violations.

### 4. Create ACCESSIBILITY.md
Create `ACCESSIBILITY.md` in project root:

```markdown
# Accessibility Guide

RateCard.AI is committed to WCAG 2.2 Level AA compliance.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ? | Show keyboard shortcuts help |
| g h | Go to Home/Dashboard |
| g i | Go to Inbox/Analyze |
| g r | Go to Rates |
| n | Create new rate card |
| Esc | Close modal/dialog |

## Screen Reader Support

- All pages have proper heading hierarchy (h1 → h2 → h3)
- Skip links available to bypass navigation
- Form fields have proper labels and error announcements
- Dynamic content announced via aria-live regions
- Interactive elements have descriptive accessible names

## Motion Preferences

Animations are disabled when `prefers-reduced-motion: reduce` is set in system preferences.

## Color Contrast

All text meets WCAG AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

## Testing

### Automated Testing
- axe-core runs in development mode
- eslint-plugin-jsx-a11y catches issues during development
- Lighthouse accessibility audits in CI

### Manual Testing Checklist
- [ ] Tab through entire page - logical order?
- [ ] All interactive elements reachable by keyboard?
- [ ] Focus visible at all times?
- [ ] Can close modals with Escape?
- [ ] Screen reader announces page content correctly?
- [ ] Content readable at 200% zoom?
- [ ] Works in high contrast mode?

## Known Limitations

1. [Document any known accessibility issues here]

## Reporting Issues

If you encounter accessibility barriers, please report them to: [email/issue tracker]
```

### 5. Run Manual Accessibility Audit

**Keyboard Testing:**
- Tab through every page
- Verify all interactive elements reachable
- Verify focus visible
- Verify modals trap focus
- Verify Escape closes modals

**Screen Reader Testing (use VoiceOver on Mac or NVDA on Windows):**
- Navigate by headings (H key)
- Navigate by links
- Fill out forms
- Verify dynamic content announced

**Visual Testing:**
- Test at 200% zoom
- Test in Windows High Contrast mode
- Test in grayscale (verify info not conveyed by color alone)
- Enable prefers-reduced-motion and verify animations disabled

Document any issues found and fix them.

### 6. Run Lighthouse Audit
```bash
# In Chrome DevTools, run Lighthouse accessibility audit
# Target: 95+ score
```

Fix any issues reported by Lighthouse.

## Testing Requirements

### Run All Tests
```bash
pnpm test
pnpm lint
```

Ensure everything passes.

### Create Accessibility Test Summary
Create `tests/accessibility/AUDIT_RESULTS.md`:
- Document Lighthouse score
- Document axe-core results
- Document manual testing results
- List any remaining issues

## Commit Point
When complete:
1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure all pass
3. Commit with message: "docs: add accessibility testing and documentation"
```

---

## FINAL COMMIT POINT

After completing Prompt 7:
```bash
git add -A
git commit -m "docs: add accessibility testing and documentation

- Configure axe-core for development
- Add eslint-plugin-jsx-a11y to ESLint
- Create ACCESSIBILITY.md with full documentation
- Complete manual accessibility audit
- Document audit results"

git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## Summary

| Prompt | Focus | Commit Message |
|--------|-------|----------------|
| 0 | Critical Accessibility (COMPLETE) | "feat: implement WCAG Phase 0 critical accessibility fixes" |
| 1 | SWR + SavedRateCard Infrastructure | "feat: add SWR infrastructure and SavedRateCard model" |
| 2 | WCAG AA Core Compliance | "feat: implement WCAG AA core compliance" |
| 3 | localStorage to Server Migration | "feat: migrate components from localStorage to server data" |
| 4 | PostHog Analytics | "feat: integrate PostHog analytics for production" |
| 5 | Enhanced Accessibility | "feat: implement enhanced accessibility features" |
| 6 | Internal Analytics Dashboard | "feat: build internal analytics dashboard" |
| 7 | Testing & Documentation | "docs: add accessibility testing and documentation" |

---

## Execution Order

1. **Prompt 1** → Commit → /clear
2. **Prompt 2** → Commit → /clear
3. **Prompt 3** → Commit → /clear
4. **Prompt 4** → Commit → /clear
5. **Prompt 5** → Commit → /clear
6. **Prompt 6** → Commit → /clear
7. **Prompt 7** → Commit → DONE!

After all prompts complete, create a PR summarizing all changes.
