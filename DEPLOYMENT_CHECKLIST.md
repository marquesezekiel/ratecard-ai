# RateCard.AI Deployment Checklist

This checklist ensures all steps are completed before deploying to production.

---

## Pre-Deployment Verification

### 1. Environment Variables

All required environment variables must be configured in your deployment platform:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | 32+ character secret for auth |
| `BETTER_AUTH_URL` | Yes | Production URL (e.g., `https://ratecard.ai`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL (same as above) |
| `GROQ_API_KEY` | Yes | Groq API key for LLM features |
| `GOOGLE_API_KEY` | Optional | Fallback for Gemini LLM |

**Verification:**
- [ ] All required environment variables are set
- [ ] No hardcoded URLs in codebase
- [ ] Secrets are not exposed in git history
- [ ] LLM API keys have sufficient quota

### 2. Database

**Schema includes:**
- User, Session, Account, Verification (Better Auth)
- CreatorProfile (creator data)
- Brief, RateCard (rate card generation)
- GiftDeal (gift relationship tracking)
- Outcome (deal outcome tracking)

**Steps:**
- [ ] Run `pnpm prisma generate` to generate Prisma client
- [ ] Run `pnpm prisma db push` to sync schema to production database
- [ ] Verify all indexes are created (see schema.prisma)
- [ ] Test database connection from production environment

**Index Coverage:**
- User: email (unique)
- CreatorProfile: userId
- Brief: userId, createdAt
- RateCard: userId, createdAt
- GiftDeal: creatorId, status, createdAt
- Outcome: creatorId, sourceType, outcome, platform, createdAt

### 3. Build Verification

**Run these commands locally before deploying:**

```bash
# Generate Prisma client and build
pnpm build

# Run linter (warnings acceptable, errors must be fixed)
pnpm lint

# Run test suite (all tests must pass)
pnpm test:run
```

**Results:**
- [ ] `pnpm build` completes successfully
- [ ] No TypeScript errors
- [ ] No critical lint errors
- [ ] All 839+ tests passing
- [ ] Bundle size reasonable (~643MB build folder)

### 4. API Routes Verification

All routes that should exist:

| Route | Method | Auth Required | Purpose |
|-------|--------|---------------|---------|
| `/api/auth/[...all]` | * | No | Better Auth handlers |
| `/api/calculate` | POST | Yes | Calculate pricing (authenticated) |
| `/api/public-calculate` | POST | No | Calculate pricing (anonymous) |
| `/api/parse-brief` | POST | Yes | Parse uploaded PDF/DOCX |
| `/api/generate-pdf` | POST | Yes | Generate rate card PDF |
| `/api/parse-dm` | POST | Yes | Parse DM text/screenshot |
| `/api/evaluate-gift` | POST | Yes | Evaluate gift deal worth |
| `/api/gifts` | GET/POST | Yes | List/create gift deals |
| `/api/gifts/[id]` | GET/PUT/DELETE | Yes | Gift deal CRUD |
| `/api/gifts/[id]/convert` | POST/DELETE | Yes | Convert gift to paid |
| `/api/gifts/[id]/follow-up` | GET/POST | Yes | Follow-up scripts |
| `/api/outcomes` | GET/POST | Yes | Outcome tracking |
| `/api/outcomes/[id]` | GET/PUT/DELETE | Yes | Outcome CRUD |
| `/api/outcomes/analytics` | GET | Yes | Outcome analytics |

### 5. Static Pages

All pages should render correctly:

- [ ] `/` - Landing page
- [ ] `/sign-in` - Sign in page
- [ ] `/sign-up` - Sign up page
- [ ] `/quote` - Public quote calculator
- [ ] `/dashboard` - Main dashboard
- [ ] `/dashboard/profile` - Profile setup
- [ ] `/dashboard/quick-quote` - Quick pricing
- [ ] `/dashboard/upload` - Brief upload
- [ ] `/dashboard/generate` - Rate card generation
- [ ] `/dashboard/rates` - View rates
- [ ] `/dashboard/history` - Rate card history
- [ ] `/dashboard/analyze` - DM analyzer
- [ ] `/dashboard/gifts` - Gift evaluator

---

## Deployment Steps

### 1. Pre-Deploy

```bash
# Ensure clean git state
git status

# Run all checks
pnpm build && pnpm lint && pnpm test:run
```

### 2. Database Migration

```bash
# Push schema to production database
DATABASE_URL="production-connection-string" pnpm prisma db push
```

### 3. Deploy

Deploy using your platform (Vercel, Railway, etc.):
- Ensure environment variables are set
- Verify build logs for any errors
- Check deployment preview if available

### 4. Post-Deploy Verification

- [ ] Create test user account
- [ ] Complete profile setup
- [ ] Generate a test rate card
- [ ] Test DM analyzer
- [ ] Test gift evaluator
- [ ] Verify PDF generation
- [ ] Check error reporting/logging

---

## Feature Verification Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | Ready | Better Auth with email/password |
| Profile Creation | Ready | Creator profile with platform data |
| Pricing Engine | Ready | 11+ pricing factors |
| Rate Card PDF | Ready | React-PDF generation |
| DM Parser | Ready | Text + image support |
| Gift Evaluator | Ready | Worth scoring + responses |
| Gift Tracker | UI Ready | Backend ready, full tracker coming soon |
| Outcome Tracking | Ready | Analytics + market benchmarks |
| FTC Guidance | Ready | Platform-specific compliance |
| Contract Checklist | Ready | Essential terms verification |
| Negotiation Tips | Ready | Talking points + scripts |

---

## Rollback Plan

If issues are discovered post-deployment:

1. **Immediate rollback**: Use deployment platform's rollback feature
2. **Database issues**: Schema is additive; no destructive migrations
3. **Feature flag**: Core features work without new models

---

## Monitoring Post-Launch

- [ ] Error tracking configured (Sentry recommended)
- [ ] Analytics configured (Vercel Analytics or similar)
- [ ] Database monitoring (connection pool, query performance)
- [ ] LLM API usage monitoring (Groq dashboard)

---

## Contact

For deployment issues, check:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Prisma docs: https://www.prisma.io/docs
- Next.js docs: https://nextjs.org/docs

---

**Last Updated:** 2026-01-21
**Version:** 1.0.0
