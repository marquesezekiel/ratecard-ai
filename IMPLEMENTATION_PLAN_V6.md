# RateCard.AI Implementation Plan V6 - System Integrity Refactor

**Created**: January 25, 2026
**Purpose**: Address 43 identified issues across ethics, routing, copy, pricing, UX, architecture, and legal compliance.
**Estimated Prompts**: 9 (including testing)
**Branch**: `claude/analyze-test-coverage-hWgZz`

---

## Issue Summary

| Category | Count | Priority |
|----------|-------|----------|
| Critical - Ethical/Trust | 6 | Immediate |
| High - Route Consolidation | 5 | High |
| High - Copy/Terminology | 5 | High |
| High - Pricing Engine | 7 | High |
| Medium - Design/UX | 8 | Medium |
| Medium - Architecture | 6 | Medium |
| Medium - Legal | 2 | Medium |
| Low - Scope Cleanup | 4 | Low |
| **Total** | **43** | |

---

## Prompt 0: Critical Ethical Fixes

**Issues Addressed**: 1, 2, 3, 4, 5, 6
**Files Modified**:
- `src/app/quick-calculate/page.tsx`
- `src/components/quick-calculator-result.tsx`
- `src/lib/quick-calculator.ts`

### Requirements

#### Issue 1: Fabricated "10,000+ creators" claim
- **File**: `src/app/quick-calculate/page.tsx`
- **Current**: "See where you stand among 10,000+ creators"
- **Fix**: Replace with "Based on industry benchmarks"
- **Also fix**: Any duplicate claims (lines 57-58, 85-86)

#### Issue 2: "73% undercharge by $340" stat
- **Action**: KEEP AS IS per user decision

#### Issue 3: Fake testimonial "@lifestyle.sarah"
- **File**: `src/components/quick-calculator-result.tsx`
- **Current**: Testimonial block with "@lifestyle.sarah, 22K followers"
- **Fix**: Remove entire testimonial section until real testimonials exist

#### Issue 4: Fake percentile data
- **File**: `src/lib/quick-calculator.ts`
- **Current**: `TIER_PERCENTILE_RANGES` presented as real data
- **Fix**:
  - Rename to `ESTIMATED_TIER_RANGES`
  - Update UI labels from "Top X%" to "Estimated range based on tier"
  - Change `calculatePercentile` function comments to clarify these are estimates

- **File**: `src/components/quick-calculator-result.tsx`
- **Fix**: Change "Where you stand among [Tier] creators" to "Estimated position in [Tier] range"

#### Issue 5: Arbitrary "potential rate" (3.12x multiplier)
- **Action**: KEEP AS IS per user decision

#### Issue 6: "$200-$800 swing" claim
- **Action**: KEEP AS IS per user decision

### Success Criteria
- [ ] No "10,000+ creators" text anywhere in codebase
- [ ] Testimonial section removed
- [ ] Percentile labeled as "estimated"
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes

---

## Prompt 1: Route Consolidation

**Issues Addressed**: 7, 8, 9, 10, 11
**Files Modified/Deleted**:
- DELETE: `src/app/quote/` (entire directory)
- DELETE: `src/app/(dashboard)/quick-quote/` (entire directory)
- MODIFY: `src/app/(dashboard)/upload/page.tsx` → merge into Inbox
- MODIFY: `src/app/(dashboard)/analyze/page.tsx` (add brief upload)
- MODIFY: `src/app/(dashboard)/layout.tsx` (remove nav items)
- MODIFY: `src/app/(dashboard)/history/` (remove from nav)
- MODIFY: `src/app/(dashboard)/gifts/page.tsx` (remove Coming Soon tab)

### Requirements

#### Issue 7 & 8: Delete orphaned /quote route
- Delete entire `src/app/quote/` directory
- Search codebase for any links to `/quote` and update to `/quick-calculate`

#### Issue 9: Merge /dashboard/quick-quote into /quick-calculate
- Delete `src/app/(dashboard)/quick-quote/` directory
- Update `/quick-calculate` to detect authenticated users and show enhanced features
- Add auth check: if logged in, show "Save to Profile" option

#### Issue 10: Move brief upload into Inbox
- **File**: `src/app/(dashboard)/analyze/page.tsx`
- Add file upload zone (PDF/DOCX) alongside text input
- When file uploaded, parse and populate analysis
- Delete or redirect `src/app/(dashboard)/upload/page.tsx`

#### Issue 11: Remove Coming Soon from nav
- **File**: `src/app/(dashboard)/layout.tsx`
- Remove "History" from sidebar navigation
- **File**: `src/app/(dashboard)/gifts/page.tsx`
- Remove "Track Gifts" tab (keep only "Evaluate Gift")

### Success Criteria
- [ ] `/quote` returns 404
- [ ] `/dashboard/quick-quote` returns 404
- [ ] Brief upload works in Inbox
- [ ] No "Coming Soon" visible in nav
- [ ] All internal links updated
- [ ] `pnpm build` succeeds

---

## Prompt 2: Copy & Terminology Cleanup

**Issues Addressed**: 12, 13, 14, 15, 16
**Files Modified**: Multiple (search and replace)

### Requirements

#### Issue 12: Standardize timing to "30 seconds"
- Search all files for "60 seconds", "under 2 minutes", "one minute"
- Replace with "30 seconds" where referring to rate generation time
- **Key file**: `src/app/page.tsx` line 225 (How It Works section)

#### Issue 13: Remove specific layer count
- Search for "6-layer", "6 layer", "11-layer", "11 layer"
- Replace with "multi-factor" or "our pricing algorithm"
- **Key file**: `src/app/(auth)/sign-up/page.tsx`

#### Issue 14: Update year to 2026
- Search for "2025" in copy (not in comments/dates)
- Replace with "2026" where referring to "industry standards"
- **Key file**: `src/components/quick-calculator-form.tsx` line 70

#### Issue 15: Purge "Fit Score" terminology
- Search entire codebase for "Fit Score", "fit score", "fitScore"
- Replace UI-facing instances with "Deal Quality"
- Update component names if necessary (FitScoreDisplay → DealQualityDisplay)
- Keep backend compatibility but update display strings
- **Key files**:
  - `src/app/page.tsx` (hero card shows "Fit score: 92")
  - `src/app/(dashboard)/generate/page.tsx`
  - `src/components/rate-card/fit-score-display.tsx` (rename)

#### Issue 16: Remove "Real Rate" contradiction
- **File**: `src/components/quick-calculator-result.tsx`
- Change "Your Real Rate Could Be $X" to "With full profile: up to $X"
- Remove any implication that quick estimate isn't valid

### Success Criteria
- [ ] No "60 seconds" timing claims
- [ ] No specific layer counts in UI copy
- [ ] All years updated to 2026
- [ ] Zero "Fit Score" in user-facing UI
- [ ] No "Real Rate" language
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes

---

## Prompt 3: Pricing Engine Fixes

**Issues Addressed**: 17, 18, 19, 20, 21, 22, 23
**Files Modified**:
- `src/lib/pricing-engine.ts`
- `src/lib/types.ts`
- `src/lib/quick-calculator.ts`

### Requirements

#### Issue 17: Add multiplier cap
- **File**: `src/lib/pricing-engine.ts`
- Add `MAX_TOTAL_MULTIPLIER = 3.0` constant
- After all multipliers applied, cap total adjustment at 3.0x base rate
- Add comment explaining volatility prevention

```typescript
// After calculating all adjustments
const totalMultiplier = adjustments.reduce((acc, adj) =>
  adj.type === 'multiply' ? acc * adj.value : acc, 1);
const cappedMultiplier = Math.min(totalMultiplier, MAX_TOTAL_MULTIPLIER);
```

#### Issue 18: Replace region with audience_geography
- **File**: `src/lib/types.ts`
- Add new type `AudienceGeography` with same values as `Region`
- Add `audienceGeography?: AudienceGeography` to `CreatorProfile`
- Deprecate `region` field (keep for backwards compat)

- **File**: `src/lib/pricing-engine.ts`
- Update `getRegionalMultiplier` to prefer `audienceGeography` over `region`
- Add migration comment

#### Issue 19: Raise UGC base rates
- **File**: `src/lib/pricing-engine.ts`
- Find `UGC_BASE_RATES` or equivalent
- Update: photo $100 → $200, video $175 → $275
- Add comment: "Raised to align with 'don't undersell' mission"

#### Issue 20: Cap retainer discounts
- **File**: `src/lib/pricing-engine.ts`
- Find `RETAINER_DISCOUNTS` or equivalent
- Cap maximum discount at 20% (was 35%)
- Update discount tiers proportionally

#### Issue 21: Platform-specific engagement normalization
- **File**: `src/lib/pricing-engine.ts`
- Create `PLATFORM_ENGAGEMENT_NORMS` constant:
```typescript
const PLATFORM_ENGAGEMENT_NORMS: Record<Platform, number> = {
  instagram: 1.0,      // baseline
  tiktok: 1.67,        // 5% TikTok = 3% Instagram
  youtube: 0.67,       // 2% YouTube = 3% Instagram
  twitter: 0.8,
  // ... etc
};
```
- Normalize engagement rate before applying multiplier

#### Issue 22: Fix usage rights + whitelisting overlap
- **File**: `src/lib/pricing-engine.ts`
- Make whitelisting a fixed add-on with cap, not multiplicative
- If usage rights already applied, whitelisting adds flat amount based on tier
- Cap whitelisting premium at +100% (not +200%)

#### Issue 23: Soften niche premiums
- **File**: `src/lib/pricing-engine.ts`
- Find `NICHE_PREMIUMS` constant
- Remove penalties below 1.0x (gaming 0.95x → 1.0x)
- Reduce extreme premiums (finance 2.0x → 1.5x)
- Add comment explaining conservative approach

### Success Criteria
- [ ] Multiplier cap at 3.0x implemented
- [ ] `audienceGeography` field added to types
- [ ] UGC rates raised
- [ ] Retainer discount capped at 20%
- [ ] Engagement normalized by platform
- [ ] Whitelisting not double-counting
- [ ] No niche penalties below 1.0x
- [ ] All existing tests pass
- [ ] `pnpm build` succeeds

---

## Prompt 4: Design & UX Fixes

**Issues Addressed**: 24, 25, 26, 27, 28, 29, 30, 31
**Files Modified**:
- `src/components/quick-calculator-result.tsx`
- `src/app/quick-calculate/page.tsx`
- `src/app/(dashboard)/analyze/page.tsx`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/(dashboard)/gifts/page.tsx`
- Various header components

### Requirements

#### Issue 24: Remove emoji
- **File**: `src/components/quick-calculator-result.tsx`
- Remove `<p className="text-3xl mb-2">💡</p>`
- Replace with appropriate Lucide icon (e.g., `<Lightbulb className="h-8 w-8 text-primary" />`)

#### Issue 25: Fix coral color semantic violation
- **File**: `src/components/quick-calculator-result.tsx`
- Change `text-coral` for "$340" stat to `text-primary` or `text-foreground`
- Coral is for celebrations, not warnings

#### Issue 26: Fix percentile bar visualization
- **File**: `src/components/quick-calculator-result.tsx`
- Current: Shows $0 to $X but positions marker using percentile%
- Fix: Either show 0-100 percentile scale OR position marker based on dollar value
- Recommended: Change to percentile scale (0% to 100%) with marker at calculated position

#### Issue 27: Fix mobile cramping
- **File**: `src/components/quick-calculator-result.tsx`
- Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for missing factors section
- Ensure long descriptions don't overflow

#### Issue 28: Standardize header pattern
- Create consistent header component for public pages
- All public pages should have: Logo | [spacer] | "Sign in" | "Get Started" (primary)
- **Files**:
  - `src/app/quick-calculate/page.tsx`
  - `src/app/page.tsx`
  - Any other public pages

#### Issue 29: Add minimal profile mode
- **File**: `src/app/(dashboard)/profile/page.tsx`
- Add "Quick Setup" option that only asks for:
  - Primary platform
  - Follower count
  - (Optional) Engagement rate
- Show "Add more details for accuracy" expansion
- Save minimal profile as valid

#### Issue 30: Inline profile capture in Analyze
- **File**: `src/app/(dashboard)/analyze/page.tsx`
- Instead of hard-blocking with "Complete your profile first"
- Show inline form: "To analyze, tell us about your account:"
  - Platform dropdown
  - Follower count input
  - Continue button
- Save to profile on submit, then proceed with analysis

#### Issue 31: Fix purple icon color
- **File**: `src/app/(dashboard)/gifts/page.tsx`
- Find `text-purple-600` or similar hard-coded purple
- Replace with `text-primary`

### Success Criteria
- [ ] No emoji in result component
- [ ] Coral color only used for celebrations
- [ ] Percentile bar makes visual sense
- [ ] Missing factors readable on mobile
- [ ] Consistent header across public pages
- [ ] Minimal profile mode works
- [ ] Analyze page doesn't hard-block
- [ ] No hard-coded purple
- [ ] `pnpm build` succeeds

---

## Prompt 5: Architecture Improvements

**Issues Addressed**: 32, 33, 34, 35, 36, 37
**Files Modified**:
- `src/app/api/quick-calculate/route.ts` (NEW)
- `src/components/quick-calculator-form.tsx`
- `src/lib/quick-calculator.ts`
- Various dashboard files

### Requirements

#### Issue 32: Unify to server-side calculation
- Create new API route: `src/app/api/quick-calculate/route.ts`
```typescript
// POST /api/quick-calculate
// Accepts: { followerCount, platform, contentFormat, niche }
// Returns: QuickEstimateResult
// Includes: rate limiting, analytics hooks
```
- Update `quick-calculator-form.tsx` to call API instead of client-side function
- Keep client-side function for fallback/offline

#### Issue 33: Add follower count validation
- **File**: `src/components/quick-calculator-form.tsx`
- Add maximum: 10,000,000 (10M) followers
- Show tier-appropriate messaging for celebrity tier
- If > 1M followers, show: "For celebrity-tier creators, we recommend a custom consultation"

#### Issue 34: Migrate localStorage to server
- **Priority files**:
  - `src/app/(dashboard)/rates/page.tsx` (saved rates)
  - `src/app/(dashboard)/generate/page.tsx` (current brief)
- For authenticated users, save to database via API
- Keep localStorage as fallback for unauthenticated/offline
- Add migration: on auth, sync localStorage to server

#### Issue 35: Add analytics events
- Create analytics utility: `src/lib/analytics.ts`
```typescript
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  // Console log in dev, send to analytics service in prod
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }
  // TODO: Add real analytics service
}
```
- Add events:
  - `quick_calculate_submit` (with platform, tier)
  - `quick_calculate_result_view` (with rate range)
  - `quick_calculate_cta_click` (which CTA)
  - `signup_from_calculator`

#### Issue 36: Add rate limiting
- **File**: `src/app/api/quick-calculate/route.ts`
- Implement simple rate limiting:
  - 10 requests per minute per IP
  - Return 429 if exceeded
- Use in-memory store (upgrade to Redis later)

#### Issue 37: Make missing factors dynamic
- **File**: `src/lib/quick-calculator.ts`
- Update `MISSING_FACTORS` to be a function that returns relevant factors based on input:
```typescript
export function getMissingFactors(input: QuickCalculatorInput): MissingFactor[] {
  const factors: MissingFactor[] = [];

  // Always show engagement (everyone can improve)
  factors.push(ENGAGEMENT_FACTOR);

  // Show location factor if not US platform
  if (input.platform !== 'linkedin') {
    factors.push(LOCATION_FACTOR);
  }

  // Show brand work factor for non-nano
  if (calculateTier(input.followerCount) !== 'nano') {
    factors.push(BRAND_WORK_FACTOR);
  }

  // Show quality factor for video formats
  if (['reel', 'video'].includes(input.contentFormat)) {
    factors.push(QUALITY_FACTOR);
  }

  return factors.slice(0, 4); // Max 4
}
```

### Success Criteria
- [ ] New `/api/quick-calculate` route exists
- [ ] Form calls API (with client fallback)
- [ ] Follower count has max validation
- [ ] Analytics events fire in console (dev)
- [ ] Rate limiting returns 429 when exceeded
- [ ] Missing factors vary based on input
- [ ] `pnpm build` succeeds

---

## Prompt 6: Legal Disclaimers

**Issues Addressed**: 38, 39
**Files Modified**:
- `src/app/(dashboard)/tools/contract-scanner/page.tsx`
- `src/app/(dashboard)/tools/brand-vetter/page.tsx`

### Requirements

#### Issue 38: Contract Scanner disclaimer
- **File**: `src/app/(dashboard)/tools/contract-scanner/page.tsx`
- Add prominent disclaimer banner at top:
```tsx
<Alert variant="warning" className="mb-6">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Not Legal Advice</AlertTitle>
  <AlertDescription>
    This tool provides general guidance only and is not a substitute for
    professional legal advice. Always consult a qualified attorney before
    signing contracts.
  </AlertDescription>
</Alert>
```
- Add footer disclaimer on results

#### Issue 39: Brand Vetter signals language
- **File**: `src/app/(dashboard)/tools/brand-vetter/page.tsx`
- Change "legitimate" to "signals"
- Change "Trust Level: Verified" to "Trust Signals: Strong"
- Add disclaimer:
```tsx
<Alert className="mb-6">
  <Info className="h-4 w-4" />
  <AlertTitle>Signals, Not Guarantees</AlertTitle>
  <AlertDescription>
    This tool analyzes publicly available signals but cannot guarantee
    brand legitimacy. Always do your own research before accepting deals.
  </AlertDescription>
</Alert>
```
- Update result labels: "Verified" → "Strong Signals", "High Risk" → "Caution Advised"

### Success Criteria
- [ ] Contract Scanner has prominent disclaimer
- [ ] Brand Vetter uses "signals" language
- [ ] No "Verified" or "legitimate" claims
- [ ] Both tools have appropriate warnings
- [ ] `pnpm build` succeeds

---

## Prompt 7: Scope Cleanup

**Issues Addressed**: 40, 41, 42, 43
**Files Modified**:
- `src/app/(dashboard)/gifts/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/lib/outcome-analytics.ts`
- `src/lib/deal-quality-score.ts`

### Requirements

#### Issue 40: Defer Gift Tracking CRM
- **File**: `src/app/(dashboard)/gifts/page.tsx`
- Keep only the Gift Evaluator tab/functionality
- Remove any tracking, CRM, or history features
- Remove database writes for gift tracking (keep evaluator stateless)

#### Issue 41: Make Outcome Tracking internal-only
- **File**: `src/lib/outcome-analytics.ts`
- Add comment: "INTERNAL USE ONLY - Not exposed in UI"
- Remove any UI components that surface outcome analytics to users
- Keep the logic for future internal dashboards

#### Issue 42: Hide Tools from primary nav
- **File**: `src/app/(dashboard)/layout.tsx`
- Move "Tools" from primary nav to a submenu or "More" section
- Or rename to "Advanced Tools" with visual de-emphasis
- Tools should be discoverable but not prominent

#### Issue 43: Clean up Deal Quality → Fit mapping
- **File**: `src/lib/deal-quality-score.ts`
- Remove `calculateDealQualityWithCompat` function
- Create clean `calculateDealQuality` that doesn't reference Fit Score
- Update all callers to use new function
- Add deprecation comments to any remaining Fit Score code

### Success Criteria
- [ ] Gift page is evaluator-only
- [ ] No user-facing outcome analytics
- [ ] Tools de-emphasized in nav
- [ ] No Fit Score compatibility layer in active use
- [ ] `pnpm build` succeeds

---

## Prompt 8: Final Testing & Polish

**Files**: All modified files
**Focus**: Integration testing, edge cases, visual QA

### Requirements

#### Build & Lint
```bash
pnpm lint
pnpm build
```

#### Manual Testing Checklist

**Public Flow (unauthenticated)**:
- [ ] Homepage loads, CTA goes to /quick-calculate
- [ ] Quick Calculator accepts input, shows result
- [ ] No fake statistics visible
- [ ] Percentile labeled as "estimated"
- [ ] Result page has proper mobile layout
- [ ] /quote returns 404
- [ ] Sign up flow works

**Authenticated Flow**:
- [ ] Dashboard loads without errors
- [ ] Inbox accepts text AND file upload
- [ ] Profile has minimal mode option
- [ ] Analyze doesn't hard-block without profile
- [ ] Generate page shows Deal Quality (not Fit Score)
- [ ] Rates are saved to server (not just localStorage)
- [ ] Tools section is de-emphasized
- [ ] Contract Scanner has disclaimer
- [ ] Brand Vetter uses "signals" language
- [ ] Gifts page is evaluator-only

**Pricing Engine**:
- [ ] Multiplier never exceeds 3.0x
- [ ] UGC rates are $200+ (photo) / $275+ (video)
- [ ] Retainer discount maxes at 20%
- [ ] No niche penalties below 1.0x

**API**:
- [ ] /api/quick-calculate returns valid result
- [ ] Rate limiting works (test with 11+ rapid requests)
- [ ] Analytics events log in console

### Success Criteria
- [ ] All manual tests pass
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes

---

## Quick Reference

| Prompt | Focus | Issues | Est. Complexity |
|--------|-------|--------|-----------------|
| 0 | Ethical Fixes | 1-6 | Low |
| 1 | Route Consolidation | 7-11 | High |
| 2 | Copy Cleanup | 12-16 | Medium |
| 3 | Pricing Engine | 17-23 | High |
| 4 | Design/UX | 24-31 | Medium |
| 5 | Architecture | 32-37 | High |
| 6 | Legal Disclaimers | 38-39 | Low |
| 7 | Scope Cleanup | 40-43 | Medium |
| 8 | Testing & Polish | All | Medium |

---

## File Change Summary

### Files to DELETE
- `src/app/quote/` (entire directory)
- `src/app/(dashboard)/quick-quote/` (entire directory)
- `src/app/(dashboard)/upload/page.tsx` (after merge to Inbox)

### Files to CREATE
- `src/app/api/quick-calculate/route.ts`
- `src/lib/analytics.ts`

### Major Modifications
- `src/lib/pricing-engine.ts` (7 changes)
- `src/components/quick-calculator-result.tsx` (6 changes)
- `src/app/(dashboard)/layout.tsx` (nav changes)
- `src/app/(dashboard)/analyze/page.tsx` (file upload + inline profile)
- `src/app/(dashboard)/profile/page.tsx` (minimal mode)
- `src/lib/quick-calculator.ts` (dynamic factors)
- `src/lib/types.ts` (audience geography)

---

## Commit Strategy

After each prompt:
```bash
git add -A
git commit -m "refactor: [prompt description]"
```

After all prompts:
```bash
git push -u origin claude/analyze-test-coverage-hWgZz
```

Create PR with title: "V6: System Integrity Refactor (43 issues)"
