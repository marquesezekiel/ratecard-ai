# IMPLEMENTATION_PLAN.md

This file contains the complete implementation plan for RateCard.AI. Each prompt is designed to be executed sequentially using Claude Code.

## How to Use This File

In your terminal with Claude Code, reference prompts like this:
```bash
# Execute a specific prompt
claude "Implement PHASE-1-PROMPT-01 from IMPLEMENTATION_PLAN.md"

# Or reference the section directly
claude "Follow the instructions in IMPLEMENTATION_PLAN.md for PHASE-2-PROMPT-05"

# Check progress
claude "Review IMPLEMENTATION_PLAN.md and tell me which prompts are complete based on the current codebase"
```

---

## Progress Tracker

| Phase | Status | Prompts | Description |
|-------|--------|---------|-------------|
| Phase 1 | ⬜ Not Started | 01-04 | Project Structure & Types |
| Phase 2 | ⬜ Not Started | 05-09 | Authentication |
| Phase 3 | ⬜ Not Started | 10-13 | Core Business Logic |
| Phase 4 | ⬜ Not Started | 14-17 | API Routes |
| Phase 5 | ⬜ Not Started | 18-23 | UI Components & Pages |
| Phase 6 | ⬜ Not Started | 24-26 | Landing Page & Deployment |

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

# PHASE 1: Project Structure & Types (1 hour)

## PHASE-1-PROMPT-01: Project Structure

**Goal:** Create the folder structure for the entire application.

**Prerequisites:** 
- Next.js project initialized with `pnpm create next-app`
- shadcn initialized with `pnpm dlx shadcn@latest init`

**Instructions:**

Create the following folder structure. Create placeholder files with basic exports for each:
```
src/
├── app/
│   ├── page.tsx                    # Home/landing
│   ├── layout.tsx                  # Root layout (update existing)
│   ├── globals.css                 # Already exists from shadcn
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Dashboard home
│   │   ├── profile/page.tsx        # Creator profile form
│   │   ├── upload/page.tsx         # Brief upload
│   │   ├── generate/page.tsx       # Rate card generation
│   │   └── history/page.tsx        # Past rate cards
│   └── api/
│       ├── auth/[...all]/route.ts  # Better Auth handler
│       ├── parse-brief/route.ts
│       ├── calculate/route.ts
│       └── generate-pdf/route.ts
├── components/
│   ├── ui/                         # shadcn components (exists)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── forms/
│   │   ├── profile-form.tsx
│   │   └── brief-uploader.tsx
│   └── rate-card/
│       ├── fit-score-display.tsx
│       ├── pricing-breakdown.tsx
│       └── rate-card-preview.tsx
├── lib/
│   ├── auth.ts                     # Better Auth config
│   ├── auth-client.ts              # Better Auth client
│   ├── db.ts                       # Prisma client
│   ├── llm.ts                      # Groq/Gemini client
│   ├── pricing-engine.ts           # 6-layer pricing
│   ├── fit-score.ts                # Fit score calculator
│   ├── brief-parser.ts             # PDF/DOCX parsing
│   ├── pdf-generator.tsx           # React-PDF templates
│   └── types.ts                    # TypeScript types
├── hooks/
│   └── use-auth.ts                 # Auth state hook
└── prisma/
    └── schema.prisma               # Database schema
```

For placeholder files, use:
- Page components: `export default function PageName() { return <div>PageName</div> }`
- Lib files: `// TODO: Implement` with appropriate empty exports
- Components: Basic functional component skeleton

**Validation:** Run `pnpm build` - should complete without errors (warnings OK).

---

## PHASE-1-PROMPT-02: TypeScript Types

**Goal:** Define all TypeScript interfaces for the application.

**File:** `src/lib/types.ts`

**Instructions:**

Create comprehensive TypeScript types:
```typescript
// Platform metrics for each social network
export interface PlatformMetrics {
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgViews: number;
}

// Audience demographics
export interface AudienceDemographics {
  ageRange: string;  // "18-24", "25-34", etc.
  genderSplit: {
    male: number;
    female: number;
    other: number;
  };
  topLocations: string[];
  interests: string[];
}

// Creator profile
export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  niches: string[];
  instagram?: PlatformMetrics;
  tiktok?: PlatformMetrics;
  youtube?: PlatformMetrics;
  twitter?: PlatformMetrics;
  audience: AudienceDemographics;
  tier: "nano" | "micro" | "mid" | "macro";
  totalReach: number;
  avgEngagementRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Parsed brand brief
export interface ParsedBrief {
  id?: string;
  brand: {
    name: string;
    industry: string;
    product: string;
  };
  campaign: {
    objective: string;
    targetAudience: string;
    budgetRange: string;
  };
  content: {
    platform: "instagram" | "tiktok" | "youtube" | "twitter";
    format: "static" | "carousel" | "story" | "reel" | "video" | "live" | "ugc";
    quantity: number;
    creativeDirection: string;
  };
  usageRights: {
    durationDays: number;
    exclusivity: "none" | "category" | "full";
    paidAmplification: boolean;
  };
  timeline: {
    deadline: string;
  };
  rawText: string;
}

// Fit score result
export interface FitScoreResult {
  totalScore: number;
  fitLevel: "perfect" | "high" | "medium" | "low";
  priceAdjustment: number;
  breakdown: {
    nicheMatch: { score: number; weight: number; insight: string };
    demographicMatch: { score: number; weight: number; insight: string };
    platformMatch: { score: number; weight: number; insight: string };
    engagementQuality: { score: number; weight: number; insight: string };
    contentCapability: { score: number; weight: number; insight: string };
  };
  insights: string[];
}

// Pricing layer
export interface PricingLayer {
  name: string;
  description: string;
  baseValue: number | string;
  multiplier: number;
  adjustment: number;
}

// Final pricing result
export interface PricingResult {
  pricePerDeliverable: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  validDays: number;
  layers: PricingLayer[];
  formula: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Rate card (database model)
export interface RateCard {
  id: string;
  creatorId: string;
  briefId?: string;
  brandName: string;
  campaignName?: string;
  fitScore: number;
  fitLevel: string;
  pricePerDeliverable: number;
  quantity: number;
  totalPrice: number;
  pdfUrl?: string;
  createdAt: Date;
  expiresAt: Date;
}
```

Add JSDoc comments explaining each interface.

**Validation:** `pnpm tsc --noEmit` should pass.

---

## PHASE-1-PROMPT-03: Prisma Schema

**Goal:** Create the database schema.

**File:** `prisma/schema.prisma`

**Prerequisites:** None (file may need to be created)

**Instructions:**

Create PostgreSQL schema compatible with Better Auth:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth required models
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  accounts      Account[]
  profile       CreatorProfile?
  briefs        Brief[]
  rateCards     RateCard[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([identifier, value])
}

// App-specific models
model CreatorProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  displayName       String
  handle            String
  bio               String?
  location          String?
  niches            String[]
  instagram         Json?
  tiktok            Json?
  youtube           Json?
  twitter           Json?
  audience          Json?
  tier              String   @default("nano")
  totalReach        Int      @default(0)
  avgEngagementRate Float    @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model Brief {
  id               String     @id @default(cuid())
  userId           String
  originalFilename String?
  rawText          String
  parsedData       Json
  status           String     @default("parsed")
  createdAt        DateTime   @default(now())
  user             User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  rateCards        RateCard[]
  
  @@index([userId])
  @@index([createdAt])
}

model RateCard {
  id                  String   @id @default(cuid())
  userId              String
  briefId             String?
  brandName           String
  campaignName        String?
  fitScore            Int
  fitLevel            String
  fitBreakdown        Json
  fitInsights         String[]
  pricePerDeliverable Int
  quantity            Int      @default(1)
  totalPrice          Int
  pricingBreakdown    Json
  pdfUrl              String?
  createdAt           DateTime @default(now())
  expiresAt           DateTime
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  brief               Brief?   @relation(fields: [briefId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}
```

**Validation:** 
1. Create `.env` with `DATABASE_URL`
2. Run `pnpm prisma generate`
3. Run `pnpm prisma db push`

---

## PHASE-1-PROMPT-04: Prisma Client & Environment

**Goal:** Set up Prisma client singleton and environment variables.

**Files:** 
- `src/lib/db.ts`
- `.env.example`

**Instructions:**

Create Prisma client singleton (`src/lib/db.ts`):
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

Create `.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ratecard?schema=public"

# Better Auth
BETTER_AUTH_SECRET="generate-a-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# LLM Providers
GROQ_API_KEY="your-groq-api-key"
GOOGLE_API_KEY="your-google-api-key"
```

Copy to `.env` and add real values. Add `.env` to `.gitignore` if not already there.

**Validation:** Import `db` in a test file and verify no errors.

---

# PHASE 2: Authentication (1 hour)

## PHASE-2-PROMPT-05: Better Auth Server Configuration

**Goal:** Configure Better Auth on the server.

**File:** `src/lib/auth.ts`

**Prerequisites:** 
- Run `pnpm add better-auth`
- Database set up from Phase 1

**Instructions:**
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simple for MVP
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

**Validation:** File should compile without errors.

---

## PHASE-2-PROMPT-06: Better Auth Client

**Goal:** Create client-side auth utilities.

**Files:**
- `src/lib/auth-client.ts`
- `src/hooks/use-auth.ts`

**Instructions:**

Auth client (`src/lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

Auth hook (`src/hooks/use-auth.ts`):
```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error } = useSession();
  
  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
  };
}
```

**Validation:** Imports should resolve correctly.

---

## PHASE-2-PROMPT-07: Auth API Route

**Goal:** Create the Better Auth API handler.

**File:** `src/app/api/auth/[...all]/route.ts`

**Instructions:**
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

**Validation:** Start dev server, navigate to `/api/auth/signin` - should not 404.

---

## PHASE-2-PROMPT-08: Auth Pages (Sign In / Sign Up)

**Goal:** Create authentication UI pages.

**Files:**
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/sign-up/page.tsx`

**Prerequisites:** 
- Run `pnpm dlx shadcn@latest add card button input label`

**Instructions:**

Create sign-in page with:
- Email input field
- Password input field
- Submit button with loading state
- Error display
- Link to sign-up page
- On success, redirect to `/dashboard`

Create sign-up page with:
- Display name field
- Email field
- Password field
- Confirm password field (client-side validation)
- Submit button with loading state
- Error display
- Link to sign-in page
- On success, redirect to `/dashboard/profile`

Use shadcn Card component for layout. Keep forms simple and mobile-friendly.

Style notes:
- Center card on page with `min-h-screen flex items-center justify-center`
- Max width `max-w-md`
- Use `space-y-4` for form field spacing

**Validation:** 
1. Navigate to `/sign-in` and `/sign-up`
2. Attempt sign-up with test credentials
3. Verify redirect works after auth

---

## PHASE-2-PROMPT-09: Auth Middleware

**Goal:** Protect dashboard routes from unauthenticated access.

**File:** `src/middleware.ts`

**Instructions:**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || 
                     request.nextUrl.pathname.startsWith("/sign-up");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect authenticated users away from auth pages
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign-in
  if (isDashboard && !sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
```

**Validation:**
1. Sign out
2. Try to access `/dashboard` - should redirect to `/sign-in`
3. Sign in
4. Try to access `/sign-in` - should redirect to `/dashboard`

---

# PHASE 3: Core Business Logic (1.5 hours)

## PHASE-3-PROMPT-10: Pricing Engine

**Goal:** Implement the 6-Layer Pricing Engine.

**File:** `src/lib/pricing-engine.ts`

**Instructions:**

Implement the complete pricing engine with these specifications:

**Layer 1 - Base Rates:**
```typescript
const BASE_RATES = {
  nano: 100,    // 1K-10K followers
  micro: 250,   // 10K-50K followers
  mid: 750,     // 50K-500K followers
  macro: 2500,  // 500K+ followers
};
```

**Layer 2 - Engagement Multipliers:**
```typescript
// <1%: 0.8x, 1-3%: 1.0x, 3-5%: 1.3x, 5-8%: 1.6x, 8%+: 2.0x
```

**Layer 3 - Format Premiums:**
```typescript
const FORMAT_PREMIUMS = {
  static: 0,
  carousel: 0.15,
  story: -0.15,
  reel: 0.25,
  video: 0.35,
  live: 0.40,
  ugc: -0.25,
};
```

**Layer 4 - Fit Score Adjustment:**
- Perfect (85-100): +25%
- High (65-84): +15%
- Medium (40-64): 0%
- Low (0-39): -10%

**Layer 5 - Usage Rights:**
- Duration: 0 days (0%), 30 (+25%), 60 (+35%), 90 (+45%), 180 (+60%), 365 (+80%), perpetual (+100%)
- Exclusivity: none (0%), category (+30%), full (+50%)

**Layer 6 - Complexity:**
- simple (0%), standard (+15%), complex (+30%), production (+50%)

**Formula:** `(Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)`

Round final price to nearest $5.

Export:
- `calculatePrice(profile, brief, fitScore): PricingResult`
- `calculateTier(followers): "nano" | "micro" | "mid" | "macro"`

Include the `PricingLayer` array in results for transparency.

**Validation:** Write a test case:
- Micro tier (25K followers)
- 4% engagement
- Instagram Reel
- High fit (75%)
- 90-day usage rights
- Standard complexity

Expected result: ~$780 (verify calculation matches formula).

---

## PHASE-3-PROMPT-11: Fit Score Calculator

**Goal:** Implement the 5-component weighted fit score.

**File:** `src/lib/fit-score.ts`

**Instructions:**

Implement with these weights:
1. **Niche Match (30%)** - Map industries to relevant niches
2. **Demographic Match (25%)** - Compare audience age/gender/location
3. **Platform Match (20%)** - Check if target platform is creator's strength
4. **Engagement Quality (15%)** - Compare to tier benchmarks
5. **Content Capability (10%)** - Assess format production ability

**Industry-Niche Mapping:**
```typescript
const INDUSTRY_NICHES = {
  fashion: ["fashion", "style", "clothing", "beauty", "lifestyle", "luxury"],
  fitness: ["fitness", "health", "wellness", "sports", "gym", "nutrition"],
  technology: ["tech", "gaming", "gadgets", "software", "apps", "ai"],
  food: ["food", "cooking", "recipes", "restaurants", "foodie", "chef"],
  travel: ["travel", "adventure", "destinations", "hotels", "wanderlust"],
  beauty: ["beauty", "makeup", "skincare", "cosmetics", "hair", "nails"],
  finance: ["finance", "investing", "money", "business", "crypto", "stocks"],
  education: ["education", "learning", "tutorials", "courses", "teaching"],
  entertainment: ["entertainment", "movies", "music", "celebrity", "pop culture"],
  parenting: ["parenting", "family", "kids", "motherhood", "fatherhood"],
  automotive: ["automotive", "cars", "vehicles", "racing", "motorcycles"],
  gaming: ["gaming", "esports", "games", "streaming", "twitch"],
  home: ["home", "decor", "diy", "interior", "garden", "renovation"],
  pets: ["pets", "dogs", "cats", "animals", "pet care"],
};
```

**Engagement Benchmarks by Tier:**
```typescript
const BENCHMARKS = { nano: 5.0, micro: 3.5, mid: 2.5, macro: 1.5 };
```

**Fit Levels:**
- 85-100: "perfect" (+25% price adjustment)
- 65-84: "high" (+15%)
- 40-64: "medium" (0%)
- 0-39: "low" (-10%)

Export: `calculateFitScore(profile, brief): FitScoreResult`

Each component should return a score (0-100) and an insight string explaining the result.

**Validation:** Test with a fashion brand + lifestyle creator - should get high niche match score.

---

## PHASE-3-PROMPT-12: LLM Client

**Goal:** Create LLM client with Groq primary and Gemini fallback.

**File:** `src/lib/llm.ts`

**Prerequisites:**
- Run `pnpm add groq-sdk @google/generative-ai`

**Instructions:**

Create a brief parsing function that:
1. Takes raw text from a brand brief
2. Uses Groq (llama-3.1-70b-versatile) as primary
3. Falls back to Gemini (gemini-1.5-flash) on error
4. Returns structured data matching `ParsedBrief` type

Use this system prompt:
```
You are an expert at parsing brand campaign briefs. Extract structured information from the following brief text.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "brand": { "name": "", "industry": "", "product": "" },
  "campaign": { "objective": "", "targetAudience": "", "budgetRange": "" },
  "content": { "platform": "", "format": "", "quantity": 1, "creativeDirection": "" },
  "usageRights": { "durationDays": 0, "exclusivity": "none", "paidAmplification": false },
  "timeline": { "deadline": "" }
}
```

Configuration:
- Temperature: 0.1 (for consistency)
- Use JSON mode for both providers
- Implement retry logic with exponential backoff

Export: `parseBriefWithLLM(text: string): Promise<Omit<ParsedBrief, "id" | "rawText">>`

**Validation:** Test with sample brief text, verify JSON output parses correctly.

---

## PHASE-3-PROMPT-13: Brief Parser (File Extraction)

**Goal:** Extract text from PDF, DOCX, and TXT files.

**File:** `src/lib/brief-parser.ts`

**Prerequisites:**
- Run `pnpm add pdf-parse mammoth`
- Run `pnpm add -D @types/pdf-parse`

**Instructions:**

Create functions:

1. `extractTextFromFile(buffer: Buffer, filename: string): Promise<string>`
   - Detect file type by extension
   - PDF: Use pdf-parse
   - DOCX: Use mammoth
   - TXT: Direct UTF-8 decode

2. `parseBrief(buffer: Buffer, filename: string): Promise<Omit<ParsedBrief, "id">>`
   - Extract text from file
   - Validate text length (min 50 chars)
   - Parse with LLM
   - Return combined result with rawText

3. `parseBriefFromText(text: string): Promise<Omit<ParsedBrief, "id">>`
   - For pasted text (no file)
   - Validate text length
   - Parse with LLM
   - Return with rawText

Handle errors gracefully with descriptive messages.

**Validation:** Test with a sample PDF brand brief.

---

# PHASE 4: API Routes (45 minutes)

## PHASE-4-PROMPT-14: Parse Brief API

**Goal:** Create endpoint for brief parsing.

**File:** `src/app/api/parse-brief/route.ts`

**Instructions:**

Create POST handler that:
1. Verifies authentication (return 401 if not authenticated)
2. Accepts either:
   - `multipart/form-data` with file upload
   - JSON body with `{ text: string }`
3. Calls appropriate parser function
4. Returns `ApiResponse<ParsedBrief>` shape

Use Better Auth's `auth.api.getSession()` with headers for auth check.

Error handling:
- 400 for missing file/text
- 401 for unauthenticated
- 500 for parsing errors

**Validation:** Test with Postman or curl:
```bash
curl -X POST http://localhost:3000/api/parse-brief \
  -H "Content-Type: application/json" \
  -d '{"text": "Brand brief text here..."}'
```

---

## PHASE-4-PROMPT-15: Calculate API

**Goal:** Create endpoint for fit score + pricing calculation.

**File:** `src/app/api/calculate/route.ts`

**Instructions:**

Create POST handler that:
1. Verifies authentication
2. Accepts JSON body with `{ profile: CreatorProfile, brief: ParsedBrief }`
3. Calculates fit score
4. Calculates pricing using fit score
5. Returns both results

Response shape:
```typescript
{
  success: true,
  data: {
    fitScore: FitScoreResult,
    pricing: PricingResult
  }
}
```

**Validation:** Test with sample profile and brief data.

---

## PHASE-4-PROMPT-16: Generate PDF API

**Goal:** Create endpoint for PDF generation.

**File:** `src/app/api/generate-pdf/route.ts`

**Prerequisites:**
- Run `pnpm add @react-pdf/renderer`

**Instructions:**

Create POST handler that:
1. Verifies authentication
2. Accepts JSON body with `{ profile, brief, fitScore, pricing }`
3. Generates PDF using React-PDF (from `pdf-generator.tsx`)
4. Returns PDF as downloadable file

Response headers:
```typescript
{
  "Content-Type": "application/pdf",
  "Content-Disposition": `attachment; filename="ratecard-${handle}-${timestamp}.pdf"`
}
```

Use `renderToBuffer()` from `@react-pdf/renderer`.

**Validation:** Test endpoint and verify PDF downloads correctly.

---

## PHASE-4-PROMPT-17: PDF Generator Component

**Goal:** Create React-PDF document template.

**File:** `src/lib/pdf-generator.tsx`

**Instructions:**

Create a professional PDF rate card with these sections:

1. **Header**
   - Creator name (24pt, bold)
   - Handle (@username)
   - Horizontal divider line

2. **Creator Profile Section**
   - Tier badge
   - Total reach
   - Engagement rate
   - Niches (comma-separated)

3. **Campaign Section**
   - Brand name
   - Platform + format
   - Quantity

4. **Fit Score Section**
   - Large circular score display
   - Fit level badge (color-coded)
   - Top 3 insights as bullet points

5. **Pricing Breakdown**
   - Table with all 6 layers
   - Each row: Layer name, description, adjustment %
   - Subtotal line

6. **Total Price Box**
   - Prominent colored background
   - Price per deliverable × quantity
   - Total in large font
   - Currency and validity period

7. **Footer**
   - "Generated by RateCard.AI"
   - Expiry date
   - Formula reference

Color scheme:
```typescript
const colors = {
  primary: "#3B82F6",
  secondary: "#1E40AF",
  success: "#10B981",  // Perfect fit
  warning: "#F59E0B",  // Medium fit
  danger: "#EF4444",   // Low fit
};
```

Export: `RateCardDocument({ profile, brief, fitScore, pricing })`

**Validation:** Generate a test PDF and review layout.

---

# PHASE 5: UI Components & Pages (2 hours)

## PHASE-5-PROMPT-18: Add shadcn Components

**Goal:** Install all required UI components.

**Instructions:**

Run the following command:
```bash
pnpm dlx shadcn@latest add button card input label form select textarea tabs badge progress separator avatar dropdown-menu sheet toast
```

Also install:
```bash
pnpm add react-dropzone react-hook-form @hookform/resolvers zod lucide-react
```

**Validation:** All imports should resolve without errors.

---

## PHASE-5-PROMPT-19: Dashboard Layout

**Goal:** Create the dashboard shell with responsive sidebar.

**File:** `src/app/dashboard/layout.tsx`

**Instructions:**

Create a dashboard layout with:

1. **Desktop Sidebar (hidden on mobile)**
   - Logo + tagline at top
   - Navigation links with icons:
     - Home (dashboard)
     - Profile
     - Upload Brief
     - Generate
     - History
   - Active state styling
   - User menu at bottom with sign out

2. **Mobile Header**
   - Hamburger menu (Sheet component)
   - Logo centered
   - User avatar with dropdown

3. **Main Content Area**
   - Responsive padding
   - Max width constraint
   - Background color differentiation

Use these icons from lucide-react:
- Home, User, Upload, FileText, History, Menu, LogOut

Navigation items:
```typescript
const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/upload", label: "Upload Brief", icon: Upload },
  { href: "/dashboard/generate", label: "Generate", icon: FileText },
  { href: "/dashboard/history", label: "History", icon: History },
];
```

Include loading state while checking auth.

**Validation:** Test responsive behavior at mobile and desktop widths.

---

## PHASE-5-PROMPT-20: Profile Form Component

**Goal:** Create the multi-step creator profile form.

**File:** `src/components/forms/profile-form.tsx`

**Instructions:**

Create a form with three sections (use Card components):

**Section 1: Basic Info**
- Display name (required)
- Primary handle (required)
- Bio (optional, textarea)
- Location (select dropdown with countries)
- Niches (multi-select badges, max 5)

**Section 2: Platform Metrics (Tabs)**
- Tab for each platform: Instagram, TikTok, YouTube, Twitter
- Each tab has:
  - Followers (number)
  - Engagement rate % (number, step 0.1)
  - Avg likes (number)
  - Avg comments (number)
  - Avg views (number, for video platforms)

**Section 3: Audience Demographics**
- Primary age range (select)
- Gender split (three number inputs: male %, female %, other %)
- Top locations (could simplify to just primary location for MVP)

On submit:
- Calculate tier from total followers
- Calculate average engagement rate
- Save to localStorage (for MVP) or call API
- Redirect to upload page

Use Zod for validation.

**Validation:** Fill out form completely and verify data saves correctly.

---

## PHASE-5-PROMPT-21: Brief Uploader Component

**Goal:** Create drag-and-drop file upload with paste option.

**File:** `src/components/forms/brief-uploader.tsx`

**Instructions:**

Create uploader with two tabs:

**Tab 1: Upload File**
- Dropzone area (react-dropzone)
- Accept: .pdf, .docx, .txt
- Visual feedback for drag state
- Loading spinner during parsing
- File name display after selection

**Tab 2: Paste Text**
- Large textarea
- Character count
- Parse button

After successful parse:
- Display parsed data in collapsible sections
- Show: Brand name, industry, platform, format, quantity
- Allow user to proceed to generate

Error states:
- File type not supported
- Parsing failed
- Text too short

**Validation:** Test with PDF upload and text paste.

---

## PHASE-5-PROMPT-21B: Profile Form - Smart Defaults

**Goal:** Reduce form friction by calculating estimated metrics from just followers + engagement rate.

**File:** `src/components/forms/profile-form.tsx` (modify existing)

**Why This Matters:**
Creators check their follower count and engagement rate constantly—they know these numbers by heart. But avg likes, avg comments, and avg views? They'd have to go calculate those. We can do that math for them.

**Instructions:**

Modify the `PlatformMetricsForm` component to implement "Smart Defaults":

**New Behavior:**
1. User enters only TWO required fields per platform:
   - Followers (required)
   - Engagement Rate % (required)

2. System auto-calculates the rest using industry benchmarks:
```typescript
   // Calculations based on engagement rate
   const estimatedLikes = Math.round(followers * (engagementRate / 100));
   const estimatedComments = Math.round(estimatedLikes / 25); // ~4% of likes are comments
   const estimatedViews = Math.round(followers * 1.5); // Avg views ~150% of followers for video
```

3. Show calculated values as **pre-filled but editable** fields:
   - Display with subtle styling indicating "estimated"
   - Add small text: "Estimated • Edit if you know your exact numbers"
   - If user edits, remove the "estimated" indicator

**UI Changes:**
```tsx
// Before: 5 required fields
Followers: [____]
Engagement Rate: [____]
Avg Likes: [____]
Avg Comments: [____]  
Avg Views: [____]

// After: 2 required + 3 auto-calculated
Followers: [____] *required
Engagement Rate: [____] *required

── Estimated Metrics (edit if needed) ──
Avg Likes: [1,050] 📊 estimated
Avg Comments: [42] 📊 estimated
Avg Views: [37,500] 📊 estimated
```

**Implementation Details:**

1. Add state to track which fields are estimated vs manually entered:
```typescript
   const [estimatedFields, setEstimatedFields] = useState<Set<string>>(
     new Set(['avgLikes', 'avgComments', 'avgViews'])
   );
```

2. Add `useEffect` to recalculate when followers or engagement changes:
```typescript
   useEffect(() => {
     if (metrics.followers > 0 && metrics.engagementRate > 0) {
       const newMetrics = { ...metrics };
       
       if (estimatedFields.has('avgLikes')) {
         newMetrics.avgLikes = Math.round(metrics.followers * (metrics.engagementRate / 100));
       }
       if (estimatedFields.has('avgComments')) {
         newMetrics.avgComments = Math.round(newMetrics.avgLikes / 25);
       }
       if (estimatedFields.has('avgViews')) {
         newMetrics.avgViews = Math.round(metrics.followers * 1.5);
       }
       
       setMetrics(newMetrics);
       onChange(newMetrics);
     }
   }, [metrics.followers, metrics.engagementRate]);
```

3. When user manually edits an estimated field, remove it from `estimatedFields` set

4. Style estimated fields differently:
   - Slightly muted text color
   - Small "📊 estimated" badge or text
   - Remove indicator once manually edited

**Validation Rules:**
- Followers: required, min 100
- Engagement Rate: required, min 0.1, max 100
- Other fields: optional (will use estimates if blank)

**Copy/Microcopy:**
- Section header: "We'll estimate the rest" or "Estimated from your engagement"
- Helper text: "These are calculated from industry averages. Edit if you know your exact numbers."
- Don't say "AI" or "machine learning" — it's just math

**What NOT to Do:**
- Don't hide the estimated fields entirely (transparency builds trust)
- Don't make estimated fields read-only (power users want control)
- Don't add tooltips explaining the math (keep it simple)
- Don't add a "recalculate" button (just recalc on input change)

**Testing:**
1. Enter 25,000 followers and 4.2% engagement
2. Verify: ~1,050 likes, ~42 comments, ~37,500 views appear
3. Manually edit likes to 1,200
4. Change followers to 30,000
5. Verify: likes stays at 1,200 (manual), comments recalculates, views recalculates

**Validation:** Form should feel faster—2 fields instead of 5 per platform.

---

## PHASE-5-PROMPT-22: Rate Card Display Components

**Goal:** Create fit score and pricing display components.

**Files:**
- `src/components/rate-card/fit-score-display.tsx`
- `src/components/rate-card/pricing-breakdown.tsx`

**Instructions:**

**Fit Score Display:**
- Large circular score indicator (color by fit level)
- Fit level badge
- Price adjustment indicator
- Progress bars for each of 5 components
- Component insights as small text

**Pricing Breakdown:**
- List of all 6 layers
- Each layer: name, description, adjustment percentage
- Color code positive (green) vs negative (red) adjustments
- Separator line
- Per-deliverable price
- Quantity multiplier
- Final total in prominent box
- Formula at bottom

Keep components simple, focused on data display.

**Validation:** Pass mock data and verify rendering.

---

# V1 Critical Features - Additional Prompts

> **Integration Guide:** These prompts address critical gaps that would cause user abandonment. They are inserted after PHASE-5-PROMPT-22 (Rate Card Display Components).

## Placement Overview

| Prompt | Insert After | Priority |
|--------|--------------|----------|
| PHASE-5-PROMPT-22B | PHASE-5-PROMPT-22 | ⚠️ High |
| PHASE-5-PROMPT-22C | PHASE-5-PROMPT-22B | Medium |
| PHASE-5-PROMPT-22D | PHASE-5-PROMPT-22C | 🚨 Critical |
| PHASE-5-PROMPT-22E | PHASE-5-PROMPT-22D | ⚠️ High |
| PHASE-5-PROMPT-23 | PHASE-5-PROMPT-22E | (Original) |
| PHASE-5-PROMPT-23B | PHASE-5-PROMPT-23 | 🚨 Critical |
| PHASE-5-PROMPT-23C | PHASE-5-PROMPT-23B | 🚨 Critical |
| PHASE-5-PROMPT-23D | PHASE-5-PROMPT-23C | ⚠️ High |
| PHASE-6-PROMPT-24 | PHASE-5-PROMPT-23D | (Original) |
| PHASE-6-PROMPT-24B | PHASE-6-PROMPT-24 | ⚠️ High |
| PHASE-6-PROMPT-25 | PHASE-6-PROMPT-24B | (Original) |
| PHASE-6-PROMPT-25B | PHASE-6-PROMPT-25 | Medium |
| PHASE-6-PROMPT-26 | PHASE-6-PROMPT-25B | (Original) |

---

## PHASE-5-PROMPT-22B: Trust Signals & Calculation Breakdown

**Goal:** Show creators exactly how their rate was calculated to build trust and help them defend their pricing to brands.

**Priority:** ⚠️ High  
**Effort:** 1 hour

**Why This Matters:**
Creator sees "$780" and thinks "Why should I trust this random number?" Without transparency, they won't use the rate card or won't feel confident defending the price.

**File to Modify:** `src/components/rate-card/pricing-breakdown.tsx`

**Instructions:**

Replace `src/components/rate-card/pricing-breakdown.tsx` with an enhanced version:
```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PricingResult } from "@/lib/types";

interface PricingBreakdownProps {
  pricing: PricingResult;
  showDetailedExplanation?: boolean;
}

function getAdjustmentIcon(adjustment: number) {
  if (adjustment > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (adjustment < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getAdjustmentColor(adjustment: number) {
  if (adjustment > 0) return "text-green-600";
  if (adjustment < 0) return "text-red-600";
  return "text-gray-500";
}

// Explanations for each pricing layer
const LAYER_EXPLANATIONS: Record<string, string> = {
  "Base Rate": "Starting rate based on your follower tier. Nano (1K-10K): $100, Micro (10K-50K): $250, Mid (50K-500K): $750, Macro (500K+): $2,500.",
  "Engagement Rate": "Higher engagement means your audience actually pays attention. Brands pay more for engaged audiences.",
  "Content Format": "Video content (Reels, TikToks) takes more effort than static posts. Complex formats command higher rates.",
  "Brand Fit": "When your audience matches the brand's target customer, your content performs better—justifying a premium.",
  "Usage Rights": "If the brand wants to use your content in their ads, that's worth significantly more than organic posting only.",
  "Complexity": "Productions requiring multiple locations, professional equipment, or extensive editing justify higher rates.",
};

export function PricingBreakdown({ pricing, showDetailedExplanation = true }: PricingBreakdownProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState(null);

  return (
    
      
        
          Pricing Breakdown
          {showDetailedExplanation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-muted-foreground"
            >
              
              {showExplanation ? "Hide" : "How we calculated this"}
            
          )}
        
      
      
        {/* Explanation Panel */}
        {showExplanation && (
          
            How RateCard.AI Calculates Your Rate
            
              We use a 6-layer pricing model based on industry benchmarks and real sponsorship data. 
              Each factor either increases or decreases your base rate.
            
            
              Formula: (Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)
            
          
        )}

        {/* Layers */}
        
          {pricing.layers.map((layer, index) => (
            
              <button
                className="w-full py-3 flex items-center justify-between hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                onClick={() => setExpandedLayer(expandedLayer === layer.name ? null : layer.name)}
              >
                
                  {getAdjustmentIcon(layer.adjustment)}
                  {layer.name}
                
                
                  
                    {layer.adjustment >= 0 ? "+" : ""}{layer.adjustment.toFixed(0)}%
                  
                  {showDetailedExplanation && (
                    expandedLayer === layer.name 
                      ? 
                      : 
                  )}
                
              
              
              {/* Expanded explanation */}
              {expandedLayer === layer.name && showDetailedExplanation && (
                
                  
                    {layer.description}
                    
                      {LAYER_EXPLANATIONS[layer.name]}
                    
                  
                
              )}
            
          ))}
        

        

        {/* Per-Deliverable Price */}
        
          Price per deliverable
          
            ${pricing.pricePerDeliverable.toLocaleString()}
          
        

        {pricing.quantity > 1 && (
          
            Quantity
            ×{pricing.quantity}
          
        )}

        

        {/* Total */}
        
          
            
              Your Rate
              
                ${pricing.totalPrice.toLocaleString()}
              
            
            
              {pricing.currency}
              Valid {pricing.validDays} days
            
          
        

        {/* Confidence note */}
        
          Based on industry benchmarks for creators in your tier with similar engagement.
          
          Your actual rate may vary based on relationship with brand and negotiation.
        
      
    
  );
}
```

**Validation:**
1. Generate a rate card
2. Click "How we calculated this" - see explanation panel
3. Click each layer - see expanded explanation
4. Verify creator understands why each factor affects price


## PHASE-5-PROMPT-22C: Currency Support

**Goal:** Allow creators to select their preferred currency for rate cards.

**Priority:** Medium  
**Effort:** 45 minutes

**Why This Matters:**
A creator in London doesn't want to send a rate card in USD. This is a simple change that makes the tool feel internationally aware without complex currency conversion.

**Files to Modify:**
- `src/lib/types.ts`
- `src/components/forms/profile-form.tsx`
- `src/lib/pricing-engine.ts`
- `src/lib/pdf-generator.tsx`

**Instructions:**

### Part 1: Add Currency to Types

Update `src/lib/types.ts`:
```typescript
// Add new type
export type CurrencyCode = "USD" | "GBP" | "EUR" | "CAD" | "AUD" | "BRL" | "INR" | "MXN";

export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
];

// Update CreatorProfile interface - add:
export interface CreatorProfile {
  // ... existing fields ...
  currency: CurrencyCode;
}

// Update PricingResult interface - add:
export interface PricingResult {
  // ... existing fields ...
  currencySymbol: string;
}
```

### Part 2: Add Currency Selector to Profile Form

In `src/components/forms/profile-form.tsx`, in the "Basic Information" card, add after Location:
```typescript
import { CURRENCIES, CurrencyCode } from "@/lib/types";

// In the form, add:

  Currency
  <Select
    value={form.watch("currency") || "USD"}
    onValueChange={(val) => form.setValue("currency", val as CurrencyCode)}
  >
    
      
    
    
      {CURRENCIES.map((currency) => (
        
          {currency.symbol} - {currency.name}
        
      ))}
    
  
  
    Your rate card will display prices in this currency
  

```

Also add `currency: "USD"` to the form's defaultValues.

### Part 3: Update Pricing Engine

In `src/lib/pricing-engine.ts`, update the `calculatePrice` function to include currency symbol:
```typescript
import { CURRENCIES } from "./types";

export function calculatePrice(
  profile: CreatorProfile,
  brief: ParsedBrief,
  fitScore: FitScoreResult
): PricingResult {
  // ... existing calculation logic ...

  const currencyInfo = CURRENCIES.find(c => c.code === profile.currency) || CURRENCIES[0];

  return {
    pricePerDeliverable,
    quantity,
    totalPrice: pricePerDeliverable * quantity,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    validDays: 14,
    layers,
    formula: "(Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)",
  };
}
```

### Part 4: Update All Currency Displays

Search for hardcoded "$" in these files and replace with `pricing.currencySymbol` or `{currencySymbol}`:
- `src/components/rate-card/pricing-breakdown.tsx`
- `src/components/rate-card/fit-score-display.tsx`
- `src/lib/pdf-generator.tsx`

**What NOT to Do:**
- Don't add currency conversion (way too complex for MVP)
- Don't adjust base rates by region (keep pricing logic simple)
- Don't add every world currency (8-10 major ones is enough)

**Validation:**
1. Set currency to GBP in profile
2. Generate rate card
3. Verify PDF shows "£780" not "$780"

---

## PHASE-5-PROMPT-22D: Editable Brief Review

**Goal:** Allow creators to review and correct LLM-parsed brief data before calculation.

**Priority:** 🚨 Critical  
**Effort:** 1.5 hours

**Why This Matters:**
LLMs hallucinate. They'll parse "30-day usage" as "90-day" sometimes. If the creator can't fix mistakes, they get wrong pricing, lose trust, and never return. This is a trust-critical feature.

**Files to Create:**
- `src/components/forms/brief-review-form.tsx`

**Files to Modify:**
- `src/app/dashboard/upload/page.tsx`

**Instructions:**

### Part 1: Create Brief Review Form Component

Create `src/components/forms/brief-review-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Edit2 } from "lucide-react";
import type { ParsedBrief } from "@/lib/types";

const INDUSTRIES = [
  "fashion", "fitness", "technology", "food", "travel", "beauty",
  "finance", "education", "entertainment", "parenting", "automotive",
  "gaming", "home", "pets", "other"
];

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter"];

const FORMATS = [
  { value: "static", label: "Static Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "video", label: "Video" },
  { value: "live", label: "Live Stream" },
  { value: "ugc", label: "UGC Only" },
];

const USAGE_DURATIONS = [
  { value: 0, label: "Organic only (no paid usage)" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
  { value: -1, label: "Perpetual / Forever" },
];

const EXCLUSIVITY_OPTIONS = [
  { value: "none", label: "No exclusivity" },
  { value: "category", label: "Category exclusivity" },
  { value: "full", label: "Full exclusivity" },
];

interface BriefReviewFormProps {
  initialBrief: Omit;
  onConfirm: (brief: Omit) => void;
  onReparse: () => void;
}

export function BriefReviewForm({ initialBrief, onConfirm, onReparse }: BriefReviewFormProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [hasEdits, setHasEdits] = useState(false);

  const updateField = (section: keyof ParsedBrief, field: string, value: any) => {
    setBrief(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
    setHasEdits(true);
  };

  return (
    
      {/* Header */}
      
        
          
            
            Brief Parsed Successfully
          
          
            Review the extracted details below. Click any field to edit if something looks wrong.
          
        
        {hasEdits && (
          
            Edited
          
        )}
      

      {/* AI Confidence Warning */}
      
        
        
          AI extraction isn't perfect
          
            Please double-check everything—especially usage rights and exclusivity, 
            as these significantly impact pricing.
          
        
      

      {/* Brand Section */}
      
        
          Brand Details
        
        
          
            
              Brand Name
              <Input
                id="brandName"
                value={brief.brand.name}
                onChange={(e) => updateField("brand", "name", e.target.value)}
                placeholder="e.g., Glossier"
              />
            
            
              Industry
              <Select
                value={brief.brand.industry.toLowerCase()}
                onValueChange={(val) => updateField("brand", "industry", val)}
              >
                
                  
                
                
                  {INDUSTRIES.map((industry) => (
                    
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    
                  ))}
                
              
            
          
        
      

      {/* Content Section */}
      
        
          Content Requirements
          What they're asking you to create
        
        
          
            
              Platform
              <Select
                value={brief.content.platform}
                onValueChange={(val) => updateField("content", "platform", val)}
              >
                
                  
                
                
                  {PLATFORMS.map((platform) => (
                    
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    
                  ))}
                
              
            
            
              Content Format
              <Select
                value={brief.content.format}
                onValueChange={(val) => updateField("content", "format", val)}
              >
                
                  
                
                
                  {FORMATS.map((format) => (
                    
                      {format.label}
                    
                  ))}
                
              
            
            
              Quantity
              <Input
                type="number"
                min={1}
                max={20}
                value={brief.content.quantity}
                onChange={(e) => updateField("content", "quantity", parseInt(e.target.value) || 1)}
              />
            
          
        
      

      {/* Usage Rights Section - CRITICAL */}
      
        
          
            Usage Rights
            
              High pricing impact
            
          
          
            These settings significantly affect your rate. Please verify carefully.
          
        
        
          
            
              Paid Usage Duration
              <Select
                value={brief.usageRights.durationDays.toString()}
                onValueChange={(val) => updateField("usageRights", "durationDays", parseInt(val))}
              >
                
                  
                
                
                  {USAGE_DURATIONS.map((duration) => (
                    
                      {duration.label}
                    
                  ))}
                
              
              
                How long can the brand use your content in paid ads?
              
            
            
              Exclusivity
              <Select
                value={brief.usageRights.exclusivity}
                onValueChange={(val) => updateField("usageRights", "exclusivity", val)}
              >
                
                  
                
                
                  {EXCLUSIVITY_OPTIONS.map((option) => (
                    
                      {option.label}
                    
                  ))}
                
              
              
                Are you restricted from working with competitors?
              
            
          
        
      

      {/* Actions */}
      
        
          
          Upload Different Brief
        
        <Button onClick={() => onConfirm(brief)} className="sm:flex-1">
          {hasEdits ? "Use My Edits" : "Looks Good"} → Calculate Rate
        
      
    
  );
}
```

### Part 2: Update Upload Page Flow

Replace `src/app/dashboard/upload/page.tsx` with a two-step flow:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BriefUploader } from "@/components/forms/brief-uploader";
import { BriefReviewForm } from "@/components/forms/brief-review-form";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { ParsedBrief } from "@/lib/types";

type FlowStep = "upload" | "review";

export default function UploadPage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [step, setStep] = useState("upload");
  const [parsedBrief, setParsedBrief] = useState<Omit | null>(null);

  useEffect(() => {
    const profile = localStorage.getItem("creatorProfile");
    setHasProfile(!!profile);
  }, []);

  const handleBriefParsed = (brief: Omit) => {
    setParsedBrief(brief);
    setStep("review");
  };

  const handleConfirmBrief = (brief: Omit) => {
    localStorage.setItem("currentBrief", JSON.stringify(brief));
    router.push("/dashboard/generate");
  };

  const handleReparse = () => {
    setParsedBrief(null);
    setStep("upload");
  };

  if (!hasProfile) {
    return (
      
        
        Complete Your Profile First
        
          We need your platform metrics to calculate accurate rates.
        
        <Button onClick={() => router.push("/dashboard/profile")}>
          Go to Profile
        
      
    );
  }

  return (
    
      
        
          {step === "upload" ? "Upload Brand Brief" : "Review Brief Details"}
        
        
          {step === "upload" 
            ? "Upload the brand's campaign brief and we'll extract the key details."
            : "Make sure everything looks right before we calculate your rate."
          }
        
      

      {step === "upload" && (
        
      )}

      {step === "review" && parsedBrief && (
        
      )}
    
  );
}
```

### Part 3: Simplify Brief Uploader

Update `src/components/forms/brief-uploader.tsx` to remove the inline preview card that was showing parsed data (since the review form handles that now). The component should only handle upload/paste and call `onBriefParsed`.

**Validation:**
1. Upload a brief
2. See review form with all fields editable
3. Change usage rights from 30 to 90 days
4. Confirm and verify the 90-day value carries through to pricing

---

## PHASE-5-PROMPT-22E: Loading States & Progress Indicators

**Goal:** Provide clear feedback during async operations so users don't think the app is broken.

**Priority:** ⚠️ High  
**Effort:** 45 minutes

**Why This Matters:**
Brief parsing takes 3-10 seconds. Without feedback, users will click the button multiple times, think the app crashed, or close the tab.

**Files to Create:**
- `src/components/ui/progress-steps.tsx`

**Files to Modify:**
- `src/components/forms/brief-uploader.tsx`
- `src/app/dashboard/generate/page.tsx`

**Instructions:**

### Part 1: Create Progress Steps Component

Create `src/components/ui/progress-steps.tsx`:
```typescript
"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    
      {steps.map((step, index) => (
        
          {step.status === "complete" && (
            
          )}
          {step.status === "active" && (
            
          )}
          {step.status === "pending" && (
            
          )}
          <span className={`text-sm ${
            step.status === "active" ? "text-primary font-medium" :
            step.status === "complete" ? "text-green-600" :
            "text-gray-400"
          }`}>
            {step.label}
          
        
      ))}
    
  );
}
```

### Part 2: Update Brief Uploader with Progress

In `src/components/forms/brief-uploader.tsx`, replace the simple `loading` state with step-based progress:
```typescript
import { ProgressSteps } from "@/components/ui/progress-steps";

// Replace loading state with:
const [parseStep, setParseStep] = useState<
  "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error"
>("idle");

// Update parseFile function:
const parseFile = async (file: File) => {
  setParseStep("uploading");
  setError(null);

  try {
    setParseStep("extracting");
    
    const formData = new FormData();
    formData.append("file", file);

    setParseStep("analyzing");
    
    const response = await fetch("/api/parse-brief", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to parse brief");
    }

    setParseStep("complete");
    setParsedBrief(result.data);
    
    // Small delay to show completion before transitioning
    setTimeout(() => {
      onBriefParsed(result.data);
    }, 500);
    
  } catch (err) {
    setParseStep("error");
    setError(err instanceof Error ? err.message : "Failed to parse brief");
  }
};

// In render, show progress when parsing:
{parseStep !== "idle" && parseStep !== "error" && (
  
    <ProgressSteps
      steps={[
        { 
          label: "Uploading file", 
          status: parseStep === "uploading" ? "active" : 
                  ["extracting", "analyzing", "complete"].includes(parseStep) ? "complete" : "pending"
        },
        { 
          label: "Extracting text", 
          status: parseStep === "extracting" ? "active" :
                  ["analyzing", "complete"].includes(parseStep) ? "complete" : "pending"
        },
        { 
          label: "AI analyzing brief (5-10 seconds)", 
          status: parseStep === "analyzing" ? "active" :
                  parseStep === "complete" ? "complete" : "pending"
        },
      ]}
    />
  
)}
```

### Part 3: Update Generate Page Loading

In `src/app/dashboard/generate/page.tsx`, replace the simple spinner with informative loading:
```typescript
// Replace the loading spinner with:
{!fitScore && !pricing && !error && (
  
    
    
      Calculating your rate...
      
        Analyzing brand fit and running pricing engine
      
    
  
)}
```

### Part 4: Add Loading State to PDF Download Button
```typescript
const [pdfProgress, setPdfProgress] = useState("idle");

// Update download button:
<Button onClick={downloadPDF} disabled={pdfProgress !== "idle"}>
  {pdfProgress === "generating" && (
    <>
      
      Creating PDF...
    </>
  )}
  {pdfProgress === "downloading" && (
    <>
      
      Downloading...
    </>
  )}
  {pdfProgress === "idle" && (
    <>
      
      Download PDF
    </>
  )}

```

**Validation:**
1. Upload a brief - see 3-step progress indicator
2. Verify each step transitions smoothly
3. Test with slow network (Chrome DevTools > Network > Slow 3G)
4. Verify users never see a "stuck" state

---

## PHASE-5-PROMPT-23: Dashboard Pages

**Goal:** Create all dashboard page views.

**Files:**
- `src/app/dashboard/page.tsx` - Dashboard home
- `src/app/dashboard/profile/page.tsx` - Profile form page
- `src/app/dashboard/upload/page.tsx` - Brief upload page
- `src/app/dashboard/generate/page.tsx` - Rate card generation page
- `src/app/dashboard/history/page.tsx` - History placeholder

**Instructions:**

**Dashboard Home (`page.tsx`):**
- Welcome message
- 3-step process cards (Profile → Upload → Generate)
- CTA banner at bottom

**Profile Page:**
- Page title and description
- ProfileForm component
- Load existing profile from localStorage on mount

**Upload Page:**
- Check for existing profile (redirect if missing)
- BriefUploader component
- "Continue" button after successful parse
- Save brief to localStorage

**Generate Page:**
- Check for profile and brief (show error if missing)
- Load data from localStorage
- Call `/api/calculate` on mount
- Display FitScoreDisplay and PricingBreakdown
- "Download PDF" button that calls `/api/generate-pdf`

**History Page:**
- "Coming Soon" placeholder with icon
- Brief description of future feature

For MVP, use localStorage for state persistence. Database integration can come later.

**Validation:** Walk through complete flow from profile to PDF download.

---

## PHASE-5-PROMPT-23B: Quick Quote Flow (No Brief Required)

**Goal:** Allow creators to get a rate instantly without uploading a brand brief.

**Priority:** 🚨 Critical  
**Effort:** 2 hours

**Why This Matters:**
This is arguably your **real** MVP. Most creator interactions are:
> "A brand just DM'd me asking for rates. I don't have a brief—they just asked what I charge for a Reel."

Requiring a brief for this use case = losing 70% of your users.

**Files to Create:**
- `src/app/dashboard/quick-quote/page.tsx`
- `src/components/forms/quick-quote-form.tsx`

**Files to Modify:**
- `src/app/dashboard/page.tsx` (add quick quote CTA)
- `src/app/dashboard/layout.tsx` (add nav item)

**Prerequisites:**
```bash
pnpm dlx shadcn@latest add radio-group
```

**Instructions:**

### Part 1: Add Navigation Item

In `src/app/dashboard/layout.tsx`, add to `navItems` array:
```typescript
import { Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/quick-quote", label: "Quick Quote", icon: Zap }, // Add this line
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/upload", label: "Upload Brief", icon: Upload },
  { href: "/dashboard/generate", label: "Generate", icon: FileText },
  { href: "/dashboard/history", label: "History", icon: History },
];
```

### Part 2: Create Quick Quote Form

Create `src/components/forms/quick-quote-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Zap } from "lucide-react";
import type { ParsedBrief, CreatorProfile, FitScoreResult, PricingResult } from "@/lib/types";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
];

const FORMATS = [
  { value: "static", label: "Static Post", platforms: ["instagram", "twitter"] },
  { value: "carousel", label: "Carousel", platforms: ["instagram"] },
  { value: "story", label: "Story", platforms: ["instagram"] },
  { value: "reel", label: "Reel", platforms: ["instagram"] },
  { value: "video", label: "Short Video", platforms: ["tiktok", "youtube"] },
  { value: "live", label: "Live Stream", platforms: ["instagram", "tiktok", "youtube"] },
  { value: "ugc", label: "UGC Only (no posting)", platforms: ["instagram", "tiktok", "youtube"] },
];

const USAGE_OPTIONS = [
  { value: "organic", label: "Organic only (I post it, that's it)", days: 0, exclusivity: "none" },
  { value: "30-day", label: "30-day paid usage", days: 30, exclusivity: "none" },
  { value: "90-day", label: "90-day paid usage", days: 90, exclusivity: "none" },
  { value: "90-day-exclusive", label: "90-day + category exclusivity", days: 90, exclusivity: "category" },
  { value: "perpetual", label: "Unlimited/perpetual usage", days: -1, exclusivity: "none" },
];

interface QuickQuoteFormProps {
  profile: CreatorProfile;
  onQuoteGenerated: (data: {
    brief: Omit;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  }) => void;
}

export function QuickQuoteForm({ profile, onQuoteGenerated }: QuickQuoteFormProps) {
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [usageOption, setUsageOption] = useState("organic");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableFormats = FORMATS.filter(f => 
    f.platforms.includes(platform) || platform === ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platform || !format) {
      setError("Please select platform and content type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedUsage = USAGE_OPTIONS.find(u => u.value === usageOption)!;
      
      // Construct a synthetic brief from the quick form
      const syntheticBrief: Omit = {
        brand: {
          name: brandName || "Brand",
          industry: profile.niches[0] || "other",
          product: "Product",
        },
        campaign: {
          objective: "Brand awareness",
          targetAudience: "General audience",
          budgetRange: "Not specified",
        },
        content: {
          platform: platform as any,
          format: format as any,
          quantity: quantity,
          creativeDirection: "Creator's discretion",
        },
        usageRights: {
          durationDays: selectedUsage.days,
          exclusivity: selectedUsage.exclusivity as any,
          paidAmplification: selectedUsage.days > 0,
        },
        timeline: {
          deadline: "Flexible",
        },
        rawText: `Quick quote for ${quantity}x ${format} on ${platform}`,
      };

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, brief: syntheticBrief }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Calculation failed");
      }

      onQuoteGenerated({
        brief: syntheticBrief,
        fitScore: result.data.fitScore,
        pricing: result.data.pricing,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    
      
        
          
            
            Quick Quote
          
          
            Get an instant rate without uploading a brief. Perfect for DM inquiries.
          
        
        
          {/* Brand Name (Optional) */}
          
            Brand Name (optional)
            <Input
              id="brandName"
              placeholder="e.g., Nike, Glossier"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            
              Leave blank if you don't know yet
            
          

          {/* Platform */}
          
            Platform *
            <Select value={platform} onValueChange={(val) => {
              setPlatform(val);
              setFormat("");
            }}>
              
                
              
              
                {PLATFORMS.map((p) => (
                  
                    {p.label}
                  
                ))}
              
            
          

          {/* Content Format */}
          
            Content Type *
            
              
                
              
              
                {availableFormats.map((f) => (
                  
                    {f.label}
                  
                ))}
              
            
          

          {/* Quantity */}
          
            How many?
            
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              
              <Input
                id="quantity"
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
              >
                +
              
              
                {format || "deliverables"}
              
            
          

          {/* Usage Rights */}
          
            Usage Rights
            
              {USAGE_OPTIONS.map((option) => (
                
                  
                  
                    {option.label}
                  
                
              ))}
            
            
              "Paid usage" means the brand can use your content in their ads.
            
          

          {/* Error */}
          {error && (
            
              {error}
            
          )}

          {/* Submit */}
          
            {loading ? (
              <>
                
                Calculating...
              </>
            ) : (
              <>
                
                Get My Rate
              </>
            )}
          
        
      
    
  );
}
```

### Part 3: Create Quick Quote Page

Create `src/app/dashboard/quick-quote/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickQuoteForm } from "@/components/forms/quick-quote-form";
import { FitScoreDisplay } from "@/components/rate-card/fit-score-display";
import { PricingBreakdown } from "@/components/rate-card/pricing-breakdown";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import type { CreatorProfile, ParsedBrief, FitScoreResult, PricingResult } from "@/lib/types";

export default function QuickQuotePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("creatorProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const downloadPDF = async () => {
    if (!profile || !result) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          brief: result.brief,
          fitScore: result.fitScore,
          pricing: result.pricing,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ratecard-${profile.handle}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      
        
      
    );
  }

  if (!profile) {
    return (
      
        
        Complete Your Profile First
        
          We need your follower counts and engagement rates to calculate your rate.
        
        <Button onClick={() => router.push("/dashboard/profile")}>
          Set Up Profile
        
      
    );
  }

  return (
    
      
        
          
            {result ? "Your Quote" : "Quick Quote"}
          
          
            {result 
              ? `${result.brief.content.quantity}x ${result.brief.content.format} on ${result.brief.content.platform}`
              : "Get an instant rate without uploading a brief"
            }
          
        
        {result && (
          
            <Button variant="outline" onClick={() => setResult(null)}>
              
              New Quote
            
            
              {generating ? (
                
              ) : (
                
              )}
              Download PDF
            
          
        )}
      

      {!result ? (
        
          
        
      ) : (
        
          
          
        
      )}

      {!result && (
        
          Tip: If you have a full brand brief, use the{" "}
          <button 
            onClick={() => router.push("/dashboard/upload")}
            className="text-primary hover:underline"
          >
            Upload Brief
          {" "}
          flow for more accurate pricing.
        
      )}
    
  );
}
```

### Part 4: Update Dashboard Home

In `src/app/dashboard/page.tsx`, add Quick Quote as the primary CTA at the top:
```typescript
import { Zap, FileText, ArrowRight } from "lucide-react";

// Add this grid near the top of the page content:

  
    
      
        
        Need a quick rate?
      
    
    
      
        Brand just DM'd you? Get an instant quote in 30 seconds.
      
      
        
          Quick Quote 
        
      
    
  
  
  
    
      
        
        Have a brand brief?
      
    
    
      
        Upload the full brief for more accurate, tailored pricing.
      
      
        
          Upload Brief 
        
      
    
  

```

**Validation:**
1. Navigate to Quick Quote
2. Select Instagram > Reel > 1 > 30-day usage
3. Get rate without any file upload
4. Download PDF
5. Verify the full flow takes under 30 seconds

---

## PHASE-5-PROMPT-23C: Price Adjustment Before Download

**Goal:** Allow creators to adjust the final price before downloading the rate card.

**Priority:** 🚨 Critical  
**Effort:** 45 minutes

**Why This Matters:**
Your engine outputs $780. Creator thinks "That's too high for my first deal" or "I'll round up to $850." No override = they won't trust or use the rate card.

**Files to Create:**
- `src/components/rate-card/price-adjuster.tsx`

**Files to Modify:**
- `src/app/dashboard/generate/page.tsx`
- `src/app/dashboard/quick-quote/page.tsx`

**Instructions:**

### Part 1: Create Price Adjuster Component

Create `src/components/rate-card/price-adjuster.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calculator, Edit2 } from "lucide-react";
import type { PricingResult } from "@/lib/types";

interface PriceAdjusterProps {
  calculatedPricing: PricingResult;
  onPriceChange: (adjustedPricing: PricingResult) => void;
}

export function PriceAdjuster({ calculatedPricing, onPriceChange }: PriceAdjusterProps) {
  const [useCalculated, setUseCalculated] = useState(true);
  const [customPrice, setCustomPrice] = useState(calculatedPricing.totalPrice);

  const difference = customPrice - calculatedPricing.totalPrice;
  const percentDiff = ((difference / calculatedPricing.totalPrice) * 100).toFixed(0);

  useEffect(() => {
    if (useCalculated) {
      onPriceChange(calculatedPricing);
    } else {
      onPriceChange({
        ...calculatedPricing,
        pricePerDeliverable: Math.round(customPrice / calculatedPricing.quantity),
        totalPrice: customPrice,
        originalTotal: calculatedPricing.totalPrice,
      });
    }
  }, [useCalculated, customPrice]);

  return (
    
      
        
          
          Your Final Rate
        
      
      
        <RadioGroup
          value={useCalculated ? "calculated" : "custom"}
          onValueChange={(val) => setUseCalculated(val === "calculated")}
        >
          {/* Option 1: Use Calculated */}
          <div className={`flex items-start space-x-3 p-3 rounded-lg border ${
            useCalculated ? "border-primary bg-primary/5" : "border-gray-200"
          }`}>
            
            
              
                Use RateCard.AI suggestion
              
              
                {calculatedPricing.currencySymbol || "$"}
                {calculatedPricing.totalPrice.toLocaleString()}
              
              
                Based on your metrics and campaign requirements
              
            
            
              Recommended
            
          

          {/* Option 2: Custom Price */}
          <div className={`flex items-start space-x-3 p-3 rounded-lg border ${
            !useCalculated ? "border-primary bg-primary/5" : "border-gray-200"
          }`}>
            
            
              
                
                Set my own price
              
              
                {calculatedPricing.currencySymbol || "$"}
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                  disabled={useCalculated}
                  className="w-32 text-lg font-bold"
                  min={0}
                  step={50}
                />
                {!useCalculated && difference !== 0 && (
                   0 ? "text-green-600" : "text-red-600"}`}>
                    {difference > 0 ? "+" : ""}{percentDiff}%
                  
                )}
              
            
          
        

        {!useCalculated && (
          
            {difference < 0 
              ? "Going lower is okay for your first deal—just don't undervalue yourself long-term."
              : "Your custom rate will appear on the PDF with the suggested rate for reference."
            }
          
        )}
      
    
  );
}
```

### Part 2: Update Types

Add to `src/lib/types.ts` in the `PricingResult` interface:
```typescript
export interface PricingResult {
  // ... existing fields ...
  originalTotal?: number; // Original calculated price if user adjusted
}
```

### Part 3: Integrate into Generate and Quick Quote Pages

In both `src/app/dashboard/generate/page.tsx` and `src/app/dashboard/quick-quote/page.tsx`:
```typescript
import { PriceAdjuster } from "@/components/rate-card/price-adjuster";

// Add state
const [adjustedPricing, setAdjustedPricing] = useState(null);

// Add component before the action buttons, after pricing displays:
{pricing && (
  
)}

// Update downloadPDF to use adjusted pricing:
const downloadPDF = async () => {
  const finalPricing = adjustedPricing || pricing;
  // ... use finalPricing in the API call
};
```

**Validation:**
1. Generate a rate card
2. Select "Set my own price"
3. Enter $650 instead of $780
4. Download PDF
5. Verify PDF shows $650 as the rate

---

## PHASE-5-PROMPT-23D: Mobile Share UX

**Goal:** Optimize rate card delivery for mobile users (70% of audience).

**Priority:** ⚠️ High  
**Effort:** 1.5 hours

**Why This Matters:**
PDF download on mobile is terrible—iOS opens it in a new tab, users can't find downloaded files. A share-first approach works better.

**Files to Create:**
- `src/components/rate-card/share-actions.tsx`

**Files to Modify:**
- `src/app/dashboard/generate/page.tsx`
- `src/app/dashboard/quick-quote/page.tsx`

**Prerequisites:**
```bash
pnpm dlx shadcn@latest add dialog
```

**Instructions:**

### Part 1: Create Share Actions Component

Create `src/components/rate-card/share-actions.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Share2, 
  Copy, 
  Mail, 
  Check, 
  Loader2,
  FileText
} from "lucide-react";
import type { CreatorProfile, PricingResult, FitScoreResult, ParsedBrief } from "@/lib/types";

interface ShareActionsProps {
  profile: CreatorProfile;
  brief: ParsedBrief | Omit;
  fitScore: FitScoreResult;
  pricing: PricingResult;
}

export function ShareActions({ profile, brief, fitScore, pricing }: ShareActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const isMobile = typeof window !== "undefined" && 
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, brief, fitScore, pricing }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ratecard-${profile.handle}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    const currencySymbol = pricing.currencySymbol || "$";
    const text = `Rate Card for ${brief.brand.name}

Creator: ${profile.displayName} (@${profile.handle})
Content: ${brief.content.quantity}x ${brief.content.format} on ${brief.content.platform}
Usage: ${brief.usageRights.durationDays === 0 ? "Organic only" : `${brief.usageRights.durationDays} days paid usage`}

Rate: ${currencySymbol}${pricing.totalPrice.toLocaleString()}
Valid for: ${pricing.validDays} days

Generated by RateCard.AI`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (!navigator.share) return;

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, brief, fitScore, pricing }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], `ratecard-${profile.handle}.pdf`, { type: "application/pdf" });
        
        await navigator.share({
          title: `Rate Card - ${profile.displayName}`,
          text: `My rate for ${brief.content.quantity}x ${brief.content.format}: ${pricing.currencySymbol || "$"}${pricing.totalPrice.toLocaleString()}`,
          files: [file],
        });
      }
    } catch (err) {
      // Fallback to text share
      await navigator.share({
        title: `Rate Card - ${profile.displayName}`,
        text: `My rate for ${brief.content.quantity}x ${brief.content.format}: ${pricing.currencySymbol || "$"}${pricing.totalPrice.toLocaleString()}`,
      });
    }
  };

  const openEmailClient = () => {
    const subject = encodeURIComponent(`Rate Card from ${profile.displayName}`);
    const body = encodeURIComponent(`Hi,

Please find my rate card for the ${brief.brand.name} campaign.

Rate: ${pricing.currencySymbol || "$"}${pricing.totalPrice.toLocaleString()}
Content: ${brief.content.quantity}x ${brief.content.format} on ${brief.content.platform}

${message ? `${message}\n\n` : ""}Best,
${profile.displayName}

---
Generated by RateCard.AI`);

    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    setEmailDialogOpen(false);
  };

  // Mobile-first layout
  if (isMobile && navigator.share) {
    return (
      
        
          
          Share Rate Card
        
        
        
          
            
              
            
          
          
            
              
              Download PDF
            
            
              {copied ?  : }
              Copy as Text
            
            
            <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
              
              Email to Brand
            
          
        
      
    );
  }

  // Desktop layout
  return (
    <>
      
        
          {downloading ?  : }
          Download PDF
        

        
          
            
              
              Share
            
          
          
            
              {copied ?  : }
              Copy as Text
            
            <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
              
              Email to Brand
            
          
        
      

      
        
          
            Email Rate Card
            
              Send your rate card directly to the brand.
            
          
          
            
              Recipient Email
              <Input
                id="email"
                type="email"
                placeholder="brand@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            
            
              Personal Message (optional)
              <Textarea
                id="message"
                placeholder="Looking forward to working together!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            
            
              
              Open Email App
            
          
        
      
    </>
  );
}
```

### Part 2: Replace Download Buttons

In both `generate/page.tsx` and `quick-quote/page.tsx`, replace the download button with:
```typescript
import { ShareActions } from "@/components/rate-card/share-actions";

// Replace the download button section with:
{fitScore && pricing && (
  
)}
```

**Validation:**
1. Test on mobile device (or Chrome DevTools mobile emulation)
2. Verify "Share" button is primary on mobile
3. Test native share sheet opens
4. Test "Copy as Text" works
5. Test email dialog

---

# PHASE 6: Landing Page & Deployment (1 hour)

## PHASE-6-PROMPT-24: Landing Page

**Goal:** Create public marketing landing page.

**File:** `src/app/page.tsx`

**Instructions:**

Create a landing page with:

**Header**
- Logo (text: "RateCard.AI")
- Sign In / Get Started buttons

**Hero Section**
- Headline: "Get Paid What You're Actually Worth"
- Subheadline about AI-powered rate cards
- CTA button: "Create Free Rate Card"
- "No credit card required" text

**Features Section (3 cards)**
1. AI-Powered Parsing - Upload any brief format
2. Data-Backed Rates - 6-Layer Pricing Engine
3. Professional PDFs - Agency-quality output

**How It Works (3 steps)**
1. Add Your Stats
2. Upload the Brief
3. Download & Send

**CTA Section**
- "Ready to Get Paid What You Deserve?"
- Large CTA button

**Footer**
- Copyright
- Simple tagline

Keep copy friendly and creator-focused. Avoid corporate language.

**Validation:** Review on mobile and desktop.

---

## PHASE-6-PROMPT-25: Environment & Config

**Goal:** Prepare for Vercel deployment.

**Files:**
- `.env.example` (update)
- `next.config.js`
- `vercel.json` (if needed)

**Instructions:**

Update `.env.example` with all variables:
```env
# Database (Vercel Postgres)
DATABASE_URL=""

# Better Auth
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""
NEXT_PUBLIC_APP_URL=""

# LLM
GROQ_API_KEY=""
GOOGLE_API_KEY=""
```

Create/update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

module.exports = nextConfig
```

Update `package.json` build script:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

**Validation:** Run `pnpm build` locally.

---

## PHASE-6-PROMPT-24B: Error Handling & Recovery

**Goal:** Implement comprehensive error handling so users never hit dead ends.

**Priority:** ⚠️ High  
**Effort:** 1.5 hours

**Why This Matters:**
Without error handling, API failures = blank screens. Users think the app is broken and leave.

**Files to Create:**
- `src/components/ui/error-boundary.tsx`
- `src/components/ui/error-alert.tsx`

**Files to Modify:**
- `src/app/dashboard/layout.tsx`

**Prerequisites:**
```bash
pnpm dlx shadcn@latest add alert
```

**Instructions:**

### Part 1: Create Error Boundary

Create `src/components/ui/error-boundary.tsx`:
```typescript
"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        
          
            
              
                
                Something went wrong
              
            
            
              
                We hit an unexpected error. This has been logged and we'll look into it.
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                
                  {this.state.error.message}
                
              )}
            
            
              
                
                Try Again
              
              <Button onClick={() => window.location.href = "/dashboard"}>
                
                Go Home
              
            
          
        
      );
    }

    return this.props.children;
  }
}
```

### Part 2: Create Reusable Error Alert

Create `src/components/ui/error-alert.tsx`:
```typescript
"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  suggestion?: string;
}

export function ErrorAlert({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  onDismiss,
  suggestion 
}: ErrorAlertProps) {
  return (
    
      
      
        {title}
        {onDismiss && (
          
            
          
        )}
      
      
        {message}
        {suggestion && {suggestion}}
        {onRetry && (
          
            
            Try Again
          
        )}
      
    
  );
}
```

### Part 3: Wrap Dashboard in Error Boundary

Update `src/app/dashboard/layout.tsx`:
```typescript
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    
      {/* ... existing header/sidebar ... */}
      
        
          {children}
        
      
    
  );
}
```

### Part 4: Use ErrorAlert in Pages

In pages with API calls, add error state and display:
```typescript
import { ErrorAlert } from "@/components/ui/error-alert";

// Add state
const [error, setError] = useState(null);

// In your async functions
try {
  // ... API call
} catch (err) {
  setError({
    title: "Calculation Failed",
    message: err instanceof Error ? err.message : "Unknown error",
    suggestion: "Try again or use Quick Quote mode instead.",
  });
}

// In render
{error && (
  <ErrorAlert
    title={error.title}
    message={error.message}
    suggestion={error.suggestion}
    onRetry={() => { setError(null); /* retry function */ }}
    onDismiss={() => setError(null)}
  />
)}
```

**Validation:**
1. Simulate network error (Chrome DevTools > Network > Offline)
2. Verify error message appears with retry button
3. Click retry, verify recovery when network restored

---

## PHASE-6-PROMPT-25B: Rate Limiting

**Goal:** Protect API endpoints from abuse.

**Priority:** Medium  
**Effort:** 1 hour

**Why This Matters:**
Free tool + AI calls = expensive if abused. One script could run up your Groq bill.

**Files to Create:**
- `src/lib/rate-limit.ts`

**Files to Modify:**
- `src/app/api/parse-brief/route.ts`
- `src/app/api/calculate/route.ts`
- `src/app/api/generate-pdf/route.ts`

**Prerequisites:**
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

**Instructions:**

### Part 1: Create Rate Limiter

Create `src/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const rateLimiters = {
  parseBrief: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "ratelimit:parse-brief",
      })
    : null,
  calculate: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 h"),
        prefix: "ratelimit:calculate",
      })
    : null,
  generatePdf: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "ratelimit:generate-pdf",
      })
    : null,
};

// In-memory fallback for development
const inMemoryStore = new Map();

export async function checkRateLimit(
  limiterName: keyof typeof rateLimiters,
  identifier: string
): Promise {
  const limiter = rateLimiters[limiterName];

  if (limiter) {
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
  }

  // Fallback for dev
  const key = `${limiterName}:${identifier}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = limiterName === "parseBrief" ? 10 : 30;

  const record = inMemoryStore.get(key);

  if (!record || now > record.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count++;
  return { success: true, remaining: maxRequests - record.count, reset: record.resetAt };
}
```

### Part 2: Apply to API Routes

In each API route, add after auth check:
```typescript
import { checkRateLimit } from "@/lib/rate-limit";

// After session check
const rateLimitResult = await checkRateLimit("parseBrief", session.user.id);
if (!rateLimitResult.success) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: "You've made too many requests. Please wait before trying again.",
    },
    { status: 429 }
  );
}
```

### Part 3: Add Environment Variables

Add to `.env.example`:
```env
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

**Validation:**
1. Make 11 rapid calls to `/api/parse-brief`
2. Verify 429 response on 11th call
3. Wait and verify calls work again

---

## PHASE-6-PROMPT-26: Final Testing & Deployment

**Goal:** Test complete flow and deploy.

**Instructions:**

**Local Testing Checklist:**
1. [ ] Sign up with new account
2. [ ] Complete profile with Instagram metrics
3. [ ] Upload test brief (PDF or paste text)
4. [ ] Review fit score calculation
5. [ ] Review pricing calculation
6. [ ] Download PDF
7. [ ] Sign out and sign back in
8. [ ] Test mobile responsiveness

**Fix Common Issues:**
- pdf-parse type errors: Add `@types/pdf-parse`
- React-PDF SSR issues: Ensure only used in API routes
- Better Auth cookie issues: Check BETTER_AUTH_URL matches actual URL

**Deployment Steps:**
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Add Vercel Postgres from integrations
5. Deploy
6. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to production domain
7. Run `prisma db push` against production

**Validation:** Complete full flow on production URL.

---

# Execution Order

Run prompts in this order:
```bash
# Trust & Polish (after PHASE-5-PROMPT-22)
claude "Implement PHASE-5-PROMPT-22B from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-5-PROMPT-22C from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-5-PROMPT-22D from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-5-PROMPT-22E from IMPLEMENTATION_PLAN.md"

# Dashboard Pages (original)
claude "Implement PHASE-5-PROMPT-23 from IMPLEMENTATION_PLAN.md"

# Critical Features
claude "Implement PHASE-5-PROMPT-23B from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-5-PROMPT-23C from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-5-PROMPT-23D from IMPLEMENTATION_PLAN.md"

# Phase 6 - Deployment
claude "Implement PHASE-6-PROMPT-24 from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-6-PROMPT-24B from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-6-PROMPT-25 from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-6-PROMPT-25B from IMPLEMENTATION_PLAN.md"
claude "Implement PHASE-6-PROMPT-26 from IMPLEMENTATION_PLAN.md"
```

---

## Dependencies to Add
```bash
pnpm dlx shadcn@latest add radio-group dialog alert
pnpm add @upstash/ratelimit @upstash/redis
```

---

# PHASE 7: Post-MVP Enhancements (Deferred)

> **Important:** These features are intentionally deferred. The MVP validates whether creators want AI-generated rate cards. Only invest in these enhancements after you have:
> 1. ✅ Deployed MVP to production
> 2. ✅ 50+ users have completed the full flow
> 3. ✅ Collected feedback on actual pain points
> 
> **Premature optimization is the root of all evil.** Ship first, enhance later.

---

## Progress Tracker (Phase 7)

| Prompt | Feature | Complexity | Trigger |
|--------|---------|------------|---------|
| 7-01 | Screenshot Parser | 4-6 hours | Users complain about manual entry |
| 7-02 | Database Persistence | 2-3 hours | Ready to store real user data |
| 7-03 | Rate Card History | 2-3 hours | After 7-02, users want to revisit cards |
| 7-04 | Profile API | 1-2 hours | After 7-02, multi-device access needed |
| 7-05 | Email Delivery | 2-3 hours | Users want to send directly to brands |
| 7-06 | Shareable Links | 3-4 hours | Users want public rate card pages |
| 7-07 | Third-Party Data (Phyllo) | 4-6 hours | Revenue justifies $200+/mo API cost |
| 7-08 | Custom Branding (Premium) | 3-4 hours | Ready to monetize |

---

## PHASE-7-PROMPT-01: Screenshot Parser

**Goal:** Allow creators to upload screenshots of their platform insights instead of typing metrics.

**Complexity:** 4-6 hours  
**Dependencies:** Claude Vision API (recommended) or Tesseract.js (free but less accurate)

**Trigger:** Implement only if user feedback shows manual metric entry is a top-3 friction point.

**Files to Create/Modify:**
- `src/lib/screenshot-parser.ts` (new)
- `src/components/forms/profile-form.tsx` (modify)
- `src/app/api/parse-screenshot/route.ts` (new)

**Instructions:**

### Part 1: Screenshot Parser Library

Create `src/lib/screenshot-parser.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";

interface ExtractedMetrics {
  followers?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  reach?: number;
  impressions?: number;
  confidence: "high" | "medium" | "low";
  rawExtraction: string;
}

const EXTRACTION_PROMPT = `You are analyzing a screenshot of a social media insights/analytics dashboard.

Extract the following metrics if visible. Return ONLY valid JSON, no explanation:

{
  "followers": <number or null>,
  "engagementRate": <number as percentage or null>,
  "avgLikes": <number or null>,
  "avgComments": <number or null>,
  "avgViews": <number or null>,
  "reach": <number or null>,
  "impressions": <number or null>,
  "confidence": "high" | "medium" | "low",
  "rawExtraction": "<brief description of what you see>"
}

Rules:
- Convert "10.5K" to 10500, "1.2M" to 1200000
- If engagement rate shows "4.2%", return 4.2
- If a metric isn't visible, return null
- Set confidence based on image clarity and how certain you are
- Only extract numbers you can clearly read`;

export async function parseScreenshot(
  imageBase64: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp"
): Promise<ExtractedMetrics> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  
  try {
    return JSON.parse(text);
  } catch {
    return {
      confidence: "low",
      rawExtraction: "Failed to parse response",
    };
  }
}
```

### Part 2: API Route

Create `src/app/api/parse-screenshot/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { parseScreenshot } from "@/lib/screenshot-parser";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("screenshot") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const metrics = await parseScreenshot(
      base64,
      file.type as "image/png" | "image/jpeg" | "image/webp"
    );

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Screenshot parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse screenshot" },
      { status: 500 }
    );
  }
}
```

### Part 3: UI Component

Create `src/components/forms/screenshot-uploader.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import type { PlatformMetrics } from "@/lib/types";

interface ScreenshotUploaderProps {
  platform: string;
  onMetricsExtracted: (metrics: Partial<PlatformMetrics>) => void;
}

export function ScreenshotUploader({ platform, onMetricsExtracted }: ScreenshotUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    confidence?: string;
    message?: string;
  } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("screenshot", file);

      const response = await fetch("/api/parse-screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      const metrics = data.data;
      
      // Pass extracted metrics to parent
      onMetricsExtracted({
        followers: metrics.followers ?? undefined,
        engagementRate: metrics.engagementRate ?? undefined,
        avgLikes: metrics.avgLikes ?? undefined,
        avgComments: metrics.avgComments ?? undefined,
        avgViews: metrics.avgViews ?? undefined,
      });

      setResult({
        success: true,
        confidence: metrics.confidence,
        message: `Extracted ${Object.values(metrics).filter(v => v !== null && v !== undefined).length - 2} metrics`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to parse screenshot",
      });
    } finally {
      setLoading(false);
    }
  }, [onMetricsExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center gap-2 cursor-pointer transition-colors p-4 rounded-md ${
            isDragActive ? "bg-primary/5" : "hover:bg-muted/50"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          
          {loading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : result?.success ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : result?.success === false ? (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {loading
                ? "Analyzing screenshot..."
                : result?.success
                ? result.message
                : `Upload ${platform} insights screenshot`}
            </p>
            {result?.confidence && (
              <p className="text-xs text-muted-foreground">
                Confidence: {result.confidence}
              </p>
            )}
            {!loading && !result && (
              <p className="text-xs text-muted-foreground">
                PNG, JPEG, or WebP • Max 5MB
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Part 4: Integration with Profile Form

Modify `src/components/forms/profile-form.tsx` to add screenshot option:
```typescript
// Add import
import { ScreenshotUploader } from "./screenshot-uploader";

// Inside PlatformMetricsForm component, add above the manual fields:
<div className="space-y-4">
  {/* Screenshot option */}
  <ScreenshotUploader
    platform={platform}
    onMetricsExtracted={(extracted) => {
      const updated = { ...metrics };
      if (extracted.followers) updated.followers = extracted.followers;
      if (extracted.engagementRate) updated.engagementRate = extracted.engagementRate;
      if (extracted.avgLikes) updated.avgLikes = extracted.avgLikes;
      if (extracted.avgComments) updated.avgComments = extracted.avgComments;
      if (extracted.avgViews) updated.avgViews = extracted.avgViews;
      setMetrics(updated);
      onChange(updated);
      // Clear estimated flags for extracted fields
      setEstimatedFields(new Set());
    }}
  />
  
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">
        Or enter manually
      </span>
    </div>
  </div>
  
  {/* Existing manual entry fields */}
  <div className="grid grid-cols-2 gap-4">
    {/* ... existing fields ... */}
  </div>
</div>
```

### Dependencies
```bash
pnpm add @anthropic-ai/sdk
```

Add to `.env`:
```env
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### Cost Consideration

Claude Vision API pricing (as of 2024):
- ~$0.003 per image for Sonnet
- At 1,000 screenshots/month = ~$3/month
- Very affordable, but track usage

**Validation:**
1. Upload a clear Instagram Insights screenshot
2. Verify metrics are extracted with "high" confidence
3. Verify extracted values populate the form
4. Test with blurry/partial screenshots - should get "low" confidence

---

## PHASE-7-PROMPT-02: Database Persistence

**Goal:** Move from localStorage to real database storage.

**Complexity:** 2-3 hours  
**Dependencies:** Prisma schema already set up in Phase 1

**Trigger:** Implement when you're confident the MVP works and want real user data persistence.

**Files to Modify:**
- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/upload/page.tsx`
- `src/app/dashboard/generate/page.tsx`
- `src/app/api/profile/route.ts` (new)
- `src/app/api/briefs/route.ts` (new)
- `src/app/api/rate-cards/route.ts` (new)

**Instructions:**

### Part 1: Profile API

Create `src/app/api/profile/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { CreatorProfile } from "@/lib/types";

// GET - Fetch current user's profile
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json() as CreatorProfile;

    const profile = await db.creatorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: data.displayName,
        handle: data.handle,
        bio: data.bio,
        location: data.location,
        niches: data.niches,
        instagram: data.instagram ?? undefined,
        tiktok: data.tiktok ?? undefined,
        youtube: data.youtube ?? undefined,
        twitter: data.twitter ?? undefined,
        audience: data.audience ?? undefined,
        tier: data.tier,
        totalReach: data.totalReach,
        avgEngagementRate: data.avgEngagementRate,
      },
      create: {
        userId: session.user.id,
        displayName: data.displayName,
        handle: data.handle,
        bio: data.bio,
        location: data.location,
        niches: data.niches,
        instagram: data.instagram ?? undefined,
        tiktok: data.tiktok ?? undefined,
        youtube: data.youtube ?? undefined,
        twitter: data.twitter ?? undefined,
        audience: data.audience ?? undefined,
        tier: data.tier,
        totalReach: data.totalReach,
        avgEngagementRate: data.avgEngagementRate,
      },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Profile save error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
```

### Part 2: Update Profile Page

Modify `src/app/dashboard/profile/page.tsx` to use API instead of localStorage:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import { Loader2 } from "lucide-react";
import type { CreatorProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();
        if (result.data) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (data: CreatorProfile) => {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to save profile");
    }

    router.push("/dashboard/upload");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Creator Profile</h1>
        <p className="text-muted-foreground">
          This information is used to calculate your rates and brand fit.
        </p>
      </div>
      <ProfileForm initialData={profile || undefined} onSubmit={handleSubmit} />
    </div>
  );
}
```

### Part 3: Briefs & Rate Cards APIs

Create similar API routes for briefs and rate cards following the same pattern. Store the brief after parsing, store the rate card after generation.

**Key changes:**
- Replace all `localStorage.getItem/setItem` with API calls
- Add loading states for async operations
- Handle errors gracefully with user feedback

**Validation:**
1. Sign up as new user
2. Complete profile - verify it persists after page refresh
3. Sign out, sign back in - verify profile still exists
4. Test on different browser/device - verify data syncs

---

## PHASE-7-PROMPT-03: Rate Card History

**Goal:** Implement the history page to show past rate cards.

**Complexity:** 2-3 hours  
**Dependencies:** Phase 7-02 (Database Persistence)

**Trigger:** Implement after database persistence is working.

**Files to Modify:**
- `src/app/dashboard/history/page.tsx`
- `src/app/api/rate-cards/route.ts` (add GET)

**Instructions:**

### Part 1: Rate Cards List API

Add to `src/app/api/rate-cards/route.ts`:
```typescript
// GET - List user's rate cards
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rateCards = await db.rateCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        brief: {
          select: {
            parsedData: true,
          },
        },
      },
    });

    const total = await db.rateCard.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        rateCards,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Rate cards fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards" },
      { status: 500 }
    );
  }
}
```

### Part 2: History Page UI

Replace `src/app/dashboard/history/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, Calendar, DollarSign } from "lucide-react";

interface RateCardSummary {
  id: string;
  brandName: string;
  campaignName?: string;
  fitScore: number;
  fitLevel: string;
  totalPrice: number;
  createdAt: string;
  expiresAt: string;
}

export default function HistoryPage() {
  const [rateCards, setRateCards] = useState<RateCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchRateCards();
  }, []);

  async function fetchRateCards(offset = 0) {
    try {
      const response = await fetch(`/api/rate-cards?limit=20&offset=${offset}`);
      const result = await response.json();
      
      if (result.success) {
        setRateCards(prev => 
          offset === 0 ? result.data.rateCards : [...prev, ...result.data.rateCards]
        );
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch rate cards:", error);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF(rateCardId: string) {
    // Re-generate PDF from stored data
    const response = await fetch(`/api/rate-cards/${rateCardId}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ratecard-${rateCardId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  function getFitLevelColor(level: string) {
    switch (level) {
      case "perfect": return "bg-green-500";
      case "high": return "bg-blue-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (rateCards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rate Card History</h1>
          <p className="text-muted-foreground">
            Your generated rate cards will appear here.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No rate cards yet</p>
            <p className="text-muted-foreground mt-1">
              Generate your first rate card to see it here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rate Card History</h1>
        <p className="text-muted-foreground">
          {rateCards.length} rate card{rateCards.length !== 1 ? "s" : ""} generated
        </p>
      </div>

      <div className="grid gap-4">
        {rateCards.map((card) => (
          <Card key={card.id} className={isExpired(card.expiresAt) ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{card.brandName}</CardTitle>
                  {card.campaignName && (
                    <p className="text-sm text-muted-foreground">{card.campaignName}</p>
                  )}
                </div>
                <Badge className={getFitLevelColor(card.fitLevel)}>
                  {card.fitScore}% {card.fitLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${(card.totalPrice / 100).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(card.createdAt).toLocaleDateString()}
                  </span>
                  {isExpired(card.expiresAt) && (
                    <Badge variant="outline" className="text-yellow-600">
                      Expired
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPDF(card.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchRateCards(rateCards.length)}
        >
          Load More
        </Button>
      )}
    </div>
  );
}
```

**Validation:**
1. Generate 3+ rate cards
2. Navigate to history - verify all appear
3. Click download - verify PDF regenerates
4. Check expired badge shows correctly

---

## PHASE-7-PROMPT-04: Profile API Hooks

**Goal:** Create reusable hooks for profile data fetching.

**Complexity:** 1-2 hours  
**Dependencies:** Phase 7-02

**Files to Create:**
- `src/hooks/use-profile.ts`
- `src/hooks/use-rate-cards.ts`

**Instructions:**

Create `src/hooks/use-profile.ts`:
```typescript
"use client";

import { useState, useEffect } from "react";
import type { CreatorProfile } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(data: CreatorProfile) {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      setProfile(result.data);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  }

  return {
    profile,
    loading,
    error,
    saveProfile,
    refetch: fetchProfile,
  };
}
```

This centralizes data fetching logic and makes it reusable across pages.

---

## PHASE-7-PROMPT-05: Email Delivery

**Goal:** Allow creators to email rate cards directly to brands.

**Complexity:** 2-3 hours  
**Dependencies:** Email service (Resend recommended)

**Trigger:** Users request ability to send directly instead of downloading.

**Files to Create:**
- `src/lib/email.ts`
- `src/app/api/rate-cards/[id]/send/route.ts`

**Instructions:**

### Part 1: Email Setup
```bash
pnpm add resend
```

Create `src/lib/email.ts`:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendRateCardEmailParams {
  to: string;
  creatorName: string;
  brandName: string;
  pdfBuffer: Buffer;
  customMessage?: string;
}

export async function sendRateCardEmail({
  to,
  creatorName,
  brandName,
  pdfBuffer,
  customMessage,
}: SendRateCardEmailParams) {
  const response = await resend.emails.send({
    from: "RateCard.AI <noreply@ratecard.ai>",
    to,
    subject: `Rate Card from ${creatorName} for ${brandName} Campaign`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi there!</h2>
        <p>${creatorName} has sent you their rate card for the ${brandName} campaign.</p>
        ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ""}
        <p>Please find the rate card attached as a PDF.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          Generated by <a href="https://ratecard.ai">RateCard.AI</a>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `ratecard-${creatorName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  return response;
}
```

### Part 2: Send API Route

Create `src/app/api/rate-cards/[id]/send/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendRateCardEmail } from "@/lib/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { RateCardDocument } from "@/lib/pdf-generator";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, message } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fetch rate card with all related data
    const rateCard = await db.rateCard.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        brief: true,
      },
    });

    if (!rateCard) {
      return NextResponse.json({ error: "Rate card not found" }, { status: 404 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      RateCardDocument({
        profile: profile as any,
        brief: rateCard.brief?.parsedData as any,
        fitScore: {
          totalScore: rateCard.fitScore,
          fitLevel: rateCard.fitLevel as any,
          priceAdjustment: 0,
          breakdown: rateCard.fitBreakdown as any,
          insights: rateCard.fitInsights,
        },
        pricing: {
          pricePerDeliverable: rateCard.pricePerDeliverable / 100,
          quantity: rateCard.quantity,
          totalPrice: rateCard.totalPrice / 100,
          currency: "USD",
          validDays: 14,
          layers: rateCard.pricingBreakdown as any,
          formula: "",
        },
      })
    );

    // Send email
    await sendRateCardEmail({
      to: email,
      creatorName: profile.displayName,
      brandName: rateCard.brandName,
      pdfBuffer: Buffer.from(pdfBuffer),
      customMessage: message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
```

### Part 3: UI Component

Add a "Send to Brand" button and modal to the generate page and history page.

**Validation:**
1. Generate a rate card
2. Click "Send to Brand"
3. Enter email and optional message
4. Verify email arrives with PDF attachment

---

## PHASE-7-PROMPT-06: Shareable Links

**Goal:** Generate public URLs for rate cards that don't require login.

**Complexity:** 3-4 hours  
**Dependencies:** Phase 7-02

**Trigger:** Creators want to share rate cards via link instead of PDF.

**Files to Create:**
- `src/app/r/[slug]/page.tsx` (public rate card page)
- Database migration for `shareSlug` field

**Instructions:**

### Part 1: Add Share Slug to Schema

Update `prisma/schema.prisma`:
```prisma
model RateCard {
  // ... existing fields ...
  shareSlug     String?   @unique
  shareEnabled  Boolean   @default(false)
}
```

Run migration:
```bash
pnpm prisma db push
```

### Part 2: Generate Share Link API

Create `src/app/api/rate-cards/[id]/share/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

// POST - Enable sharing and generate link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCard = await db.rateCard.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!rateCard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate slug if doesn't exist
  const shareSlug = rateCard.shareSlug || nanoid(10);

  await db.rateCard.update({
    where: { id: params.id },
    data: {
      shareSlug,
      shareEnabled: true,
    },
  });

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${shareSlug}`;

  return NextResponse.json({ success: true, data: { shareUrl } });
}

// DELETE - Disable sharing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.rateCard.update({
    where: { id: params.id, userId: session.user.id },
    data: { shareEnabled: false },
  });

  return NextResponse.json({ success: true });
}
```

### Part 3: Public Rate Card Page

Create `src/app/r/[slug]/page.tsx`:
```typescript
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: { slug: string };
}

export default async function PublicRateCardPage({ params }: Props) {
  const rateCard = await db.rateCard.findFirst({
    where: {
      shareSlug: params.slug,
      shareEnabled: true,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!rateCard || !rateCard.user?.profile) {
    notFound();
  }

  const profile = rateCard.user.profile;
  const isExpired = new Date(rateCard.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">@{profile.handle}</p>
        </div>

        {/* Rate Card Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rate Card for {rateCard.brandName}</CardTitle>
              <Badge variant={isExpired ? "secondary" : "default"}>
                {isExpired ? "Expired" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fit Score</span>
              <span className="font-bold">{rateCard.fitScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rate</span>
              <span className="font-bold text-2xl">
                ${(rateCard.totalPrice / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valid Until</span>
              <span>{new Date(rateCard.expiresAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Generated by{" "}
          <a href="/" className="text-primary hover:underline">
            RateCard.AI
          </a>
        </p>
      </div>
    </div>
  );
}
```

Dependencies:
```bash
pnpm add nanoid
```

**Validation:**
1. Generate a rate card
2. Click "Share Link"
3. Copy URL and open in incognito browser
4. Verify rate card displays without login

---

## PHASE-7-PROMPT-07: Third-Party Data Integration (Phyllo)

**Goal:** Auto-fetch creator metrics from connected social accounts.

**Complexity:** 4-6 hours  
**Dependencies:** Phyllo API account ($200+/month)

**Trigger:** Only implement when you have revenue to justify the cost.

> **Cost Warning:** Phyllo charges ~$200-2,000/month depending on usage. Only implement after you've validated the product and have paying users or funding.

**Files to Create:**
- `src/lib/phyllo.ts`
- `src/app/api/connect/[platform]/route.ts`
- `src/components/forms/platform-connect.tsx`

This is a significant integration. High-level steps:

1. Set up Phyllo account and get API keys
2. Implement OAuth flow for each platform
3. Fetch and sync metrics periodically
4. Update profile form to show "Connected" state
5. Handle token refresh and disconnection

**Consider deferring this until you have:**
- 1,000+ active users
- Revenue of at least $500/month
- Clear user demand for automated metrics

For now, the manual entry + smart defaults + screenshot parser covers 95% of needs.

---

## PHASE-7-PROMPT-08: Custom Branding (Premium Feature)

**Goal:** Allow paid users to add their own logo and colors to PDFs.

**Complexity:** 3-4 hours  
**Dependencies:** Payment integration (Stripe), file upload for logos

**Trigger:** Ready to monetize with premium tier.

**Files to Create:**
- `src/app/dashboard/settings/branding/page.tsx`
- `src/lib/pdf-generator.tsx` (modify for custom branding)
- Database fields for brand settings

**Premium Features:**
1. Custom logo on PDF header
2. Custom accent color
3. Custom footer text
4. Remove "Generated by RateCard.AI" branding

This requires Stripe integration for subscriptions—a separate implementation effort.

---

# Quick Reference: Phase 7 Commands
```bash
# Screenshot Parser
claude "Implement PHASE-7-PROMPT-01 from IMPLEMENTATION_PLAN.md"

# Database Persistence  
claude "Implement PHASE-7-PROMPT-02 from IMPLEMENTATION_PLAN.md"

# Rate Card History
claude "Implement PHASE-7-PROMPT-03 from IMPLEMENTATION_PLAN.md"

# Profile Hooks
claude "Implement PHASE-7-PROMPT-04 from IMPLEMENTATION_PLAN.md"

# Email Delivery
claude "Implement PHASE-7-PROMPT-05 from IMPLEMENTATION_PLAN.md"

# Shareable Links
claude "Implement PHASE-7-PROMPT-06 from IMPLEMENTATION_PLAN.md"

# Phyllo Integration (expensive - defer)
claude "Implement PHASE-7-PROMPT-07 from IMPLEMENTATION_PLAN.md"

# Custom Branding (premium - defer)
claude "Implement PHASE-7-PROMPT-08 from IMPLEMENTATION_PLAN.md"
```

---

# Recommended Phase 7 Order

Based on value vs. effort:

| Order | Prompt | Why |
|-------|--------|-----|
| 1st | 7-02 (Database) | Foundation for everything else |
| 2nd | 7-04 (Hooks) | Clean up code, reusable patterns |
| 3rd | 7-03 (History) | Users expect to see past work |
| 4th | 7-01 (Screenshots) | Only if users complain about manual entry |
| 5th | 7-06 (Share Links) | Nice-to-have for virality |
| 6th | 7-05 (Email) | Convenience feature |
| 7th+ | 7-07, 7-08 | Only with revenue/funding |

---

# Appendix: Quick Reference

## File Checklist

| File | Phase | Status |
|------|-------|--------|
| `src/lib/types.ts` | 1 | ⬜ |
| `prisma/schema.prisma` | 1 | ⬜ |
| `src/lib/db.ts` | 1 | ⬜ |
| `src/lib/auth.ts` | 2 | ⬜ |
| `src/lib/auth-client.ts` | 2 | ⬜ |
| `src/hooks/use-auth.ts` | 2 | ⬜ |
| `src/app/api/auth/[...all]/route.ts` | 2 | ⬜ |
| `src/app/(auth)/sign-in/page.tsx` | 2 | ⬜ |
| `src/app/(auth)/sign-up/page.tsx` | 2 | ⬜ |
| `src/middleware.ts` | 2 | ⬜ |
| `src/lib/pricing-engine.ts` | 3 | ⬜ |
| `src/lib/fit-score.ts` | 3 | ⬜ |
| `src/lib/llm.ts` | 3 | ⬜ |
| `src/lib/brief-parser.ts` | 3 | ⬜ |
| `src/app/api/parse-brief/route.ts` | 4 | ⬜ |
| `src/app/api/calculate/route.ts` | 4 | ⬜ |
| `src/app/api/generate-pdf/route.ts` | 4 | ⬜ |
| `src/lib/pdf-generator.tsx` | 4 | ⬜ |
| `src/app/dashboard/layout.tsx` | 5 | ⬜ |
| `src/components/forms/profile-form.tsx` | 5 | ⬜ |
| `src/components/forms/brief-uploader.tsx` | 5 | ⬜ |
| `src/components/rate-card/fit-score-display.tsx` | 5 | ⬜ |
| `src/components/rate-card/pricing-breakdown.tsx` | 5 | ⬜ |
| `src/app/dashboard/page.tsx` | 5 | ⬜ |
| `src/app/dashboard/profile/page.tsx` | 5 | ⬜ |
| `src/app/dashboard/upload/page.tsx` | 5 | ⬜ |
| `src/app/dashboard/generate/page.tsx` | 5 | ⬜ |
| `src/app/dashboard/history/page.tsx` | 5 | ⬜ |
| `src/app/page.tsx` | 6 | ⬜ |

## Dependencies to Install
```bash
# Phase 1
# (none - just file creation)

# Phase 2
pnpm add better-auth

# Phase 3
pnpm add groq-sdk @google/generative-ai pdf-parse mammoth
pnpm add -D @types/pdf-parse

# Phase 4
pnpm add @react-pdf/renderer

# Phase 5
pnpm dlx shadcn@latest add button card input label form select textarea tabs badge progress separator avatar dropdown-menu sheet toast
pnpm add react-dropzone react-hook-form @hookform/resolvers zod lucide-react
```

## Test Credentials

For local development, create a test account:
- Email: `test@ratecard.ai`
- Password: `TestPassword123!`

## Sample Test Data

**Creator Profile:**
```json
{
  "displayName": "Maya Creates",
  "handle": "maya.creates",
  "location": "United States",
  "niches": ["lifestyle", "fashion", "beauty"],
  "instagram": {
    "followers": 18000,
    "engagementRate": 4.2,
    "avgLikes": 756,
    "avgComments": 42,
    "avgViews": 12000
  }
}
```

**Sample Brief Text:**
```
Brand: Glossier
Industry: Beauty
Campaign: Summer Glow Collection Launch

Looking for lifestyle creators to showcase our new Summer Glow collection.
Target audience: Women 18-34 interested in minimal, natural beauty.

Deliverables: 1 Instagram Reel
Usage: 60-day paid media rights
Timeline: Content due in 2 weeks
```

Expected output: ~$500-600 rate card for a nano/micro creator with good engagement.