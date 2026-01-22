# RateCard.AI Implementation Plan V3

## Overview

This document contains detailed prompts to implement 4 new features for RateCard.AI. Each prompt is designed to be referenced in Claude Code.

**Timeline**: 1 day
**Total Features**: 4
**Testing**: Included after each feature

### Feature Summary

| # | Feature | Description | Complexity |
|---|---------|-------------|------------|
| 1 | Quick Calculator | Landing page rate estimator (no auth) | Low |
| 2 | Contract Scanner | Upload contract → LLM analyzes → flags issues | Medium |
| 3 | Brand Message Analyzer | Unified DM + Email parser (refactor existing) | Medium |
| 4 | Brand Vetter | Research brand legitimacy, detect scams | High |

---

## Feature Designs

### Feature 1: Quick Calculator

**Purpose**: Landing page conversion tool - quick rate estimate without signup

**User Flow**:
```
INPUT                          OUTPUT
┌─────────────────────┐       ┌─────────────────────────────────┐
│ Followers: 50,000   │       │ Estimated Rate: $350 - $500     │
│ Platform: Instagram │  ──►  │                                 │
│ Content: Reel       │       │ Factors that could increase:    │
│ Niche: Beauty       │       │ • High engagement (+20%)        │
│                     │       │ • Usage rights (+50%)           │
│ [Calculate]         │       │ • Exclusivity (+30%)            │
└─────────────────────┘       │                                 │
                              │ [Get Your Full Rate Card →]     │
                              └─────────────────────────────────┘
```

**Technical Design**:

```typescript
// src/lib/quick-calculator.ts

export interface QuickCalculatorInput {
  followerCount: number;
  platform: Platform;
  contentFormat: ContentFormat;
  niche?: string;
}

export interface QuickEstimateResult {
  minRate: number;
  maxRate: number;
  baseRate: number;
  tierName: string;
  factors: RateInfluencer[];
}

export interface RateInfluencer {
  name: string;
  description: string;
  potentialIncrease: string; // e.g., "+20%"
}

// Uses existing pricing engine with assumed 3% engagement
// Returns ±20% range to account for unknown variables
export function calculateQuickEstimate(input: QuickCalculatorInput): QuickEstimateResult
```

**Files to Create**:
- `src/lib/quick-calculator.ts` - Core calculation logic
- `src/app/(public)/quick-calculate/page.tsx` - Public page (no auth)
- `src/components/forms/quick-calculator-form.tsx` - Input form
- `src/components/quick-calculator-result.tsx` - Results display
- `tests/lib/quick-calculator.test.ts` - Unit tests

**Key Requirements**:
- NO authentication required (public page)
- Reuse existing pricing engine functions
- Assume 3% engagement rate for estimates
- Return min/max range (±20%)
- Show factors that could increase rate
- Strong CTA to sign up for full rate card
- Mobile-first responsive design

---

### Feature 2: Contract Scanner

**Purpose**: Upload contract → LLM analyzes → flags issues, missing clauses, red flags

**User Flow**:
```
UPLOAD                    ANALYSIS                         RESULT
┌──────────────┐         ┌─────────────────────┐         ┌────────────────────────┐
│ 📄 Drop PDF  │         │ Extracting text...  │         │ Contract Health: 62/100│
│              │   ──►   │ Analyzing clauses...│   ──►   │                        │
│ or DOCX      │         │ Checking red flags..│         │ ✅ Payment: $500       │
│              │         └─────────────────────┘         │ ✅ Net-30 terms        │
│ ─── OR ───   │                                         │ ⚠️ No kill fee clause  │
│              │                                         │ ⚠️ No revision limit   │
│ 📝 Paste     │                                         │ 🚩 Perpetual rights!   │
│ contract     │                                         │ 🚩 Unlimited revisions │
│ text here    │                                         │                        │
└──────────────┘                                         │ Missing Clauses:       │
                                                         │ • Kill fee (critical)  │
                                                         │ • Revision cap         │
                                                         │ • Late payment penalty │
                                                         │                        │
                                                         │ [Copy Change Request]  │
                                                         └────────────────────────┘
```

**Technical Design**:

```typescript
// src/lib/contract-scanner.ts

export interface ContractScanInput {
  contractText: string;
  dealContext?: {
    platform?: Platform;
    dealType?: DealType;
    offeredRate?: number;
  };
}

export interface ContractScanResult {
  healthScore: number; // 0-100
  healthLevel: "excellent" | "good" | "fair" | "poor";

  categories: {
    payment: CategoryAnalysis;
    contentRights: CategoryAnalysis;
    exclusivity: CategoryAnalysis;
    legal: CategoryAnalysis;
  };

  foundClauses: FoundClause[];
  missingClauses: MissingClause[];
  redFlags: ContractRedFlag[];

  recommendations: string[];
  changeRequestTemplate: string;
}

export interface CategoryAnalysis {
  score: number; // 0-25
  status: "complete" | "partial" | "missing";
  findings: string[];
}

export interface FoundClause {
  category: "payment" | "content_rights" | "exclusivity" | "legal";
  item: string;
  quote: string; // Actual text from contract
  assessment: "good" | "concerning" | "red_flag";
  note?: string;
}

export interface MissingClause {
  category: "payment" | "content_rights" | "exclusivity" | "legal";
  item: string;
  importance: "critical" | "important" | "recommended";
  suggestion: string;
}

export interface ContractRedFlag {
  severity: "high" | "medium" | "low";
  clause: string;
  quote?: string;
  explanation: string;
  suggestion: string;
}

export async function scanContract(input: ContractScanInput): Promise<ContractScanResult>
export function generateChangeRequest(result: ContractScanResult, creatorName?: string): string
```

**LLM Analysis Strategy**:

The LLM should analyze the contract against these categories from contract-checklist.ts:

**Payment (25 points)**:
- Payment amount clearly stated
- Payment timeline (Net-15, Net-30, etc.)
- Late payment penalty clause
- Deposit/upfront payment (50% recommended)
- Kill fee if brand cancels (25-50% recommended)

**Content & Rights (25 points)**:
- Deliverables clearly defined
- Revision rounds limited (max 2 recommended)
- Usage rights duration specified
- Usage channels specified (organic, paid, OOH)
- Territory specified
- Creator retains raw content ownership

**Exclusivity (25 points)**:
- Exclusivity period defined (if any)
- Exclusivity scope defined (category, full)
- Exclusivity compensated appropriately

**Legal (25 points)**:
- Termination clause exists
- Dispute resolution specified
- No unreasonable liability
- FTC compliance language

**Red Flags to Detect**:
- Perpetual/unlimited usage rights
- No payment for usage rights
- Exclusivity without compensation
- Payment terms beyond Net-60
- Unlimited revisions
- Moral rights waiver
- Overly broad non-disparagement

**Files to Create**:
- `src/lib/contract-scanner.ts` - LLM analysis logic
- `src/app/api/scan-contract/route.ts` - API endpoint
- `src/app/(dashboard)/tools/contract-scanner/page.tsx` - Dashboard page
- `src/components/forms/contract-scanner-form.tsx` - Upload/paste form
- `src/components/contract-scan-result.tsx` - Results display
- `tests/lib/contract-scanner.test.ts` - Unit tests

**Key Requirements**:
- Accept PDF, DOCX file upload OR pasted text
- Use existing document extraction from brief-parser.ts
- Use LLM (Groq primary, Gemini fallback) for analysis
- Compare against contract-checklist.ts categories
- Quote specific contract language as evidence
- Generate ready-to-send change request email
- Auth required
- Mobile-responsive

---

### Feature 3: Brand Message Analyzer (Unified DM + Email)

**Purpose**: Refactor existing DM Parser to handle both DMs AND emails as a unified "Brand Message Analyzer"

**Why Unified?**:
The core analysis is identical for DMs and emails:
- Brand identification
- Compensation type detection
- Tone analysis
- Red/green flags
- Gift detection
- Recommended response

Only the input patterns differ (subject lines, signatures, formality).

**User Flow**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    BRAND MESSAGE ANALYZER                       │
│         Analyze brand outreach from any channel                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ 📱 DM   │ │ 📧 Email│ │ 📸 Image│ │ 📋 Paste│              │
│  │  Text   │ │  Text   │ │Screenshot│ │  Any   │              │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘              │
│       │           │           │           │                     │
│       └───────────┴───────────┴───────────┘                     │
│                         │                                       │
│                         ▼                                       │
│              ┌─────────────────────┐                           │
│              │   Auto-detect type  │                           │
│              │   • DM vs Email     │                           │
│              │   • Platform        │                           │
│              │   • Extract brand   │                           │
│              └──────────┬──────────┘                           │
│                         │                                       │
│                         ▼                                       │
│              ┌─────────────────────┐                           │
│              │   Unified Analysis  │                           │
│              │   • Brand ID        │                           │
│              │   • Compensation    │                           │
│              │   • Tone/Flags      │                           │
│              │   • Gift detection  │                           │
│              └──────────┬──────────┘                           │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ANALYSIS RESULT                                          │   │
│  │ Brand: GlowSkin Beauty (@glowskinbeauty)                │   │
│  │ Source: Instagram DM | Email                             │   │
│  │ Compensation: 🎁 Gift Offer | 💰 Paid | ❓ Unclear       │   │
│  │                                                          │   │
│  │ [Vet This Brand]  [Evaluate Gift]  [Generate Rate Card] │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Technical Design - Refactor from DM Parser**:

```typescript
// Rename: src/lib/dm-parser.ts → src/lib/message-analyzer.ts
// Keep dm-parser.ts as re-export for backwards compatibility

export type MessageSource = "instagram_dm" | "tiktok_dm" | "twitter_dm" | "email" | "linkedin_dm" | "other";

export interface MessageAnalysisInput {
  content: string;          // Text content (pasted or extracted from image)
  sourceHint?: MessageSource; // Optional hint if user knows the source
  imageData?: string;       // Base64 image if screenshot uploaded
}

export interface MessageAnalysis {
  // Source detection
  detectedSource: MessageSource;
  sourceConfidence: "high" | "medium" | "low";

  // Brand identification (same as before)
  brandName: string | null;
  brandHandle: string | null;
  brandEmail?: string | null;      // NEW: extracted from email
  brandWebsite?: string | null;    // NEW: extracted from signature

  // Request analysis (same as before)
  deliverableRequest: string | null;
  compensationType: "paid" | "gifted" | "hybrid" | "unclear" | "none_mentioned";
  offeredAmount: number | null;
  estimatedProductValue: number | null;

  // Tone & quality (same as before)
  tone: "professional" | "casual" | "mass_outreach" | "scam_likely";
  urgency: "high" | "medium" | "low";

  // Flags (same as before)
  redFlags: string[];
  greenFlags: string[];

  // Gift analysis (same as before)
  isGiftOffer: boolean;
  giftAnalysis: GiftAnalysis | null;

  // Email-specific fields (NEW)
  emailMetadata?: {
    subject?: string;
    senderName?: string;
    senderEmail?: string;
    companySignature?: string;
    hasAttachments?: boolean;
  };

  // Recommendations (same as before)
  recommendedResponse: string;
  suggestedRate: number;
  dealQualityEstimate: number;
  nextSteps: string[];
}

// Main function - handles both DM and email
export async function analyzeMessage(
  input: MessageAnalysisInput,
  creatorProfile: CreatorProfile
): Promise<MessageAnalysis>

// Source detection
export function detectMessageSource(content: string): { source: MessageSource; confidence: string }

// Backwards compatibility
export const parseDMText = analyzeMessage; // Alias for existing code
```

**Source Detection Logic**:

```typescript
function detectMessageSource(content: string): { source: MessageSource; confidence: string } {
  // Email indicators
  const emailPatterns = [
    /^(Subject|From|To|Date):/im,           // Email headers
    /^Dear\s+/im,                            // Formal greeting
    /^Hello\s+[A-Z]/im,                      // Semi-formal greeting
    /Best regards|Sincerely|Kind regards/i, // Email closings
    /@[a-z]+\.(com|io|co|org)/i,           // Email in signature
    /^On .+ wrote:$/im,                     // Reply thread
  ];

  // DM indicators
  const dmPatterns = [
    /^Hey!|^Hi!|^Hii+/i,                    // Casual greetings
    /^Hey babe|^Hey girl|^Hey love/i,       // Mass outreach DM style
    /DM me|slide into|check your DMs/i,     // DM language
    /link in bio|swipe up/i,                // Social media language
  ];

  // Platform-specific
  const platformPatterns = {
    instagram_dm: /instagram|@[\w]+|#\w+/i,
    tiktok_dm: /tiktok|fyp|viral/i,
    linkedin_dm: /linkedin|connection|network/i,
    twitter_dm: /twitter|tweet|x\.com/i,
  };

  // Score and determine
  // ...
}
```

**Files to Modify**:
- `src/lib/dm-parser.ts` → Rename to `src/lib/message-analyzer.ts`
- `src/lib/dm-parser.ts` → Keep as re-export for backwards compatibility
- `src/lib/types.ts` → Add MessageSource, update DMAnalysis → MessageAnalysis
- `src/app/api/parse-dm/route.ts` → Update to use new analyzer
- `src/components/forms/dm-parser-form.tsx` → Rename to `message-analyzer-form.tsx`
- `tests/lib/dm-parser.test.ts` → Rename and add email tests

**Files to Create**:
- `src/lib/dm-parser.ts` (new - re-exports for backwards compatibility)

**Key Requirements**:
- Auto-detect if input is DM or email
- Extract email-specific metadata (subject, sender, signature)
- Same output structure for unified downstream handling
- Backwards compatible with existing dm-parser usage
- Update UI labels: "DM Parser" → "Message Analyzer"
- Add email examples to UI placeholder text

---

### Feature 4: Brand Vetter

**Purpose**: Research brand legitimacy, detect scams, build trust

**User Flow**:
```
INPUT                           RESEARCH                        OUTPUT
┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────────┐
│ Brand: GlowSkin Co  │        │ Checking social...  │        │ Trust Score: 78/100     │
│ Handle: @glowskinco │  ──►   │ Verifying website...│  ──►   │ Level: LIKELY LEGIT ✓   │
│ Website: glowskin.co│        │ Finding collabs...  │        │                         │
│ Platform: Instagram │        │ Scanning for scams..│        │ ┌─────────────────────┐ │
└─────────────────────┘        └─────────────────────┘        │ │ Social       22/25  │ │
                                                              │ │ Website      20/25  │ │
                                                              │ │ Collabs      18/25  │ │
                                                              │ │ Scam Check   18/25  │ │
                                                              │ └─────────────────────┘ │
                                                              │                         │
                                                              │ Findings:               │
                                                              │ ✓ 45K followers         │
                                                              │ ✓ Active since 2021     │
                                                              │ ✓ 8 past creator collabs│
                                                              │ ✓ SSL valid website     │
                                                              │                         │
                                                              │ No red flags found      │
                                                              │                         │
                                                              │ ✅ Safe to proceed      │
                                                              └─────────────────────────┘
```

**Technical Design**:

```typescript
// src/lib/brand-vetter.ts

export interface BrandVettingInput {
  brandName: string;
  brandHandle?: string;      // @glowskinco
  brandWebsite?: string;     // https://glowskin.co
  brandEmail?: string;       // partnerships@glowskin.co
  platform: Platform;
}

export interface BrandVettingResult {
  trustScore: number;        // 0-100
  trustLevel: TrustLevel;

  breakdown: {
    socialPresence: CategoryScore;
    websiteVerification: CategoryScore;
    collaborationHistory: CategoryScore;
    scamIndicators: CategoryScore;
  };

  findings: BrandFinding[];
  redFlags: BrandRedFlag[];
  recommendations: string[];

  // Metadata
  checkedAt: Date;
  dataSources: string[];
  cached: boolean;
}

export type TrustLevel = "verified" | "likely_legit" | "caution" | "high_risk";

export interface CategoryScore {
  score: number;             // 0-25
  confidence: "high" | "medium" | "low";
  details: string[];
}

export interface BrandFinding {
  category: "social" | "website" | "collabs" | "scam_check";
  finding: string;
  evidence?: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface BrandRedFlag {
  severity: "high" | "medium" | "low";
  flag: string;
  explanation: string;
  source?: string;
}

export async function vetBrand(input: BrandVettingInput): Promise<BrandVettingResult>
export function getTrustLevel(score: number): TrustLevel
```

**Vetting Categories**:

**1. Social Presence (25 points)**:
- Follower count (is it substantial for their niche?)
- Account age (older = more trustworthy)
- Posting frequency (active = good sign)
- Engagement rate (real engagement vs bought followers)
- Verified badge (instant trust boost)
- Profile completeness (bio, links, highlights)

**2. Website Verification (25 points)**:
- Does website exist and load?
- Valid SSL certificate?
- Real domain (not free hosting like wix.free or blogspot)
- Contact page with real info?
- About page with company details?
- Professional design (not template spam site)

**3. Collaboration History (25 points)**:
- Search for #ad or #sponsored posts mentioning brand
- Look for creator testimonials
- Check if brand reposts creator content
- Look for ongoing ambassador relationships
- Search for reviews from other creators

**4. Scam Indicators (25 points - inverse)**:
Start at 25, subtract for each indicator found:
- Drop shipping red flags (-5)
- MLM/pyramid scheme indicators (-10)
- "Pay to collab" language (-15)
- Fake follower patterns (-5)
- Too-good-to-be-true offers (-5)
- Pressure tactics/urgency (-3)
- No payment mentioned but expecting content (-5)
- Brand new account reaching out to many creators (-3)

**Trust Level Thresholds**:
- 80-100: "verified" - Safe to proceed
- 60-79: "likely_legit" - Probably fine, do basic due diligence
- 40-59: "caution" - Proceed carefully, ask questions
- 0-39: "high_risk" - Likely scam, avoid

**Files to Create**:
- `src/lib/brand-vetter.ts` - Core vetting logic
- `src/app/api/vet-brand/route.ts` - API endpoint
- `src/app/(dashboard)/tools/brand-vetter/page.tsx` - Dashboard page
- `src/components/forms/brand-vetter-form.tsx` - Input form
- `src/components/brand-vetting-result.tsx` - Results display
- `tests/lib/brand-vetter.test.ts` - Unit tests

**Integration Points**:
- Message Analyzer: "Vet This Brand" button after analysis
- Gift Evaluator: Include trust score in evaluation
- Standalone tool: /tools/brand-vetter

**Key Requirements**:
- Use LLM (Groq/Gemini) with web search for research
- Cache results: same brand + same day = return cached
- Show research steps during loading
- Clear trust level badges with colors
- Expandable category details
- Red flags prominently displayed
- Auth required
- Mobile-responsive

---

## Implementation Prompts

### Prompt 0: Setup and Planning

```
Before implementing new features, analyze the current codebase state:

1. Read CLAUDE.md to understand the architecture
2. Read src/lib/dm-parser.ts to understand the current DM parsing implementation
3. Read src/lib/contract-checklist.ts to understand the checklist structure
4. Read src/lib/pricing-engine.ts to understand the pricing functions
5. Check the current test setup in tests/

Report back:
- Current state of dm-parser.ts (what functions exist)
- Current state of contract-checklist.ts (what's already built)
- Any existing quick-calculate or rate estimation code
- Test infrastructure status

Do NOT implement anything yet. Just analyze and report.
```

---

### Prompt 1: Quick Calculator

```
Implement the Quick Calculator feature for landing page conversion.

Read IMPLEMENTATION_PLAN_V3.md Feature 1 (Quick Calculator) for the full design.

**Create these files:**

1. `src/lib/quick-calculator.ts`:
   - Export QuickCalculatorInput, QuickEstimateResult, RateInfluencer types
   - Export calculateQuickEstimate(input): QuickEstimateResult
   - Reuse functions from pricing-engine.ts (calculateTier, getNichePremium, getPlatformMultiplier)
   - Assume 3% engagement rate
   - Return ±20% range for min/max rates
   - Include factors array showing what could increase the rate

2. `src/app/(public)/quick-calculate/page.tsx`:
   - Public page (no auth required)
   - Clean landing page design
   - Value proposition: "Get an instant rate estimate in seconds"
   - Mobile-first responsive

3. `src/components/forms/quick-calculator-form.tsx`:
   - Follower count input with number formatting (commas)
   - Platform dropdown (all 12 platforms)
   - Content format dropdown
   - Niche dropdown (optional, default "lifestyle")
   - Loading state on submit

4. `src/components/quick-calculator-result.tsx`:
   - Rate range display: "$350 - $500"
   - Tier name display: "You're in the Micro tier"
   - Factors that could increase rate (with potential % increase)
   - Strong CTA: "Get Your Personalized Rate Card" → /signup or /login
   - Note: "This is an estimate based on average engagement"

5. `tests/lib/quick-calculator.test.ts`:
   - Test tier boundaries (edge cases at 10K, 50K, 100K, etc.)
   - Test platform multipliers applied correctly
   - Test niche premium applied correctly
   - Test range calculation (min/max ±20%)
   - Test factors array populated correctly

Add types to src/lib/types.ts:
- QuickCalculatorInput
- QuickEstimateResult
- RateInfluencer

Run pnpm test and pnpm build when complete. Show me results.
```

---

### Prompt 2: Contract Scanner

```
Implement the Contract Scanner feature.

Read IMPLEMENTATION_PLAN_V3.md Feature 2 (Contract Scanner) for the full design.

**Create these files:**

1. `src/lib/contract-scanner.ts`:
   - Export all types: ContractScanInput, ContractScanResult, CategoryAnalysis, FoundClause, MissingClause, ContractRedFlag
   - Export scanContract(input): Promise<ContractScanResult>
   - Export generateChangeRequest(result, creatorName?): string

   scanContract should:
   - Use LLM (Groq primary with llama-3.3-70b-versatile, Gemini fallback)
   - Follow the same retry/fallback pattern as dm-parser.ts
   - Analyze contract against 4 categories: payment, contentRights, exclusivity, legal
   - Extract and quote specific contract language
   - Identify red flags from contract-checklist.ts
   - Calculate health score (0-100) based on category scores
   - Generate recommendations

   generateChangeRequest should:
   - Create a professional email template
   - List specific changes needed
   - Include severity for each request

2. `src/app/api/scan-contract/route.ts`:
   - POST endpoint
   - Auth required (use auth.api.getSession pattern)
   - Accept: multipart/form-data with file OR JSON with contractText
   - If file: extract text (reuse extractTextFromDocument from brief-parser.ts if it exists, or create similar)
   - Return ContractScanResult

3. `src/app/(dashboard)/tools/contract-scanner/page.tsx`:
   - Dashboard page at /tools/contract-scanner
   - Title and description
   - Include form and result components

4. `src/components/forms/contract-scanner-form.tsx`:
   - File upload with drag-and-drop (PDF, DOCX)
   - OR textarea for pasting contract text
   - Toggle between upload and paste modes
   - Optional deal context fields (collapsible)
   - Loading state with "Analyzing contract..." message

5. `src/components/contract-scan-result.tsx`:
   - Health Score gauge (0-100) with color:
     - 80+: Green "Excellent"
     - 60-79: Blue "Good"
     - 40-59: Yellow "Fair"
     - <40: Red "Poor"
   - Four category cards in grid with scores
   - Found Clauses section (collapsible, with quotes)
   - Missing Clauses section (with importance badges)
   - Red Flags section (prominent, red background)
   - Recommendations list
   - "Copy Change Request" button

6. `tests/lib/contract-scanner.test.ts`:
   - Test with good contract (high score expected)
   - Test with contract missing critical clauses (low score)
   - Test with contract containing red flags
   - Test health score calculation
   - Test change request generation
   - Mock LLM responses for deterministic tests

Run pnpm test and pnpm build when complete. Show me results.
```

---

### Prompt 3: Brand Message Analyzer (Unified DM + Email)

```
Refactor the DM Parser into a unified Brand Message Analyzer that handles both DMs and emails.

Read IMPLEMENTATION_PLAN_V3.md Feature 3 (Brand Message Analyzer) for the full design.

**Refactor/Create these files:**

1. `src/lib/message-analyzer.ts` (NEW - main file):
   - Export MessageSource type: "instagram_dm" | "tiktok_dm" | "twitter_dm" | "linkedin_dm" | "email" | "other"
   - Export MessageAnalysisInput, MessageAnalysis types
   - Export analyzeMessage(input, creatorProfile): Promise<MessageAnalysis>
   - Export detectMessageSource(content): { source: MessageSource; confidence: string }

   The analyzeMessage function should:
   - Auto-detect if input is DM or email using detectMessageSource()
   - Extract email-specific metadata (subject, sender, signature) if email
   - Use existing LLM analysis logic (move from dm-parser.ts)
   - Return unified MessageAnalysis structure

   detectMessageSource should check for:
   - Email patterns: Subject/From/To headers, "Dear X", formal closings, email in signature
   - DM patterns: Casual greetings, social media language, @handles
   - Platform-specific patterns

2. `src/lib/dm-parser.ts` (MODIFY - backwards compatibility):
   - Keep the file but make it re-export from message-analyzer.ts
   - Export parseDMText as alias for analyzeMessage
   - Export parseDMImage (keep existing or move to message-analyzer.ts)
   - This ensures existing code doesn't break

3. `src/lib/types.ts` (UPDATE):
   - Add MessageSource type
   - Add MessageAnalysisInput type
   - Rename/alias DMAnalysis → MessageAnalysis (keep DMAnalysis for backwards compat)
   - Add emailMetadata field to analysis type

4. `src/components/forms/message-analyzer-form.tsx` (NEW or rename from dm-parser-form.tsx):
   - Update title: "Brand Message Analyzer"
   - Update description: "Analyze brand outreach from DMs or emails"
   - Add source hint dropdown (optional): "Where is this from?" - Instagram DM, TikTok DM, Email, etc.
   - Keep existing paste and image upload functionality
   - Update placeholder text to include email examples

5. `src/app/api/parse-dm/route.ts` (UPDATE):
   - Import from message-analyzer.ts
   - Keep same endpoint for backwards compatibility
   - Add optional sourceHint parameter

6. `tests/lib/message-analyzer.test.ts` (NEW):
   - Test email detection (formal email with headers)
   - Test DM detection (casual Instagram DM)
   - Test source confidence levels
   - Test email metadata extraction
   - Test backwards compatibility (parseDMText still works)
   - Keep existing dm-parser tests and ensure they still pass

7. Update any components that import from dm-parser.ts to ensure they still work.

Run pnpm test and pnpm build when complete. Show me results.
```

---

### Prompt 4: Brand Vetter Core

```
Implement the Brand Vetter core library and API.

Read IMPLEMENTATION_PLAN_V3.md Feature 4 (Brand Vetter) for the full design.

**Create these files:**

1. `src/lib/brand-vetter.ts`:
   - Export all types: BrandVettingInput, BrandVettingResult, TrustLevel, CategoryScore, BrandFinding, BrandRedFlag
   - Export vetBrand(input): Promise<BrandVettingResult>
   - Export getTrustLevel(score): TrustLevel

   vetBrand should perform 4 checks:

   a) Social Presence (25 pts):
      - Use LLM with web search to research brand's social presence
      - Check: follower count, account age, posting frequency, engagement, verified badge
      - Higher followers + active + engaged = higher score

   b) Website Verification (25 pts):
      - If website provided, fetch it to verify it exists
      - Check for SSL (https), real domain, professional appearance
      - Look for contact page, about page
      - No website = partial score (not disqualifying)

   c) Collaboration History (25 pts):
      - Search for past creator collaborations
      - Look for: #ad mentions, ambassador programs, creator testimonials
      - More evidence of real creator relationships = higher score

   d) Scam Indicators (25 pts inverse):
      - Start at 25, subtract for each red flag found
      - Check for: dropshipping, MLM, pay-to-collab, fake followers, pressure tactics

   getTrustLevel thresholds:
   - 80+: "verified"
   - 60-79: "likely_legit"
   - 40-59: "caution"
   - 0-39: "high_risk"

2. `src/app/api/vet-brand/route.ts`:
   - POST endpoint
   - Auth required
   - Accept BrandVettingInput
   - Implement simple caching: same brand name + same day = return cached result
   - Return BrandVettingResult

3. `tests/lib/brand-vetter.test.ts`:
   - Test with well-known brand (mock high trust signals)
   - Test with suspicious brand (mock red flags)
   - Test with minimal input (just brand name)
   - Test trust level thresholds
   - Test each category scoring
   - Mock LLM and fetch responses

Use the same LLM pattern as dm-parser.ts (Groq primary, Gemini fallback).

For web fetching, use the existing fetch or a simple HEAD request to check if website exists.

Run pnpm test and pnpm build when complete. Show me results.
```

---

### Prompt 5: Brand Vetter UI & Integration

```
Create the Brand Vetter UI and integrate with the Message Analyzer.

Read IMPLEMENTATION_PLAN_V3.md Feature 4 (Brand Vetter) for the design reference.

**Create these files:**

1. `src/app/(dashboard)/tools/brand-vetter/page.tsx`:
   - Dashboard page at /tools/brand-vetter
   - Title: "Brand Vetter"
   - Description: "Check if a brand is legitimate before you engage. We'll research their social presence, website, and collaboration history."

2. `src/components/forms/brand-vetter-form.tsx`:
   - Brand name input (required)
   - Brand handle input (optional, with @ prefix helper text)
   - Brand website input (optional, with https:// prefix helper)
   - Brand email input (optional, for email outreach)
   - Platform dropdown (where did they reach out)
   - "Check Brand" button
   - Loading state showing steps: "Checking social presence...", "Verifying website...", "Searching for collaborations...", "Scanning for red flags..."

3. `src/components/brand-vetting-result.tsx`:
   - Trust Score gauge (0-100) with colors:
     - 80+: Green with "Verified" badge
     - 60-79: Blue with "Likely Legit" badge
     - 40-59: Yellow with "Proceed with Caution" badge
     - <40: Red with "High Risk" badge
   - Four category cards in responsive grid:
     - Social Presence (X/25)
     - Website (X/25)
     - Creator Collabs (X/25)
     - Scam Check (X/25)
   - Each card expandable to show details
   - Findings list with sentiment icons (✓ positive, ○ neutral, ✗ negative)
   - Red Flags section (if any) - prominent red styling
   - Recommendations section
   - Data sources note (e.g., "Checked on Jan 22, 2026")
   - "Vet Another Brand" reset button

4. **Update Message Analyzer integration:**

   In `src/components/forms/message-analyzer-form.tsx` (or dm-parser result component):
   - After analysis completes and brand is detected
   - Add "Vet This Brand" button
   - When clicked, either:
     a) Navigate to /tools/brand-vetter?brand={brandName}&handle={brandHandle}&platform={platform}
     b) OR open the brand vetter inline/modal
   - Pre-fill the brand vetter form with detected info

5. **Update navigation:**
   - Add /tools/brand-vetter to dashboard sidebar/nav if not already
   - Add /tools/contract-scanner to dashboard sidebar/nav if not already
   - Ensure tools section is visible and accessible

Run the dev server and manually verify:
1. Navigate to /tools/brand-vetter directly
2. Enter a real brand and verify results display
3. Go to Message Analyzer, paste a DM with brand mention
4. Click "Vet This Brand" and verify pre-fill works

Show me confirmation that the UI works and integration is complete.
```

---

### Prompt 6: Testing & Polish

```
Run comprehensive tests and polish all four new features.

**1. Run all tests:**
```bash
pnpm test
```
Fix any failing tests.

**2. Run build and lint:**
```bash
pnpm build && pnpm lint
```
Fix any type errors or lint issues.

**3. Integration Testing - verify these flows:**

FLOW 1: Quick Calculator
- Go to /quick-calculate (no login required)
- Enter: 50,000 followers, Instagram, Reel, Beauty niche
- Expected: Rate range ~$500-$700, shows "Micro tier"
- Verify: CTA button links to signup
- Test at 375px mobile viewport

FLOW 2: Contract Scanner
- Login, go to /tools/contract-scanner
- Paste this BAD contract:
  "Payment: $500. Payment Terms: Net-60. Usage Rights: Perpetual, worldwide, all media. Exclusivity: 12 months full category. Revisions: Unlimited."
- Expected: Low health score (<50), red flags for perpetual rights + unlimited revisions
- Verify: Missing clauses identified (kill fee, revision cap)
- Verify: Change request template generated
- Test with a GOOD contract too (should score 80+)

FLOW 3: Message Analyzer (DM)
- Login, go to Message Analyzer
- Paste Instagram DM: "Hey! We love your content! We'd love to send you our new skincare line to feature 💕"
- Expected: Detected as Instagram DM, gift offer detected, brand identified
- Verify: "Vet This Brand" button appears

FLOW 4: Message Analyzer (Email)
- Paste formal email:
  "Subject: Partnership Opportunity

   Dear [Creator],

   I'm reaching out from GlowSkin Beauty regarding a potential paid collaboration.

   We have a budget of $800 for an Instagram Reel featuring our new serum.

   Best regards,
   Sarah
   Partnerships Manager
   sarah@glowskin.com"
- Expected: Detected as Email, paid opportunity, $800 amount extracted
- Verify: Source shows "Email" not "DM"

FLOW 5: Brand Vetter Standalone
- Go to /tools/brand-vetter
- Test with known brand: "Nike", "@nike", "nike.com"
- Expected: High trust score (80+), "Verified" level
- Test with fake brand: "TotallyFakeScamBrand123"
- Expected: Low trust score, red flags

FLOW 6: Message Analyzer → Brand Vetter Flow
- Paste DM with brand: "Hi! I'm from GlowSkin Beauty (@glowskinbeauty). Love your content!"
- Click "Vet This Brand"
- Verify: Brand vetter pre-fills with GlowSkin Beauty, @glowskinbeauty

**4. Mobile responsiveness (375px viewport):**
- Test /quick-calculate
- Test /tools/contract-scanner
- Test /tools/brand-vetter
- Test Message Analyzer
Fix any layout issues.

**5. Cleanup:**
- Remove console.logs
- Verify all loading states work
- Verify error handling (network errors, invalid inputs)
- Check for TypeScript any types that should be specific

**6. Update CLAUDE.md:**
- Add Quick Calculator to API routes section
- Add Contract Scanner to API routes section
- Add Brand Vetter to API routes section
- Update DM Parser section to mention it's now Message Analyzer (handles DM + Email)

Show me:
1. Test results (pnpm test output)
2. Build status (pnpm build)
3. Summary of any fixes made
4. Confirmation all 6 flows work
```

---

## Command Sequence

### Morning Session

```
STEP 1: /clear
```

```
STEP 2: Analyze current state
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 0 exactly as written. Analyze the current codebase state and report back.
```

```
STEP 3: Implement Quick Calculator
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 1 (Quick Calculator) exactly as written. Follow all requirements including tests.
```

```
STEP 4: Commit
```
```bash
git add -A && git commit -m "feat: add quick calculator for landing page conversion"
```

```
STEP 5: /clear
```

```
STEP 6: Implement Contract Scanner
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 2 (Contract Scanner) exactly as written. Follow all requirements including tests.
```

```
STEP 7: Commit
```
```bash
git add -A && git commit -m "feat: add contract scanner with LLM analysis"
```

```
STEP 8: /clear
```

---

### Midday Session

```
STEP 9: Refactor to Message Analyzer
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 3 (Brand Message Analyzer) exactly as written. Refactor DM Parser to unified Message Analyzer.
```

```
STEP 10: Commit
```
```bash
git add -A && git commit -m "refactor: unify DM parser into Brand Message Analyzer with email support"
```

```
STEP 11: /clear
```

```
STEP 12: Implement Brand Vetter Core
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 4 (Brand Vetter Core) exactly as written. Follow all requirements including tests.
```

```
STEP 13: Commit
```
```bash
git add -A && git commit -m "feat: add brand vetter core with trust scoring"
```

```
STEP 14: /clear
```

---

### Afternoon Session

```
STEP 15: Implement Brand Vetter UI & Integration
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 5 (Brand Vetter UI & Integration) exactly as written. Create UI and integrate with Message Analyzer.
```

```
STEP 16: Commit
```
```bash
git add -A && git commit -m "feat: add brand vetter UI and message analyzer integration"
```

```
STEP 17: /clear
```

```
STEP 18: Testing & Polish
```
```
Read IMPLEMENTATION_PLAN_V3.md and implement Prompt 6 (Testing & Polish) exactly as written. Run all tests and verify all flows.
```

```
STEP 19: Commit
```
```bash
git add -A && git commit -m "test: comprehensive testing and polish for V3 features"
```

```
STEP 20: Push
```
```bash
git push -u origin main
```

---

## Quick Reference

| Step | Action | Time Est. |
|------|--------|-----------|
| 1-2 | Setup & Analyze | 10 min |
| 3-4 | Quick Calculator | 30 min |
| 5-7 | Contract Scanner | 1.5 hrs |
| 8-10 | Message Analyzer Refactor | 1 hr |
| 11-13 | Brand Vetter Core | 1.5 hrs |
| 14-16 | Brand Vetter UI | 1 hr |
| 17-19 | Testing & Polish | 1 hr |
| 20 | Push | 1 min |

**Total: ~6.5 hours (1 day)**

---

## Success Criteria

After completing all prompts:

✅ `/quick-calculate` works without login, shows rate range
✅ `/tools/contract-scanner` analyzes contracts, flags issues
✅ Message Analyzer handles both DMs AND emails
✅ `/tools/brand-vetter` researches brand legitimacy
✅ "Vet This Brand" button appears after message analysis
✅ All tests pass
✅ Mobile responsive
✅ CLAUDE.md updated
