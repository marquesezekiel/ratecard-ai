# RateCard.AI Implementation Plan V4: UI/UX Overhaul

## Overview

This document contains detailed prompts to implement a comprehensive UI/UX overhaul for RateCard.AI, transforming it from "solid SaaS" to "award-winning creator tool."

**Timeline**: 1 day
**Focus**: Typography, Navigation, Dashboard, Page-specific fixes, Micro-interactions
**Target User**: 22-year-old creator with 15K followers

### Change Summary

| Category | Changes |
|----------|---------|
| Typography | Geist → Satoshi + Clash Display + JetBrains Mono |
| Navigation | 5 bottom nav items → 3 + Menu + FAB |
| Dashboard | Generic cards → Command center with inline analyzer |
| Landing Page | 4 features → 2 hero features, better social proof |
| Quote Flow | No progress → Step indicator with connecting line |
| Profile Page | 30+ fields → Progressive disclosure with preview |
| Message Analyzer | "Analyze DM" → "Brand Inbox" with personality |
| Micro-interactions | Static → Animated reveals, confetti, copy feedback |

---

## Design Tokens Reference

### Typography Scale
```
Font Families:
  --font-display: "Clash Display", sans-serif    // Headlines
  --font-sans: "Satoshi", sans-serif             // Body/UI
  --font-mono: "JetBrains Mono", monospace       // Numbers/Code

Font Sizes:
  Hero:       text-5xl md:text-7xl (48px / 72px)
  Page Title: text-3xl md:text-4xl (30px / 36px)
  Section:    text-xl md:text-2xl (20px / 24px)
  Body:       text-base (16px)
  Small:      text-sm (14px)
  Tiny:       text-xs (12px)

Font Weights:
  Display:    font-bold (700)
  Heading:    font-semibold (600)
  Body:       font-medium (500)
  Light:      font-normal (400)
```

### Spacing System (8px base)
```
--space-1: 4px   (p-1)
--space-2: 8px   (p-2)
--space-3: 12px  (p-3)
--space-4: 16px  (p-4)
--space-6: 24px  (p-6)
--space-8: 32px  (p-8)
--space-12: 48px (p-12)
--space-16: 64px (p-16)

Card Padding: 24px desktop, 16px mobile
Section Gap: 48px
Component Gap: 16px
```

### Color Adjustments (Optional - keep violet but bolder)
```
Primary:          oklch(0.50 0.22 275)  // Deeper, more saturated violet
Primary Hover:    oklch(0.45 0.24 275)  // Even deeper on hover
Accent Success:   oklch(0.65 0.20 155)  // Money green for rates
```

---

## Implementation Prompts

### Prompt 0: Typography Foundation

```
Update the typography system to use Satoshi, Clash Display, and JetBrains Mono fonts.

**1. Update `src/app/layout.tsx`:**

Remove Geist fonts and add new font imports. Use next/font/local for self-hosted fonts or next/font/google if available.

For self-hosted approach:
- Download Satoshi from https://www.fontshare.com/fonts/satoshi (400, 500, 600, 700)
- Download Clash Display from https://www.fontshare.com/fonts/clash-display (600, 700)
- Download JetBrains Mono from Google Fonts (400, 500)
- Place in public/fonts/ directory

Create font configurations:
```typescript
import localFont from 'next/font/local'

const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400' },
    { path: '../public/fonts/Satoshi-Medium.woff2', weight: '500' },
    { path: '../public/fonts/Satoshi-SemiBold.woff2', weight: '600' },
    { path: '../public/fonts/Satoshi-Bold.woff2', weight: '700' },
  ],
  variable: '--font-sans',
})

const clashDisplay = localFont({
  src: [
    { path: '../public/fonts/ClashDisplay-Semibold.woff2', weight: '600' },
    { path: '../public/fonts/ClashDisplay-Bold.woff2', weight: '700' },
  ],
  variable: '--font-display',
})

const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-Medium.woff2',
  weight: '500',
  variable: '--font-mono',
})
```

Apply to body: `${satoshi.variable} ${clashDisplay.variable} ${jetbrainsMono.variable} font-sans`

**2. Update `tailwind.config.ts`:**

```typescript
fontFamily: {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
}
```

**3. Update `src/app/globals.css`:**

Add utility classes:
```css
.font-display {
  font-family: var(--font-display), var(--font-sans), sans-serif;
}

/* For monetary values */
.font-money {
  font-family: var(--font-mono), monospace;
  font-variant-numeric: tabular-nums;
}
```

**4. Update key headlines across the app to use `font-display`:**

- Landing page hero: "stop guessing. start charging." → add `font-display`
- All page titles (Dashboard, Profile, etc.) → add `font-display`
- Rate amounts ($500, etc.) → add `font-mono` or `font-money`

**5. Create a test page or component to verify fonts load correctly.**

Files to check fonts are applied:
- src/app/page.tsx (landing)
- src/app/dashboard/page.tsx
- src/components/rate-card/pricing-breakdown.tsx (for money values)

Verify:
- Headlines feel bold and distinctive (Clash Display)
- Body text is readable and friendly (Satoshi)
- Numbers are crisp and aligned (JetBrains Mono)

Run `pnpm build` to ensure no errors. Show me the font setup is complete.
```

---

### Prompt 1: Navigation Restructure

```
Restructure the mobile navigation from 5 items to 3 + Menu, and add a Floating Action Button (FAB).

**Current Navigation (5 items):**
Home, Analyze DM, Gifts, My Rates, Profile

**New Navigation (3 + Menu + FAB):**
- Home (dashboard)
- Analyze (message analyzer - killer feature)
- Rates (my rate cards)
- Menu (hamburger → Profile, Gifts, Tools, Settings)
- FAB: + New Rate Card (floating, primary action)

**1. Update `src/app/dashboard/layout.tsx`:**

Restructure the bottom navigation:

```tsx
// Bottom nav items - reduced to 3 + menu
const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/analyze', icon: MessageSquare, label: 'Analyze' },
  { href: '/dashboard/rates', icon: FileText, label: 'Rates' },
]

// Menu items (in sheet/drawer)
const menuItems = [
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/gifts', icon: Gift, label: 'Gift Deals' },
  { href: '/dashboard/tools', icon: Wrench, label: 'Tools' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]
```

**2. Create FAB component `src/components/ui/fab.tsx`:**

```tsx
"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FABProps {
  className?: string
}

export function FAB({ className }: FABProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/dashboard/quick-quote')}
      className={cn(
        "fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6",
        "h-14 w-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label="Create new rate card"
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
```

**3. Create Menu Sheet `src/components/navigation/menu-sheet.tsx`:**

```tsx
"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, Gift, Wrench, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MenuSheet() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
    { href: '/dashboard/gifts', icon: Gift, label: 'Gift Deals' },
    { href: '/dashboard/tools/brand-vetter', icon: Wrench, label: 'Brand Vetter' },
    { href: '/dashboard/tools/contract-scanner', icon: FileSearch, label: 'Contract Scanner' },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center p-2">
          <Menu className="h-5 w-5" />
          <span className="text-xs mt-1">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 py-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                "hover:bg-accent transition-colors",
                pathname === item.href && "bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <hr className="my-2" />
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

**4. Update bottom navigation in dashboard layout:**

Replace the 5-item nav with the new 3 + menu structure. Include the FAB.

**5. Update desktop navigation:**

On desktop, keep a more traditional sidebar or top nav, but ensure the FAB is still visible in the bottom-right corner.

**6. Ensure active states are visually clear:**

- Active nav item should have filled background
- Use primary color for active icon
- Add subtle indicator dot or underline

Test on mobile viewport (375px):
- Bottom nav should show: Home, Analyze, Rates, Menu (4 items max width)
- FAB should float above the nav bar
- Menu sheet should slide up smoothly
- All links should work

Run `pnpm build` and verify no errors.
```

---

### Prompt 2: Dashboard Redesign (One-Page Test)

```
Redesign the dashboard to be a "creator command center" with inline message analyzer.

**Current Dashboard:**
- Welcome header
- 4 equal cards (Quick Quote, Analyze DM, Upload Brief, Evaluate Gift)
- Recent Rates section

**New Dashboard:**
- Success metric header ("You've generated $X in rates")
- Inline message analyzer (the killer feature, no navigation needed)
- Two secondary action cards (smaller)
- Recent activity feed

**1. Update `src/app/dashboard/page.tsx`:**

```tsx
export default async function DashboardPage() {
  // Get user data
  const session = await auth.api.getSession(...)
  const user = session?.user

  // Get stats (total rates generated, pending gifts, etc.)
  // const stats = await getCreatorStats(user.id)

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      {/* Success-focused header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold">
          Hey {user?.name?.split(' ')[0] || 'Creator'} 👋
        </h1>
        <p className="text-muted-foreground">
          You've generated <span className="font-mono font-semibold text-primary">$2,340</span> in rates this month
        </p>
      </header>

      {/* PRIMARY: Inline Message Analyzer */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          New Message?
        </h2>
        <InlineMessageAnalyzer />
      </section>

      {/* SECONDARY: Quick actions */}
      <section className="grid grid-cols-2 gap-4">
        <QuickActionCard
          href="/dashboard/quick-quote"
          icon={Calculator}
          title="Quick Rate"
          description="Get an instant quote"
          variant="outline"
        />
        <QuickActionCard
          href="/dashboard/gifts"
          icon={Gift}
          title="Gift Deals"
          badge={pendingGifts > 0 ? `${pendingGifts} pending` : undefined}
          description="Track gift offers"
          variant="outline"
        />
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recent Activity
        </h2>
        <RecentActivityFeed activities={recentActivities} />
      </section>
    </div>
  )
}
```

**2. Create `src/components/dashboard/inline-message-analyzer.tsx`:**

This is the killer feature - analyze messages without navigating away.

```tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, MessageSquare, Mail, Image } from "lucide-react"
import { useRouter } from "next/navigation"

export function InlineMessageAnalyzer() {
  const [message, setMessage] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const handleAnalyze = async () => {
    if (!message.trim()) return

    // Option 1: Navigate to full analyzer with message pre-filled
    router.push(`/dashboard/analyze?message=${encodeURIComponent(message)}`)

    // Option 2: Analyze inline and show results (more advanced)
    // setIsAnalyzing(true)
    // const result = await analyzeMessage(message)
    // setResult(result)
  }

  return (
    <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-4">
        <Textarea
          placeholder="Paste a brand DM or email here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> DMs
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Emails
            </span>
            <span className="flex items-center gap-1">
              <Image className="h-3 w-3" /> Screenshots
            </span>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!message.trim() || isAnalyzing}
            size="sm"
          >
            Analyze
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**3. Create `src/components/dashboard/quick-action-card.tsx`:**

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  variant?: "default" | "outline"
}

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  variant = "default"
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className={cn(
        "h-full transition-all hover:shadow-md hover:-translate-y-0.5",
        variant === "outline" && "border-2"
      )}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <Icon className="h-5 w-5 text-primary" />
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

**4. Create `src/components/dashboard/recent-activity-feed.tsx`:**

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Gift, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: "rate_card" | "gift" | "message"
  title: string
  subtitle?: string
  timestamp: Date
}

export function RecentActivityFeed({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No activity yet. Analyze your first brand message to get started!</p>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "rate_card": return FileText
      case "gift": return Gift
      case "message": return MessageSquare
    }
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {activities.map((activity) => {
          const Icon = getIcon(activity.type)
          return (
            <div key={activity.id} className="flex items-center gap-3 p-4">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.title}</p>
                {activity.subtitle && (
                  <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </time>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

**5. Remove or repurpose old dashboard components if they exist.**

**6. Verify the new dashboard:**
- Header shows personalized greeting with success metric
- Inline analyzer is prominent and functional
- Secondary actions are visually subordinate
- Activity feed shows recent items or helpful empty state
- Mobile responsive (stack vertically on small screens)

Run `pnpm build` and test on mobile viewport.
```

---

### Prompt 3: Landing Page Fixes

```
Fix the landing page issues: reduce features from 4 to 2 hero features, add social proof, improve mobile experience.

**Issues to Fix:**
1. Hero blobs hidden on mobile (wasted space)
2. 4 feature cards is too many (prioritize top 2)
3. "3 steps" section is forgettable (make more visual)
4. Footer is too minimal (add social proof)

**1. Update Hero Section in `src/app/page.tsx`:**

On mobile, replace hidden blobs with subtle gradient background:

```tsx
{/* Hero background - simplified for mobile */}
<div className="absolute inset-0 -z-10">
  {/* Mobile: Simple gradient */}
  <div className="md:hidden absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

  {/* Desktop: Keep animated blobs */}
  <div className="hidden md:block">
    {/* existing blob animations */}
  </div>
</div>
```

**2. Reduce Feature Section to 2 Hero Features:**

Instead of 4 equal cards, show 2 prominent features with supporting text:

```tsx
<section className="py-16 md:py-24">
  <div className="container max-w-5xl">
    <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
      Everything you need to get paid fairly
    </h2>

    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
      {/* Feature 1: Message Analyzer (Killer Feature) */}
      <Card className="p-6 md:p-8 border-2">
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-display font-semibold">
            Analyze Any Brand Message
          </h3>
          <p className="text-muted-foreground">
            Paste a DM or email. We'll tell you if it's legit, what to charge,
            and give you a response to copy-paste.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Detects gift offers vs paid opportunities
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Spots scams and red flags
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Generates ready-to-send responses
            </li>
          </ul>
        </div>
      </Card>

      {/* Feature 2: Rate Cards */}
      <Card className="p-6 md:p-8 border-2">
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-display font-semibold">
            Professional Rate Cards
          </h3>
          <p className="text-muted-foreground">
            Generate a PDF rate card you can send to any brand. Backed by real
            market data so you never undercharge.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              10+ pricing factors calculated
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Negotiation talking points included
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Looks like it came from an agency
            </li>
          </ul>
        </div>
      </Card>
    </div>

    {/* Link to see all features */}
    <p className="text-center mt-8 text-muted-foreground">
      Plus gift deal tracking, contract scanning, brand vetting, and more.
    </p>
  </div>
</section>
```

**3. Make "How It Works" More Visual:**

Add icons and make steps more prominent:

```tsx
<section className="py-16 md:py-24 bg-muted/30">
  <div className="container max-w-4xl">
    <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
      Get your rate in 60 seconds
    </h2>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        {
          step: "01",
          title: "Tell us about you",
          description: "Platform, followers, engagement rate",
          icon: User,
        },
        {
          step: "02",
          title: "Describe the deal",
          description: "Content type, usage rights, timeline",
          icon: FileText,
        },
        {
          step: "03",
          title: "Get your rate card",
          description: "Download a PDF ready to send",
          icon: Download,
        },
      ].map((item, i) => (
        <div key={i} className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <item.icon className="h-8 w-8" />
          </div>
          <div className="text-4xl font-display font-bold text-primary/20">
            {item.step}
          </div>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**4. Add Social Proof to Footer:**

```tsx
<footer className="py-12 border-t">
  <div className="container max-w-4xl">
    {/* Social proof stats */}
    <div className="grid grid-cols-3 gap-4 mb-8 text-center">
      <div>
        <div className="text-2xl font-display font-bold">10K+</div>
        <div className="text-sm text-muted-foreground">Rate cards generated</div>
      </div>
      <div>
        <div className="text-2xl font-display font-bold">$2.4M</div>
        <div className="text-sm text-muted-foreground">In rates calculated</div>
      </div>
      <div>
        <div className="text-2xl font-display font-bold">4.9/5</div>
        <div className="text-sm text-muted-foreground">Creator rating</div>
      </div>
    </div>

    {/* Footer links */}
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span>RateCard.AI</span>
      </div>
      <div className="flex gap-4">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="mailto:hello@ratecard.ai">Contact</Link>
      </div>
    </div>
  </div>
</footer>
```

**5. Verify landing page:**
- Mobile: gradient background visible, no wasted space
- Features: 2 prominent cards with clear value props
- How it works: visual, scannable
- Footer: includes social proof stats
- All CTAs work

Run `pnpm build` and test at 375px viewport.
```

---

### Prompt 4: Quote Flow Fixes

```
Fix the quote flow: add progress indicator, make steps feel connected.

**Issues to Fix:**
1. No visual progress indicator
2. Steps feel disconnected
3. Results page is dense

**1. Create Step Progress Component `src/components/ui/step-progress.tsx`:**

```tsx
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export function StepProgress({ currentStep, totalSteps, labels }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep

        return (
          <div key={i} className="flex items-center">
            {/* Step circle */}
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
            </div>

            {/* Connector line */}
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 mx-2 transition-colors",
                  stepNum < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**2. Update Quote Page `src/app/quote/page.tsx`:**

Add the step progress at the top:

```tsx
export default function QuotePage() {
  const [step, setStep] = useState(1)

  return (
    <div className="container max-w-2xl py-8">
      {/* Progress indicator */}
      <StepProgress
        currentStep={step}
        totalSteps={3}
      />

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">
            {step === 1 && "About You"}
            {step === 2 && "The Deal"}
            {step === 3 && "Your Rate"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Tell us about your platform and audience"}
            {step === 2 && "Describe what the brand is asking for"}
            {step === 3 && "Here's what you should charge"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step forms */}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button onClick={() => setStep(s => s + 1)} className="ml-auto">
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
```

**3. Improve Results Layout (Step 3):**

Use tabs to separate Pricing from Talking Points:

```tsx
{step === 3 && (
  <Tabs defaultValue="pricing" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="pricing">Your Rate</TabsTrigger>
      <TabsTrigger value="tips">Negotiation Tips</TabsTrigger>
    </TabsList>

    <TabsContent value="pricing" className="space-y-6">
      {/* Fit Score Display */}
      <FitScoreDisplay score={result.fitScore} />

      {/* Pricing Breakdown */}
      <PricingBreakdown pricing={result.pricing} />

      {/* Download/Share buttons */}
      <ShareActions result={result} />
    </TabsContent>

    <TabsContent value="tips" className="space-y-6">
      <NegotiationCheatSheet points={result.talkingPoints} />
    </TabsContent>
  </Tabs>
)}
```

**4. Also update `/dashboard/quick-quote/page.tsx` with same improvements if structure differs.**

**5. Verify the quote flow:**
- Progress indicator shows current step (circle highlighted, previous filled)
- Connector lines animate as steps complete
- Back/Continue buttons work correctly
- Results use tabs to reduce density
- Mobile friendly

Run `pnpm build` and test the flow end-to-end.
```

---

### Prompt 5: Profile Page Fixes

```
Fix the profile page: implement progressive disclosure, add live preview.

**Issues to Fix:**
1. Form is too long (30+ fields) - overwhelming
2. Platform tabs confusing on mobile
3. No preview of how profile affects rates

**1. Update Profile Page `src/app/dashboard/profile/page.tsx`:**

Split into collapsible sections with progress indicator:

```tsx
export default function ProfilePage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            The more you share, the more accurate your rates
          </p>
        </div>
        <ProfileCompleteness percentage={65} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main form - 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Basic Info (always expanded) */}
          <ProfileSection
            title="Basic Info"
            description="Required for rate calculations"
            defaultOpen={true}
          >
            <BasicInfoForm />
          </ProfileSection>

          {/* Section 2: Platform Stats (collapsible) */}
          <ProfileSection
            title="Platform Stats"
            description="Add your main platform metrics"
            badge="Recommended"
          >
            <PlatformStatsForm />
          </ProfileSection>

          {/* Section 3: Audience (collapsible, optional) */}
          <ProfileSection
            title="Audience Demographics"
            description="Helps with niche-specific rates"
            badge="Optional"
            defaultOpen={false}
          >
            <AudienceForm />
          </ProfileSection>
        </div>

        {/* Live Preview - 1 col, sticky */}
        <div className="hidden md:block">
          <div className="sticky top-6">
            <RatePreviewCard />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**2. Create Collapsible Profile Section `src/components/profile/profile-section.tsx`:**

```tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileSectionProps {
  title: string
  description: string
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function ProfileSection({
  title,
  description,
  badge,
  defaultOpen = true,
  children
}: ProfileSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}
```

**3. Create Profile Completeness Indicator `src/components/profile/profile-completeness.tsx`:**

```tsx
interface ProfileCompletenessProps {
  percentage: number
}

export function ProfileCompleteness({ percentage }: ProfileCompletenessProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">
        {percentage}% complete
      </div>
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

**4. Create Live Rate Preview `src/components/profile/rate-preview-card.tsx`:**

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfileForm } from "@/hooks/use-profile-form" // or your form context

export function RatePreviewCard() {
  // Get form values from context/state
  const { followers, platform, engagementRate } = useProfileForm()

  // Calculate estimated rate based on current form values
  const estimatedRate = calculateQuickEstimate({
    followerCount: followers || 10000,
    platform: platform || "instagram",
    contentFormat: "reel",
  })

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Estimated Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold font-mono">
          ${estimatedRate.minRate.toLocaleString()} - ${estimatedRate.maxRate.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          For a typical Instagram Reel. Add more details for accurate rates.
        </p>
      </CardContent>
    </Card>
  )
}
```

**5. Simplify Platform Stats Form:**

Only show platforms the user has indicated they use:

```tsx
// In BasicInfoForm, add:
<FormField
  name="activePlatforms"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Which platforms do you use?</FormLabel>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Badge
            key={platform}
            variant={field.value?.includes(platform) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              const current = field.value || []
              const updated = current.includes(platform)
                ? current.filter(p => p !== platform)
                : [...current, platform]
              field.onChange(updated)
            }}
          >
            {platform}
          </Badge>
        ))}
      </div>
    </FormItem>
  )}
/>

// Then in PlatformStatsForm, only show tabs for selected platforms
```

**6. Verify profile page:**
- Sections collapse/expand smoothly
- Progress indicator updates as fields are filled
- Live preview shows estimated rate
- Optional sections are clearly marked
- Mobile: sections stack, preview hidden (or at bottom)

Run `pnpm build` and test.
```

---

### Prompt 6: Message Analyzer Fixes

```
Fix the Message Analyzer: rename from "Analyze DM", add personality to results.

**Issues to Fix:**
1. Title "Analyze DM" is limiting (now handles email too)
2. Textarea feels small
3. Results feel clinical

**1. Update Page Title and Copy:**

In `src/app/dashboard/analyze/page.tsx`:

```tsx
<div className="space-y-2 mb-6">
  <h1 className="text-2xl font-display font-bold">Brand Inbox</h1>
  <p className="text-muted-foreground">
    Paste any message from a brand - DMs, emails, even screenshots.
    We'll tell you what it's worth and how to respond.
  </p>
</div>
```

**2. Update Message Analyzer Form:**

In `src/components/forms/message-analyzer-form.tsx` (or dm-parser-form.tsx):

```tsx
<Textarea
  placeholder="Paste a brand message here...

Example DM:
'Hey! We love your content and would love to send you some products to try!'

Example Email:
'Dear Creator, We're reaching out about a paid partnership opportunity...'"
  className="min-h-[200px] text-base leading-relaxed"
  // ... rest of props
/>
```

**3. Add Personality to Results:**

In the results component, add contextual messages based on analysis:

```tsx
function getResultHeadline(analysis: MessageAnalysis) {
  if (analysis.compensationType === "gifted") {
    return {
      emoji: "🎁",
      headline: "Gift Offer Detected",
      subline: "They want to send free product in exchange for content"
    }
  }
  if (analysis.compensationType === "paid") {
    return {
      emoji: "💰",
      headline: "Paid Opportunity!",
      subline: `They mentioned ${analysis.offeredAmount ? `$${analysis.offeredAmount}` : 'payment'}`
    }
  }
  if (analysis.tone === "scam_likely") {
    return {
      emoji: "🚩",
      headline: "This Looks Suspicious",
      subline: "We detected some red flags you should know about"
    }
  }
  if (analysis.tone === "mass_outreach") {
    return {
      emoji: "📋",
      headline: "Mass Outreach Template",
      subline: "This message was probably sent to many creators"
    }
  }
  return {
    emoji: "📬",
    headline: "Message Analyzed",
    subline: "Here's what we found"
  }
}

// In the result display:
const { emoji, headline, subline } = getResultHeadline(analysis)

<div className="text-center py-4">
  <div className="text-4xl mb-2">{emoji}</div>
  <h2 className="text-xl font-display font-semibold">{headline}</h2>
  <p className="text-muted-foreground">{subline}</p>
</div>
```

**4. Add Quick Actions Based on Result:**

```tsx
<div className="flex flex-wrap gap-2 justify-center mt-4">
  {analysis.isGiftOffer && (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/dashboard/gifts/evaluate?brand=${analysis.brandName}`}>
        Evaluate This Gift
      </Link>
    </Button>
  )}

  {analysis.brandName && (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/dashboard/tools/brand-vetter?brand=${analysis.brandName}`}>
        Vet This Brand
      </Link>
    </Button>
  )}

  {analysis.compensationType === "paid" && (
    <Button size="sm" asChild>
      <Link href={`/dashboard/quick-quote?prefill=${encodeData(analysis)}`}>
        Generate Rate Card
      </Link>
    </Button>
  )}
</div>
```

**5. Update Navigation Labels:**

In dashboard layout, update the nav label:
- Before: "Analyze DM"
- After: "Inbox" or "Analyze"

**6. Verify Message Analyzer:**
- Page title says "Brand Inbox"
- Textarea is larger and inviting
- Placeholder shows examples for both DM and email
- Results have personality (emoji, contextual headline)
- Quick action buttons appear based on analysis type
- Vet Brand button links correctly

Run `pnpm build` and test with sample messages.
```

---

### Prompt 7: Micro-interactions & Animations

```
Add micro-interactions: animated rate reveal, confetti on first rate card, copy feedback, score animations.

**1. Create Animated Number Component `src/components/ui/animated-number.tsx`:**

```tsx
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  className
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * easeOut)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}
```

**2. Create Confetti Component `src/components/ui/confetti.tsx`:**

```tsx
"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function useConfetti() {
  const fire = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#22C55E', '#FCD34D']
    })
  }

  return { fire }
}

// Usage: const { fire } = useConfetti(); fire();
```

Add to package.json: `"canvas-confetti": "^1.9.0"` and `@types/canvas-confetti`

**3. Create Copy Button with Feedback `src/components/ui/copy-button.tsx`:**

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn("gap-2", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </Button>
  )
}
```

**4. Create Animated Score Gauge `src/components/ui/animated-gauge.tsx`:**

```tsx
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedGaugeProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
}

export function AnimatedGauge({
  value,
  size = 120,
  strokeWidth = 8,
  className
}: AnimatedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const getColor = (val: number) => {
    if (val >= 80) return "text-green-500"
    if (val >= 60) return "text-blue-500"
    if (val >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out stroke-current", getColor(value))}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-2xl font-display font-bold", getColor(value))}>
          {animatedValue}
        </span>
      </div>
    </div>
  )
}
```

**5. Add Button Press Animation:**

Update `src/components/ui/button.tsx` to include press feedback:

```tsx
// Add to button base classes:
"active:scale-[0.98] transition-transform"
```

**6. Integrate Animations into Existing Components:**

In PricingBreakdown or wherever rate is displayed:
```tsx
<AnimatedNumber value={finalRate} prefix="$" className="text-4xl font-bold" />
```

In FitScoreDisplay or DealQualityDisplay:
```tsx
<AnimatedGauge value={score} size={140} />
```

In NegotiationCheatSheet or response templates:
```tsx
<CopyButton text={responseTemplate} />
```

**7. Add First Rate Card Confetti:**

In the quick-quote results page or rate card generation:
```tsx
const { fire: fireConfetti } = useConfetti()
const [isFirstRateCard, setIsFirstRateCard] = useState(false)

useEffect(() => {
  // Check if this is user's first rate card
  const hasGeneratedBefore = localStorage.getItem('hasGeneratedRateCard')
  if (!hasGeneratedBefore && result) {
    setIsFirstRateCard(true)
    fireConfetti()
    localStorage.setItem('hasGeneratedRateCard', 'true')
  }
}, [result])

// Show celebration message for first-timers
{isFirstRateCard && (
  <div className="text-center py-4 animate-fade-in">
    <div className="text-2xl mb-2">🎉</div>
    <p className="font-semibold">Your first rate card!</p>
    <p className="text-sm text-muted-foreground">You're on your way to getting paid what you're worth.</p>
  </div>
)}
```

**8. Verify all animations:**
- Rate numbers animate counting up
- Score gauges fill smoothly
- Copy buttons show "Copied!" feedback
- First rate card triggers confetti
- Button presses have subtle scale effect

Run `pnpm build` and install canvas-confetti: `pnpm add canvas-confetti && pnpm add -D @types/canvas-confetti`
```

---

### Prompt 8: Spacing & Layout Consistency

```
Apply consistent spacing and layout patterns across all pages.

**Spacing System:**
- Component gap: 16px (gap-4)
- Section gap: 48px (space-y-12)
- Card padding: 24px desktop (p-6), 16px mobile (p-4)
- Page padding: 24px (py-6)

**1. Create Layout Constants `src/lib/layout.ts`:**

```typescript
export const layout = {
  // Container max widths
  container: {
    sm: "max-w-2xl",   // Forms, single column
    md: "max-w-4xl",   // Most pages
    lg: "max-w-6xl",   // Wide layouts
  },

  // Spacing
  spacing: {
    page: "py-6",
    section: "space-y-12",
    component: "space-y-4",
    card: "p-6 md:p-6", // Consistent card padding
  },

  // Common patterns
  pageHeader: "space-y-1 mb-6",
  sectionHeader: "space-y-1 mb-4",
}
```

**2. Audit and Update All Dashboard Pages:**

For each page in `src/app/dashboard/*/page.tsx`:

```tsx
// Consistent page structure
export default function SomePage() {
  return (
    <div className="container max-w-4xl py-6">
      {/* Page Header */}
      <header className="space-y-1 mb-6">
        <h1 className="text-2xl font-display font-bold">Page Title</h1>
        <p className="text-muted-foreground">Page description</p>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Sections with consistent spacing */}
      </div>
    </div>
  )
}
```

**3. Update Card Padding Consistency:**

Search for all Card usages and ensure consistent padding:

```tsx
// Before (inconsistent):
<Card className="p-4">
<Card className="p-5">
<Card className="px-6 py-4">

// After (consistent):
<CardContent className="p-6">
// Or for compact cards:
<CardContent className="p-4">
```

**4. Update Form Spacing:**

Ensure all forms have consistent field spacing:

```tsx
// Form fields should use space-y-4
<form className="space-y-4">
  <FormField ... />
  <FormField ... />
  <FormField ... />
</form>

// Form sections should use space-y-6
<div className="space-y-6">
  <section className="space-y-4">...</section>
  <section className="space-y-4">...</section>
</div>
```

**5. Update Grid Gaps:**

Standardize grid gaps across the app:

```tsx
// Card grids
<div className="grid md:grid-cols-2 gap-4">

// Feature grids (larger gap)
<div className="grid md:grid-cols-3 gap-6">
```

**6. Mobile Padding Check:**

Ensure no content touches screen edges on mobile:

```tsx
// Container should have horizontal padding
<div className="container px-4 md:px-6">
```

**7. Create Page Template Component (Optional) `src/components/layout/page-container.tsx`:**

```tsx
interface PageContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg"
}

export function PageContainer({
  title,
  description,
  children,
  maxWidth = "md"
}: PageContainerProps) {
  const widthClass = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
  }[maxWidth]

  return (
    <div className={cn("container py-6", widthClass)}>
      <header className="space-y-1 mb-6">
        <h1 className="text-2xl font-display font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
```

**8. Pages to Update:**
- /dashboard (home)
- /dashboard/quick-quote
- /dashboard/analyze
- /dashboard/profile
- /dashboard/gifts
- /dashboard/rates
- /dashboard/tools/* (all tool pages)

**9. Verify spacing consistency:**
- All pages have same container max-width pattern
- All pages have same vertical rhythm
- Cards have consistent padding
- Forms have consistent field spacing
- Mobile has proper edge padding

Run `pnpm build` and visually inspect each page at desktop and mobile viewports.
```

---

### Prompt 9: Testing & Polish

```
Final testing and polish for all UI/UX changes.

**1. Run Tests:**
```bash
pnpm test
pnpm build
pnpm lint
```

Fix any errors.

**2. Visual Regression Check - Desktop (1440px):**

Navigate through all pages and verify:

LANDING PAGE:
- [ ] Fonts: Clash Display on headlines, Satoshi on body
- [ ] Hero: Clear CTA, rate card preview visible
- [ ] Features: 2 hero features, not 4
- [ ] How it works: Visual with icons
- [ ] Footer: Social proof stats visible
- [ ] Animations: Smooth, not janky

DASHBOARD:
- [ ] Header: Shows success metric ("$X generated")
- [ ] Inline analyzer: Prominent, inviting textarea
- [ ] Secondary actions: Smaller, subordinate
- [ ] Activity feed: Shows items or empty state
- [ ] FAB: Visible in bottom right

NAVIGATION:
- [ ] Desktop: Clear navigation, user menu works
- [ ] Active states: Current page highlighted

QUOTE FLOW:
- [ ] Progress indicator: Shows steps with connecting line
- [ ] Step transitions: Smooth
- [ ] Results: Tabs for pricing vs tips
- [ ] Rate animation: Number counts up

PROFILE:
- [ ] Sections: Collapsible, optional clearly marked
- [ ] Completeness: Percentage indicator visible
- [ ] Live preview: Shows estimated rate (desktop)

MESSAGE ANALYZER (Brand Inbox):
- [ ] Title: "Brand Inbox" not "Analyze DM"
- [ ] Textarea: Large, placeholder has examples
- [ ] Results: Emoji + contextual headline
- [ ] Actions: Vet Brand, Generate Rate Card buttons

**3. Visual Regression Check - Mobile (375px):**

- [ ] Navigation: 3 items + menu, FAB above nav
- [ ] Typography: Readable, not cramped
- [ ] Touch targets: At least 44px
- [ ] Forms: Full width, easy to tap
- [ ] Cards: Proper padding, no edge touching
- [ ] Modals/Sheets: Slide up smoothly

**4. Interaction Check:**

- [ ] Copy buttons: Show "Copied!" feedback
- [ ] Rate reveals: Animate counting up
- [ ] Score gauges: Fill animation works
- [ ] First rate card: Confetti fires (clear localStorage to test)
- [ ] Button presses: Subtle scale effect
- [ ] Form submissions: Loading states work
- [ ] Navigation: Smooth transitions

**5. Performance Check:**

- [ ] Fonts load without FOUT (flash of unstyled text)
- [ ] Animations are 60fps (no jank)
- [ ] Pages load quickly (check Network tab)
- [ ] No console errors

**6. Accessibility Quick Check:**

- [ ] Focus indicators visible on interactive elements
- [ ] Color contrast sufficient (use browser dev tools)
- [ ] Form labels associated with inputs
- [ ] Buttons have accessible names

**7. Cross-Browser Check:**

Test on:
- [ ] Chrome
- [ ] Safari (if available)
- [ ] Firefox

**8. Final Polish:**

- Remove any console.log statements
- Remove any TODO comments for shipped features
- Ensure all placeholder text is production-ready
- Check for typos in UI copy

**9. Update CLAUDE.md:**

Add a section documenting the design system:
- Font stack (Satoshi, Clash Display, JetBrains Mono)
- Spacing system (8px base)
- Animation patterns
- Component patterns

Show me:
1. Test results
2. Build status
3. Any issues found and fixed
4. Confirmation all checkpoints pass
```

---

## Command Sequence

### Morning Session (Foundation)

```
STEP 1: /clear
```

```
STEP 2: Typography Foundation
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 0 (Typography Foundation) exactly as written. Download fonts, update config, apply to key components.
```

```
STEP 3: Commit
```
```bash
git add -A && git commit -m "feat: update typography to Satoshi + Clash Display + JetBrains Mono"
```

```
STEP 4: /clear
```

```
STEP 5: Navigation Restructure
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 1 (Navigation Restructure) exactly as written. Reduce to 3 + menu, add FAB.
```

```
STEP 6: Commit
```
```bash
git add -A && git commit -m "feat: restructure navigation with FAB and menu drawer"
```

```
STEP 7: /clear
```

---

### Late Morning Session (Dashboard & Landing)

```
STEP 8: Dashboard Redesign
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 2 (Dashboard Redesign) exactly as written. Create command center with inline analyzer.
```

```
STEP 9: Commit
```
```bash
git add -A && git commit -m "feat: redesign dashboard as creator command center"
```

```
STEP 10: /clear
```

```
STEP 11: Landing Page Fixes
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 3 (Landing Page Fixes) exactly as written. Reduce features, add social proof.
```

```
STEP 12: Commit
```
```bash
git add -A && git commit -m "feat: improve landing page with focused features and social proof"
```

```
STEP 13: /clear
```

---

### Afternoon Session (Page Fixes)

```
STEP 14: Quote Flow Fixes
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 4 (Quote Flow Fixes) exactly as written. Add progress indicator, tabs for results.
```

```
STEP 15: Commit
```
```bash
git add -A && git commit -m "feat: add step progress indicator to quote flow"
```

```
STEP 16: /clear
```

```
STEP 17: Profile Page Fixes
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 5 (Profile Page Fixes) exactly as written. Add progressive disclosure, live preview.
```

```
STEP 18: Commit
```
```bash
git add -A && git commit -m "feat: improve profile page with collapsible sections and preview"
```

```
STEP 19: /clear
```

```
STEP 20: Message Analyzer Fixes
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 6 (Message Analyzer Fixes) exactly as written. Rename, add personality.
```

```
STEP 21: Commit
```
```bash
git add -A && git commit -m "feat: rebrand DM parser as Brand Inbox with personality"
```

```
STEP 22: /clear
```

---

### Late Afternoon Session (Polish)

```
STEP 23: Micro-interactions
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 7 (Micro-interactions & Animations) exactly as written. Add animated numbers, confetti, copy feedback.
```

```
STEP 24: Commit
```
```bash
git add -A && git commit -m "feat: add micro-interactions and celebration animations"
```

```
STEP 25: /clear
```

```
STEP 26: Spacing & Layout
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 8 (Spacing & Layout Consistency) exactly as written. Standardize across all pages.
```

```
STEP 27: Commit
```
```bash
git add -A && git commit -m "fix: standardize spacing and layout across all pages"
```

```
STEP 28: /clear
```

```
STEP 29: Testing & Polish
```
```
Read IMPLEMENTATION_PLAN_V4.md and implement Prompt 9 (Testing & Polish) exactly as written. Run all checks, fix issues.
```

```
STEP 30: Commit
```
```bash
git add -A && git commit -m "polish: final UI/UX testing and fixes"
```

```
STEP 31: Push
```
```bash
git push -u origin main:claude/analyze-test-coverage-hWgZz
```

---

## Quick Reference

| Step | Action | Time Est. |
|------|--------|-----------|
| 1-3 | Typography Foundation | 45 min |
| 4-6 | Navigation Restructure | 45 min |
| 7-9 | Dashboard Redesign | 1 hr |
| 10-12 | Landing Page Fixes | 45 min |
| 13-15 | Quote Flow Fixes | 30 min |
| 16-18 | Profile Page Fixes | 45 min |
| 19-21 | Message Analyzer Fixes | 30 min |
| 22-24 | Micro-interactions | 45 min |
| 25-27 | Spacing & Layout | 30 min |
| 28-30 | Testing & Polish | 45 min |
| 31 | Push | 1 min |

**Total: 31 steps, 10 prompts, 10 commits, 9 /clear commands, ~7 hours**

---

## Success Criteria

After completing all prompts:

✅ Typography: Clash Display headlines, Satoshi body, JetBrains Mono numbers
✅ Navigation: 3 bottom items + menu + FAB on mobile
✅ Dashboard: Inline message analyzer, success metrics, activity feed
✅ Landing: 2 hero features, visual "how it works", social proof footer
✅ Quote Flow: Step progress indicator with connecting line
✅ Profile: Collapsible sections, completeness indicator, live preview
✅ Message Analyzer: "Brand Inbox" title, personality in results
✅ Animations: Counting numbers, gauge fills, confetti, copy feedback
✅ Spacing: Consistent 8px system across all pages
✅ Mobile: Clean navigation, proper touch targets, no edge-touching content
