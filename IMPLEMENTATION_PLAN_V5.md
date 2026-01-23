# RateCard.AI Implementation Plan V5: Creator-Native Redesign

## Overview

This document contains prompts to transform RateCard.AI from "corporate SaaS" to "creator-native" based on Chrome MCP DOM analysis feedback.

**Timeline**: 1 day (6-7 hours)
**Focus**: Fix broken functionality, unify entry points, warm up the color palette, add personality, enhance visual polish
**Target User**: 22-year-old creator @maya.creates with 18K followers

### Critical Issues Identified (Chrome MCP Analysis)

| Issue | Priority | Fix |
|-------|----------|-----|
| Upload Brief buttons navigate to `/dashboard/upload` but not integrated into main flow | HIGH | Merge into unified "Brand Inbox" entry point |
| "NEW MESSAGE?" label is confusing | HIGH | Rename to "Got a brand message?" |
| Primary color (violet) reads as corporate | HIGH | Change to teal (#36a9b1) + coral accent |
| Rate Preview at bottom on mobile (not sticky) | HIGH | Add sticky bottom sheet for mobile |
| Landing page feature cards look generic | MEDIUM | Add visual differentiation with accent colors |
| No deal quality badges in analysis results | MEDIUM | Add visual badges for deal quality, gifts, urgency |
| Dashboard action cards look identical | MEDIUM | Differentiate with accent colors and emojis |
| Typography used conservatively | MEDIUM | Use display font more boldly |
| Profile progress bar not gamified | LOW | Convert to level-based system |
| FAB missing aria-label | LOW | Already has aria-label, verified |
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

### Prompt 6: Landing Page Visual Refresh

```
Refresh the landing page to feel more creator-native with visual differentiation, warmer presentation, and authentic social proof styling.

**Current Issues:**
- Feature cards look identical to generic SaaS
- Stats section feels corporate
- No visual hierarchy between features
- Hero preview is good but rest of page is flat

**1. Update feature cards in `src/app/page.tsx`:**

Add visual differentiation with accent colors and icons:

```tsx
{/* Feature 1: Message Analyzer - Primary Feature */}
<Card className="p-6 md:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all hover:-translate-y-1">
  <div className="space-y-4">
    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
      <MessageSquare className="h-6 w-6 text-primary-foreground" />
    </div>
    <h3 className="text-xl font-display font-semibold">
      Analyze Any Brand Message
    </h3>
    <p className="text-muted-foreground">
      Paste a DM or email. We&apos;ll tell you if it&apos;s legit, what to charge,
      and give you a response to copy-paste.
    </p>
    <ul className="space-y-2 text-sm">
      <li className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-3 w-3 text-primary" />
        </div>
        Detects gift offers vs paid opportunities
      </li>
      <li className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-3 w-3 text-primary" />
        </div>
        Spots scams and red flags
      </li>
      <li className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-3 w-3 text-primary" />
        </div>
        Generates ready-to-send responses
      </li>
    </ul>
  </div>
</Card>

{/* Feature 2: Rate Cards - Secondary Feature with coral accent */}
<Card className="p-6 md:p-8 border-2 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-coral/30">
  <div className="space-y-4">
    <div className="h-12 w-12 rounded-xl bg-coral/10 flex items-center justify-center">
      <FileText className="h-6 w-6 text-coral" />
    </div>
    {/* ... rest of card content ... */}
  </div>
</Card>
```

**2. Update stats section to feel more authentic:**

```tsx
{/* Social proof stats - more creator-native styling */}
<div className="grid grid-cols-3 gap-6 mb-10">
  <div className="text-center space-y-1">
    <div className="text-3xl md:text-4xl font-display font-bold text-primary">10K+</div>
    <div className="text-sm text-muted-foreground">rate cards generated</div>
  </div>
  <div className="text-center space-y-1">
    <div className="text-3xl md:text-4xl font-display font-bold font-money text-money">$2.4M</div>
    <div className="text-sm text-muted-foreground">in rates calculated</div>
  </div>
  <div className="text-center space-y-1">
    <div className="flex items-center justify-center gap-1">
      <span className="text-3xl md:text-4xl font-display font-bold">4.9</span>
      <Star className="h-6 w-6 text-energy fill-energy" />
    </div>
    <div className="text-sm text-muted-foreground">creator rating</div>
  </div>
</div>

{/* Creator-style social proof */}
<div className="flex items-center justify-center gap-2 mb-8">
  <div className="flex -space-x-2">
    {/* Avatar placeholders - represents real creator community */}
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 border-2 border-background" />
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 border-2 border-background" />
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-background" />
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 border-2 border-background" />
  </div>
  <span className="text-sm text-muted-foreground">
    Trusted by creators like <span className="font-medium text-foreground">@maya.creates</span>
  </span>
</div>
```

**3. Add subtle animations to "How It Works" steps:**

```tsx
{[
  {
    step: "01",
    title: "Tell us about you",
    description: "Platform, followers, engagement rate",
    icon: User,
    delay: "delay-100",
  },
  {
    step: "02",
    title: "Describe the deal",
    description: "Content type, usage rights, timeline",
    icon: FileText,
    delay: "delay-200",
  },
  {
    step: "03",
    title: "Get your rate card",
    description: "Download a PDF ready to send",
    icon: Download,
    delay: "delay-300",
  },
].map((item) => (
  <div key={item.step} className={`text-center space-y-4 animate-fade-in ${item.delay}`}>
    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
      <item.icon className="h-8 w-8" />
    </div>
    <div className="text-4xl font-display font-bold text-primary/20">
      {item.step}
    </div>
    <h3 className="font-semibold">{item.title}</h3>
    <p className="text-sm text-muted-foreground">{item.description}</p>
  </div>
))}
```

**4. Add coral utility class if not already present in globals.css:**

```css
.text-coral {
  color: oklch(0.72 0.16 45);
}
.bg-coral {
  background-color: oklch(0.72 0.16 45);
}
.bg-coral\/10 {
  background-color: oklch(0.72 0.16 45 / 0.1);
}
.border-coral\/30 {
  border-color: oklch(0.72 0.16 45 / 0.3);
}
```

**5. Verify:**
- Feature cards have distinct visual identities
- Primary feature (Message Analyzer) is visually prominent
- Stats use money-green for dollar amounts
- Creator avatars add authenticity feel
- Hover states are smooth and delightful
- Step icons have subtle shadows

Run `pnpm build` and visually inspect landing page.
```

---

### Prompt 7: Brand Inbox Visual Enhancements

```
Add visual feedback badges to analyzed messages showing deal quality, gift detection, and urgency indicators.

**Goal:** Make the Brand Inbox results feel "smart" by showing creators visual cues at a glance.

**1. Create deal quality badge component `src/components/ui/deal-badge.tsx`:**

```tsx
"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Gift, Zap, Clock } from "lucide-react"

type DealQuality = "excellent" | "good" | "fair" | "caution"
type BadgeType = "quality" | "gift" | "urgent" | "scam"

interface DealBadgeProps {
  type: BadgeType
  value?: DealQuality | boolean
  className?: string
}

const qualityConfig: Record<DealQuality, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  excellent: {
    label: "Great Deal",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle2,
  },
  good: {
    label: "Good Deal",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
  },
  fair: {
    label: "Fair",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: AlertTriangle,
  },
  caution: {
    label: "Caution",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: AlertTriangle,
  },
}

export function DealBadge({ type, value, className }: DealBadgeProps) {
  if (type === "quality" && typeof value === "string") {
    const config = qualityConfig[value as DealQuality]
    const Icon = config.icon
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color,
        className
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  if (type === "gift" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-coral/10 text-coral border-coral/20",
        className
      )}>
        <Gift className="h-3 w-3" />
        Gift Offer
      </span>
    )
  }

  if (type === "urgent" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-amber-500/10 text-amber-600 border-amber-500/20",
        className
      )}>
        <Clock className="h-3 w-3" />
        Time Sensitive
      </span>
    )
  }

  if (type === "scam" && value) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "bg-red-500/10 text-red-600 border-red-500/20",
        className
      )}>
        <AlertTriangle className="h-3 w-3" />
        Red Flags Detected
      </span>
    )
  }

  return null
}

/**
 * Convert numeric deal quality score to category
 */
export function getDealQualityLevel(score: number): DealQuality {
  if (score >= 85) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "fair"
  return "caution"
}
```

**2. Create badges row component `src/components/ui/deal-badges-row.tsx`:**

```tsx
"use client"

import { DealBadge, getDealQualityLevel } from "./deal-badge"

interface DealBadgesRowProps {
  dealQualityScore?: number
  isGiftOffer?: boolean
  hasDeadline?: boolean
  hasRedFlags?: boolean
  className?: string
}

export function DealBadgesRow({
  dealQualityScore,
  isGiftOffer,
  hasDeadline,
  hasRedFlags,
  className
}: DealBadgesRowProps) {
  const hasBadges = dealQualityScore !== undefined || isGiftOffer || hasDeadline || hasRedFlags

  if (!hasBadges) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {dealQualityScore !== undefined && (
        <DealBadge type="quality" value={getDealQualityLevel(dealQualityScore)} />
      )}
      {isGiftOffer && <DealBadge type="gift" value={true} />}
      {hasDeadline && <DealBadge type="urgent" value={true} />}
      {hasRedFlags && <DealBadge type="scam" value={true} />}
    </div>
  )
}
```

**3. Integrate badges into message analysis results:**

Update `src/app/dashboard/analyze/page.tsx` (or wherever results are displayed):

```tsx
import { DealBadgesRow } from "@/components/ui/deal-badges-row"

// In the results section, add after the brand name header:
{analysis && (
  <div className="space-y-4">
    {/* Brand and badges */}
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{analysis.brandName || "Brand Analysis"}</h3>
      <DealBadgesRow
        dealQualityScore={analysis.dealQualityScore}
        isGiftOffer={analysis.compensationType === "gifted"}
        hasDeadline={!!analysis.deadline}
        hasRedFlags={analysis.tone === "scam_likely" || analysis.redFlags?.length > 0}
      />
    </div>

    {/* Rest of analysis content */}
  </div>
)}
```

**4. Update recent activity feed to show badges:**

In `src/components/dashboard/recent-activity-feed.tsx`, add badge support:

```tsx
interface Activity {
  id: string
  type: "rate_card" | "dm_analyzed" | "gift_tracked" | "brand_vetted"
  title: string
  subtitle: string
  timestamp: Date
  dealQuality?: "excellent" | "good" | "fair" | "caution"
  isGift?: boolean
}

// In the render:
<div className="flex items-center gap-2">
  {activity.dealQuality && (
    <DealBadge type="quality" value={activity.dealQuality} />
  )}
  {activity.isGift && (
    <DealBadge type="gift" value={true} />
  )}
</div>
```

**5. Verify:**
- Excellent deals (85+) show green "Great Deal" badge
- Good deals (70-84) show teal "Good Deal" badge
- Fair deals (50-69) show yellow "Fair" badge
- Caution deals (<50) show red "Caution" badge
- Gift offers show coral "Gift Offer" badge
- Deadline detected shows amber "Time Sensitive" badge
- Scam signals show red "Red Flags Detected" badge
- Badges wrap properly on mobile

Run `pnpm build` and test with different message types.
```

---

### Prompt 8: Dashboard Card Visual Differentiation

```
Give Quick Rate and Gift Deals cards distinct visual identities so creators can quickly scan their dashboard.

**Current State:** Both cards look identical (same shape, icon style, colors)
**Target State:** Each card has its own visual personality while maintaining cohesion

**1. Update `src/components/dashboard/quick-action-card.tsx`:**

Add support for accent colors and variants:

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type AccentColor = "primary" | "coral" | "money"

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  variant?: "default" | "outline"
  accent?: AccentColor
  emoji?: string
}

const accentStyles: Record<AccentColor, { icon: string; border: string; bg: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    border: "hover:border-primary/30",
    bg: "hover:bg-primary/5",
  },
  coral: {
    icon: "bg-coral/10 text-coral",
    border: "hover:border-coral/30",
    bg: "hover:bg-coral/5",
  },
  money: {
    icon: "bg-money/10 text-money",
    border: "hover:border-money/30",
    bg: "hover:bg-money/5",
  },
}

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  variant = "default",
  accent = "primary",
  emoji
}: QuickActionCardProps) {
  const styles = accentStyles[accent]

  return (
    <Link href={href} className="block group">
      <Card className={cn(
        "h-full transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        variant === "outline" && "border-2",
        styles.border,
        styles.bg
      )}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
              styles.icon
            )}>
              {emoji ? (
                <span className="text-xl">{emoji}</span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**2. Update dashboard page to use accents:**

In `src/app/dashboard/page.tsx`:

```tsx
{/* SECONDARY: Quick actions - with distinct visual identities */}
<section className="grid grid-cols-2 gap-4">
  <QuickActionCard
    href="/dashboard/quick-quote"
    icon={Calculator}
    title="Quick Rate"
    description="Get an instant quote"
    variant="outline"
    accent="primary"
    emoji="⚡"
  />
  <QuickActionCard
    href="/dashboard/gifts"
    icon={Gift}
    title="Gift Deals"
    badge={pendingGifts > 0 ? `${pendingGifts} pending` : undefined}
    description="Track gift offers"
    variant="outline"
    accent="coral"
    emoji="🎁"
  />
</section>
```

**3. Add more quick actions if they exist:**

If you have other quick actions (Contract Scanner, Brand Vetter), add them with appropriate accents:

```tsx
{/* Could expand to 2x2 grid with more actions */}
<QuickActionCard
  href="/dashboard/contracts"
  icon={FileSearch}
  title="Contract Scanner"
  description="Check for red flags"
  variant="outline"
  accent="money"
  emoji="📋"
/>
<QuickActionCard
  href="/dashboard/vet"
  icon={Shield}
  title="Brand Vetter"
  description="Research brands"
  variant="outline"
  accent="primary"
  emoji="🔍"
/>
```

**4. Verify:**
- Quick Rate card has teal accent and ⚡ emoji
- Gift Deals card has coral accent and 🎁 emoji
- Hover states use respective accent colors
- Icons scale up slightly on hover
- Cards feel distinct but cohesive
- Mobile: cards stack properly at 2-column grid

Run `pnpm build` and verify dashboard visually.
```

---

### Prompt 9: Typography Polish

```
Use typography more boldly to create better visual hierarchy and a more energetic feel.

**Note:** We keep the existing fonts (Satoshi, Clash Display, JetBrains Mono) but apply them more dramatically.

**1. Update hero headline size in `src/app/page.tsx`:**

Make the hero headline larger and more impactful:

```tsx
{/* Main headline - bigger, bolder */}
<h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold tracking-tight leading-[1.05]">
  stop guessing.
  <br />
  <span className="text-gradient">start charging.</span>
</h1>
```

**2. Add letter-spacing utility for display text:**

In `src/app/globals.css`, add:

```css
/* Typography enhancements */
.tracking-display {
  letter-spacing: -0.02em;
}

.tracking-tight-display {
  letter-spacing: -0.03em;
}

/* Text shadow for headlines on colored backgrounds */
.text-shadow-sm {
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
}

/* Heavier font weight for emphasis */
.font-black {
  font-weight: 900;
}
```

**3. Update section headers to use display font consistently:**

Throughout the app, ensure section headers use `font-display`:

```tsx
{/* Example: Features section */}
<h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-center tracking-display mb-12">
  Everything you need to get paid fairly
</h2>

{/* Example: How it works */}
<h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-center tracking-display mb-12">
  Get your rate in 60 seconds
</h2>
```

**4. Update dashboard greeting to be bolder:**

In `src/app/dashboard/page.tsx`:

```tsx
<header className="space-y-1">
  <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
    {getGreeting()}{creatorHandle ? `, @${creatorHandle}` : `, ${firstName}`} ✨
  </h1>
  <p className="text-muted-foreground text-base md:text-lg">
    {totalGenerated > 0 ? (
      <>
        You&apos;ve quoted <span className="font-mono font-bold text-primary">${totalGenerated.toLocaleString()}</span> in rates this month
      </>
    ) : (
      "Ready to know your worth? Let's get you a rate."
    )}
  </p>
</header>
```

**5. Update monetary values to be more prominent:**

Wherever rates/prices are shown, make them pop:

```tsx
{/* Rate display - larger, bolder */}
<div className="text-center">
  <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight">
    ${minRate.toLocaleString()}
  </span>
  <span className="text-2xl md:text-3xl text-muted-foreground mx-2">–</span>
  <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight">
    ${maxRate.toLocaleString()}
  </span>
</div>
```

**6. Add subtle text shadows to CTA sections:**

In the big CTA block:

```tsx
<h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight-display text-primary-foreground text-shadow-sm">
  ready to know your worth?
</h2>
```

**7. Verify:**
- Hero headline feels more impactful (bigger on desktop)
- Section headers use display font consistently
- Monetary values are prominently styled
- Dashboard greeting feels warm but confident
- Letter-spacing looks clean on display text
- No jarring font-size jumps between breakpoints

Run `pnpm build` and compare before/after screenshots.
```

---

### Prompt 10: Profile Gamification

```
Transform the profile completeness indicator into a level-based gamification system that makes filling out the profile feel rewarding.

**Current State:** Simple percentage bar (e.g., "80% complete")
**Target State:** Level system with achievements (Beginner → Rising → Pro)

**1. Create level system types in `src/lib/gamification.ts`:**

```tsx
export type CreatorLevel = "beginner" | "rising" | "pro" | "expert"

interface LevelConfig {
  name: string
  minPercentage: number
  emoji: string
  color: string
  description: string
}

export const CREATOR_LEVELS: Record<CreatorLevel, LevelConfig> = {
  beginner: {
    name: "Beginner",
    minPercentage: 0,
    emoji: "🌱",
    color: "text-yellow-500",
    description: "Just getting started",
  },
  rising: {
    name: "Rising",
    minPercentage: 40,
    emoji: "🌟",
    color: "text-primary",
    description: "Building your profile",
  },
  pro: {
    name: "Pro",
    minPercentage: 70,
    emoji: "🔥",
    color: "text-orange-500",
    description: "Profile looking strong",
  },
  expert: {
    name: "Expert",
    minPercentage: 100,
    emoji: "👑",
    color: "text-amber-500",
    description: "Fully optimized",
  },
}

export function getCreatorLevel(percentage: number): CreatorLevel {
  if (percentage >= 100) return "expert"
  if (percentage >= 70) return "pro"
  if (percentage >= 40) return "rising"
  return "beginner"
}

export function getNextLevel(current: CreatorLevel): CreatorLevel | null {
  const order: CreatorLevel[] = ["beginner", "rising", "pro", "expert"]
  const currentIndex = order.indexOf(current)
  if (currentIndex === order.length - 1) return null
  return order[currentIndex + 1]
}

export function getPercentageToNextLevel(percentage: number): number {
  const current = getCreatorLevel(percentage)
  const next = getNextLevel(current)
  if (!next) return 0

  const nextConfig = CREATOR_LEVELS[next]
  const currentConfig = CREATOR_LEVELS[current]

  const range = nextConfig.minPercentage - currentConfig.minPercentage
  const progress = percentage - currentConfig.minPercentage
  return Math.round((progress / range) * 100)
}
```

**2. Update `src/components/profile/profile-completeness.tsx`:**

```tsx
"use client";

import { cn } from "@/lib/utils";
import {
  getCreatorLevel,
  getNextLevel,
  CREATOR_LEVELS,
  getPercentageToNextLevel,
} from "@/lib/gamification";

interface ProfileCompletenessProps {
  percentage: number;
  className?: string;
  showDetails?: boolean;
}

export function ProfileCompleteness({
  percentage,
  className,
  showDetails = false,
}: ProfileCompletenessProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const level = getCreatorLevel(clampedPercentage);
  const levelConfig = CREATOR_LEVELS[level];
  const nextLevel = getNextLevel(level);
  const progressToNext = getPercentageToNextLevel(clampedPercentage);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Level badge */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{levelConfig.emoji}</span>
        <div>
          <div className={cn("font-semibold text-sm", levelConfig.color)}>
            {levelConfig.name}
          </div>
          {showDetails && (
            <div className="text-xs text-muted-foreground">
              {levelConfig.description}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              level === "expert"
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : level === "pro"
                ? "bg-gradient-to-r from-orange-400 to-orange-500"
                : level === "rising"
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500"
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Progress text */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">{Math.round(clampedPercentage)}%</span>
          {nextLevel && (
            <span>
              {progressToNext}% to {CREATOR_LEVELS[nextLevel].emoji} {CREATOR_LEVELS[nextLevel].name}
            </span>
          )}
          {!nextLevel && <span className="text-amber-500">✓ Max level!</span>}
        </div>
      </div>
    </div>
  );
}

// Keep existing calculateProfileCompleteness function unchanged
export { calculateProfileCompleteness } from "./profile-completeness-calc";
```

**3. Extract calculation to separate file `src/components/profile/profile-completeness-calc.ts`:**

Move the `calculateProfileCompleteness` function to this file to keep components clean.

**4. Add level-up celebration:**

In the profile page, trigger celebration when level increases:

```tsx
import { useCelebration } from "@/hooks/use-celebration"
import { getCreatorLevel } from "@/lib/gamification"

// Track previous level
const [prevLevel, setPrevLevel] = useState<string | null>(null)
const currentLevel = getCreatorLevel(completeness)

useEffect(() => {
  if (prevLevel && prevLevel !== currentLevel) {
    // Level changed - check if it's an upgrade
    const levels = ["beginner", "rising", "pro", "expert"]
    const prevIndex = levels.indexOf(prevLevel)
    const currentIndex = levels.indexOf(currentLevel)

    if (currentIndex > prevIndex) {
      // Level up! Celebrate
      celebrate("profile_level_up")
    }
  }
  setPrevLevel(currentLevel)
}, [currentLevel, prevLevel, celebrate])
```

**5. Add level_up milestone to celebrations:**

In `src/lib/celebrations.ts`:

```tsx
profile_level_up: {
  type: "profile_level_up",
  title: "Level up!",
  emoji: "⬆️",
  subtitle: "Your profile just got stronger.",
},
```

**6. Update profile page to show detailed view:**

```tsx
<ProfileCompleteness percentage={completeness} showDetails />
```

**7. Verify:**
- 0-39%: Shows 🌱 Beginner with yellow bar
- 40-69%: Shows 🌟 Rising with teal bar
- 70-99%: Shows 🔥 Pro with orange bar
- 100%: Shows 👑 Expert with gold bar and "Max level!"
- Progress text shows "X% to next level"
- Level-up triggers celebration + confetti
- Gradient progress bar looks polished

Run `pnpm build` and test level transitions.
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

### Session 3: Visual Polish

```
STEP 17: Landing Page Visual Refresh
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 6 (Landing Page Visual Refresh) exactly as written.
```

```
STEP 18: Commit
```
```bash
git add -A && git commit -m "feat: landing page visual refresh with creator-native styling"
```

```
STEP 19: /clear
```

```
STEP 20: Brand Inbox Visual Enhancements
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 7 (Brand Inbox Visual Enhancements) exactly as written.
```

```
STEP 21: Commit
```
```bash
git add -A && git commit -m "feat: add deal quality badges and visual indicators"
```

```
STEP 22: /clear
```

```
STEP 23: Dashboard Card Differentiation
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 8 (Dashboard Card Visual Differentiation) exactly as written.
```

```
STEP 24: Commit
```
```bash
git add -A && git commit -m "feat: differentiate dashboard action cards with accents"
```

```
STEP 25: /clear
```

---

### Session 4: Typography & Gamification

```
STEP 26: Typography Polish
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 9 (Typography Polish) exactly as written.
```

```
STEP 27: Commit
```
```bash
git add -A && git commit -m "polish: bolder typography and visual hierarchy"
```

```
STEP 28: /clear
```

```
STEP 29: Profile Gamification
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 10 (Profile Gamification) exactly as written.
```

```
STEP 30: Commit
```
```bash
git add -A && git commit -m "feat: profile gamification with level system"
```

```
STEP 31: /clear
```

---

### Session 5: Testing & Ship

```
STEP 32: Testing & Polish
```
```
Read IMPLEMENTATION_PLAN_V5.md and implement Prompt 5 (Testing & Polish) exactly as written. Also verify all new prompts (6-10) pass their verification criteria.

Additional verification for new prompts:

**Prompt 6 Verification:**
- [ ] Feature cards have distinct visual identities (primary vs coral)
- [ ] Stats section uses color-coded values
- [ ] Creator avatars section present
- [ ] How It Works steps animate in

**Prompt 7 Verification:**
- [ ] Deal quality badges render correctly
- [ ] Gift offer badge shows coral color
- [ ] Urgent/deadline badge shows amber
- [ ] Red flags badge shows red
- [ ] Badges appear in analysis results

**Prompt 8 Verification:**
- [ ] Quick Rate card has teal accent + ⚡ emoji
- [ ] Gift Deals card has coral accent + 🎁 emoji
- [ ] Hover states use respective accent colors
- [ ] Icons scale on hover

**Prompt 9 Verification:**
- [ ] Hero headline is larger (text-8xl on xl screens)
- [ ] Section headers use font-display consistently
- [ ] Monetary values are prominently styled
- [ ] Letter-spacing utilities work

**Prompt 10 Verification:**
- [ ] Level system shows correct level for percentage
- [ ] Progress bar has gradient colors per level
- [ ] "X% to next level" text shows
- [ ] 100% shows "Max level!"
- [ ] Level-up triggers celebration
```

```
STEP 33: Commit
```
```bash
git add -A && git commit -m "polish: v5 testing and final fixes"
```

```
STEP 34: Push
```
```bash
git push origin main
```

---

## Quick Reference

| Step | Action | Time Est. |
|------|--------|-----------|
| 1-3 | Color Palette Update | 30 min |
| 4-6 | Unified Brand Inbox | 45 min |
| 7-9 | Mobile Rate Sheet | 30 min |
| 10-12 | Personalization | 30 min |
| 13-16 | Celebrations | 45 min |
| 17-19 | Landing Page Refresh | 45 min |
| 20-22 | Brand Inbox Badges | 30 min |
| 23-25 | Dashboard Cards | 20 min |
| 26-28 | Typography Polish | 20 min |
| 29-31 | Profile Gamification | 45 min |
| 32-34 | Testing & Ship | 30 min |

**Total: 34 steps, 11 prompts, 11 commits, ~6 hours**

---

## Success Criteria

After completing all prompts:

### Core Functionality (Prompts 0-5)
✅ Color palette is teal, not violet
✅ Brand Inbox accepts DMs, emails, AND brief files
✅ "Got a brand message?" label (not "NEW MESSAGE?")
✅ Mobile Rate Preview is sticky and visible while editing profile
✅ Time-based greetings with @handle personalization
✅ Milestone celebrations beyond first rate card

### Visual Polish (Prompts 6-10)
✅ Landing page feature cards have distinct visual identities
✅ Social proof section feels authentic with creator avatars
✅ Deal quality badges show in analysis results
✅ Dashboard action cards have unique accent colors
✅ Typography is bolder with better hierarchy
✅ Profile uses level-based gamification system

### Quality
✅ All tests pass
✅ No TypeScript errors
✅ Mobile-first responsive design maintained
✅ No console errors in browser
✅ Lighthouse score > 90 for performance
