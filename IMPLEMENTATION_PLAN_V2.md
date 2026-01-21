# RateCard.AI Implementation Plan V2

## Overview

This document contains detailed prompts to run in Claude Code to implement the 19 features for the RateCard.AI platform upgrade. Each prompt is designed to be copy-pasted directly into Claude Code.

**Timeline**: 5 days
**Total Features**: 19 (including Gift Deal Manager system)
**Testing**: Included after each major section

### Feature Summary

| Day | Focus | Features |
|-----|-------|----------|
| 1 | Pricing Engine | Base rates, Niche, UGC, Whitelisting, Seasonal, Regional, Platforms |
| 2 | Pricing Models | Affiliate/Performance, Retainer/Ambassador |
| 3 | Score & Output | Deal Quality Score, Negotiation, FTC, Contracts |
| 4 | DM & Gifts | DM Parser, Gift Evaluator, Gift Tracker, Outcomes, Image Parser |
| 5 | Polish & Ship | Mobile, Testing, Docs, Deployment |

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

## Day 4: DM & Gift Opportunity System (Features 14-19)

Day 4 builds the complete "opportunity intake" system - from the moment a creator receives a brand DM to tracking the outcome. This includes the Gift Deal Manager, which helps creators evaluate gift offers and convert them to paid partnerships.

### Prompt 14: DM Text Parser with Gift Detection

```
Build the DM text parser - the killer feature that meets creators where opportunities actually arrive.

When a creator gets a brand DM, they can paste it and get instant analysis + response. CRITICALLY, this must detect gift-only offers and route to appropriate handling.

Implementation:

1. Create src/lib/dm-parser.ts with:

   parseDMText(dmText: string, creatorProfile: CreatorProfile): DMAnalysis

   DMAnalysis type:
   {
     // Brand identification
     brandName: string | null,
     brandHandle: string | null,

     // Request analysis
     deliverableRequest: string | null,
     compensationType: "paid" | "gifted" | "hybrid" | "unclear" | "none_mentioned",
     offeredAmount: number | null,
     estimatedProductValue: number | null,  // NEW: for gift offers

     // Tone & quality signals
     tone: "professional" | "casual" | "mass_outreach" | "scam_likely",
     urgency: "high" | "medium" | "low",

     // Flags
     redFlags: string[],
     greenFlags: string[],

     // Gift-specific analysis (NEW)
     isGiftOffer: boolean,
     giftAnalysis: {
       productMentioned: string | null,
       contentExpectation: "explicit" | "implied" | "none",
       conversionPotential: "high" | "medium" | "low",
       recommendedApproach: "accept_and_convert" | "counter_with_hybrid" | "decline" | "ask_budget"
     } | null,

     // Extracted data
     extractedRequirements: Partial<BriefData>,

     // Recommendations
     recommendedResponse: string,
     suggestedRate: number,
     dealQualityEstimate: number,
     nextSteps: string[]
   }

2. Use LLM (you already have Groq integration) to extract:
   - Brand identification
   - What they're asking for
   - Compensation type detection (CRITICAL: distinguish paid vs gift vs unclear)
   - Tone analysis
   - Red flags:
     * Mass outreach signals ("Hey babe!", excessive emojis, generic language)
     * No payment mention when deliverables are expected
     * Too good to be true offers
     * Vague or missing details
     * Pressure tactics
   - Green flags:
     * Specific mention of budget
     * Professional tone
     * Clear deliverable expectations
     * Brand has legitimate presence

3. Gift detection logic:
   - Trigger phrases: "send you product", "gift", "try our", "in exchange for", "free product"
   - If gift detected AND deliverables expected = flag as "gifted" compensation type
   - Set isGiftOffer = true
   - Populate giftAnalysis object

4. Generate recommended response based on analysis:
   - If professional + paid mention: Share rate card
   - If gift offer detected: Route to Gift Evaluator flow (Prompt 15)
   - If vague: Ask clarifying questions about budget
   - If red flags: Polite decline or caution

5. Create API route: POST /api/parse-dm
   - Takes: { dmText: string }
   - Returns: DMAnalysis
   - If isGiftOffer = true, include prompt to use Gift Evaluator

6. Create UI component: DMParserForm
   - Textarea for pasting DM
   - "Analyze" button
   - Results display with:
     - Detected brand/request
     - Compensation type badge (Paid 💰 / Gift 🎁 / Unclear ❓)
     - Red/green flags with explanations
     - Recommended response (copy button)
     - If gift: "Evaluate This Gift" button → links to Gift Evaluator
     - Suggested rate (for paid) or suggested counter (for gift)
     - Deal quality estimate

Write tests for:
- DM with clear brand and paid offer → compensationType: "paid"
- DM with gift-only offer → compensationType: "gifted", isGiftOffer: true
- DM with product + payment → compensationType: "hybrid"
- Suspicious/scam DM detection
- Mass outreach template detection ("Hey babe!" pattern)
- Gift conversion potential scoring
- Response generation for each compensation type

Show me all changes and test results.
```

### Prompt 15: Gift Evaluator & Response Generator

```
Build the Gift Evaluator - helps creators decide if a gift offer is worth their time and provides smart responses.

This is triggered when DM Parser detects a gift offer, or creators can evaluate gifts directly.

Implementation:

1. Create src/lib/gift-evaluator.ts with:

   evaluateGiftDeal(input: GiftEvaluationInput, creatorProfile: CreatorProfile): GiftEvaluation

   GiftEvaluationInput type:
   {
     productDescription: string,
     estimatedProductValue: number,
     contentRequired: "organic_mention" | "dedicated_post" | "multiple_posts" | "video_content",
     estimatedHoursToCreate: number,
     brandQuality: "major_brand" | "established_indie" | "new_unknown" | "suspicious",
     wouldYouBuyIt: boolean,
     brandFollowers: number | null,
     hasWebsite: boolean,
     previousCreatorCollabs: boolean
   }

   GiftEvaluation type:
   {
     // Core evaluation
     worthScore: number,  // 0-100
     recommendation: "accept_with_hook" | "counter_hybrid" | "decline_politely" | "ask_budget_first" | "run_away",

     // The math breakdown
     analysis: {
       productValue: number,
       yourTimeValue: number,       // hours × hourly rate
       audienceValue: number,       // based on reach/engagement
       totalValueProviding: number, // time + audience
       valueGap: number,            // what you're providing - what you're getting
       effectiveHourlyRate: number  // product value / hours
     },

     // Strategic assessment
     strategicValue: {
       score: number,  // 0-10
       portfolioWorth: boolean,
       conversionPotential: "high" | "medium" | "low",
       brandReputationBoost: boolean,
       reasons: string[]
     },

     // Recommendations
     minimumAcceptableAddOn: number,  // $ to add for hybrid
     suggestedCounterOffer: string,
     walkAwayPoint: string,

     // If accepting gift-only, what to limit
     acceptanceBoundaries: {
       maxContentType: string,  // e.g., "organic story only"
       timeLimit: string,       // e.g., "24-hour story, not permanent post"
       rightsLimit: string      // e.g., "no usage rights beyond your post"
     }
   }

2. Evaluation logic:

   a) Calculate creator's effective hourly rate:
      - Use their tier to estimate hourly value
      - Nano: $30/hr, Micro: $50/hr, Mid: $75/hr, Macro+: $100+/hr

   b) Calculate total value creator is providing:
      - Time value = hours × hourly rate
      - Audience value = (followers × engagement rate × 0.001) × $5 CPM estimate
      - Total = time + audience

   c) Calculate value gap:
      - Gap = totalValueProviding - productValue
      - If gap > 50% of totalValue → recommend counter or decline

   d) Strategic scoring (0-10):
      - Major brand: +3
      - Would buy product anyway: +2
      - Has previous creator collabs: +2
      - Good conversion potential: +2
      - Portfolio worthy: +1
      - Suspicious signals: -5

   e) Decision matrix:
      | Worth Score | Strategic Score | Recommendation |
      |-------------|-----------------|----------------|
      | 70+         | 7+              | Accept with conversion hook |
      | 50-70       | 5+              | Counter with hybrid |
      | 50-70       | <5              | Ask about budget first |
      | 30-50       | Any             | Decline politely |
      | <30         | Any             | Run away |

3. Create src/lib/gift-responses.ts with:

   generateGiftResponse(evaluation: GiftEvaluation, context: ResponseContext): GiftResponse

   GiftResponse type:
   {
     responseType: string,
     message: string,
     followUpReminder: string | null,
     conversionScript: string | null  // for use after successful gift collab
   }

   Response templates for each scenario:

   ACCEPT_WITH_HOOK:
   "Hi [Brand]! Thanks for reaching out - I'd love to try [product]!

   I'm happy to share my honest experience with my audience. If the content performs well, I'd love to discuss a paid partnership for future campaigns!

   Where should I send my shipping info?"

   COUNTER_HYBRID:
   "Hi [Brand]! Thank you for thinking of me - [product] looks amazing!

   For a dedicated [post type], my rate is typically $[X]. I'd be happy to do a hybrid collaboration:

   → Product gifted + $[reduced rate] = [deliverables]

   This lets me create the high-quality content your brand deserves. Would that work with your budget?"

   ASK_BUDGET_FIRST:
   "Hi [Brand]! Thanks for reaching out!

   Before I confirm, I have a few quick questions:
   1. What's the retail value of the product?
   2. What deliverables are you hoping for?
   3. Is there a budget for this partnership, or is it product-only?

   Looking forward to hearing more!"

   DECLINE_POLITELY:
   "Thanks so much for thinking of me!

   I'm currently focused on paid partnerships, but I appreciate you reaching out. If you have budget for a collaboration in the future, I'd love to chat!

   Best of luck with your campaign!"

4. Create API route: POST /api/evaluate-gift
   - Takes: GiftEvaluationInput
   - Returns: GiftEvaluation + recommended response

5. Create UI components:

   GiftEvaluatorForm:
   - Product description input
   - Retail value input ($)
   - Content required dropdown
   - Time estimate slider (hours)
   - Brand quality radio buttons
   - "Would you buy this?" toggle
   - [Evaluate] button

   GiftEvaluationResult:
   - Worth Score gauge (0-100 with color coding)
   - Recommendation badge
   - "The Math" breakdown showing:
     * Product value: $X
     * Your time: X hrs × $Y/hr = $Z
     * Your audience value: ~$W
     * Total you're providing: $Total
     * Value gap: $Gap (You're giving $X more than receiving)
   - Strategic value score with reasons
   - Recommended response (with copy button)
   - If accepting: "Set follow-up reminder" option
   - "Track This Brand" button → saves to Gift Tracker

Write tests for:
- High-value product + low content = recommend accept
- Low-value product + high content = recommend decline
- Mid-range scenarios = recommend hybrid
- Strategic score calculation
- Response generation for each type
- Hourly rate calculation by tier

Show me all changes and test results.
```

### Prompt 16: Gift Relationship Tracker

```
Build the Gift Relationship Tracker - helps creators track gift deals and convert them to paid partnerships.

This creates a CRM-lite for gift relationships, enabling systematic conversion.

Implementation:

1. Database schema (Prisma):

   model GiftDeal {
     id                String   @id @default(cuid())
     creatorId         String
     creator           User     @relation(fields: [creatorId], references: [id])

     // Brand info
     brandName         String
     brandHandle       String?
     brandWebsite      String?
     brandFollowers    Int?

     // Gift details
     productDescription String
     productValue      Float
     dateReceived      DateTime

     // Content created
     contentType       String?   // "post", "reel", "story", "video"
     contentUrl        String?
     contentDate       DateTime?

     // Performance (if tracked)
     views             Int?
     likes             Int?
     comments          Int?
     saves             Int?
     shares            Int?

     // Conversion tracking
     status            String    @default("received")  // received, content_created, followed_up, converted, declined, archived
     conversionStatus  String?   // null, "attempting", "converted", "rejected"
     convertedDealId   String?   // links to RateCard if converted
     convertedAmount   Float?

     // Follow-up
     followUpDate      DateTime?
     followUpSent      Boolean   @default(false)
     notes             String?

     // Timestamps
     createdAt         DateTime  @default(now())
     updatedAt         DateTime  @updatedAt
   }

2. Create API routes:
   - POST /api/gifts - Create new gift record
   - GET /api/gifts - List all gifts for creator
   - GET /api/gifts/:id - Get single gift details
   - PATCH /api/gifts/:id - Update gift (add performance, status, etc.)
   - DELETE /api/gifts/:id - Remove gift record
   - POST /api/gifts/:id/follow-up - Log follow-up attempt
   - POST /api/gifts/:id/convert - Mark as converted to paid

3. Create src/lib/gift-tracker.ts with:

   getGiftsByStatus(creatorId, status): GiftDeal[]
   getReadyToConvert(creatorId): GiftDeal[]  // gifts with good performance, no follow-up yet
   getFollowUpsDue(creatorId): GiftDeal[]    // past follow-up date
   getConversionRate(creatorId): number
   getGiftAnalytics(creatorId): GiftAnalytics

   GiftAnalytics type:
   {
     totalGiftsReceived: number,
     totalProductValue: number,
     giftsConverted: number,
     conversionRate: number,
     revenueFromConverted: number,
     roiOnGiftWork: number,            // revenue / product value
     avgTimeToConversion: number,      // days
     topConvertingCategory: string,
     followUpsDue: number
   }

4. Create conversion playbook logic:

   getConversionScript(giftDeal: GiftDeal, scriptType: string): string

   Script types:
   - "performance_share" (after content posted, share results)
   - "follow_up_30_day" (check in after 30 days)
   - "new_launch_pitch" (when brand has new product)
   - "returning_brand_offer" (offer returning brand discount)

   Example scripts:

   PERFORMANCE_SHARE:
   "Hi [Brand]! Wanted to share - the [product] content performed great!

   📊 Results:
   • [X] views
   • [Y] likes
   • [Z] saves

   My audience loved it! I'd love to discuss a paid partnership for future campaigns. Here's my rate card: [link]"

   FOLLOW_UP_30_DAY:
   "Hi [Brand]! I've been using [product] for a month now and still loving it!

   I noticed you have some exciting things coming up. I'd love to be part of your next campaign - I offer a 15% returning brand discount.

   Would you be interested in discussing a paid collaboration?"

5. Create UI components:

   GiftDashboard:
   - Summary stats (total gifts, conversion rate, revenue)
   - Filter by status
   - "Ready to Convert" section (gifts with good performance)
   - "Follow-ups Due" section
   - Recent activity

   GiftList:
   - Card view of all gift deals
   - Status badges (Received, Content Created, Following Up, Converted!)
   - Quick actions (Add Performance, Follow Up, Mark Converted)

   GiftDetailModal:
   - Full gift details
   - Performance metrics input
   - Conversion scripts (with copy buttons)
   - Follow-up scheduler
   - Notes section

   AddGiftForm:
   - Brand info inputs
   - Product details
   - Optionally import from DM Parser result

6. Reminder system:
   - When creator adds a gift, suggest follow-up date (14 days for performance share)
   - Show "Follow-ups Due" badge on dashboard
   - Optional email/push reminder (future feature)

Write tests for:
- Gift CRUD operations
- Status transitions
- Analytics calculations
- Conversion rate calculation
- Follow-up due logic
- Script generation with dynamic data

Show me all changes and test results.
```

### Prompt 17: Outcome Tracking (Expanded for Gifts)

```
Build comprehensive outcome tracking - expanded to include gift outcomes and build the data flywheel.

After every rate card, DM analysis, or gift evaluation, track what happened to build market intelligence.

Implementation:

1. Database schema (Prisma) - EXPANDED:

   model Outcome {
     id                String   @id @default(cuid())
     creatorId         String
     creator           User     @relation(fields: [creatorId], references: [id])

     // Source tracking
     sourceType        String   // "rate_card" | "dm_analysis" | "gift_evaluation"
     sourceId          String?  // ID of rate card, DM, or gift

     // What was proposed
     proposedRate      Float?
     proposedType      String   // "paid" | "gift" | "hybrid" | "affiliate"
     platform          String
     dealType          String
     niche             String?

     // What happened
     outcome           String   // "accepted" | "negotiated" | "rejected" | "ghosted" | "pending" | "gift_accepted" | "gift_converted"
     finalRate         Float?
     negotiationDelta  Float?   // percentage change from proposed

     // Gift-specific outcomes (NEW)
     giftOutcome       String?  // "accepted_gift" | "countered_to_paid" | "declined" | "converted_later"
     giftConversionDays Int?    // days from gift to paid conversion

     // Metadata
     brandName         String?
     brandFollowers    Int?
     dealLength        String?
     wasGiftFirst      Boolean  @default(false)  // Did this start as a gift?

     // Timestamps
     createdAt         DateTime @default(now())
     updatedAt         DateTime @updatedAt
     closedAt          DateTime?
   }

2. Create API routes:
   - POST /api/outcomes - Create new outcome
   - PATCH /api/outcomes/:id - Update outcome status
   - GET /api/outcomes - Get creator's outcome history
   - GET /api/outcomes/analytics - Get aggregated analytics

3. Create src/lib/outcome-analytics.ts - EXPANDED:

   calculateAcceptanceRate(outcomes): { paid: number, gift: number, overall: number }
   calculateAverageNegotiationDelta(outcomes): number
   calculateGiftConversionRate(outcomes): number
   calculateAvgGiftConversionTime(outcomes): number
   getMarketBenchmark(platform, niche, tier): MarketBenchmark

   MarketBenchmark type:
   {
     avgAcceptanceRate: number,
     avgRate: number,
     avgNegotiationDelta: number,
     giftConversionRate: number,
     sampleSize: number
   }

4. Create UI components:

   OutcomePrompt - Shows after rate card/DM/gift:
   - "What happened with this opportunity?"
   - Quick buttons:
     * For paid: Accepted, Negotiated, Rejected, Ghosted
     * For gift: Accepted Gift, Countered & Won, Countered & Lost, Declined
   - If negotiated: "What was the final rate?"
   - Optional: Brand name for tracking

   OutcomeHistory:
   - List of all tracked outcomes
   - Filter by type (paid, gift, converted)
   - Conversion funnel visualization

   OutcomeDashboard - EXPANDED:
   - Overall stats:
     * Total opportunities tracked
     * Acceptance rate (paid)
     * Acceptance rate (gift)
     * Gift → Paid conversion rate
   - Comparison to market:
     * "Your acceptance rate: 72%"
     * "Average for your tier: 65%"
     * "You're 10% above average!"
   - Recommendations:
     * "Your rates have 85% acceptance - you could increase by ~15%"
     * "You convert 25% of gifts to paid - above the 12% average!"
   - Gift insights:
     * "Beauty brands convert 2x faster for you"
     * "Average conversion time: 34 days"

5. Integrate outcome tracking into existing flows:

   After Rate Card generation:
   - Show OutcomePrompt
   - "Did you send this rate? What happened?"

   After DM Analysis:
   - Show OutcomePrompt
   - Different options based on compensation type detected

   After Gift Evaluation:
   - Prompt to track result
   - Connect to Gift Tracker for conversion follow-up

6. Build data aggregation (anonymized):
   - Aggregate outcomes across all creators
   - Calculate market benchmarks by:
     * Platform
     * Niche
     * Creator tier
     * Deal type
   - Update benchmarks weekly (cron job or on-demand)
   - Use for "Creators like you" comparisons

Write tests for:
- Outcome creation for each source type
- Status transitions
- Analytics calculations
- Gift conversion tracking
- Benchmark aggregation (with mock data)
- Comparison calculations ("X% above average")

Show me all changes and test results.
```

### Prompt 18: DM Screenshot/Image Parser

```
Extend the DM parser to handle screenshots (images) of DMs.

Creators often screenshot DMs rather than copy-pasting text. This should extract text and run the same analysis.

Implementation:

1. Update src/lib/dm-parser.ts:

   Add parseDMImage(imageBuffer: Buffer, creatorProfile: CreatorProfile): Promise<DMAnalysis>

   This should:
   - Use vision/OCR to extract text from screenshot
   - Then run same analysis as text parser (including gift detection)
   - Handle common DM screenshot formats (Instagram, TikTok, Email, Twitter)

2. Use Claude's vision capability or integrate a vision API:
   - Option A: Use Claude API with vision (recommended if available)
   - Option B: Use Tesseract.js for OCR (fallback)
   - Option C: Use Google Cloud Vision API

   For Claude vision, the prompt should:
   - Extract all text from the DM screenshot
   - Identify the platform based on UI elements
   - Return structured text for analysis

3. Update API route: POST /api/parse-dm
   - Accept both text and image uploads
   - Content-Type: multipart/form-data for images
   - Content-Type: application/json for text
   - Detect input type and route appropriately

4. Update DMParserForm UI:
   - Add image upload/drop zone (drag and drop)
   - Support paste from clipboard (Cmd+V / Ctrl+V)
   - Show image preview before analysis
   - Handle loading state for image processing (slower than text)
   - Clear visual distinction between text and image input modes

5. Handle edge cases:
   - Low quality/blurry images → helpful error message
   - Multiple DMs in one screenshot → process first or ask user
   - Non-DM images → detect and show error
   - Supported formats: PNG, JPG, WEBP, HEIC
   - Max file size: 10MB

6. Platform detection from screenshots:
   - Instagram DM: Characteristic bubbles, profile pics
   - TikTok DM: Different UI pattern
   - Twitter/X DM: Blue accents, specific layout
   - Email: Formal header structure
   - Use detected platform to inform analysis

Write tests for:
- Image upload handling
- OCR text extraction (mock vision response)
- Error handling for bad/unsupported images
- Clipboard paste functionality
- Platform detection from UI elements
- Full flow: image → text extraction → analysis → gift detection

Show me all changes and test results.
```

### Day 4 Testing Checkpoint

```
Run comprehensive tests for Day 4 features:

1. Run: pnpm test
2. Run: pnpm build
3. Run: pnpm lint

Then do manual integration testing of the complete opportunity flow:

FLOW 1: Paid DM
- Paste a DM: "Hi! We love your content. We have a $500 budget for an Instagram Reel promoting our new product. Interested?"
- Verify: compensationType = "paid", suggested rate shown, response template ready

FLOW 2: Gift DM → Evaluation → Tracking
- Paste a DM: "Hey! We'd love to send you our new skincare line to try and share with your followers!"
- Verify: compensationType = "gifted", isGiftOffer = true
- Click "Evaluate This Gift" → enters Gift Evaluator
- Fill in: $150 product, dedicated post, 2 hours, established indie brand
- Verify: Worth score calculated, recommendation shown, response ready
- Click "Track This Brand" → saved to Gift Tracker
- Verify: Appears in Gift Dashboard

FLOW 3: Gift Conversion
- In Gift Tracker, find the tracked gift
- Click "Add Performance" → enter metrics (10K views, 500 likes, 50 saves)
- Verify: "Ready to Convert" badge appears
- Click "Get Conversion Script" → performance share script generated
- Click "Mark as Converted" → enter $400 paid deal
- Verify: Conversion tracked, analytics updated

FLOW 4: Outcome Analytics
- Check Outcome Dashboard
- Verify: Shows gift vs paid acceptance rates
- Verify: Shows gift conversion rate
- Verify: "Creators like you" comparison displayed

FLOW 5: Image Upload
- Upload a screenshot of an Instagram DM
- Verify: Text extracted, analysis runs, gift detection works

Fix any issues before proceeding to Day 5.

Show me all test results and the complete flow screenshots/outputs.
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

## Day 5: Mobile & Ship (Features 20-22)

Day 5 focuses on mobile optimization, comprehensive testing, and shipping.

### Prompt 19: Ensure Mobile-First Experience

```
Audit and fix the mobile experience. 70% of target users are on phones.

Comprehensive mobile audit:

1. Test all pages on mobile viewport (375px width):
   - Home/Landing
   - Dashboard
   - Create Rate Card flow
   - DM Parser + Gift Evaluator (NEW)
   - Gift Tracker Dashboard (NEW)
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

5. DM Parser mobile experience (CRITICAL):
   - Easy paste from clipboard
   - Camera/photo library access for screenshots
   - Results fit on mobile screen
   - Gift Evaluator flows smoothly from DM analysis

6. Gift Tracker mobile experience:
   - Card-based layout for gift deals
   - Easy status updates (swipe actions?)
   - Follow-up reminders work on mobile
   - Conversion scripts easy to copy

7. Performance on mobile:
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

### Prompt 20: Final Integration Testing

```
Comprehensive end-to-end testing of all 19 features.

Run through these complete user flows:

FLOW 1: New Nano Creator - Basic Rate Card
- Create profile: 8K followers, lifestyle niche, US-based
- Calculate rate for Instagram Reel
- Verify all pricing layers show correctly (base, niche, regional, seasonal, etc.)
- Generate PDF and verify all sections (pricing, negotiation tips, FTC, contracts)

FLOW 2: Gift Offer → Evaluation → Tracking → Conversion
- Profile: 45K followers, beauty niche, UK-based
- Paste sample DM: "Hey! Love your content! We'd love to send you our new serum to try and feature. LMK if interested!"
- Verify: compensationType = "gifted", isGiftOffer = true
- Click "Evaluate This Gift" → fill in $150 product, 2 hours, established brand
- Verify: Worth score, hybrid counter recommendation
- Copy the counter response, click "Track This Brand"
- Later: Add performance data (15K views, 800 likes)
- Verify: "Ready to Convert" status
- Get conversion script, mark as converted ($400)
- Verify: Appears in conversion analytics

FLOW 3: Mid-Tier Creator with Complex Paid Deal
- Profile: 150K followers, finance niche, US-based
- Hybrid deal: Base + 15% affiliate
- 6-month retainer
- Full exclusivity
- Q4 campaign (seasonal)
- Whitelisting for paid social
- Verify: All premiums applied, PDF shows retainer breakdown, Deal Quality Score

FLOW 4: UGC Creator
- Profile: 5K followers (shouldn't matter)
- UGC deal type
- 3 videos
- Verify: Follower count doesn't affect price, UGC-specific pricing applied

FLOW 5: Ambassador Deal
- Profile: 500K followers, tech niche
- 12-month ambassador
- Monthly: 4 posts, 8 stories, 2 videos
- Category exclusivity
- 2 event appearances
- Verify: Total contract value, monthly breakdown, event fees, volume discount

FLOW 6: Image DM Upload
- Upload a screenshot of an Instagram DM (gift offer)
- Verify: OCR extracts text, gift detection works, full analysis runs

FLOW 7: Outcome Analytics
- After completing flows 2-5, check Outcome Dashboard
- Verify: Acceptance rates shown
- Verify: Gift conversion rate calculated
- Verify: "Creators like you" comparisons work

Run these tests and fix any issues found.

Then run:
- pnpm test (all unit tests)
- pnpm build (no errors)
- pnpm lint (no warnings)

Show me results of all flows and test suite.
```

### Prompt 21: Documentation & Cleanup

```
Final cleanup and documentation before deployment.

1. Update CLAUDE.md with new features:
   - Document enhanced pricing engine (now 10+ factors)
   - Document DM Parser + Gift Detection
   - Document Gift Deal Manager system
   - Document Outcome Tracking
   - Update the original 6-Layer model description (now expanded)
   - Add Gift-to-Paid Conversion workflow

2. Clean up code:
   - Remove any console.logs
   - Remove unused imports
   - Remove commented-out code
   - Ensure consistent code style

3. Update types.ts:
   - Ensure all new types are exported:
     * DMAnalysis, GiftAnalysis
     * GiftEvaluationInput, GiftEvaluation
     * GiftDeal, GiftResponse
     * Outcome (expanded)
   - Add JSDoc comments to complex types
   - Remove any deprecated types

4. Create/update API documentation:
   - Document all new API routes:
     * POST /api/parse-dm
     * POST /api/evaluate-gift
     * CRUD /api/gifts
     * CRUD /api/outcomes
   - Include request/response examples
   - Note authentication requirements

5. Check for security issues:
   - No secrets in code
   - API routes properly authenticated
   - Input validation on all endpoints
   - SQL injection protection (Prisma handles this)
   - Image upload validation (size, type)

6. Performance check:
   - No N+1 queries (especially in gift/outcome lists)
   - Proper error handling
   - Loading states on all async operations
   - LLM calls have appropriate timeouts

Show me the updated documentation and any issues found during cleanup.
```

### Prompt 22: Deployment Preparation

```
Prepare for deployment.

1. Environment check:
   - All required env vars documented
   - No hardcoded URLs
   - Proper error messages for missing config
   - LLM API keys configured (Groq, etc.)

2. Database:
   - Run: pnpm prisma generate
   - Create migrations for new models:
     * GiftDeal
     * Outcome (expanded)
   - Test migrations on fresh database
   - Verify indexes for performance

3. Build verification:
   - pnpm build completes successfully
   - No TypeScript errors
   - No lint errors
   - Bundle size reasonable
   - All pages render correctly

4. Create deployment checklist:
   - [ ] All tests passing
   - [ ] Build successful
   - [ ] Migrations ready and tested
   - [ ] Environment variables set
   - [ ] LLM API keys valid and have quota
   - [ ] Image upload storage configured
   - [ ] Error tracking configured
   - [ ] Analytics configured

5. Git cleanup:
   - Review all changes with git diff
   - Create meaningful commit messages for each feature
   - Ensure no sensitive data in commits
   - Tag release version

6. Post-deployment verification:
   - Create test user
   - Run through critical flows
   - Verify LLM integration works in production
   - Check error reporting

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
| 14 | DM Parser (with gift detection) | Prompt 14 | 4 |
| 15 | **Gift Evaluator & Responses** | Prompt 15 | 4 |
| 16 | **Gift Relationship Tracker** | Prompt 16 | 4 |
| 17 | Outcome tracking (expanded) | Prompt 17 | 4 |
| 18 | DM image parser | Prompt 18 | 4 |
| 19 | Mobile-first | Prompt 19 | 5 |

**Bold** = New gift features

---

## Tips for Running These Prompts

1. **Run prompts sequentially** - Later prompts depend on earlier ones

2. **Verify after each prompt** - Don't proceed if tests fail

3. **Commit after each feature** - Makes rollback easier

4. **If Claude gets confused** - Remind it of the current file structure and what's already been implemented

5. **For complex prompts** - Break into smaller requests if needed

6. **Save your work** - Commit frequently with descriptive messages

7. **Day 4 is the biggest day** - Consider splitting across two sessions if needed

---

## Expected Final State

After completing all prompts, RateCard.AI will have:

- **Enhanced Pricing Engine**: 10+ pricing factors vs original 6
- **New Deal Types**: UGC, Affiliate, Retainer, Ambassador
- **DM Parser**: Text and image support with gift detection
- **Gift Deal Manager**: Evaluate, respond, track, and convert gift offers
- **Data Flywheel**: Outcome tracking building market intelligence
- **Creator Protection**: FTC guidance, contract checklist
- **Confidence Stack**: Negotiation support in every output
- **Mobile-First**: Optimized for 70% of users
- **All Tiers Supported**: Nano to Celebrity

---

## The Gift Deal Manager System

The Gift Deal Manager is a new core pillar of RateCard.AI:

```
CREATOR RECEIVES DM
        │
        ▼
   DM PARSER
   (Detects gift offer)
        │
        ▼
   GIFT EVALUATOR
   "Is this worth my time?"
        │
   ┌────┴────┐
   │         │
   ▼         ▼
ACCEPT    COUNTER
   │         │
   ▼         ▼
GIFT TRACKER    RATE CARD
(Track brand)   (If countered to paid)
   │
   ▼
FOLLOW UP
(After content performs)
   │
   ▼
CONVERT TO PAID
(Use conversion scripts)
   │
   ▼
OUTCOME TRACKING
(Build market data)
```

This addresses a critical gap: most nano/micro creators get stuck in the "gift trap" of creating content for free product without ever converting to paid partnerships. The Gift Deal Manager provides:

1. **Evaluation** - "Is this gift worth my time?"
2. **Response Templates** - "How do I reply professionally?"
3. **Tracking** - "Which brands have I worked with?"
4. **Conversion Scripts** - "How do I ask for paid next time?"
5. **Analytics** - "What's my gift-to-paid conversion rate?"

Good luck with the implementation!
