# V6 Implementation Prompt Sequence

**Total Prompts**: 20 (including setup, testing, commits, and clears)
**Branch**: `claude/analyze-test-coverage-hWgZz`

---

## Pre-Implementation

### Step 1: Setup
```
Read IMPLEMENTATION_PLAN_V6.md to understand all 43 issues being addressed. Confirm you understand the scope before proceeding.
```

---

## Prompt 0: Critical Ethical Fixes

### Step 2: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 0 exactly as written. Address issues 1, 3, and 4 only (issues 2, 5, 6 are marked KEEP AS IS). Remove fabricated "10,000+ creators" claims, remove fake testimonial, and label percentile data as "estimated". Do not modify any pricing logic.
```

### Step 3: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Verify that no "10,000+ creators" text exists in the codebase. Verify the testimonial section is removed. Verify percentile labels say "estimated".
```

### Step 4: Commit
```
Stage all changes and commit with message: "fix: remove fabricated statistics and fake testimonial, label estimates clearly"
```

### Step 5: Clear
```
/clear
```

---

## Prompt 1: Route Consolidation

### Step 6: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 1 exactly as written. Delete /quote and /dashboard/quick-quote directories. Move brief upload functionality into the Inbox (/dashboard/analyze). Remove Coming Soon pages from navigation. Update all internal links that referenced deleted routes.
```

### Step 7: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Verify /quote route no longer exists in the codebase. Verify /dashboard/quick-quote no longer exists. Verify brief upload works in Inbox. Verify no "Coming Soon" in navigation.
```

### Step 8: Commit
```
Stage all changes and commit with message: "refactor: consolidate rate paths, remove orphaned routes, integrate brief upload into Inbox"
```

### Step 9: Clear
```
/clear
```

---

## Prompt 2: Copy & Terminology Cleanup

### Step 10: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 2 exactly as written. Standardize all timing references to "30 seconds". Remove specific layer counts from UI copy. Update "2025" to "2026" in industry standards copy. Replace all user-facing "Fit Score" with "Deal Quality". Remove "Real Rate" language that contradicts estimate.
```

### Step 11: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Search codebase for "60 seconds" - should find none in UI. Search for "Fit Score" - should find none in user-facing components. Search for "2025" in copy - should be updated.
```

### Step 12: Commit
```
Stage all changes and commit with message: "fix: standardize copy, update terminology to Deal Quality, fix stale year references"
```

### Step 13: Clear
```
/clear
```

---

## Prompt 3: Pricing Engine Fixes

### Step 14: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 3 exactly as written. Add MAX_TOTAL_MULTIPLIER cap of 3.0x. Add audienceGeography field to types. Raise UGC base rates to $200 photo / $275 video. Cap retainer discounts at 20%. Add platform-specific engagement normalization. Fix whitelisting to not double-count with usage rights. Remove niche penalties below 1.0x.
```

### Step 15: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Write a simple test or console check that verifies: (1) extreme multiplier stacking doesn't exceed 3.0x, (2) UGC rates are correct, (3) no niche premium is below 1.0.
```

### Step 16: Commit
```
Stage all changes and commit with message: "refactor: cap multipliers, fix double-counting, raise UGC rates, normalize engagement by platform"
```

### Step 17: Clear
```
/clear
```

---

## Prompt 4: Design & UX Fixes

### Step 18: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 4 exactly as written. Remove emoji and replace with Lucide icon. Fix coral color semantic violation. Fix percentile bar to use consistent scale. Add responsive grid for mobile. Standardize header pattern across public pages. Add minimal profile mode. Add inline profile capture in Analyze page. Fix purple icon to use primary color.
```

### Step 19: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Manually check quick-calculator-result.tsx has no emoji. Check mobile responsiveness with grid-cols-1 sm:grid-cols-2. Verify headers are consistent.
```

### Step 20: Commit
```
Stage all changes and commit with message: "fix: UX improvements - remove emoji, fix colors, improve mobile layout, add minimal profile mode"
```

### Step 21: Clear
```
/clear
```

---

## Prompt 5: Architecture Improvements

### Step 22: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 5 exactly as written. Create new /api/quick-calculate route with rate limiting. Update quick-calculator-form to call API. Add follower count max validation (10M). Create analytics utility with event tracking. Make missing factors dynamic based on input.
```

### Step 23: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Test the new API route manually with curl or browser. Verify rate limiting returns 429 after 10 rapid requests. Check console for analytics events in dev mode.
```

### Step 24: Commit
```
Stage all changes and commit with message: "feat: add server-side calculation API with rate limiting and analytics hooks"
```

### Step 25: Clear
```
/clear
```

---

## Prompt 6: Legal Disclaimers

### Step 26: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 6 exactly as written. Add "Not Legal Advice" disclaimer to Contract Scanner. Change Brand Vetter to use "signals" language instead of "legitimate" or "Verified". Add appropriate warning alerts to both tools.
```

### Step 27: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Verify Contract Scanner page has visible disclaimer. Verify Brand Vetter says "signals" not "legitimate".
```

### Step 28: Commit
```
Stage all changes and commit with message: "fix: add legal disclaimers to Contract Scanner and Brand Vetter"
```

### Step 29: Clear
```
/clear
```

---

## Prompt 7: Scope Cleanup

### Step 30: Implement
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 7 exactly as written. Simplify Gifts page to evaluator-only. Remove user-facing outcome analytics. De-emphasize Tools in navigation. Clean up Deal Quality compatibility layer removing Fit Score references.
```

### Step 31: Test
```
Run `pnpm lint && pnpm build` and fix any errors. Verify Gifts page has no tracking/CRM features. Verify Tools is de-emphasized in nav. Verify no Fit Score compatibility layer in active code paths.
```

### Step 32: Commit
```
Stage all changes and commit with message: "refactor: reduce scope - simplify gifts, hide outcome tracking, de-emphasize tools"
```

### Step 33: Clear
```
/clear
```

---

## Prompt 8: Final Testing & Polish

### Step 34: Full Test Suite
```
Read IMPLEMENTATION_PLAN_V6.md and execute Prompt 8 testing checklist. Run full build and lint. Manually test all public flows (homepage → quick-calculate → result). Test authenticated flows (dashboard, inbox, profile, generate). Verify pricing engine constraints. Test API rate limiting. Document any issues found.
```

### Step 35: Fix Issues
```
Fix any issues discovered during testing. Ensure all 43 issues from the original list are addressed. Run `pnpm lint && pnpm build` one final time.
```

### Step 36: Final Commit
```
Stage all remaining changes and commit with message: "test: final testing and polish for V6 refactor"
```

---

## Post-Implementation

### Step 37: Push
```
Push all commits to remote: git push -u origin claude/analyze-test-coverage-hWgZz
```

### Step 38: Summary
```
Provide a summary of all changes made across the 9 prompts. List any issues that could not be fully addressed and why. Confirm the 43 issues have been resolved.
```

---

## Quick Copy-Paste Prompts

For convenience, here are the core implementation prompts ready to paste:

---

**Prompt 0:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 0 exactly as written. Address issues 1, 3, and 4 only (issues 2, 5, 6 are marked KEEP AS IS). Remove fabricated "10,000+ creators" claims, remove fake testimonial, and label percentile data as "estimated". Do not modify any pricing logic.
```

**Prompt 1:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 1 exactly as written. Delete /quote and /dashboard/quick-quote directories. Move brief upload functionality into the Inbox (/dashboard/analyze). Remove Coming Soon pages from navigation. Update all internal links that referenced deleted routes.
```

**Prompt 2:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 2 exactly as written. Standardize all timing references to "30 seconds". Remove specific layer counts from UI copy. Update "2025" to "2026" in industry standards copy. Replace all user-facing "Fit Score" with "Deal Quality". Remove "Real Rate" language that contradicts estimate.
```

**Prompt 3:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 3 exactly as written. Add MAX_TOTAL_MULTIPLIER cap of 3.0x. Add audienceGeography field to types. Raise UGC base rates to $200 photo / $275 video. Cap retainer discounts at 20%. Add platform-specific engagement normalization. Fix whitelisting to not double-count with usage rights. Remove niche penalties below 1.0x.
```

**Prompt 4:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 4 exactly as written. Remove emoji and replace with Lucide icon. Fix coral color semantic violation. Fix percentile bar to use consistent scale. Add responsive grid for mobile. Standardize header pattern across public pages. Add minimal profile mode. Add inline profile capture in Analyze page. Fix purple icon to use primary color.
```

**Prompt 5:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 5 exactly as written. Create new /api/quick-calculate route with rate limiting. Update quick-calculator-form to call API. Add follower count max validation (10M). Create analytics utility with event tracking. Make missing factors dynamic based on input.
```

**Prompt 6:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 6 exactly as written. Add "Not Legal Advice" disclaimer to Contract Scanner. Change Brand Vetter to use "signals" language instead of "legitimate" or "Verified". Add appropriate warning alerts to both tools.
```

**Prompt 7:**
```
Read IMPLEMENTATION_PLAN_V6.md and implement Prompt 7 exactly as written. Simplify Gifts page to evaluator-only. Remove user-facing outcome analytics. De-emphasize Tools in navigation. Clean up Deal Quality compatibility layer removing Fit Score references.
```

**Prompt 8:**
```
Read IMPLEMENTATION_PLAN_V6.md and execute Prompt 8 testing checklist. Run full build and lint. Manually test all public flows (homepage → quick-calculate → result). Test authenticated flows (dashboard, inbox, profile, generate). Verify pricing engine constraints. Test API rate limiting. Fix any issues found and commit.
```

---

## Issue Tracking

| Issue # | Description | Prompt | Status |
|---------|-------------|--------|--------|
| 1 | Fabricated "10,000+ creators" | 0 | Pending |
| 2 | "73% undercharge" stat | - | KEEP |
| 3 | Fake testimonial | 0 | Pending |
| 4 | Fake percentile data | 0 | Pending |
| 5 | Arbitrary potential rate | - | KEEP |
| 6 | "$200-$800 swing" claim | - | KEEP |
| 7 | 4 overlapping rate paths | 1 | Pending |
| 8 | Orphaned /quote route | 1 | Pending |
| 9 | Redundant /dashboard/quick-quote | 1 | Pending |
| 10 | Standalone /dashboard/upload | 1 | Pending |
| 11 | Coming Soon in nav | 1 | Pending |
| 12 | "30s" vs "60s" conflict | 2 | Pending |
| 13 | "6-layer" vs "11-layer" | 2 | Pending |
| 14 | "2025" stale copy | 2 | Pending |
| 15 | Fit Score vs Deal Quality | 2 | Pending |
| 16 | "Real" vs "Estimate" | 2 | Pending |
| 17 | Multiplier stacking | 3 | Pending |
| 18 | Regional multipliers | 3 | Pending |
| 19 | UGC rates too low | 3 | Pending |
| 20 | Retainer discounts | 3 | Pending |
| 21 | Platform engagement | 3 | Pending |
| 22 | Usage + whitelisting | 3 | Pending |
| 23 | Niche premiums | 3 | Pending |
| 24 | Emoji in tool | 4 | Pending |
| 25 | Coral color violation | 4 | Pending |
| 26 | Percentile bar | 4 | Pending |
| 27 | Mobile cramping | 4 | Pending |
| 28 | Header inconsistency | 4 | Pending |
| 29 | Profile too heavy | 4 | Pending |
| 30 | Hard profile gating | 4 | Pending |
| 31 | Purple icon | 4 | Pending |
| 32 | Client vs server calc | 5 | Pending |
| 33 | No follower max | 5 | Pending |
| 34 | localStorage reliance | 5 | Pending |
| 35 | No analytics | 5 | Pending |
| 36 | No rate limiting | 5 | Pending |
| 37 | Static missing factors | 5 | Pending |
| 38 | Contract Scanner disclaimer | 6 | Pending |
| 39 | Brand Vetter "legitimate" | 6 | Pending |
| 40 | Gift Tracking CRM | 7 | Pending |
| 41 | Outcome Tracking | 7 | Pending |
| 42 | Tools in primary nav | 7 | Pending |
| 43 | Fit mapping hack | 7 | Pending |
