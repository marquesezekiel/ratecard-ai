# IMPLEMENTATION_PLAN_V7: Web Accessibility

## Overview

This implementation plan ensures RateCard.AI is fully accessible to all users, including those with disabilities. We're targeting **WCAG 2.2 Level AA compliance** as the minimum standard, with select AAA enhancements where practical.

**Why This Matters:**
- ~15% of the global population has some form of disability
- Legal compliance (ADA, Section 508, European Accessibility Act)
- Better SEO and overall UX for everyone
- Aligns with our mission: helping ALL creators know their worth

**Reference:** Based on [Hostinger Web Accessibility Guide](https://hostinger.com/tutorials/web-accessibility) and WCAG 2.2 guidelines.

---

## POUR Framework

All changes follow the WCAG POUR principles:

| Principle | Meaning | Our Focus |
|-----------|---------|-----------|
| **Perceivable** | Content available to all senses | Alt text, color contrast, captions |
| **Operable** | Works with any input method | Keyboard nav, skip links, timing |
| **Understandable** | Clear language and predictable UI | Plain language, error handling |
| **Robust** | Works with assistive technologies | Semantic HTML, ARIA, screen readers |

---

## Current State Summary

Based on codebase audit:

| Category | Status | Priority |
|----------|--------|----------|
| Skip Links | **MISSING** | P0 |
| Alt Text | **MISSING** | P0 |
| ARIA Labels (icon buttons) | Partial | P0 |
| Focus Management | Good | P1 |
| Semantic HTML | Good | P1 |
| Color Contrast | Needs verification | P1 |
| Form Accessibility | Good, needs polish | P1 |
| Keyboard Navigation | Good (via Radix) | P2 |
| Motion Preferences | **MISSING** | P1 |
| Screen Reader Support | Partial | P1 |

---

## Implementation Phases

### Phase 0: Critical Blockers (WCAG A)
Issues that block basic accessibility compliance.

### Phase 1: Core Compliance (WCAG AA)
Standard accessibility features expected by users.

### Phase 2: Enhanced Experience (WCAG AA+)
Polish and advanced features for power users.

### Phase 3: Excellence (WCAG AAA Select)
Best-in-class accessibility where practical.

---

## Phase 0: Critical Blockers

### Issue 1: Add Skip Links
**Priority:** P0 | **WCAG:** 2.4.1 Bypass Blocks (A)

Skip links allow keyboard users to bypass repetitive navigation.

**Files:**
- `src/app/layout.tsx`
- `src/app/dashboard/layout.tsx`

**Implementation:**
```tsx
// Add as first element inside <body>
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
>
  Skip to main content
</a>

// Add id to <main> element
<main id="main-content">
```

**Acceptance Criteria:**
- [ ] Skip link visible only on focus
- [ ] Tab key from page load focuses skip link first
- [ ] Activating skip link moves focus to main content
- [ ] Works on all page layouts

---

### Issue 2: Add Alt Text to Images
**Priority:** P0 | **WCAG:** 1.1.1 Non-text Content (A)

All images must have descriptive alt text or be marked decorative.

**Files to audit:**
- Any component using `<img>` tags
- Avatar components (need meaningful alt)
- Uploaded screenshots in message analyzer
- Brand logos in vetting results

**Implementation Pattern:**
```tsx
// Informative images
<img src={src} alt="Brand logo for Nike showing swoosh symbol" />

// Decorative images (empty alt, not missing)
<img src={decorative} alt="" role="presentation" />

// Complex images (use aria-describedby)
<img
  src={chart}
  alt="Rate comparison chart"
  aria-describedby="chart-description"
/>
<div id="chart-description" className="sr-only">
  Chart showing your rate of $450 compared to average of $320...
</div>
```

**Avatar Component Update:**
```tsx
// src/components/ui/avatar.tsx
<AvatarFallback>
  <span className="sr-only">{userName}'s avatar</span>
  {initials}
</AvatarFallback>
```

**Acceptance Criteria:**
- [ ] All `<img>` tags have alt attribute
- [ ] Decorative images have `alt=""`
- [ ] Avatar shows user name to screen readers
- [ ] Uploaded images have contextual alt text

---

### Issue 3: ARIA Labels for Icon-Only Buttons
**Priority:** P0 | **WCAG:** 1.1.1 Non-text Content (A), 4.1.2 Name, Role, Value (A)

Buttons with only icons need accessible names.

**Files:**
- `src/components/navigation/menu-sheet.tsx` (menu button)
- `src/components/ui/copy-button.tsx`
- `src/components/dashboard/inline-message-analyzer.tsx` (action buttons)
- Any button with only a Lucide icon

**Implementation:**
```tsx
// Before (inaccessible)
<Button variant="ghost" size="icon">
  <Menu className="h-5 w-5" />
</Button>

// After (accessible)
<Button variant="ghost" size="icon" aria-label="Open menu">
  <Menu className="h-5 w-5" aria-hidden="true" />
</Button>
```

**Common Labels Needed:**
| Icon | aria-label |
|------|------------|
| Menu | "Open menu" |
| X/Close | "Close" or "Close [thing]" |
| Copy | "Copy to clipboard" |
| Refresh | "Refresh" or "Try again" |
| ChevronDown | "Expand" or "Show more" |
| ChevronUp | "Collapse" or "Show less" |
| Settings | "Settings" |
| Trash | "Delete" |
| Edit | "Edit" |

**Acceptance Criteria:**
- [ ] All icon-only buttons have aria-label
- [ ] Icons inside buttons have aria-hidden="true"
- [ ] Screen reader announces button purpose

---

### Issue 4: Add aria-current to Active Navigation
**Priority:** P0 | **WCAG:** 1.3.1 Info and Relationships (A)

Active navigation links should indicate current page.

**Files:**
- `src/app/dashboard/layout.tsx` (TopNavLink, BottomNavLink)
- `src/components/navigation/menu-sheet.tsx`

**Implementation:**
```tsx
function TopNavLink({ href, isActive, ...props }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        isActive ? "bg-accent text-foreground" : "text-muted-foreground"
      )}
    >
      ...
    </Link>
  );
}
```

**Acceptance Criteria:**
- [ ] Active nav link has aria-current="page"
- [ ] Screen reader announces "current page" for active link
- [ ] Works on both desktop and mobile navigation

---

### Issue 5: Respect prefers-reduced-motion
**Priority:** P0 | **WCAG:** 2.3.3 Animation from Interactions (AAA, but critical for vestibular disorders)

Users who prefer reduced motion should not see animations.

**File:** `src/app/globals.css`

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-sparkle,
  .animate-bounce-subtle,
  .animate-fade-in,
  .animate-slide-up,
  .animate-spin {
    animation: none !important;
  }
}
```

**Acceptance Criteria:**
- [ ] Animations disabled when prefers-reduced-motion is set
- [ ] Essential transitions still work (just faster)
- [ ] Confetti celebrations respect motion preference
- [ ] Loading spinners still indicate loading (but don't spin)

---

## Phase 1: Core Compliance (WCAG AA)

### Issue 6: Color Contrast Verification
**Priority:** P1 | **WCAG:** 1.4.3 Contrast Minimum (AA)

Verify all text meets 4.5:1 ratio (3:1 for large text).

**Files:**
- `src/app/globals.css` (color definitions)
- `tailwind.config.ts` (if custom colors)

**Colors to Verify:**
| Color Variable | Usage | Verify Against |
|----------------|-------|----------------|
| `--muted-foreground` | Secondary text | `--background` |
| `--primary` | Buttons, links | `--primary-foreground` |
| `text-money` | Rate amounts | `--background` |
| `text-energy` | Deal scores | `--background` |
| `text-coral` | Accents | `--background` |

**Tools:**
- WebAIM Contrast Checker
- Stark (Figma plugin)
- Chrome DevTools color picker

**Acceptance Criteria:**
- [ ] All text colors pass WCAG AA (4.5:1)
- [ ] Large text (18px+ bold, 24px+ regular) passes 3:1
- [ ] Focus indicators have 3:1 contrast
- [ ] Document any exceptions with justification

---

### Issue 7: Form Required Field Indicators
**Priority:** P1 | **WCAG:** 3.3.2 Labels or Instructions (A)

Required fields must be clearly indicated.

**Files:**
- `src/components/ui/label.tsx`
- `src/components/ui/input.tsx`
- All form components in `src/components/forms/`

**Implementation:**
```tsx
// Update Label component
export function Label({ required, children, ...props }) {
  return (
    <LabelPrimitive {...props}>
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-hidden="true">*</span>
      )}
      {required && <span className="sr-only">(required)</span>}
    </LabelPrimitive>
  );
}

// Update Input to include required attribute
<Input required aria-required="true" />
```

**Form Instructions Pattern:**
```tsx
// At top of form
<p className="text-sm text-muted-foreground mb-4">
  Fields marked with <span className="text-destructive">*</span> are required.
</p>
```

**Acceptance Criteria:**
- [ ] Required fields have visual indicator (*)
- [ ] Screen readers announce "required"
- [ ] HTML required attribute set
- [ ] Form has instructions about required fields

---

### Issue 8: Live Regions for Dynamic Content
**Priority:** P1 | **WCAG:** 4.1.3 Status Messages (AA)

Dynamic updates must be announced to screen readers.

**Files:**
- `src/components/forms/message-analyzer-form.tsx`
- `src/components/forms/quick-calculator-form.tsx`
- `src/components/quick-calculator-result.tsx`
- Toast/notification system

**Implementation:**
```tsx
// For status updates (polite - waits for user to finish)
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && "Analyzing your message..."}
  {isComplete && "Analysis complete. Results shown below."}
</div>

// For errors (assertive - interrupts immediately)
<div role="alert" aria-live="assertive">
  {error && `Error: ${error}`}
</div>

// For rate calculation results
<div aria-live="polite" aria-atomic="true">
  {result && (
    <span className="sr-only">
      Your estimated rate is ${result.minRate} to ${result.maxRate}
    </span>
  )}
</div>
```

**Acceptance Criteria:**
- [ ] Loading states announced
- [ ] Success messages announced
- [ ] Error messages announced immediately
- [ ] Calculation results announced

---

### Issue 9: Focus Management in Modals
**Priority:** P1 | **WCAG:** 2.4.3 Focus Order (A)

Focus must be trapped in modals and restored on close.

**Files:**
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/onboarding/dashboard-tour.tsx`

**Verification:**
Radix UI should handle this, but verify:
- [ ] Focus moves to modal when opened
- [ ] Tab key cycles within modal only
- [ ] Escape closes modal
- [ ] Focus returns to trigger button on close

**If fixes needed:**
```tsx
// Use Radix's built-in focus management
<Dialog.Content
  onOpenAutoFocus={(e) => {
    // Focus first focusable element
    e.preventDefault();
    firstInputRef.current?.focus();
  }}
  onCloseAutoFocus={(e) => {
    // Return focus to trigger
    e.preventDefault();
    triggerRef.current?.focus();
  }}
>
```

---

### Issue 10: Heading Hierarchy Audit
**Priority:** P1 | **WCAG:** 1.3.1 Info and Relationships (A)

Ensure proper heading levels without skipping.

**Pattern:**
```
h1: Page title (one per page)
  h2: Major sections
    h3: Subsections
      h4: Sub-subsections (rare)
```

**Files to Audit:**
- All page components in `src/app/`
- Card headers (should they be headings?)
- Modal titles

**Common Issues:**
- Multiple h1 tags on a page
- Skipping from h1 to h3
- Using headings for styling, not structure

**Acceptance Criteria:**
- [ ] Each page has exactly one h1
- [ ] No heading levels skipped
- [ ] Headings reflect content structure
- [ ] Screen reader heading navigation works

---

### Issue 11: Link Purpose Clarity
**Priority:** P1 | **WCAG:** 2.4.4 Link Purpose (A)

Links must have clear, descriptive text.

**Anti-patterns to fix:**
```tsx
// Bad
<Link href="/pricing">Click here</Link>
<Link href="/docs">Learn more</Link>

// Good
<Link href="/pricing">View pricing plans</Link>
<Link href="/docs">Learn more about rate calculation</Link>

// Or use aria-label for context
<Link href="/pricing" aria-label="View pricing plans">
  Learn more
</Link>
```

**Acceptance Criteria:**
- [ ] No "click here" or "read more" links without context
- [ ] Link text describes destination
- [ ] Links distinguishable from surrounding text (not just color)

---

## Phase 2: Enhanced Experience

### Issue 12: Breadcrumb Navigation
**Priority:** P2 | **WCAG:** 2.4.8 Location (AAA)

Add breadcrumbs to help users understand location.

**Files:**
- Create `src/components/ui/breadcrumb.tsx`
- Add to nested pages like `/dashboard/tools/brand-vetter`

**Implementation:**
```tsx
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2 text-sm">
    <li>
      <Link href="/dashboard">Home</Link>
    </li>
    <li aria-hidden="true">/</li>
    <li>
      <Link href="/dashboard/tools">Tools</Link>
    </li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">Brand Vetter</li>
  </ol>
</nav>
```

---

### Issue 13: Keyboard Shortcuts
**Priority:** P2 | **WCAG:** 2.1.4 Character Key Shortcuts (A)

Add keyboard shortcuts for power users.

**Suggested Shortcuts:**
| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts help |
| `g h` | Go to home/dashboard |
| `g i` | Go to inbox/analyze |
| `g r` | Go to rates |
| `n` | New rate card (trigger FAB) |
| `Esc` | Close modal/sheet |

**Implementation:**
```tsx
// Create keyboard shortcut hook
function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        showShortcutsModal();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

**Acceptance Criteria:**
- [ ] Shortcuts work when not in form fields
- [ ] Shortcuts can be disabled in settings
- [ ] Help modal lists all shortcuts
- [ ] Shortcuts don't conflict with screen reader commands

---

### Issue 14: Error Prevention and Recovery
**Priority:** P2 | **WCAG:** 3.3.4 Error Prevention (AA)

Help users avoid and recover from errors.

**Patterns:**
```tsx
// Confirmation for destructive actions
<AlertDialog>
  <AlertDialogTrigger>Delete Rate Card</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogDescription>
      This will permanently delete your rate card. This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Delete</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>

// Inline validation with suggestions
{error.email && (
  <FormMessage>
    Please enter a valid email address (e.g., you@example.com)
  </FormMessage>
)}
```

---

### Issue 15: Touch Target Size
**Priority:** P2 | **WCAG:** 2.5.5 Target Size (AAA)

Interactive elements should be at least 44x44px.

**Files to check:**
- Mobile navigation buttons
- Form checkboxes and radio buttons
- Close buttons on modals
- Copy buttons

**Implementation:**
```tsx
// Ensure minimum touch target
<Button
  size="icon"
  className="min-h-[44px] min-w-[44px]"
>
  <X className="h-4 w-4" />
</Button>
```

---

## Phase 3: Excellence

### Issue 16: Semantic Tables for Tabular Data
**Priority:** P3 | **WCAG:** 1.3.1 Info and Relationships (A)

Use proper table markup for pricing grids.

**Files:**
- Rate card displays
- Pricing breakdowns
- Comparison views

**Implementation:**
```tsx
<table>
  <caption className="sr-only">Rate breakdown by content type</caption>
  <thead>
    <tr>
      <th scope="col">Content Type</th>
      <th scope="col">Base Rate</th>
      <th scope="col">Your Rate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Instagram Reel</th>
      <td>$300</td>
      <td>$425</td>
    </tr>
  </tbody>
</table>
```

---

### Issue 17: Language of Parts
**Priority:** P3 | **WCAG:** 3.1.2 Language of Parts (AA)

Mark content in different languages.

**If applicable:**
```tsx
<p>
  The French term <span lang="fr">je ne sais quoi</span> applies here.
</p>
```

---

### Issue 18: Extended Audio Description
**Priority:** P3 | **WCAG:** 1.2.7 (AAA)

If video content is added, include audio descriptions.

**Future consideration** - not currently applicable as app has no video content.

---

## Testing Strategy

### Automated Testing

**Tools:**
- `axe-core` via `@axe-core/react` in development
- Lighthouse accessibility audit in CI
- `eslint-plugin-jsx-a11y` for static analysis

**Implementation:**
```bash
# Add to package.json
pnpm add -D @axe-core/react eslint-plugin-jsx-a11y
```

```tsx
// Add to development entry point
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### Manual Testing Checklist

**Keyboard Testing:**
- [ ] Tab through entire page - logical order?
- [ ] Can reach all interactive elements?
- [ ] Can activate all buttons/links with Enter/Space?
- [ ] Can navigate forms with Tab?
- [ ] Can close modals with Escape?
- [ ] Focus visible at all times?

**Screen Reader Testing (VoiceOver/NVDA):**
- [ ] Page title announced on load
- [ ] Headings navigation works (H key)
- [ ] Links list makes sense (Ctrl+Opt+U on Mac)
- [ ] Forms announce labels and errors
- [ ] Dynamic content announced
- [ ] Images described appropriately

**Visual Testing:**
- [ ] 200% zoom - content still usable?
- [ ] High contrast mode - still readable?
- [ ] Grayscale - information conveyed without color?
- [ ] Reduced motion - animations disabled?

---

## Issue Tracking Summary

| # | Issue | Phase | WCAG | Priority | Est. Hours |
|---|-------|-------|------|----------|------------|
| 1 | Skip Links | 0 | 2.4.1 A | P0 | 1 |
| 2 | Alt Text | 0 | 1.1.1 A | P0 | 2 |
| 3 | ARIA Labels (icons) | 0 | 1.1.1 A | P0 | 2 |
| 4 | aria-current nav | 0 | 1.3.1 A | P0 | 0.5 |
| 5 | prefers-reduced-motion | 0 | 2.3.3 | P0 | 1 |
| 6 | Color Contrast Audit | 1 | 1.4.3 AA | P1 | 2 |
| 7 | Required Field Indicators | 1 | 3.3.2 A | P1 | 1 |
| 8 | Live Regions | 1 | 4.1.3 AA | P1 | 2 |
| 9 | Focus Management | 1 | 2.4.3 A | P1 | 1 |
| 10 | Heading Hierarchy | 1 | 1.3.1 A | P1 | 1 |
| 11 | Link Purpose | 1 | 2.4.4 A | P1 | 1 |
| 12 | Breadcrumbs | 2 | 2.4.8 AAA | P2 | 2 |
| 13 | Keyboard Shortcuts | 2 | 2.1.4 A | P2 | 3 |
| 14 | Error Prevention | 2 | 3.3.4 AA | P2 | 2 |
| 15 | Touch Targets | 2 | 2.5.5 AAA | P2 | 1 |
| 16 | Semantic Tables | 3 | 1.3.1 A | P3 | 2 |
| 17 | Language of Parts | 3 | 3.1.2 AA | P3 | 0.5 |
| 18 | Audio Description | 3 | 1.2.7 AAA | P3 | N/A |

**Total Estimated Hours:** ~24 hours

---

## Prompt Sequence

### Prompt A: Phase 0 - Critical Blockers
```
Implement Issues 1-5 from IMPLEMENTATION_PLAN_V7:
1. Add skip links to root layout and dashboard layout
2. Audit and add alt text to all images/avatars
3. Add aria-label to all icon-only buttons
4. Add aria-current="page" to active navigation links
5. Add prefers-reduced-motion CSS media query

Test with keyboard navigation after each change.
```

### Prompt B: Phase 1 - Core Compliance
```
Implement Issues 6-11 from IMPLEMENTATION_PLAN_V7:
6. Verify color contrast ratios (document findings)
7. Add required field indicators to forms
8. Add aria-live regions for dynamic content
9. Verify focus management in modals
10. Audit heading hierarchy across all pages
11. Fix any unclear link text

Run Lighthouse accessibility audit and fix issues.
```

### Prompt C: Phase 2 - Enhanced Experience
```
Implement Issues 12-15 from IMPLEMENTATION_PLAN_V7:
12. Add breadcrumb component and use on nested pages
13. Implement keyboard shortcuts with help modal
14. Add confirmation dialogs for destructive actions
15. Ensure all touch targets are minimum 44x44px
```

### Prompt D: Testing & Documentation
```
1. Add axe-core to development for automated testing
2. Add eslint-plugin-jsx-a11y to lint config
3. Create ACCESSIBILITY.md documenting:
   - Keyboard shortcuts
   - Screen reader support
   - Known limitations
4. Run full manual accessibility audit
5. Fix any remaining issues
```

---

## Success Metrics

After implementation:

- [ ] Lighthouse Accessibility score: 95+
- [ ] axe-core: 0 critical/serious violations
- [ ] Full keyboard navigation possible
- [ ] Screen reader tested (VoiceOver + NVDA)
- [ ] WCAG 2.2 AA self-assessment passed
- [ ] Documented any AAA features implemented

---

## Resources

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)
