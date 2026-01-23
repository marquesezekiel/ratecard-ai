# RateCard.AI Implementation Plan V5: Creator-Native Redesign

## Overview

This document contains prompts to transform RateCard.AI from "corporate SaaS" to "creator-native" based on Chrome MCP DOM analysis feedback.

**Timeline**: 1 day (5-6 hours)
**Focus**: Fix broken functionality, unify entry points, warm up the color palette, add personality
**Target User**: 22-year-old creator @maya.creates with 18K followers

### Critical Issues Identified (Chrome MCP Analysis)

| Issue | Priority | Fix |
|-------|----------|-----|
| Upload Brief buttons navigate to `/dashboard/upload` but not integrated into main flow | HIGH | Merge into unified "Brand Inbox" entry point |
| "NEW MESSAGE?" label is confusing | HIGH | Rename to "Got a brand message?" |
| Primary color (violet) reads as corporate | MEDIUM | Change to teal (#36a9b1) + coral accent |
| FAB missing aria-label | LOW | Already has aria-label, verified |
| Rate Preview at bottom on mobile (not sticky) | MEDIUM | Add sticky bottom sheet for mobile |
| No micro-celebrations beyond first rate card | MEDIUM | Add personalization and celebrations |

---

## Design Tokens Update

### New Color Palette

```css
/* From corporate violet... */
--primary: oklch(0.55 0.18 275);  /* Current: deep violet */

/* ...to creator teal */
--primary: oklch(0.60 0.13 195);  /* New: warm teal #36a9b1 */
--primary-foreground: oklch(0.99 0 0);

/* Accent colors for context */
--accent-coral: oklch(0.72 0.16 45);    /* Coral #FF7B54 - celebrations */
--accent-money: oklch(0.68 0.17 155);   /* Mint #4ADE80 - money/success */
--accent-warning: oklch(0.75 0.15 70);  /* Amber - caution */
```

### Typography (Keep existing - Satoshi + Clash Display + JetBrains Mono)

The fonts are already creator-friendly. No changes needed.

---

## Implementation Prompts

### Prompt 0: Update Color Palette to Teal

```
Update the color palette from violet to teal to feel more creator-native and less corporate.

**1. Update `src/app/globals.css`:**

Replace the primary color values in both light and dark modes:

```css
:root {
  /* Previous primary was violet: oklch(0.55 0.18 275) */
  /* New primary: Creator Teal - warm, inviting, fresh */
  --primary: oklch(0.60 0.13 195);
  --primary-foreground: oklch(0.99 0 0);

  /* Update ring to match */
  --ring: oklch(0.60 0.13 195);

  /* Update sidebar primary */
  --sidebar-primary: oklch(0.60 0.13 195);
  --sidebar-ring: oklch(0.60 0.13 195);

  /* Update chart colors to complement teal */
  --chart-1: oklch(0.60 0.13 195);  /* Primary teal */
  --chart-2: oklch(0.68 0.17 155);  /* Mint green */
  --chart-3: oklch(0.72 0.16 45);   /* Coral */
  --chart-4: oklch(0.65 0.12 280);  /* Soft violet (secondary) */
  --chart-5: oklch(0.70 0.10 200);  /* Light teal */
}

.dark {
  /* Dark mode teal - slightly lighter for visibility */
  --primary: oklch(0.68 0.12 195);
  --primary-foreground: oklch(0.14 0.02 195);

  --ring: oklch(0.68 0.12 195);

  --sidebar-primary: oklch(0.68 0.12 195);
  --sidebar-ring: oklch(0.68 0.12 195);

  --chart-1: oklch(0.68 0.12 195);
}
```

**2. Add accent color utilities to globals.css:**

```css
/* Creator accent colors */
.text-coral {
  color: oklch(0.72 0.16 45);
}
.bg-coral {
  background-color: oklch(0.72 0.16 45);
}
.bg-coral\/10 {
  background-color: oklch(0.72 0.16 45 / 0.1);
}

/* Keep existing money green */
/* .text-money, .bg-money already defined */

/* Update text-gradient to use teal */
.text-gradient {
  background: linear-gradient(135deg, oklch(0.60 0.13 195) 0%, oklch(0.68 0.17 155) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Update pattern backgrounds */
.bg-dots {
  background-image: radial-gradient(oklch(0.60 0.13 195 / 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

.bg-grid {
  background-image:
    linear-gradient(oklch(0.60 0.13 195 / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.60 0.13 195 / 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**3. Update confetti colors in `src/components/ui/confetti.tsx`:**

Find the colors array and update to teal-coral palette:
```tsx
colors: ['#36a9b1', '#4ADE80', '#FF7B54', '#38bdf8', '#fcd34d']
// Teal, Mint, Coral, Sky, Amber
```

**4. Verify the color change:**
- Run `pnpm build` to ensure no errors
- Check the landing page - hero gradient should be teal
- Check primary buttons - should be teal
- Check focus rings - should be teal
- Check dark mode toggle - colors should adapt

Run `pnpm build` and verify.
```

---

### Prompt 1: Unify Brand Inbox with Brief Upload

```
Merge the brief upload functionality into the Brand Inbox (InlineMessageAnalyzer) so creators have one entry point for all brand communications.

**Current State:**
- Dashboard has InlineMessageAnalyzer for text only
- Separate /dashboard/upload page for brief files
- Two entry points is confusing

**Target State:**
- Single "Brand Inbox" that handles DMs, emails, AND brief uploads
- File upload integrated directly into the dashboard
- Smart detection: text paste → DM parser, file upload → brief parser

**1. Update `src/components/dashboard/inline-message-analyzer.tsx`:**

Add file upload support alongside text paste:

```tsx
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight,
  MessageSquare,
  Mail,
  ImageIcon,
  FileText,
  Upload,
  Loader2,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
}

export function InlineMessageAnalyzer() {
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [mode, setMode] = useState<"text" | "file">("text")
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setMode("file")
      setMessage("") // Clear text when file is dropped
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    noClick: mode === "text" && !selectedFile, // Don't open picker when typing
  })

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    if (mode === "file" && selectedFile) {
      // Navigate to upload flow with file
      // Store file reference for the upload page
      const fileData = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      }
      sessionStorage.setItem("pendingBriefFile", JSON.stringify(fileData))
      // Note: We can't store the actual file in sessionStorage,
      // so we navigate to upload page where they can re-select
      router.push("/dashboard/upload")
    } else if (message.trim()) {
      // Navigate to analyzer with message
      router.push(`/dashboard/analyze?message=${encodeURIComponent(message)}`)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setMode("text")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (message.trim()) handleAnalyze()
    }
  }

  const canSubmit = mode === "file" ? !!selectedFile : message.trim().length > 0

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-primary/20 hover:border-primary/40"
      )}
    >
      <CardContent className="p-4 space-y-4">
        <input {...getInputProps()} />

        {/* File Selected State */}
        {selectedFile ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click Analyze to parse
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleClearFile()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Text Input State */
          <Textarea
            placeholder={isDragActive
              ? "Drop your brief here..."
              : "Got a brand message? Paste it here, or drop a brief file..."
            }
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setMode("text")
            }}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()} // Prevent dropzone click
            className={cn(
              "min-h-[100px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/60",
              isDragActive && "opacity-50"
            )}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> DMs
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Emails
            </span>
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3" /> Briefs
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Screenshots
            </span>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleAnalyze()
            }}
            disabled={!canSubmit || isAnalyzing}
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "file" ? "Opening..." : "Analyzing..."}
              </>
            ) : (
              <>
                {mode === "file" ? "Parse Brief" : "Analyze"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**2. Update dashboard header label in `src/app/dashboard/page.tsx`:**

Change "New Message?" to something more inviting:

```tsx
{/* PRIMARY: Inline Message Analyzer */}
<section className="space-y-3">
  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
    Got a brand message?
  </h2>
  <InlineMessageAnalyzer />
</section>
```

**3. Verify:**
- Drag a PDF onto the dashboard card - should show file preview
- Paste text - should enable Analyze button
- Drop zone visual feedback works
- Keyboard shortcut (Cmd+Enter) still works for text
- File upload navigates to /dashboard/upload

Run `pnpm build` and test both flows.
```

---

### Prompt 2: Add Mobile Rate Preview Sticky Bottom Sheet

```
Make the Rate Preview visible on mobile while filling out the profile form as a sticky bottom element.

**Current State:**
- Rate Preview is at the bottom of the profile page on mobile
- User doesn't see their rate update as they fill fields
- Breaks the instant feedback loop

**Target State:**
- Sticky bottom sheet that shows rate preview while scrolling
- Collapsible to not obstruct form input
- Expands on tap to show full details

**1. Create `src/components/profile/mobile-rate-sheet.tsx`:**

```tsx
"use client"

import { useState } from "react"
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react"
import { calculateQuickEstimate } from "@/lib/quick-calculator"
import { cn } from "@/lib/utils"

interface MobileRateSheetProps {
  followers: number
  platform: "instagram" | "tiktok" | "youtube" | "twitter"
  engagementRate?: number
}

export function MobileRateSheet({
  followers,
  platform,
  engagementRate,
}: MobileRateSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show if no meaningful data
  if (!followers || followers < 100) {
    return null
  }

  const estimate = calculateQuickEstimate({
    followerCount: followers,
    platform: platform,
    contentFormat: "reel",
    niche: "lifestyle",
  })

  return (
    <div
      className={cn(
        "fixed bottom-[72px] left-0 right-0 z-40 bg-card border-t shadow-lg transition-all duration-300 safe-area-bottom",
        isExpanded ? "pb-4" : "pb-2"
      )}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Estimated Rate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono">
            ${estimate.minRate.toLocaleString()} - ${estimate.maxRate.toLocaleString()}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pt-2 border-t animate-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Your Tier</p>
              <p className="font-medium capitalize">{estimate.tierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Followers</p>
              <p className="font-mono font-medium">{followers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="font-mono font-medium">
                {engagementRate ? `${engagementRate.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Based on a typical Reel. Final rate depends on usage rights and brand fit.
          </p>
        </div>
      )}
    </div>
  )
}
```

**2. Update `src/app/dashboard/profile/page.tsx`:**

Add the mobile rate sheet component:

```tsx
"use client";

import { useState, useEffect, startTransition, useCallback } from "react";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  ProfileCompleteness,
  calculateProfileCompleteness,
} from "@/components/profile/profile-completeness";
import { RatePreviewCard } from "@/components/profile/rate-preview-card";
import { MobileRateSheet } from "@/components/profile/mobile-rate-sheet";

// ... keep existing interfaces ...

export default function ProfilePage() {
  // ... keep existing state and effects ...

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            The more you share, the more accurate your rates
          </p>
        </div>
        <ProfileCompleteness percentage={completeness} />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main form - 2 cols */}
        <div className="md:col-span-2">
          <ProfileForm
            initialData={initialData}
            onValuesChange={handleValuesChange}
          />
        </div>

        {/* Desktop: Sticky sidebar preview */}
        <div className="hidden md:block">
          <div className="sticky top-6">
            <RatePreviewCard
              followers={primaryPlatform.followers}
              platform={primaryPlatform.platform}
              engagementRate={primaryPlatform.engagementRate}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Remove the old bottom preview, use sheet instead */}
      {/* OLD CODE TO REMOVE:
      <div className="md:hidden mt-6">
        <RatePreviewCard ... />
      </div>
      */}

      {/* Mobile: Sticky bottom sheet */}
      <div className="md:hidden">
        <MobileRateSheet
          followers={primaryPlatform.followers}
          platform={primaryPlatform.platform}
          engagementRate={primaryPlatform.engagementRate}
        />
      </div>
    </div>
  );
}
```

**3. Verify:**
- On mobile (< 768px), sheet appears above bottom nav
- Tapping expands/collapses smoothly
- Rate updates as form values change
- Does not obstruct form fields when collapsed
- Desktop layout unchanged (sidebar preview)

Run `pnpm build` and test on mobile viewport.
```

---

### Prompt 3: Add Personalization to Dashboard

```
Add personalization touches that make the app feel creator-native, not corporate.

**1. Update dashboard greeting in `src/app/dashboard/page.tsx`:**

Use creator handle if available, add time-based greetings:

```tsx
// Add at top of component
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Get handle from localStorage if available
const [creatorHandle, setCreatorHandle] = useState<string | null>(null)

useEffect(() => {
  startTransition(() => {
    // ... existing localStorage loads ...

    // Load creator handle
    const profile = localStorage.getItem("creatorProfile")
    if (profile) {
      const data = JSON.parse(profile)
      if (data.handle) {
        setCreatorHandle(data.handle)
      }
    }
  })
}, [])

// In the JSX:
<header className="space-y-1">
  <h1 className="text-2xl font-display font-bold">
    {getGreeting()}{creatorHandle ? `, @${creatorHandle}` : `, ${firstName}`}
  </h1>
  <p className="text-muted-foreground">
    {totalGenerated > 0 ? (
      <>
        You&apos;ve quoted <span className="font-mono font-semibold text-primary">${totalGenerated.toLocaleString()}</span> in rates this month
      </>
    ) : (
      "Ready to know your worth? Let's get you a rate."
    )}
  </p>
</header>
```

**2. Update empty states with creator-native copy:**

In `src/components/dashboard/recent-activity-feed.tsx`:

```tsx
if (!activities || activities.length === 0) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <p className="font-medium">No deals yet - but you&apos;re about to change that</p>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a brand DM above to see what you should charge.
        </p>
      </CardContent>
    </Card>
  )
}
```

**3. Add encouraging micro-copy throughout:**

In Brand Inbox section:
```tsx
<section className="space-y-3">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      Got a brand message?
    </h2>
    <span className="text-xs text-muted-foreground">
      Works with DMs, emails, and briefs
    </span>
  </div>
  <InlineMessageAnalyzer />
</section>
```

**4. Update placeholder in InlineMessageAnalyzer:**

More casual, creator-friendly tone:
```tsx
placeholder={isDragActive
  ? "Drop your brief here..."
  : "Paste that brand DM here... or drop a brief 📄"
}
```

**5. Verify:**
- Greeting changes based on time of day
- Handle (@username) shows if available
- Empty states feel encouraging, not empty
- Copy uses "you/your" not "user/account"

Run `pnpm build` and test.
```

---

### Prompt 4: Add Celebration Moments

```
Add celebration micro-interactions beyond the first rate card.

**1. Add milestone celebrations in `src/lib/celebrations.ts`:**

```tsx
export type MilestoneType =
  | "first_rate_card"
  | "fifth_rate_card"
  | "first_paid_deal"
  | "first_brand_vetted"
  | "profile_complete"
  | "high_rate_reached"

interface Milestone {
  type: MilestoneType
  title: string
  subtitle: string
  emoji: string
}

export const MILESTONES: Record<MilestoneType, Milestone> = {
  first_rate_card: {
    type: "first_rate_card",
    title: "First rate card!",
    emoji: "🎉",
    subtitle: "You're on your way to getting paid what you're worth.",
  },
  fifth_rate_card: {
    type: "fifth_rate_card",
    title: "5 rate cards generated!",
    emoji: "🔥",
    subtitle: "You're becoming a pricing pro.",
  },
  first_paid_deal: {
    type: "first_paid_deal",
    title: "First paid deal tracked!",
    emoji: "💰",
    subtitle: "The bag has been secured.",
  },
  first_brand_vetted: {
    type: "first_brand_vetted",
    title: "First brand vetted!",
    emoji: "🔍",
    subtitle: "Smart move checking them out first.",
  },
  profile_complete: {
    type: "profile_complete",
    title: "Profile complete!",
    emoji: "⭐",
    subtitle: "Your rates are now fully personalized.",
  },
  high_rate_reached: {
    type: "high_rate_reached",
    title: "You quoted $1,000+!",
    emoji: "🚀",
    subtitle: "Big creator energy.",
  },
}

export function checkMilestone(type: MilestoneType): boolean {
  const achieved = localStorage.getItem(`milestone_${type}`)
  return !achieved
}

export function markMilestoneAchieved(type: MilestoneType): void {
  localStorage.setItem(`milestone_${type}`, new Date().toISOString())
}

export function getRateCardCount(): number {
  const saved = localStorage.getItem("savedRates")
  if (!saved) return 0
  const rates = JSON.parse(saved)
  return rates.length
}
```

**2. Create celebration toast component `src/components/ui/celebration-toast.tsx`:**

```tsx
"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CelebrationToastProps {
  title: string
  subtitle: string
  emoji: string
  onClose: () => void
}

export function CelebrationToast({ title, subtitle, emoji, onClose }: CelebrationToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100)

    // Auto dismiss after 5s
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "bg-card border shadow-lg rounded-2xl p-4",
        "flex items-center gap-3 min-w-[280px] max-w-[90vw]",
        "transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      )}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
```

**3. Create celebration hook `src/hooks/use-celebration.ts`:**

```tsx
"use client"

import { useState, useCallback } from "react"
import { useConfetti } from "@/components/ui/confetti"
import {
  type MilestoneType,
  MILESTONES,
  checkMilestone,
  markMilestoneAchieved
} from "@/lib/celebrations"

interface CelebrationState {
  isShowing: boolean
  milestone: typeof MILESTONES[MilestoneType] | null
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isShowing: false,
    milestone: null,
  })
  const { fireMultiple } = useConfetti()

  const celebrate = useCallback((type: MilestoneType) => {
    if (!checkMilestone(type)) return // Already achieved

    markMilestoneAchieved(type)
    const milestone = MILESTONES[type]

    setCelebration({ isShowing: true, milestone })
    fireMultiple()
  }, [fireMultiple])

  const dismissCelebration = useCallback(() => {
    setCelebration({ isShowing: false, milestone: null })
  }, [])

  return {
    celebration,
    celebrate,
    dismissCelebration,
  }
}
```

**4. Integrate into quick-quote page and other results pages:**

In pages that complete actions:
```tsx
import { useCelebration } from "@/hooks/use-celebration"
import { CelebrationToast } from "@/components/ui/celebration-toast"
import { getRateCardCount } from "@/lib/celebrations"

// In component:
const { celebration, celebrate, dismissCelebration } = useCelebration()

// After successful rate generation:
useEffect(() => {
  if (result) {
    const count = getRateCardCount()
    if (count === 0) {
      celebrate("first_rate_card")
    } else if (count === 4) { // Will become 5 after save
      celebrate("fifth_rate_card")
    }
    if (result.pricing.totalPrice >= 1000) {
      celebrate("high_rate_reached")
    }
  }
}, [result, celebrate])

// In JSX:
{celebration.isShowing && celebration.milestone && (
  <CelebrationToast
    title={celebration.milestone.title}
    subtitle={celebration.milestone.subtitle}
    emoji={celebration.milestone.emoji}
    onClose={dismissCelebration}
  />
)}
```

**5. Verify:**
- First rate card shows celebration (clear localStorage to test)
- 5th rate card shows different celebration
- $1000+ rate shows celebration
- Toast auto-dismisses after 5 seconds
- Can manually dismiss toast
- Confetti fires with celebration

Run `pnpm build` and test milestones.
```

---

### Prompt 5: Testing & Polish

```
Final testing and polish for V5 changes.

**1. Run tests and build:**
```bash
pnpm test
pnpm build
pnpm lint
```

Fix any errors.

**2. Color Verification Checklist:**

- [ ] Primary buttons are teal, not violet
- [ ] Focus rings are teal
- [ ] Landing page gradient uses teal
- [ ] Dark mode adapts teal properly
- [ ] Confetti uses new color palette
- [ ] Charts/graphs use teal palette

**3. Brand Inbox Verification:**

- [ ] Text paste works → navigates to /dashboard/analyze
- [ ] File drag & drop shows preview
- [ ] File upload → navigates to /dashboard/upload
- [ ] "Briefs" added to helper text
- [ ] Header says "Got a brand message?"
- [ ] Clear button removes selected file

**4. Mobile Rate Sheet Verification:**

- [ ] Sheet appears above bottom nav (72px offset)
- [ ] Collapsed shows rate range
- [ ] Tap expands to show details
- [ ] Rate updates as profile form changes
- [ ] Does not appear when no followers entered
- [ ] Desktop shows sidebar preview (unchanged)

**5. Personalization Verification:**

- [ ] Time-based greeting (morning/afternoon/evening)
- [ ] Creator handle shows if available
- [ ] Empty states have encouraging copy
- [ ] Placeholder text feels casual

**6. Celebration Verification:**

- [ ] First rate card triggers celebration + confetti
- [ ] Toast appears with correct milestone info
- [ ] Toast auto-dismisses after 5s
- [ ] Manual dismiss works
- [ ] Milestone only triggers once (refresh doesn't re-trigger)

**7. Accessibility Quick Check:**

- [ ] Color contrast still passes (teal on white)
- [ ] FAB has aria-label
- [ ] Form inputs have labels
- [ ] Focus states visible

**8. Visual Regression (375px mobile):**

- [ ] Bottom nav still shows 3 items + menu
- [ ] FAB positioned correctly
- [ ] Rate sheet doesn't overlap content
- [ ] No horizontal scroll

**9. Clean up:**

- Remove any console.log statements
- Remove TODO comments for shipped features
- Ensure no TypeScript errors

Show me:
1. Test results
2. Build status
3. Any issues found and fixed
4. Confirmation all checkpoints pass
```

---

## Command Sequence

### Session 1: Color & Core Fixes

```
STEP 1: /clear
```

```
STEP 2: Color Palette
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 0 (Update Color Palette to Teal) exactly as written.
```

```
STEP 3: Commit
```
```bash
git add -A && git commit -m "feat: update color palette from violet to creator teal"
```

```
STEP 4: /clear
```

```
STEP 5: Unified Brand Inbox
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 1 (Unify Brand Inbox with Brief Upload) exactly as written.
```

```
STEP 6: Commit
```
```bash
git add -A && git commit -m "feat: unify brand inbox with brief upload support"
```

```
STEP 7: /clear
```

---

### Session 2: Mobile & UX Enhancements

```
STEP 8: Mobile Rate Sheet
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 2 (Add Mobile Rate Preview Sticky Bottom Sheet) exactly as written.
```

```
STEP 9: Commit
```
```bash
git add -A && git commit -m "feat: add mobile rate preview sticky sheet"
```

```
STEP 10: /clear
```

```
STEP 11: Personalization
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 3 (Add Personalization to Dashboard) exactly as written.
```

```
STEP 12: Commit
```
```bash
git add -A && git commit -m "feat: add time-based greeting and personalization"
```

```
STEP 13: /clear
```

```
STEP 14: Celebrations
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 4 (Add Celebration Moments) exactly as written.
```

```
STEP 15: Commit
```
```bash
git add -A && git commit -m "feat: add milestone celebrations with confetti"
```

```
STEP 16: /clear
```

---

### Session 3: Testing & Ship

```
STEP 17: Testing & Polish
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 5 (Testing & Polish) exactly as written.
```

```
STEP 18: Commit
```
```bash
git add -A && git commit -m "polish: v5 testing and final fixes"
```

```
STEP 19: Push
```
```bash
git push -u origin claude/analyze-test-coverage-hWgZz
```

---

## Quick Reference

| Step | Action | Time Est. |
|------|--------|-----------|
| 1-3 | Color Palette Update | 30 min |
| 4-6 | Unified Brand Inbox | 45 min |
| 7-9 | Mobile Rate Sheet | 30 min |
| 10-12 | Personalization | 30 min |
| 13-15 | Celebrations | 45 min |
| 16-18 | Testing & Polish | 30 min |
| 19 | Push | 1 min |

**Total: 19 steps, 6 prompts, 6 commits, ~4 hours**

---

## Success Criteria

After completing all prompts:

✅ Color palette is teal, not violet
✅ Brand Inbox accepts DMs, emails, AND brief files
✅ "Got a brand message?" label (not "NEW MESSAGE?")
✅ Mobile Rate Preview is sticky and visible while editing profile
✅ Time-based greetings with @handle personalization
✅ Milestone celebrations beyond first rate card
✅ All tests pass
✅ No TypeScript errors
✅ Mobile-first responsive design maintained
