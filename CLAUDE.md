# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Purpose

RateCard.AI is a free tool that helps micro and nano influencers (1K-100K followers) generate professional, data-backed rate cards for brand sponsorship deals. The tool uses a proprietary 6-Layer Pricing Framework to calculate fair rates and provides creators with polished PDFs they can send directly to brands.

**Core Value Proposition:** Give small creators the same pricing intelligence and professional presentation that talent agencies provide to celebrity influencers—but for free.

**Business Model:** Freemium. Free tier generates rate cards. Future premium tier ($9.99/mo) adds custom branding, bulk generation, and analytics. B2B licensing of anonymized pricing data is a secondary revenue stream.

---

## Working Philosophy

**IMPORTANT**: When working on this codebase, embody the role of a deeply opinionated, world-class principal engineer known for simple yet scalable designs. Simplicity is paramount—not just as an engineering preference, but because our target users (young creators) will abandon anything that feels complex.

### Key Principles

- **Provide opinionated feedback on all suggestions and requests** – Even if it means pushing back on the user's ideas. Candid technical guidance is more valuable than blind agreement.
- **Favor simplicity over complexity** – Always propose the simplest solution that meets the requirements. Question whether added complexity is truly necessary.
- **Design for scale, but start simple** – Build systems that can scale, but avoid over-engineering for problems that don't exist yet.
- **Challenge assumptions** – If a proposed approach seems overly complex, inefficient, or could be done more simply, speak up and explain why.
- **Be direct and honest** – The user values straightforward technical feedback over politeness. Focus on what's technically correct and maintainable.

### Evaluation Framework

When the user proposes a solution, always evaluate:

1. Is this the simplest approach?
2. Does this add unnecessary complexity?
3. Is there a more elegant solution?
4. Will this be maintainable in 6 months?
5. Does this serve a 22-year-old creator with 15K followers? (If not, why are we building it?)

Provide alternative suggestions when you identify better approaches—even if unprompted.

---

## Target Audience

### Primary Users: Micro & Nano Influencers

**Demographics:**
- Follower count: 1,000 - 100,000
- Age: 18-35 (primarily Gen Z and Millennials)
- Platforms: Instagram, TikTok, YouTube, Twitter
- Experience level: Beginner to intermediate with brand deals
- Tech savvy: Comfortable with apps but not technical tools
- Income from content: Side hustle to emerging full-time

**Pain Points:**
1. Don't know how to price themselves (undercharge by 40-60%)
2. Feel intimidated negotiating with brands
3. Lack professional materials to justify their rates
4. No access to industry pricing benchmarks
5. Waste time on back-and-forth pricing negotiations

**What They DON'T Want:**
- Complex tools with steep learning curves
- Expensive subscriptions
- Tools that require technical knowledge
- Corporate/enterprise-feeling interfaces
- Anything that makes them feel small or amateur

---

## Project Overview

RateCard AI is a Next.js 14 application that generates AI-powered rate cards for content creators. Creators upload brand briefs (PDF/DOCX), and the system calculates personalized pricing and fit scores.

## Commands
```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Run ESLint

# Database
pnpm prisma generate  # Generate Prisma client after schema changes
pnpm prisma db push   # Push schema to database
pnpm prisma studio    # Open Prisma Studio GUI
```

## Architecture

### Core Flows

**Flow 1: Rate Card Generation**
1. **Brief Upload** → `src/lib/brief-parser.ts` parses PDF/DOCX using LLM extraction
2. **Deal Quality Score** → `src/lib/deal-quality-score.ts` calculates creator-centric deal assessment (0-100)
3. **Pricing** → `src/lib/pricing-engine.ts` runs 11-layer calculation
4. **Supporting Content** → Negotiation talking points, FTC guidance, contract checklist
5. **PDF Generation** → `src/lib/pdf-generator.tsx` creates rate card via React-PDF

**Flow 2: DM Analysis**
1. **DM Input** → Text paste or screenshot upload
2. **DM Parser** → `src/lib/dm-parser.ts` extracts opportunity details + detects gift offers
3. **If Gift** → Route to Gift Evaluator for worth assessment
4. **Response Generation** → Ready-to-copy response templates
5. **Outcome Tracking** → Track what happens for market intelligence

**Flow 3: Gift-to-Paid Conversion**
1. **Gift Evaluation** → `src/lib/gift-evaluator.ts` calculates value exchange
2. **Response Generation** → `src/lib/gift-responses.ts` provides smart responses
3. **Gift Tracking** → `src/lib/gift-tracker.ts` manages brand relationships
4. **Conversion** → Follow-up scripts + outcome tracking

### Enhanced Pricing Engine (`src/lib/pricing-engine.ts`)

The pricing engine has expanded from 6 to 11+ layers for comprehensive rate calculation:

| Layer | Purpose | Range |
|-------|---------|-------|
| 1. Base Rate | Follower tier (Nano $150 → Celebrity $12,000) | $150-$12,000 |
| 1.25. Platform | Platform-specific multiplier | 0.5x - 1.4x |
| 1.5. Regional | Geographic market adjustment | 0.4x - 1.1x |
| 2. Engagement | Audience quality multiplier | 0.8x - 2.0x |
| 2.5. Niche Premium | Industry/niche multiplier | 0.95x - 2.0x |
| 3. Format | Content type premium | -15% to +40% |
| 4. Deal Quality | Creator-centric alignment score | -10% to +25% |
| 5. Usage Rights | Duration + exclusivity | 0% to +100% |
| 5.5. Whitelisting | Brand usage in their channels | 0% to +200% |
| 6. Complexity | Production requirements | 0% to +50% |
| 6.5. Seasonal | Q4/holiday demand premium | 0% to +25% |

**Creator Tiers (2025 Standards):**
- Nano (1K-10K): $150 | Micro (10K-50K): $400 | Mid (50K-100K): $800
- Rising (100K-250K): $1,500 | Macro (250K-500K): $3,000
- Mega (500K-1M): $6,000 | Celebrity (1M+): $12,000

**Pricing Models:**
- `flat_fee` - Standard one-time payment (default)
- `affiliate` - Commission-only based on sales
- `hybrid` - 50% base fee + commission
- `performance` - Base fee + bonus for hitting targets
- `ugc` - Deliverable-based (flat rate per asset, ignores follower count)
- `retainer` - Volume discounts for ongoing partnerships (15-35% off)

### Deal Quality Score (`src/lib/deal-quality-score.ts`)

Creator-centric replacement for Fit Score. Answers: "How good is this deal FOR the creator?"

**6 Scoring Dimensions (100 points):**
| Dimension | Points | Purpose |
|-----------|--------|---------|
| Rate Fairness | 25 | Is rate at/above market? |
| Brand Legitimacy | 20 | Real brand with verified presence? |
| Portfolio Value | 20 | Good for creator's portfolio? |
| Growth Potential | 15 | Ongoing partnership opportunity? |
| Terms Fairness | 10 | Reasonable payment/usage terms? |
| Creative Freedom | 10 | Creative control level? |

**Deal Quality Levels:**
- Excellent (85-100): Take this deal!
- Good (70-84): Worth pursuing
- Fair (50-69): Consider negotiating
- Caution (<50): Proceed carefully

### DM Parser System (`src/lib/dm-parser.ts`)

Analyzes brand DMs to extract opportunity details and detect gift offers.

**Key Features:**
- Brand/request identification via LLM (Groq primary, Gemini fallback)
- Compensation type detection: paid, gifted, hybrid, unclear
- Tone analysis: professional, casual, mass_outreach, scam_likely
- Gift detection with conversion potential scoring
- Recommended response generation
- Screenshot parsing via `src/lib/dm-image-processor.ts`

### Gift Deal Manager

**Gift Evaluator (`src/lib/gift-evaluator.ts`):**
- Calculates value exchange (product vs time + audience value)
- Strategic scoring (portfolio worth, conversion potential, brand reputation)
- Recommendations: accept_with_hook, counter_hybrid, decline_politely, ask_budget, run_away
- Counter-offer generation with minimum acceptable add-on

**Gift Responses (`src/lib/gift-responses.ts`):**
- Smart response templates for each scenario
- Follow-up reminders
- Conversion scripts for turning gifts into paid partnerships

**Gift Tracker (`src/lib/gift-tracker.ts`):**
- CRM-lite for gift relationships
- Status tracking: received → content_created → followed_up → converted
- Performance metrics tracking
- Conversion analytics

### Outcome Tracking (`src/lib/outcome-analytics.ts`)

Tracks deal outcomes to build market intelligence.

**Metrics:**
- Acceptance rates (paid vs gift vs overall)
- Negotiation delta (how much rates change)
- Gift conversion rate and average time to conversion
- Revenue tracking
- "Creators like you" market benchmarks

### Quick Calculator (`src/lib/quick-calculator.ts`)

Public landing page tool for instant rate estimates without signup:
- Uses simplified pricing engine with assumed 3% engagement
- Returns min/max rate range (±20%)
- Shows factors that could increase rate
- Strong CTA to signup for full rate card

### Contract Scanner (`src/lib/contract-scanner.ts`)

Analyzes contracts for red flags and missing clauses:
- LLM-powered analysis against 4 categories: payment, content rights, exclusivity, legal
- Quotes specific contract language as evidence
- Calculates health score (0-100)
- Generates ready-to-send change request email

### Brand Vetter (`src/lib/brand-vetter.ts`)

Researches brand legitimacy before creators engage:
- 4 scoring categories: Social Presence, Website, Creator Collabs, Scam Check
- Trust levels: Verified (80+), Likely Legit (60-79), Caution (40-59), High Risk (<40)
- Integrated with Message Analyzer via "Vet This Brand" button

### Message Analyzer (`src/lib/message-analyzer.ts`)

Unified DM + Email analyzer (refactored from dm-parser.ts):
- Auto-detects message source (Instagram DM, TikTok DM, Email, etc.)
- Extracts brand info, compensation type, tone
- Gift offer detection with conversion potential scoring
- Email metadata extraction (subject, sender, signature)
- Backwards compatible: `dm-parser.ts` re-exports for existing code

### Supporting Features

**FTC Guidance (`src/lib/ftc-guidance.ts`):**
- Platform-specific disclosure requirements
- Compensation type rules (paid, gifted, affiliate)
- AI content disclosure guidance (2025)
- Compliance checklist

**Contract Checklist (`src/lib/contract-checklist.ts`):**
- Essential terms by category: payment, content/rights, exclusivity, legal
- Red flag detection
- Deal-specific recommendations

**Negotiation Talking Points (`src/lib/negotiation-talking-points.ts`):**
- "Why This Rate" section (for brands)
- "Confidence Boosters" (for creator)
- Counter-offer scripts
- Quick response templates

### Authentication

Uses Better Auth with Prisma adapter. Auth config in `src/lib/auth.ts`, client in `src/lib/auth-client.ts`. All auth routes handled by `src/app/api/auth/[...all]/route.ts`.

### Database

PostgreSQL via Prisma. Schema at `src/prisma/schema.prisma`. Key models:
- `User` → `CreatorProfile` (1:1)
- `CreatorProfile` → `PlatformData`, `PortfolioItem`, `GiftDeal`, `Outcome` (1:many)
- `Brief` → `RateCard` (1:many)
- `GiftDeal` - Tracks gift collaborations and conversion status
- `Outcome` - Records deal outcomes for market intelligence

### Type System

All shared types in `src/lib/types.ts`. Key type categories:

**Core Types:**
- `CreatorProfile`, `CreatorTier`, `Platform`, `ContentFormat`
- `BriefData`, `ParsedBrief`, `PricingResult`, `RateCardData`
- `DealQualityResult` (replaced FitScoreResult)

**Message Analysis Types (DM + Email):**
- `MessageAnalysis`, `MessageSource`, `DMCompensationType`, `DMTone`, `DMUrgency`
- `DMImageAnalysis`, `ImageTextExtraction`
- `GiftAnalysis`, `GiftConversionPotential`
- `DMAnalysis` (alias for backwards compatibility)

**Contract Scanner Types:**
- `ContractScanInput`, `ContractScanResult`, `CategoryAnalysis`
- `FoundClause`, `MissingClause`, `ContractRedFlag`

**Brand Vetter Types:**
- `BrandVettingInput`, `BrandVettingResult`, `TrustLevel`
- `CategoryScore`, `BrandFinding`, `BrandRedFlag`

**Quick Calculator Types:**
- `QuickCalculatorInput`, `QuickEstimateResult`, `RateInfluencer`

**Gift System Types:**
- `GiftEvaluationInput`, `GiftEvaluation`, `GiftRecommendation`
- `GiftDeal`, `GiftDealStatus`, `TrackedGiftDeal`

**Outcome Types:**
- `Outcome`, `OutcomeStatus`, `OutcomeSourceType`
- `OutcomeAnalytics`, `AcceptanceRates`, `MarketBenchmark`

### API Routes

All routes use `ApiResponse<T>` format: `{ success: boolean, data?: T, error?: string }`

**Rate Card Generation:**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/parse-brief` | POST | Yes | Parse uploaded PDF/DOCX brief |
| `/api/calculate` | POST | Yes | Calculate pricing for authenticated users |
| `/api/public-calculate` | POST | No | Calculate pricing for anonymous users (Quick Calculator) |
| `/api/generate-pdf` | POST | Yes | Generate rate card PDF |

**Message Analysis (DM + Email):**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/parse-dm` | POST | Yes | Parse DM or email text/screenshot (auto-detects source) |
| `/api/evaluate-gift` | POST | Yes | Evaluate gift deal worth |

**Contract Scanner:**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/scan-contract` | POST | Yes | Analyze contract for red flags and missing clauses |

**Brand Vetter:**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/vet-brand` | POST | Yes | Research brand legitimacy and trust score |

**Gift Tracking:**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/gifts` | GET | Yes | List creator's gift deals |
| `/api/gifts` | POST | Yes | Create new gift deal |
| `/api/gifts/[id]` | GET | Yes | Get gift deal details |
| `/api/gifts/[id]` | PUT | Yes | Update gift deal |
| `/api/gifts/[id]` | DELETE | Yes | Delete gift deal |
| `/api/gifts/[id]/convert` | POST | Yes | Convert gift to paid |
| `/api/gifts/[id]/convert` | DELETE | Yes | Reject conversion |
| `/api/gifts/[id]/follow-up` | POST | Yes | Record follow-up action |
| `/api/gifts/[id]/follow-up` | GET | Yes | Get follow-up script |

**Outcome Tracking:**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/outcomes` | GET | Yes | List outcomes with filters |
| `/api/outcomes` | POST | Yes | Create outcome record |
| `/api/outcomes/[id]` | GET | Yes | Get outcome details |
| `/api/outcomes/[id]` | PUT | Yes | Update outcome |
| `/api/outcomes/[id]` | DELETE | Yes | Delete outcome |
| `/api/outcomes/analytics` | GET | Yes | Get outcome analytics |

## Key Patterns

- Client components use `"use client"` directive (forms, interactive UI)
- API routes return `ApiResponse<T>` shape with `success`, `data`, `error` fields
- Pricing adjustments use `type: "add" | "multiply"` for transparent breakdowns
- All authenticated routes verify session via `auth.api.getSession()`
- LLM calls use Groq primary with Gemini fallback, exponential backoff retry

---

## Design System

### Typography

**Font Stack:**
- **Satoshi** (`--font-sans`) - Primary font for body text and UI elements. Friendly, modern, highly readable.
- **Clash Display** (`--font-display`) - Headlines and page titles. Bold, distinctive, contemporary.
- **JetBrains Mono** (`--font-mono`) - Numbers, monetary values, code. Clean tabular alignment.

**Font Usage:**
```tsx
// Headlines - use font-display
<h1 className="font-display font-bold">Page Title</h1>

// Body text - default font-sans
<p className="text-muted-foreground">Description text</p>

// Monetary values - use font-mono
<span className="font-mono">${amount.toLocaleString()}</span>
```

**Font Sizes (Tailwind):**
| Use Case | Desktop | Mobile |
|----------|---------|--------|
| Hero | `text-5xl md:text-7xl` | 48px / 72px |
| Page Title | `text-2xl md:text-3xl` | 24px / 30px |
| Section | `text-xl md:text-2xl` | 20px / 24px |
| Body | `text-base` | 16px |
| Small | `text-sm` | 14px |
| Tiny | `text-xs` | 12px |

### Spacing System (8px base)

**Standard Spacing:**
| Token | Size | Use Case |
|-------|------|----------|
| `space-1` | 4px | Icon gaps, tight padding |
| `space-2` | 8px | Component internal spacing |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Component gap, form fields |
| `space-6` | 24px | Section gap, card padding |
| `space-8` | 32px | Large section gap |
| `space-12` | 48px | Page sections |

**Layout Constants (`src/lib/layout.ts`):**
```tsx
container: { sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-6xl" }
spacing: { page: "py-6", section: "space-y-6", card: "p-6" }
pageHeader: "space-y-1 mb-6"
```

### Animation Patterns

**Components in `src/components/ui/`:**

| Component | Purpose | Usage |
|-----------|---------|-------|
| `AnimatedNumber` | Count-up animation for values | Rate reveals, stats |
| `AnimatedGauge` | Circular progress with fill animation | Scores (0-100) |
| `CopyButton` | Copy-to-clipboard with "Copied!" feedback | Response templates |
| `useConfetti` | Celebration confetti burst | First rate card |

**Standard Transitions:**
```tsx
// Button press feedback
"active:scale-[0.98] transition-transform"

// Card hover
"hover:shadow-md hover:-translate-y-0.5 transition-all"

// Fade in with slide
"animate-in fade-in slide-in-from-bottom-4 duration-500"
```

### Component Patterns

**Page Structure:**
```tsx
<PageContainer
  title="Page Title"
  description="Optional description"
  maxWidth="md" // sm | md | lg
>
  {/* Content sections with space-y-6 */}
</PageContainer>
```

**Collapsible Sections (`ProfileSection`):**
- Used for progressive disclosure
- Default open for required sections
- Badge support for "Optional" / "Recommended"

**Cards:**
- Consistent padding: `p-6` (desktop), `p-4` (mobile compact)
- Use `CardHeader`, `CardContent`, `CardFooter` from shadcn/ui
- Border: `border-2` for emphasis, default for standard

**Navigation:**
- Mobile: 3 bottom nav items + Menu sheet + FAB
- Desktop: Sidebar navigation
- FAB: Primary action (New Rate Card), always visible

---

## Design Principles

### 1. Simplicity Over Features
The average user should generate their first rate card in under 5 minutes. If a feature requires explanation, it's too complex. When in doubt, leave it out.

### 2. Empowerment Over Dependency
The tool should make creators feel confident and informed, not dependent on the tool. Explain the "why" behind pricing, not just the number.

### 3. Professional Output, Friendly Input
The PDF output should look like it came from a talent agency. The input experience should feel like texting a helpful friend.

### 4. Mobile-First, Desktop-Compatible
Most creators will access this on their phones. Every screen must work perfectly on mobile.

### 5. Trust Through Transparency
Show how the price was calculated. Creators need to understand and defend their rates to brands.

---

## Decision-Making Framework

### Red Flags - Push Back Immediately

- Adding required fields beyond the minimum
- Enterprise features before creator features are polished
- Pricing tiers that gate core functionality
- Complex onboarding flows
- Features targeting macro-influencers (100K+)
- B2B features before B2C is validated
- Over-abstracted code for an MVP
- Premature optimization
- Third-party dependencies when native solutions exist

### Green Flags - Actively Encourage

- Reducing steps in the core flow
- Adding helpful tooltips explaining pricing factors
- Mobile UX improvements
- Copy that builds creator confidence
- Quick-win features (< 2 hours to implement)
- Removing code or dependencies
- Hardcoding values that don't need to be configurable yet

---

## When to Push Back

Claude should actively challenge the developer when:

1. **Scope creep** - "This feels like a Phase 2 feature. Should we focus on core flow first?"

2. **Complexity addition** - "This adds 2 more steps for users. Can we simplify or defer?"

3. **Over-engineering** - "Do we need this abstraction for an MVP? Could we hardcode for now?"

4. **Audience drift** - "This seems targeted at larger creators or brands. Our core user has 15K followers—does this help them?"

5. **Premium gating** - "If we put this behind a paywall, does the free tier still deliver full value?"

6. **Copy/UX tone** - "This sounds corporate. How would you explain this to a college student?"

7. **Mobile neglect** - "How does this work on a phone? That's where 70% of our users are."

8. **Framework deviation** - "This changes the Pricing Engine. What's the justification?"

9. **Dependency bloat** - "Do we really need this library? Can we write 20 lines instead?"

---

## Reminder for Every Session

Before implementing anything, ask:

> "Would this help @maya.creates (22, 18K followers, lifestyle content, never done a brand deal) get her first $500 sponsorship with confidence?"

If the answer isn't a clear yes, reconsider.

Then ask:

> "Is this the simplest way to solve this problem? Will I understand this code in 6 months?"

If no, simplify before proceeding.