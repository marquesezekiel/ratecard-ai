# Unified Prompt Sequence: V6a + V7

This document consolidates all implementation prompts for IMPLEMENTATION_PLAN_V6a (Data Infrastructure & Analytics) and IMPLEMENTATION_PLAN_V7 (Web Accessibility).

## Recommended Execution Order

Prompts are ordered to minimize dependencies and allow parallel work where possible.

---

## Prompt 0: V7 Phase 0 - Critical Accessibility Blockers
**Priority:** P0 | **Source:** V7 Issues 1-5

Implement critical accessibility fixes that block WCAG A compliance:

1. **Skip Links** (Issue 1)
   - Add skip link to `src/app/layout.tsx` (root layout)
   - Add skip link to `src/app/dashboard/layout.tsx`
   - Add `id="main-content"` to main elements
   - Verify: Tab from page load focuses skip link first

2. **Alt Text for Images** (Issue 2)
   - Audit all `<img>` tags and add descriptive alt text
   - Update Avatar components to include sr-only user name
   - Mark decorative images with `alt="" role="presentation"`

3. **ARIA Labels for Icon-Only Buttons** (Issue 3)
   - Audit all icon-only buttons in the codebase
   - Add `aria-label` to each icon-only button
   - Add `aria-hidden="true"` to icons inside buttons
   - Key files: menu-sheet.tsx, copy-button.tsx, FAB, inline-message-analyzer.tsx

4. **aria-current for Active Navigation** (Issue 4)
   - Update TopNavLink in dashboard/layout.tsx
   - Update BottomNavLink in dashboard/layout.tsx
   - Update MenuSheet navigation items

5. **prefers-reduced-motion** (Issue 5)
   - Add CSS media query to globals.css
   - Disable animations for users who prefer reduced motion
   - Ensure loading states still indicate progress

**Test with keyboard navigation after each change.**

---

## Prompt 1: V6a-1 - localStorage Migration Infrastructure
**Priority:** High | **Source:** V6a Issue 1, Steps 1.1-1.3

Set up infrastructure for localStorage migration:

1. Install SWR for data fetching:
   ```bash
   pnpm add swr
   ```

2. Create data fetching hooks:
   - `src/hooks/use-profile.ts` - Profile data hook with SWR
   - `src/hooks/use-rate-cards.ts` - Rate cards hook with SWR

3. Add SavedRateCard model to Prisma schema

4. Create rate-cards API routes:
   - `src/app/api/rate-cards/route.ts` (GET list, POST create)
   - `src/app/api/rate-cards/[id]/route.ts` (GET, PUT, DELETE)

5. Run `pnpm prisma db push`

**Do not migrate components yet - just set up infrastructure.**

---

## Prompt 2: V7 Phase 1 - Core WCAG AA Compliance
**Priority:** P1 | **Source:** V7 Issues 6-11

Implement core accessibility features for WCAG AA:

1. **Color Contrast Verification** (Issue 6)
   - Verify --muted-foreground against --background
   - Verify --primary against --primary-foreground
   - Verify text-money, text-energy, text-coral colors
   - Document findings and fix any issues

2. **Required Field Indicators** (Issue 7)
   - Update Label component to show required state
   - Add sr-only "(required)" text for screen readers
   - Add form instructions about required fields

3. **Live Regions for Dynamic Content** (Issue 8)
   - Add aria-live regions to message-analyzer-form
   - Add aria-live to quick-calculator-form
   - Add aria-live to quick-calculator-result
   - Announce loading, success, and error states

4. **Focus Management Verification** (Issue 9)
   - Verify Radix UI modals trap focus correctly
   - Verify focus returns to trigger on modal close
   - Test dashboard-tour component

5. **Heading Hierarchy Audit** (Issue 10)
   - Ensure one h1 per page
   - No skipped heading levels
   - Fix any violations

6. **Link Purpose Clarity** (Issue 11)
   - Audit for "click here" or "learn more" links
   - Add context via aria-label or better link text

**Run Lighthouse accessibility audit and fix issues.**

---

## Prompt 3: V6a-2 - Component Migration to Server Data
**Priority:** High | **Source:** V6a Issue 1, Steps 1.4-1.6

Migrate components from localStorage to server data:

1. Migrate `saved-rates.tsx`:
   - Replace localStorage reads with useRateCards hook
   - Add optimistic updates for delete

2. Migrate dashboard pages:
   - `dashboard/page.tsx` - Use useProfile hook
   - `dashboard/analyze/page.tsx` - Use useProfile hook
   - `dashboard/generate/page.tsx` - Use useProfile hook

3. Update `profile-form.tsx`:
   - Keep local state for form editing
   - Save to API on blur/submit only
   - Remove localStorage writes

4. Audit `gifts/page.tsx`:
   - Verify API-only usage
   - Remove any localStorage remnants

5. Add SWR cache persistence for offline support

6. Document intentionally kept localStorage keys:
   - Banner dismiss timestamps
   - Celebration milestones
   - UI preferences (theme, collapsed sections)

---

## Prompt 4: V6a-3 - PostHog Analytics Integration
**Priority:** High | **Source:** V6a Issue 2

Integrate PostHog for production analytics:

1. Install PostHog:
   ```bash
   pnpm add posthog-js
   ```

2. Create PostHog configuration:
   - `src/lib/posthog.ts` - PostHog initialization

3. Create PostHog provider:
   - `src/components/providers/posthog-provider.tsx`
   - Track page views automatically
   - Identify users on login

4. Update `src/lib/analytics.ts`:
   - Use PostHog in production
   - Keep console.log for development

5. Add event tracking to key flows:
   - Homepage CTA clicks
   - Quick calculator submit/result
   - Sign up flow start/complete
   - Onboarding start/complete
   - Rate card generated/downloaded
   - DM analyzed
   - Gift evaluated
   - Brand vetted
   - Contract scanned

6. Add user properties:
   - tier, primaryPlatform, totalFollowers
   - profileCompleteness, rateCardsGenerated, dmsAnalyzed

---

## Prompt 5: V7 Phase 2 - Enhanced Experience
**Priority:** P2 | **Source:** V7 Issues 12-15

Implement enhanced accessibility features:

1. **Breadcrumb Navigation** (Issue 12)
   - Create `src/components/ui/breadcrumb.tsx`
   - Add to nested pages like /dashboard/tools/brand-vetter
   - Use proper nav and aria-label

2. **Keyboard Shortcuts** (Issue 13)
   - Create keyboard shortcuts hook
   - Add shortcuts: ?, g h, g i, g r, n, Esc
   - Create help modal showing all shortcuts
   - Disable in form fields

3. **Error Prevention** (Issue 14)
   - Add confirmation dialogs for destructive actions
   - Add inline validation with helpful suggestions

4. **Touch Target Size** (Issue 15)
   - Audit mobile touch targets
   - Ensure minimum 44x44px for interactive elements

---

## Prompt 6: V6a-4 - Internal Analytics Dashboard
**Priority:** Medium | **Source:** V6a Issue 3

Build internal analytics dashboard:

1. Create route structure:
   - `src/app/(internal)/layout.tsx` - Admin auth check
   - `src/app/(internal)/analytics/page.tsx` - Main dashboard

2. Install Recharts:
   ```bash
   pnpm add recharts
   ```

3. Create internal analytics API:
   - `src/app/api/internal/analytics/route.ts`
   - Aggregate outcomes, acceptance rates, benchmarks

4. Build dashboard components:
   - Key metric cards (total outcomes, acceptance rate, etc.)
   - Pie chart: Outcomes by status
   - Bar chart: Average rate by platform
   - Line chart: Acceptance rate over time

5. Add filters:
   - Date range picker
   - Platform dropdown
   - Niche dropdown

---

## Prompt 7: V7 Testing & Documentation
**Priority:** P2 | **Source:** V7 Prompt D

Complete accessibility testing and documentation:

1. Add automated testing tools:
   ```bash
   pnpm add -D @axe-core/react eslint-plugin-jsx-a11y
   ```

2. Configure axe-core for development

3. Add jsx-a11y rules to ESLint config

4. Create `ACCESSIBILITY.md` documenting:
   - Keyboard shortcuts
   - Screen reader support
   - Known limitations
   - How to test

5. Run full manual accessibility audit:
   - Keyboard navigation
   - Screen reader testing
   - Visual testing (zoom, high contrast, grayscale)
   - Reduced motion testing

6. Fix any remaining issues

---

## Summary Table

| Prompt | Plan | Focus | Dependencies |
|--------|------|-------|--------------|
| 0 | V7 | Critical Accessibility | None |
| 1 | V6a | localStorage Migration Setup | None |
| 2 | V7 | Core WCAG AA Compliance | Prompt 0 |
| 3 | V6a | Component Migration | Prompt 1 |
| 4 | V6a | PostHog Analytics | None |
| 5 | V7 | Enhanced Accessibility | Prompt 2 |
| 6 | V6a | Internal Analytics Dashboard | Prompt 3 |
| 7 | V7 | Testing & Documentation | Prompts 0, 2, 5 |

---

## Parallel Execution Opportunities

These prompt groups can run in parallel:

**Group A:** Prompts 0, 1, 4 (no dependencies)
**Group B:** Prompts 2, 3 (after Group A)
**Group C:** Prompts 5, 6 (after Group B)
**Group D:** Prompt 7 (after all others)

---

## Success Metrics

After all prompts complete:

- [ ] Lighthouse Accessibility score: 95+
- [ ] axe-core: 0 critical/serious violations
- [ ] Full keyboard navigation possible
- [ ] Screen reader tested
- [ ] WCAG 2.2 AA self-assessment passed
- [ ] All profile data from API (not localStorage)
- [ ] All rate cards stored in database
- [ ] PostHog tracking all key events
- [ ] Internal analytics dashboard functional
