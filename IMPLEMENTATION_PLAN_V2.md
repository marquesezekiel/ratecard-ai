# RateCard.AI Implementation Plan V2

## Overview

This document contains detailed prompts to run in Claude Code to implement the 17 features for the RateCard.AI platform upgrade. Each prompt is designed to be copy-pasted directly into Claude Code.

**Timeline**: 5 days
**Total Features**: 17
**Testing**: Included after each major section

---

## Pre-Implementation Setup

### Prompt 0: Codebase Analysis & Test Setup

```
Before we start implementing features, I need you to:

1. Read and understand the current pricing engine at src/lib/pricing-engine.ts
2. Read and understand the fit score system at src/lib/fit-score.ts
3. Read the types at src/lib/types.ts
4. Check if there's an existing test setup. If not, set up Vitest with the following:
   - Install vitest and @testing-library/react as dev dependencies
   - Create a vitest.config.ts file
   - Add "test" and "test:coverage" scripts to package.json
   - Create a tests/ directory structure mirroring src/lib/

Do NOT implement any features yet. Just analyze and set up testing infrastructure.
Show me what you found and what you set up.
```

---

## Day 1: Pricing Engine Foundation (Features 1-7)

### Prompt 1: Increase Base Rates to Industry Standards

```
Update the base rates in src/lib/pricing-engine.ts to match 2025 industry standards.

Current rates are too low. Update to:
- Nano (1K-10K followers): $150 (was $100)
- Micro (10K-50K followers): $400 (was $250)
- Mid (50K-100K followers): $800 (was $750)
- Rising (100K-250K followers): $1,500 (new tier)
- Macro (250K-500K followers): $3,000 (was $2,500)
- Mega (500K-1M followers): $6,000 (new tier)
- Celebrity (1M+ followers): $12,000 (new tier)

Also update the calculateTier function to handle these new tiers properly.

After making changes:
1. Update any related types in src/lib/types.ts
2. Write unit tests in tests/lib/pricing-engine.test.ts for the tier calculation
3. Test all tier boundaries (edge cases at 10K, 50K, 100K, 250K, 500K, 1M)

Show me the changes and test results.
```

### Prompt 2: Add Niche/Industry Premium Multiplier

```
Add a niche/industry premium multiplier as a new layer in the pricing engine.

Different niches command different rates. Add this pricing factor:

Niche premiums (multipliers):
- Finance/Investing: 2.0x
- B2B/Business: 1.8x
- Tech/Software: 1.7x
- Legal/Medical: 1.7x
- Luxury/High-end Fashion: 1.5x
- Beauty/Skincare: 1.3x
- Fitness/Wellness: 1.2x
- Food/Cooking: 1.15x
- Travel: 1.15x
- Parenting/Family: 1.1x
- Lifestyle (general): 1.0x (baseline)
- Entertainment/Comedy: 1.0x
- Gaming: 0.95x
- Other: 1.0x

Implementation requirements:
1. Add a "niche" field to the CreatorProfile type if not present
2. Add a "nichePremium" field to BriefData type
3. Create a getNichePremium(niche: string) function
4. Add this as Layer 2.5 (between engagement and format) in calculatePrice
5. Include it in the pricing breakdown with clear explanation
6. Update the PDF generator to show this layer

Write tests for:
- All niche multipliers return correct values
- Unknown niche defaults to 1.0x
- Integration test showing niche affects final price

Show me all changes and test results.
```

### Prompt 3: Fix UGC Pricing (Separate Service Model)

```
Fix the UGC pricing model. Currently UGC has a -25% format premium which is WRONG.

UGC (User-Generated Content) is a SERVICE, not a content format. It should be priced based on deliverables, not audience size.

Changes needed:

1. Remove UGC from the format premiums in pricing-engine.ts

2. Create a new pricing mode for UGC deals:
   - Base UGC video rate: $175
   - Base UGC photo rate: $100
   - Complexity multipliers still apply
   - Usage rights multipliers still apply
   - But NO follower-based pricing (audience size irrelevant for UGC)

3. Add a "dealType" field to distinguish:
   - "sponsored" (current behavior - audience-based)
   - "ugc" (new - deliverable-based)

4. Update calculatePrice to handle both deal types:
   if (dealType === 'ugc') {
     return calculateUGCPrice(...)
   } else {
     return calculateSponsoredPrice(...) // current logic
   }

5. Create calculateUGCPrice function with its own breakdown

6. Update types accordingly

Write tests for:
- UGC pricing ignores follower count
- UGC base rates are correct
- UGC still applies usage rights and complexity
- Sponsored content still works as before

Show me all changes and test results.
```

### Prompt 4: Separate Whitelisting Premium

```
Add whitelisting/paid amplification as a separate premium from usage rights.

Currently usage rights covers duration + exclusivity. But whitelisting (brand using creator content in their own posts/ads) is a separate, significant value.

Add new whitelisting premiums:

Whitelisting type:
- None: 0%
- Organic only (brand reposts): +50%
- Paid social (brand runs as ad): +100%
- Full media buy (TV, OOH, digital ads): +200%

Implementation:
1. Add "whitelistingType" to BriefData type with values: "none" | "organic" | "paid_social" | "full_media"
2. Create getWhitelistingPremium(type: string) function
3. Add as Layer 5.5 (after usage rights, before complexity)
4. Update pricing breakdown to show this separately
5. Update PDF generator to explain whitelisting value

Write tests for:
- All whitelisting types return correct premiums
- Whitelisting stacks with usage rights correctly
- Default is "none" (0%)

Show me all changes and test results.
```

### Prompt 5: Add Seasonal Pricing Premium

```
Add seasonal pricing to account for Q4/holiday premium and other peak periods.

Brands pay more during high-demand periods. Add automatic seasonal adjustments:

Seasonal multipliers:
- Q4 Holiday (Nov 1 - Dec 31): +25%
- Back to School (Aug 1 - Sep 15): +15%
- Valentine's/Galentine's (Feb 1-14): +10%
- Summer (Jun 1 - Aug 31): +5%
- Default (rest of year): 0%

Implementation:
1. Create getSeasonalPremium(date?: Date) function that auto-detects season
2. Add optional "campaignDate" field to BriefData (defaults to today)
3. Add as Layer 6.5 (after complexity)
4. Show in pricing breakdown with explanation of why
5. Allow manual override if creator wants to disable seasonal pricing

Write tests for:
- Each season returns correct premium
- Date edge cases (Nov 1 = Q4, Oct 31 = default)
- Manual date override works
- Default to current date when not specified

Show me all changes and test results.
```

### Prompt 6: Add Regional Rate Adjustments

```
Add regional/geographic rate adjustments. Creator location and audience location affect rates.

Regional multipliers (creator's primary market):
- United States: 1.0x (baseline)
- United Kingdom: 0.95x
- Canada: 0.9x
- Australia: 0.9x
- Western Europe (Germany, France, etc.): 0.85x
- UAE/Gulf States: 1.1x
- Singapore/Hong Kong: 0.95x
- Japan: 0.8x
- South Korea: 0.75x
- Brazil: 0.6x
- Mexico: 0.55x
- India: 0.4x
- Southeast Asia: 0.5x
- Eastern Europe: 0.5x
- Africa: 0.4x
- Other: 0.7x

Implementation:
1. Add "region" field to CreatorProfile type
2. Create getRegionalMultiplier(region: string) function
3. Add as Layer 1.5 (right after base rate, before engagement)
4. Ensure currency display matches region (USD, GBP, EUR, etc.)
5. Update PDF to show regional context

Write tests for:
- All regions return correct multipliers
- Unknown region defaults to 0.7x
- Integration with base rate calculation

Show me all changes and test results.
```

### Prompt 7: Add Emerging Platforms

```
Add support for emerging social platforms beyond Instagram, TikTok, YouTube, and Twitter.

Add these platforms:
- Threads
- Pinterest
- LinkedIn
- Bluesky
- Lemon8
- Snapchat
- Twitch

Platform-specific base rate multipliers (relative to Instagram baseline):
- Instagram: 1.0x (baseline)
- TikTok: 0.9x
- YouTube: 1.4x (long-form premium)
- YouTube Shorts: 0.7x (new - separate from long-form)
- Twitter/X: 0.7x
- Threads: 0.6x (newer, less proven ROI)
- Pinterest: 0.8x (high purchase intent)
- LinkedIn: 1.3x (B2B premium)
- Bluesky: 0.5x (emerging)
- Lemon8: 0.6x (emerging, shopping-focused)
- Snapchat: 0.75x
- Twitch: 1.1x (live streaming premium)

Implementation:
1. Update Platform type in types.ts to include all platforms
2. Create getPlatformMultiplier(platform: string) function
3. Apply platform multiplier to base rate
4. Update all UI dropdowns/selects to include new platforms
5. Ensure PDF generator handles all platforms

Write tests for:
- All platforms return correct multipliers
- YouTube vs YouTube Shorts distinction works
- Unknown platform defaults to 1.0x

Show me all changes and test results.
```

### Day 1 Testing Checkpoint

```
Run all tests created today and ensure everything passes:

1. Run: pnpm test
2. Run: pnpm build (ensure no type errors)
3. Run: pnpm lint

Fix any failing tests or type errors before proceeding.

Also, manually test the pricing engine by creating a simple test script that:
- Creates a sample creator profile
- Creates a sample brief
- Calculates price with all new factors
- Logs the full breakdown

Show me the test results and the sample calculation output.
```

---

## Day 2: New Pricing Models (Features 8-9)

### Prompt 8: Affiliate/Performance Pricing Model

```
Add a new pricing model for affiliate and performance-based deals.

Many modern deals include performance components. Add support for:

Deal structures:
1. Pure affiliate (commission only)
2. Hybrid (base fee + commission)
3. Performance bonus (base fee + bonus for hitting targets)

Affiliate commission rates by category:
- Fashion/Apparel: 10-20%
- Beauty/Skincare: 15-25%
- Tech/Electronics: 5-10%
- Home/Lifestyle: 8-15%
- Food/Beverage: 10-15%
- Health/Supplements: 15-30%
- Digital products/Courses: 20-40%
- Services/Subscriptions: 15-25%

Implementation:
1. Add "pricingModel" to BriefData: "flat_fee" | "affiliate" | "hybrid" | "performance"

2. For affiliate deals, add:
   - affiliateRate: number (percentage)
   - estimatedSales: number (to calculate potential earnings)
   - averageOrderValue: number

3. For hybrid deals:
   - Calculate base fee at 50% of normal rate
   - Add affiliate component
   - Show both in breakdown

4. For performance deals:
   - baseFee: normal calculation
   - bonusThreshold: number (e.g., 1000 clicks)
   - bonusAmount: number (e.g., $200)

5. Create new functions:
   - calculateAffiliateEarnings(rate, estimatedSales, aov)
   - calculateHybridPrice(basePrice, affiliateEarnings)
   - calculatePerformancePrice(basePrice, bonusThreshold, bonusAmount)

6. Update PDF to show different layouts for each pricing model

Write tests for:
- Pure affiliate calculation
- Hybrid pricing (50% base + affiliate)
- Performance bonus display
- Each affiliate category rate range

Show me all changes and test results.
```

### Prompt 9: Retainer/Ambassador Pricing

```
Add pricing support for retainer and ambassador deals.

Long-term deals get volume discounts but provide stability. Add:

Retainer structures:
1. Monthly retainer (ongoing, month-to-month)
2. 3-month contract
3. 6-month contract
4. 12-month ambassador

Volume discounts:
- Monthly (no commitment): 0% discount
- 3-month: 15% discount per deliverable
- 6-month: 25% discount per deliverable
- 12-month ambassador: 35% discount per deliverable

Additional ambassador perks to factor in:
- Exclusivity compensation (if required): +50-100%
- Product seeding value: deduct from rate or add as value
- Event appearances: separate day rate ($500-2000 depending on tier)

Implementation:
1. Add "dealLength" to BriefData: "one_time" | "monthly" | "3_month" | "6_month" | "12_month"

2. Add "monthlyDeliverables" object:
   {
     posts: number,
     stories: number,
     reels: number,
     videos: number
   }

3. Create calculateRetainerPrice function:
   - Calculate per-piece rates
   - Apply volume discount based on dealLength
   - Multiply by months
   - Return monthly rate and total contract value

4. Add "ambassadorPerks" object:
   {
     exclusivityRequired: boolean,
     exclusivityType: "none" | "category" | "full",
     productSeeding: boolean,
     productValue: number,
     eventsIncluded: number,
     eventDayRate: number
   }

5. Update PDF generator with retainer-specific layout showing:
   - Monthly rate
   - Total contract value
   - Per-piece breakdown
   - Discount applied

Write tests for:
- Each discount tier applies correctly
- Monthly deliverables calculation
- Ambassador exclusivity adds premium
- Event appearances calculated separately
- Total contract value is accurate

Show me all changes and test results.
```

---

## Day 3: Score Refactor & Output Enhancements (Features 10-14)

### Prompt 10: Deal Quality Score (Reframe Fit Score)

```
Refactor the fit score system to be creator-centric instead of brand-centric.

Current fit score answers: "How well does this creator fit the brand?"
New Deal Quality Score answers: "How good is this deal FOR the creator?"

Rename fit-score.ts to deal-quality-score.ts and refactor:

New scoring dimensions (100 points total):

1. Rate Fairness (25 points)
   - Is the offered/calculated rate at or above market?
   - Compare to similar creator benchmarks
   - Score: (rate / marketRate) * 25, capped at 25

2. Brand Legitimacy (20 points)
   - Is this a real brand with real followers?
   - Do they have a website?
   - Have they worked with creators before?
   - Score based on signals detected

3. Portfolio Value (20 points)
   - Will this look good in creator's portfolio?
   - Is brand in creator's niche or adjacent?
   - Brand reputation/prestige factor

4. Growth Potential (15 points)
   - Did they mention ongoing partnership?
   - Is this a category leader?
   - Could lead to more opportunities?

5. Terms Fairness (10 points)
   - Are payment terms reasonable (Net-30 or better)?
   - Are usage rights limited appropriately?
   - Any red flag terms?

6. Creative Freedom (10 points)
   - How much creative control does creator have?
   - Strict script vs. loose guidelines?
   - Approval process reasonable?

Deal Quality Levels:
- 85-100: Excellent Opportunity (green)
- 70-84: Good Deal (blue)
- 50-69: Fair/Negotiate (yellow)
- Below 50: Proceed with Caution (red)

Implementation:
1. Create new file src/lib/deal-quality-score.ts
2. Create DealQualityResult type with all dimension scores
3. Create calculateDealQuality function
4. Update the main calculation flow to use new score
5. Remove or deprecate old fit-score.ts
6. Update PDF to show Deal Quality Score with breakdown
7. Add recommendations based on score ("Take this deal", "Negotiate terms", "Consider declining")

Write tests for:
- Each dimension scores correctly
- Overall score calculation
- Deal quality level thresholds
- Recommendations match score levels

Show me all changes and test results.
```

### Prompt 11: Add Negotiation Talking Points to PDF

```
Enhance the PDF rate card to include negotiation support for creators.

Add a "Confidence Stack" section to the PDF that includes:

1. "Why This Rate" section (to share with brand):
   - 3-4 bullet points justifying the rate
   - Based on engagement, niche, audience quality
   - Professional, factual tone

2. "Confidence Boosters" section (for creator's eyes):
   - Comparison to market ("This is 10% below average for your tier")
   - Reminder of creator's value
   - Encouragement without being cheesy

3. "If They Push Back" section:
   - 2-3 counter-offer scripts
   - What to reduce (remove usage rights, shorter exclusivity)
   - Minimum acceptable rate suggestion
   - When to walk away

4. "Quick Response Template":
   - Ready-to-copy message to send to brand
   - Includes rate and brief justification
   - Professional but friendly tone

Implementation:
1. Create generateNegotiationTalkingPoints(pricingResult, creatorProfile) function
2. Returns object with all four sections above
3. Update PDF generator to include new sections
4. Style appropriately - talking points should be visually distinct
5. Add a "Creator Copy" vs "Brand Copy" toggle for PDF export
   - Brand copy: Just rate card (current)
   - Creator copy: Rate card + all talking points

Write tests for:
- Talking points generated for various scenarios
- Counter-offers are mathematically sound
- Response template includes correct rate

Show me all changes and test results.
```

### Prompt 12: Add FTC Disclosure Guidance

```
Add FTC disclosure guidance to help creators stay compliant.

FTC violations can cost up to $50,000+ per violation. Add guidance:

Create a new section in the PDF and UI:

1. Disclosure Requirements reminder:
   - "This is a paid partnership - FTC disclosure required"
   - Must use #ad or #sponsored (NOT #sp, #spon, #collab)
   - Disclosure must be at BEGINNING of caption
   - Must be visible without clicking "more"

2. Platform-specific guidance:
   - Instagram: Use "Paid partnership" tag + #ad in caption
   - TikTok: Use "Paid" disclosure label + verbal mention
   - YouTube: Use "Includes paid promotion" checkbox + verbal disclosure
   - Twitter: #ad at start of tweet

3. Content-specific rules:
   - Gifted products: Must still disclose (#gifted acceptable)
   - Affiliate links: Must disclose affiliate relationship
   - Reviews: Disclose if product was free

4. AI content disclosure (new 2025):
   - If AI tools used in content creation, may need disclosure
   - Add checkbox: "Will you use AI tools for this content?"

Implementation:
1. Create src/lib/ftc-guidance.ts with all disclosure rules
2. Create getFTCGuidance(platform, dealType, hasAI) function
3. Add FTC section to PDF rate card
4. Add "FTC Compliance Checklist" component to UI
5. Include relevant guidance based on platform and deal type

Write tests for:
- Correct guidance returned for each platform
- AI disclosure triggers when flagged
- Gifted product guidance differs from paid

Show me all changes and test results.
```

### Prompt 13: Add Contract Terms Checklist

```
Add a contract terms checklist to help creators protect themselves.

Many creators miss important contract terms. Add a checklist:

Essential terms to look for (with explanations):

PAYMENT:
- [ ] Payment amount clearly stated
- [ ] Payment timeline specified (Net-15, Net-30, etc.)
- [ ] Late payment penalty clause (recommend 10% monthly)
- [ ] Deposit/upfront payment (recommend 50%)
- [ ] Kill fee if brand cancels (recommend 25-50%)

CONTENT & RIGHTS:
- [ ] Deliverables clearly defined (number, type, length)
- [ ] Revision rounds limited (recommend max 2)
- [ ] Usage rights duration specified
- [ ] Usage channels specified (organic, paid, OOH)
- [ ] Territory specified (domestic, worldwide)
- [ ] Creator retains ownership of raw content

EXCLUSIVITY:
- [ ] Exclusivity period defined (if any)
- [ ] Exclusivity scope defined (category, full)
- [ ] Exclusivity compensated appropriately

LEGAL:
- [ ] Termination clause exists
- [ ] Dispute resolution specified
- [ ] No unreasonable liability on creator
- [ ] FTC compliance language included

RED FLAGS:
- Perpetual/unlimited usage rights without major premium
- No payment for usage rights
- Exclusivity without compensation
- Payment terms beyond Net-60
- Unlimited revisions
- Moral rights waiver
- Non-disparagement that's too broad

Implementation:
1. Create src/lib/contract-checklist.ts
2. Create ContractChecklist type with all items
3. Create getContractChecklist(briefData) function
4. Highlight which terms apply based on the brief
5. Add checklist section to PDF
6. Add interactive checklist component to UI (for future contract review feature)

Write tests for:
- Checklist items generated correctly
- Red flags identified from brief data
- Recommendations match deal type

Show me all changes and test results.
```

### Day 3 Testing Checkpoint

```
Run comprehensive tests for Days 1-3 features:

1. Run: pnpm test
2. Run: pnpm build
3. Run: pnpm lint

Then do manual integration testing:

1. Generate a rate card with ALL new features:
   - High-value niche (Finance)
   - With whitelisting (paid social)
   - During Q4 (seasonal)
   - From UK (regional)
   - Hybrid pricing model
   - 6-month retainer

2. Verify the PDF includes:
   - All pricing layers in breakdown
   - Deal Quality Score
   - Negotiation talking points
   - FTC guidance
   - Contract checklist

3. Test edge cases:
   - UGC-only deal (no follower-based pricing)
   - Celebrity tier with full ambassador package
   - Affiliate-only deal

Fix any issues before proceeding to Day 4.

Show me all test results and the generated PDF content for the integration test.
```

---

## Day 4: DM Features (Features 14-16)

### Prompt 14: DM Text Parser + Response Generator

```
Build the DM text parser - the killer feature that meets creators where opportunities actually arrive.

When a creator gets a brand DM, they can paste it and get instant analysis + response.

Implementation:

1. Create src/lib/dm-parser.ts with:

   parseDMText(dmText: string, creatorProfile: CreatorProfile): DMAnalysis

   DMAnalysis type:
   {
     brandName: string | null,
     brandHandle: string | null,
     deliverableRequest: string | null,
     compensationType: "paid" | "gifted" | "unclear" | "none_mentioned",
     offeredAmount: number | null,
     tone: "professional" | "casual" | "mass_outreach" | "scam_likely",
     urgency: "high" | "medium" | "low",
     redFlags: string[],
     greenFlags: string[],
     extractedRequirements: Partial<BriefData>,
     recommendedResponse: string,
     suggestedRate: number,
     dealQualityEstimate: number,
     nextSteps: string[]
   }

2. Use LLM (you already have Groq integration) to extract:
   - Brand identification
   - What they're asking for
   - Any mentioned compensation
   - Tone analysis
   - Red flags (mass outreach, too good to be true, vague, no payment mention)

3. Generate recommended response based on analysis:
   - If professional + paid mention: Share rate card
   - If gifted only: Politely ask about budget
   - If vague: Ask clarifying questions
   - If red flags: Polite decline or caution

4. Create API route: POST /api/parse-dm
   - Takes: { dmText: string }
   - Returns: DMAnalysis

5. Create UI component: DMParserForm
   - Textarea for pasting DM
   - "Analyze" button
   - Results display with:
     - Detected brand/request
     - Red/green flags with explanations
     - Recommended response (copy button)
     - Suggested rate
     - Deal quality estimate

Write tests for:
- DM with clear brand and paid offer
- DM with gift-only offer
- Suspicious/scam DM detection
- Mass outreach template detection
- Response generation quality

Show me all changes and test results.
```

### Prompt 15: Outcome Tracking

```
Add outcome tracking to build the data flywheel.

After every rate card or DM analysis, ask creators what happened.

Implementation:

1. Database schema updates (Prisma):

   Add Outcome model:
   model Outcome {
     id              String   @id @default(cuid())
     creatorId       String
     creator         User     @relation(fields: [creatorId], references: [id])
     rateCardId      String?
     rateCard        RateCard? @relation(fields: [rateCardId], references: [id])

     // What was proposed
     proposedRate    Float
     platform        String
     dealType        String
     niche           String?

     // What happened
     outcome         String   // "accepted" | "negotiated" | "rejected" | "ghosted" | "pending"
     finalRate       Float?   // If negotiated, what was final
     negotiationDelta Float?  // Percentage difference

     // Metadata
     brandName       String?
     brandFollowers  Int?
     dealLength      String?

     // Timestamps
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     closedAt        DateTime?
   }

2. Create API routes:
   - POST /api/outcomes - Create new outcome
   - PATCH /api/outcomes/:id - Update outcome status
   - GET /api/outcomes - Get creator's outcome history

3. Create UI components:

   OutcomePrompt - Shows after rate card generation:
   - "Did you send this rate?" (Yes/No/Not yet)
   - If yes, follow up later: "What happened?"
   - Quick buttons: Accepted, Negotiated, Rejected, Ghosted
   - If negotiated: "What was the final rate?"

   OutcomeHistory - Dashboard showing:
   - Total deals tracked
   - Acceptance rate
   - Average negotiation delta
   - Total earnings tracked

4. Create src/lib/outcome-analytics.ts:
   - calculateAcceptanceRate(outcomes)
   - calculateAverageNegotiationDelta(outcomes)
   - getMarketBenchmark(platform, niche, tier) - aggregate anonymized data

5. Display "Creators like you" insights:
   - "Your acceptance rate: 72%"
   - "Average for your tier: 65%"
   - "You could increase rates by ~10%"

Write tests for:
- Outcome creation and updates
- Analytics calculations
- Benchmark aggregation (mock data)

Show me all changes and test results.
```

### Prompt 16: DM Screenshot/Image Parser

```
Extend the DM parser to handle screenshots (images) of DMs.

Creators often screenshot DMs rather than copy-pasting text.

Implementation:

1. Update src/lib/dm-parser.ts:

   Add parseDMImage(imageBuffer: Buffer, creatorProfile: CreatorProfile): Promise<DMAnalysis>

   This should:
   - Use vision/OCR to extract text from screenshot
   - Then run same analysis as text parser
   - Handle common DM screenshot formats (Instagram, TikTok, Email)

2. Use Claude's vision capability or integrate a vision API:
   - Option A: Use Claude API with vision (if available in your setup)
   - Option B: Use Tesseract.js for OCR
   - Option C: Use Google Cloud Vision API

   Recommend Option A if possible since you already use LLMs.

3. Update API route: POST /api/parse-dm
   - Accept both text and image uploads
   - Content-Type: multipart/form-data for images
   - Content-Type: application/json for text

4. Update DMParserForm UI:
   - Add image upload/drop zone
   - Support paste from clipboard (Cmd+V)
   - Show image preview
   - Handle loading state for image processing (slower than text)

5. Handle edge cases:
   - Low quality images
   - Multiple DMs in one screenshot
   - Non-DM images (show error)
   - Supported formats: PNG, JPG, WEBP

Write tests for:
- Image upload handling
- OCR text extraction (mock)
- Error handling for bad images
- Clipboard paste functionality

Show me all changes and test results.
```

---

## Day 5: Mobile & Polish (Feature 17 + Testing)

### Prompt 17: Ensure Mobile-First Experience

```
Audit and fix the mobile experience. 70% of target users are on phones.

Comprehensive mobile audit:

1. Test all pages on mobile viewport (375px width):
   - Home/Landing
   - Dashboard
   - Create Rate Card flow
   - DM Parser
   - Rate Card PDF preview
   - Settings/Profile

2. Fix common mobile issues:
   - Touch targets too small (minimum 44x44px)
   - Text too small (minimum 16px for body)
   - Horizontal scrolling (eliminate)
   - Forms hard to use (proper input types, autocomplete)
   - Modals/dialogs not mobile-friendly
   - Tables not responsive

3. Improve mobile-specific UX:
   - Bottom navigation for key actions
   - Swipe gestures where appropriate
   - Pull-to-refresh on data pages
   - Haptic feedback on actions (if PWA)
   - Quick-action buttons for common tasks

4. PDF viewing on mobile:
   - Responsive PDF preview
   - Easy share to other apps
   - Download works properly

5. DM Parser mobile experience:
   - Easy paste from clipboard
   - Camera/photo library access for screenshots
   - Results fit on mobile screen

6. Performance on mobile:
   - Lazy load heavy components
   - Optimize images
   - Minimize JavaScript bundle
   - Test on slow 3G

Implementation:
- Audit with Chrome DevTools mobile simulation
- Fix all identified issues
- Add responsive Tailwind classes where missing
- Test on actual iOS and Android if possible

Show me:
1. List of all issues found
2. Fixes applied
3. Before/after screenshots of key screens
```

### Prompt 18: Final Integration Testing

```
Comprehensive end-to-end testing of all 17 features.

Run through these complete user flows:

FLOW 1: New Nano Creator
- Create profile: 8K followers, lifestyle niche, US-based
- Calculate rate for Instagram Reel
- Verify all pricing layers show correctly
- Generate PDF and verify all sections

FLOW 2: Micro Creator with DM
- Profile: 45K followers, beauty niche, UK-based
- Paste sample DM: "Hey! Love your content! We'd love to send you our new serum to try and feature. LMK if interested!"
- Verify: Red flags detected (no payment), suggested response asks about budget
- Track outcome: Rejected

FLOW 3: Mid-Tier Creator with Complex Deal
- Profile: 150K followers, finance niche, US-based
- Hybrid deal: Base + 15% affiliate
- 6-month retainer
- Full exclusivity
- Q4 campaign (seasonal)
- Whitelisting for paid social
- Verify: All premiums applied, PDF shows retainer breakdown

FLOW 4: UGC Creator
- Profile: 5K followers (shouldn't matter)
- UGC deal type
- 3 videos
- Verify: Follower count doesn't affect price

FLOW 5: Ambassador Deal
- Profile: 500K followers, tech niche
- 12-month ambassador
- Monthly: 4 posts, 8 stories, 2 videos
- Category exclusivity
- 2 event appearances
- Verify: Total contract value, monthly breakdown, event fees

Run these tests and fix any issues found.

Then run:
- pnpm test (all unit tests)
- pnpm build (no errors)
- pnpm lint (no warnings)

Show me results of all flows and test suite.
```

### Prompt 19: Documentation & Cleanup

```
Final cleanup and documentation before deployment.

1. Update CLAUDE.md with new features:
   - Document new pricing layers
   - Document DM parser
   - Document outcome tracking
   - Update the 6-Layer model description (now more layers!)

2. Clean up code:
   - Remove any console.logs
   - Remove unused imports
   - Remove commented-out code
   - Ensure consistent code style

3. Update types.ts:
   - Ensure all new types are exported
   - Add JSDoc comments to complex types
   - Remove any deprecated types

4. Create/update API documentation:
   - Document all new API routes
   - Include request/response examples
   - Note authentication requirements

5. Check for security issues:
   - No secrets in code
   - API routes properly authenticated
   - Input validation on all endpoints
   - SQL injection protection (Prisma handles this)

6. Performance check:
   - No N+1 queries
   - Proper error handling
   - Loading states on all async operations

Show me the updated documentation and any issues found during cleanup.
```

### Prompt 20: Deployment Preparation

```
Prepare for deployment.

1. Environment check:
   - All required env vars documented
   - No hardcoded URLs
   - Proper error messages for missing config

2. Database:
   - Run: pnpm prisma generate
   - Create migration for new Outcome model
   - Test migration on fresh database

3. Build verification:
   - pnpm build completes successfully
   - No TypeScript errors
   - No lint errors
   - Bundle size reasonable

4. Create deployment checklist:
   - [ ] All tests passing
   - [ ] Build successful
   - [ ] Migrations ready
   - [ ] Environment variables set
   - [ ] API keys valid
   - [ ] Error tracking configured

5. Git cleanup:
   - Review all changes with git diff
   - Create meaningful commit messages for each feature
   - Ensure no sensitive data in commits

Show me the deployment checklist and any remaining issues.
```

---

## Quick Reference: Feature to Prompt Mapping

| # | Feature | Prompt | Day |
|---|---------|--------|-----|
| 1 | Increase base rates | Prompt 1 | 1 |
| 2 | Niche premium multiplier | Prompt 2 | 1 |
| 3 | Fix UGC pricing | Prompt 3 | 1 |
| 4 | Whitelisting premium | Prompt 4 | 1 |
| 5 | Seasonal pricing | Prompt 5 | 1 |
| 6 | Regional adjustments | Prompt 6 | 1 |
| 7 | Emerging platforms | Prompt 7 | 1 |
| 8 | Affiliate pricing | Prompt 8 | 2 |
| 9 | Retainer pricing | Prompt 9 | 2 |
| 10 | Deal Quality Score | Prompt 10 | 3 |
| 11 | Negotiation talking points | Prompt 11 | 3 |
| 12 | FTC guidance | Prompt 12 | 3 |
| 13 | Contract checklist | Prompt 13 | 3 |
| 14 | DM text parser | Prompt 14 | 4 |
| 15 | Outcome tracking | Prompt 15 | 4 |
| 16 | DM image parser | Prompt 16 | 4 |
| 17 | Mobile-first | Prompt 17 | 5 |

---

## Tips for Running These Prompts

1. **Run prompts sequentially** - Later prompts depend on earlier ones

2. **Verify after each prompt** - Don't proceed if tests fail

3. **Commit after each feature** - Makes rollback easier

4. **If Claude gets confused** - Remind it of the current file structure and what's already been implemented

5. **For complex prompts** - Break into smaller requests if needed

6. **Save your work** - Commit frequently with descriptive messages

---

## Expected Final State

After completing all prompts, RateCard.AI will have:

- **Enhanced Pricing Engine**: 10+ pricing factors vs original 6
- **New Deal Types**: UGC, Affiliate, Retainer, Ambassador
- **DM Parser**: Text and image support
- **Data Flywheel**: Outcome tracking building market intelligence
- **Creator Protection**: FTC guidance, contract checklist
- **Confidence Stack**: Negotiation support in every output
- **Mobile-First**: Optimized for 70% of users
- **All Tiers Supported**: Nano to Celebrity

Good luck with the implementation!
