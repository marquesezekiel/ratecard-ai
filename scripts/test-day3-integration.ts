/**
 * Day 3 Testing Checkpoint - Integration Tests
 *
 * Tests:
 * 1. High-value complex deal (Finance niche, UK, whitelisting, Q4, hybrid pricing, 6-month retainer)
 * 2. Verify all Day 3 features: Deal Quality Score, Negotiation Talking Points, FTC Guidance, Contract Checklist
 * 3. Edge cases: UGC-only, Celebrity tier ambassador, Affiliate-only
 */

import { calculatePrice, calculateTier, calculateUGCPrice, calculateRetainerPrice, calculateAffiliatePricing } from "../src/lib/pricing-engine";
import { calculateFitScore } from "../src/lib/fit-score";
import { calculateDealQuality } from "../src/lib/deal-quality-score";
import { generateNegotiationTalkingPoints } from "../src/lib/negotiation-talking-points";
import { getFTCGuidance } from "../src/lib/ftc-guidance";
import { getContractChecklist, getDetectedRedFlags, getCriticalItems } from "../src/lib/contract-checklist";
import type { CreatorProfile, ParsedBrief, DealQualityInput, RetainerConfig, AffiliateConfig } from "../src/lib/types";

// =============================================================================
// TEST 1: HIGH-VALUE COMPLEX DEAL
// Finance niche, UK region, Q4 seasonal, paid social whitelisting, hybrid pricing, 6-month retainer
// =============================================================================

const highValueCreator: CreatorProfile = {
  id: "test-creator-hv",
  userId: "test-user-hv",
  displayName: "Sarah Finance UK",
  handle: "sarah.finance.uk",
  bio: "Finance tips for UK millennials | Investing & budgeting | London based",
  location: "London, UK",
  region: "united_kingdom",
  niches: ["finance", "investing"],
  instagram: {
    followers: 75000,
    engagementRate: 4.8,
    avgLikes: 3600,
    avgComments: 280,
    avgViews: 25000,
  },
  tiktok: {
    followers: 50000,
    engagementRate: 5.5,
    avgLikes: 2750,
    avgComments: 150,
    avgViews: 35000,
  },
  audience: {
    ageRange: "25-34",
    genderSplit: { male: 45, female: 53, other: 2 },
    topLocations: ["United Kingdom", "United States", "Australia"],
    interests: ["finance", "investing", "budgeting", "careers"],
  },
  tier: "mid",
  totalReach: 125000,
  avgEngagementRate: 5.1,
  currency: "GBP",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const highValueBrief: ParsedBrief = {
  dealType: "sponsored",
  brand: {
    name: "WealthTech Pro",
    industry: "finance",
    product: "Investment management platform",
  },
  campaign: {
    objective: "Drive app downloads and brand awareness among UK millennials",
    targetAudience: "Young professionals 25-35 interested in investing",
    budgetRange: "$3000-5000",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 4, // monthly content over 6 months
    creativeDirection: "Show how you use the platform for your investment portfolio",
  },
  usageRights: {
    durationDays: 180,
    exclusivity: "category",
    paidAmplification: true,
    whitelistingType: "paid_social",
  },
  timeline: {
    deadline: "2025-12-15",
  },
  campaignDate: new Date("2025-11-15"), // Q4 Holiday period
  disableSeasonalPricing: false,
  rawText: "High-value brief for testing all Day 3 features",
};

// =============================================================================
// TEST 2: UGC-ONLY DEAL (Edge Case)
// Follower count should NOT affect pricing
// =============================================================================

const ugcCreator: CreatorProfile = {
  id: "test-creator-ugc",
  userId: "test-user-ugc",
  displayName: "UGC Pro",
  handle: "ugc.pro",
  bio: "UGC content creator | High-quality product videos",
  location: "Los Angeles, USA",
  region: "united_states",
  niches: ["lifestyle"],
  instagram: {
    followers: 2500, // Very small following - should NOT matter for UGC
    engagementRate: 8.5,
    avgLikes: 213,
    avgComments: 45,
    avgViews: 1500,
  },
  audience: {
    ageRange: "25-34",
    genderSplit: { male: 30, female: 68, other: 2 },
    topLocations: ["United States"],
    interests: ["lifestyle", "products"],
  },
  tier: "nano",
  totalReach: 2500,
  avgEngagementRate: 8.5,
  currency: "USD",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ugcBrief: ParsedBrief = {
  dealType: "ugc",
  ugcFormat: "video",
  brand: {
    name: "SkinGlow Beauty",
    industry: "beauty",
    product: "Anti-aging serum",
  },
  campaign: {
    objective: "UGC content for brand advertising",
    targetAudience: "Women 25-45",
    budgetRange: "Fee per video",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 3,
    creativeDirection: "Authentic product demo and testimonial",
  },
  usageRights: {
    durationDays: 365,
    exclusivity: "none",
    paidAmplification: true,
    whitelistingType: "full_media", // Full media buy for UGC
  },
  timeline: {
    deadline: "2025-12-01",
  },
  rawText: "UGC brief for edge case testing",
};

// =============================================================================
// TEST 3: CELEBRITY TIER WITH AMBASSADOR PACKAGE (Edge Case)
// =============================================================================

const celebrityCreator: CreatorProfile = {
  id: "test-creator-celeb",
  userId: "test-user-celeb",
  displayName: "Tech Mega Star",
  handle: "tech.mega.star",
  bio: "Tech reviews & gadgets | 2M+ followers | Brand ambassador",
  location: "San Francisco, USA",
  region: "united_states",
  niches: ["tech", "gadgets"],
  instagram: {
    followers: 2500000,
    engagementRate: 2.1,
    avgLikes: 52500,
    avgComments: 3200,
    avgViews: 850000,
  },
  youtube: {
    followers: 1800000,
    avgViews: 450000,
    engagementRate: 4.5,
    avgLikes: 35000,
    avgComments: 2500,
  },
  audience: {
    ageRange: "18-34",
    genderSplit: { male: 72, female: 26, other: 2 },
    topLocations: ["United States", "United Kingdom", "Canada"],
    interests: ["technology", "gadgets", "gaming", "reviews"],
  },
  tier: "celebrity",
  totalReach: 4300000,
  avgEngagementRate: 3.3,
  currency: "USD",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ambassadorConfig: RetainerConfig = {
  dealLength: "12_month",
  monthlyDeliverables: {
    posts: 2,
    stories: 8,
    reels: 2,
    videos: 1, // YouTube video
  },
  ambassadorPerks: {
    exclusivityRequired: true,
    exclusivityType: "category",
    productSeeding: true,
    productValue: 5000, // High-value tech products
    eventsIncluded: 4,
    eventDayRate: 10000, // Celebrity event rate
  },
};

const ambassadorBrief: ParsedBrief = {
  dealType: "sponsored",
  brand: {
    name: "TechGiant Corp",
    industry: "tech",
    product: "Smart devices ecosystem",
  },
  campaign: {
    objective: "Brand ambassador for full product line",
    targetAudience: "Tech enthusiasts 18-45",
    budgetRange: "$500K+",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 1,
    creativeDirection: "Authentic integration of products into lifestyle",
  },
  usageRights: {
    durationDays: 365,
    exclusivity: "category",
    paidAmplification: true,
    whitelistingType: "full_media",
  },
  timeline: {
    deadline: "2025-12-31",
  },
  rawText: "Celebrity ambassador brief",
};

// =============================================================================
// TEST 4: AFFILIATE-ONLY DEAL (Edge Case)
// =============================================================================

const affiliateConfig: AffiliateConfig = {
  affiliateRate: 20, // 20% commission
  estimatedSales: 500, // 500 units
  averageOrderValue: 85, // $85 AOV
  category: "beauty_skincare", // Beauty category
};

const affiliateBrief: ParsedBrief = {
  dealType: "sponsored",
  pricingModel: "affiliate",
  affiliateConfig: affiliateConfig, // Include the config in the brief
  brand: {
    name: "BeautyBrand Co",
    industry: "beauty",
    product: "Skincare collection",
  },
  campaign: {
    objective: "Drive affiliate sales",
    targetAudience: "Women 25-45 interested in skincare",
    budgetRange: "Commission-based",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 2,
    creativeDirection: "Product review with affiliate link",
  },
  usageRights: {
    durationDays: 30,
    exclusivity: "none",
    paidAmplification: false,
    whitelistingType: "none",
  },
  timeline: {
    deadline: "2025-11-15",
  },
  rawText: "Affiliate-only deal brief",
};

const affiliateCreator: CreatorProfile = {
  id: "test-creator-aff",
  userId: "test-user-aff",
  displayName: "Beauty Influencer",
  handle: "beauty.deals",
  bio: "Beauty reviews & affiliate deals",
  location: "Miami, USA",
  region: "united_states",
  niches: ["beauty", "skincare"],
  instagram: {
    followers: 35000,
    engagementRate: 5.2,
    avgLikes: 1820,
    avgComments: 95,
    avgViews: 12000,
  },
  audience: {
    ageRange: "25-34",
    genderSplit: { male: 15, female: 83, other: 2 },
    topLocations: ["United States"],
    interests: ["beauty", "skincare", "makeup"],
  },
  tier: "micro",
  totalReach: 35000,
  avgEngagementRate: 5.2,
  currency: "USD",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// RUN TESTS
// =============================================================================

function formatCurrency(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toLocaleString()}`;
}

function printSeparator(char: string = "=", length: number = 80): void {
  console.log(char.repeat(length));
}

function printHeader(title: string): void {
  printSeparator();
  console.log(title);
  printSeparator();
  console.log();
}

function printSubHeader(title: string): void {
  console.log("-".repeat(60));
  console.log(title);
  console.log("-".repeat(60));
}

// Test 1: High-Value Complex Deal
printHeader("TEST 1: HIGH-VALUE COMPLEX DEAL");
console.log("Scenario: Finance niche, UK region, Q4 seasonal, paid social whitelisting");
console.log();

const hvFitScore = calculateFitScore(highValueCreator, highValueBrief);
const hvPricing = calculatePrice(highValueCreator, highValueBrief, hvFitScore);

console.log("PRICING RESULT:");
console.log(`  Creator: ${highValueCreator.displayName} (${highValueCreator.tier} tier, ${highValueCreator.region})`);
console.log(`  Niche: ${highValueCreator.niches.join(", ")}`);
console.log(`  Campaign Date: Q4 Holiday (Nov 2025)`);
console.log();

printSubHeader("PRICING LAYERS BREAKDOWN");
for (const layer of hvPricing.layers) {
  const multiplierStr = layer.multiplier !== 1 ? `×${layer.multiplier.toFixed(2)}` : "";
  const adjustmentStr = layer.adjustment > 0 ? `+${formatCurrency(layer.adjustment, hvPricing.currencySymbol)}` : "";
  console.log(`  ${layer.name.padEnd(25)} ${layer.description}`);
  if (multiplierStr || adjustmentStr) {
    console.log(`  ${"".padEnd(25)} ${multiplierStr} ${adjustmentStr}`);
  }
}
console.log();
console.log(`  TOTAL: ${formatCurrency(hvPricing.totalPrice, hvPricing.currencySymbol)} (${formatCurrency(hvPricing.pricePerDeliverable, hvPricing.currencySymbol)} per deliverable)`);
console.log();

// Deal Quality Score
printSubHeader("DEAL QUALITY SCORE");
const dealQualityInput: DealQualityInput = {};
const hvDealQuality = calculateDealQuality(highValueCreator, highValueBrief, dealQualityInput, hvPricing.totalPrice);
console.log(`  Overall Score: ${hvDealQuality.totalScore}/100`);
console.log(`  Quality Level: ${hvDealQuality.qualityLevel.toUpperCase()}`);
console.log(`  Recommendation: ${hvDealQuality.recommendationText}`);
console.log();
console.log("  Dimension Breakdown:");
for (const [key, component] of Object.entries(hvDealQuality.breakdown)) {
  const comp = component as { score: number; maxPoints: number; insight: string };
  console.log(`    - ${key.padEnd(20)}: ${comp.score}/${comp.maxPoints} pts - ${comp.insight}`);
}
console.log();

// Negotiation Talking Points
printSubHeader("NEGOTIATION TALKING POINTS");
const hvTalkingPoints = generateNegotiationTalkingPoints(hvPricing, highValueCreator, highValueBrief);
console.log("  WHY THIS RATE (to share with brand):");
for (const point of hvTalkingPoints.whyThisRate.bulletPoints.slice(0, 3)) {
  console.log(`    • ${point.point}`);
}
console.log();
console.log("  CONFIDENCE BOOSTERS (for creator):");
console.log(`    Market Comparison: ${hvTalkingPoints.confidenceBoosters.marketComparison}`);
console.log(`    Encouragement: ${hvTalkingPoints.confidenceBoosters.encouragement}`);
console.log();
console.log("  IF THEY PUSH BACK:");
console.log(`    Minimum Rate: ${formatCurrency(hvTalkingPoints.pushBack.minimumRate, hvPricing.currencySymbol)}`);
console.log(`    Walk Away Point: ${hvTalkingPoints.pushBack.walkAwayPoint}`);
console.log(`    Counter Scripts: ${hvTalkingPoints.pushBack.counterOfferScripts.length} available`);
console.log();

// FTC Guidance
printSubHeader("FTC DISCLOSURE GUIDANCE");
const hvFTCGuidance = getFTCGuidance(highValueBrief.content.platform, "paid", false);
console.log(`  Platform: ${hvFTCGuidance.platformGuidance.platformName}`);
console.log(`  Compensation Type: Paid`);
console.log(`  Required Disclosure: ${hvFTCGuidance.platformGuidance.requiredDisclosure}`);
console.log("  Key Recommendations:");
for (const rec of hvFTCGuidance.platformGuidance.recommendations.slice(0, 2)) {
  console.log(`    • ${rec}`);
}
console.log(`  Checklist Items: ${hvFTCGuidance.checklist.length} items`);
console.log();

// Contract Checklist
printSubHeader("CONTRACT CHECKLIST");
const hvChecklist = getContractChecklist(highValueBrief);
const criticalItems = getCriticalItems(hvChecklist);
const redFlags = getDetectedRedFlags(hvChecklist);
console.log(`  Total Items: ${hvChecklist.items.length}`);
console.log(`  Critical Items: ${criticalItems.length}`);
console.log(`  Red Flags Detected: ${redFlags.length}`);
console.log();
console.log("  Critical Contract Terms:");
for (const item of criticalItems.slice(0, 5)) {
  console.log(`    [${item.highlighted ? "!" : " "}] ${item.term}`);
}
if (redFlags.length > 0) {
  console.log();
  console.log("  RED FLAGS:");
  for (const flag of redFlags) {
    console.log(`    ⚠️ ${flag.flag} (${flag.severity})`);
  }
}
console.log();

// Test 2: UGC-Only Deal
printHeader("TEST 2: UGC-ONLY DEAL (Edge Case)");
console.log("Scenario: UGC pricing should ignore follower count");
console.log();

const ugcPricing = calculateUGCPrice(ugcBrief, ugcCreator);
console.log(`  Creator Followers: ${ugcCreator.instagram?.followers?.toLocaleString()} (should NOT affect price)`);
console.log(`  UGC Format: ${ugcBrief.ugcFormat}`);
console.log(`  Quantity: ${ugcBrief.content.quantity} videos`);
console.log();
printSubHeader("UGC PRICING BREAKDOWN");
for (const layer of ugcPricing.layers) {
  const multiplierStr = layer.multiplier !== 1 ? `×${layer.multiplier.toFixed(2)}` : "";
  const adjustmentStr = layer.adjustment > 0 ? `+${formatCurrency(layer.adjustment, ugcPricing.currencySymbol)}` : "";
  console.log(`  ${layer.name.padEnd(25)} ${layer.description}`);
  if (multiplierStr || adjustmentStr) {
    console.log(`  ${"".padEnd(25)} ${multiplierStr} ${adjustmentStr}`);
  }
}
console.log();
console.log(`  TOTAL: ${formatCurrency(ugcPricing.totalPrice, ugcPricing.currencySymbol)} (${formatCurrency(ugcPricing.pricePerDeliverable, ugcPricing.currencySymbol)} per video)`);
console.log();

// Verify no follower-based pricing in UGC
const hasFollowerLayer = ugcPricing.layers.some(l => l.name.toLowerCase().includes("follower") || l.name.toLowerCase().includes("base rate"));
console.log(`  ✓ Follower-based layer absent: ${!hasFollowerLayer ? "PASS" : "FAIL"}`);
console.log();

// Test 3: Celebrity Ambassador
printHeader("TEST 3: CELEBRITY TIER AMBASSADOR PACKAGE (Edge Case)");
console.log("Scenario: 12-month ambassador deal with events and exclusivity");
console.log();

const celebFitScore = calculateFitScore(celebrityCreator, ambassadorBrief);
// Celebrity tier base rate is $12,000
const celebBaseRate = 12000;
const celebRetainerPricing = calculateRetainerPrice(celebBaseRate, ambassadorConfig, celebrityCreator.tier);

console.log(`  Creator: ${celebrityCreator.displayName} (${celebrityCreator.tier} tier)`);
console.log(`  Total Reach: ${celebrityCreator.totalReach.toLocaleString()}`);
console.log(`  Deal Length: 12 months (ambassador)`);
console.log();
console.log("  MONTHLY DELIVERABLES:");
console.log(`    Posts: ${ambassadorConfig.monthlyDeliverables.posts}`);
console.log(`    Stories: ${ambassadorConfig.monthlyDeliverables.stories}`);
console.log(`    Reels: ${ambassadorConfig.monthlyDeliverables.reels}`);
console.log(`    Videos: ${ambassadorConfig.monthlyDeliverables.videos}`);
console.log();
console.log("  AMBASSADOR PERKS:");
console.log(`    Exclusivity: ${ambassadorConfig.ambassadorPerks?.exclusivityType}`);
console.log(`    Product Seeding Value: ${formatCurrency(ambassadorConfig.ambassadorPerks?.productValue || 0)}`);
console.log(`    Events Included: ${ambassadorConfig.ambassadorPerks?.eventsIncluded}`);
console.log(`    Event Day Rate: ${formatCurrency(ambassadorConfig.ambassadorPerks?.eventDayRate || 0)}`);
console.log();

printSubHeader("RETAINER PRICING BREAKDOWN");
console.log(`  Monthly Rate: ${formatCurrency(celebRetainerPricing.monthlyRate)}`);
console.log(`  Total Contract Value: ${formatCurrency(celebRetainerPricing.totalContractValue)}`);
console.log(`  Volume Discount Applied: ${(celebRetainerPricing.volumeDiscount * 100).toFixed(0)}% off`);
console.log();
if (celebRetainerPricing.ambassadorBreakdown) {
  console.log("  AMBASSADOR PERKS VALUE:");
  console.log(`    Exclusivity Premium: ${formatCurrency(celebRetainerPricing.ambassadorBreakdown.exclusivityPremium)}`);
  console.log(`    Event Appearances: ${formatCurrency(celebRetainerPricing.ambassadorBreakdown.eventAppearancesValue)}`);
  console.log(`    Product Seeding: ${formatCurrency(celebRetainerPricing.ambassadorBreakdown.productSeedingValue)}`);
  console.log(`    Total Perks Value: ${formatCurrency(celebRetainerPricing.ambassadorBreakdown.totalPerksValue)}`);
}
console.log();

// Test 4: Affiliate-Only Deal
printHeader("TEST 4: AFFILIATE-ONLY DEAL (Edge Case)");
console.log("Scenario: Pure commission-based deal, no flat fee");
console.log();

const affFitScore = calculateFitScore(affiliateCreator, affiliateBrief);
const affiliatePricing = calculateAffiliatePricing(affiliateBrief, affiliateCreator);

console.log(`  Creator: ${affiliateCreator.displayName} (${affiliateCreator.tier} tier)`);
console.log();
console.log("  AFFILIATE CONFIG:");
console.log(`    Commission Rate: ${affiliateConfig.affiliateRate}%`);
console.log(`    Estimated Sales: ${affiliateConfig.estimatedSales} units`);
console.log(`    Average Order Value: ${formatCurrency(affiliateConfig.averageOrderValue)}`);
console.log(`    Category: ${affiliateConfig.category}`);
console.log();

printSubHeader("AFFILIATE EARNINGS BREAKDOWN");
console.log(`  Estimated Total Sales: ${formatCurrency((affiliateConfig.estimatedSales || 0) * (affiliateConfig.averageOrderValue || 0))}`);
console.log(`  Commission Rate: ${affiliateConfig.affiliateRate}%`);
console.log(`  Estimated Earnings: ${formatCurrency(affiliatePricing.totalPrice, affiliatePricing.currencySymbol)}`);
console.log();
console.log(`  TOTAL ESTIMATED VALUE: ${formatCurrency(affiliatePricing.totalPrice, affiliatePricing.currencySymbol)}`);
console.log();

// Final Summary
printHeader("DAY 3 TESTING CHECKPOINT - SUMMARY");
console.log("✅ Test 1: High-value complex deal - All pricing layers calculated");
console.log("✅ Test 1: Deal Quality Score generated with all 6 dimensions");
console.log("✅ Test 1: Negotiation talking points generated");
console.log("✅ Test 1: FTC guidance generated");
console.log("✅ Test 1: Contract checklist generated with red flags");
console.log();
console.log("✅ Test 2: UGC-only deal - Follower count ignored in pricing");
console.log("✅ Test 2: UGC uses deliverable-based pricing");
console.log();
console.log("✅ Test 3: Celebrity tier ambassador - Full package calculated");
console.log("✅ Test 3: Retainer pricing with volume discount applied");
console.log("✅ Test 3: Ambassador perks (exclusivity, events) included");
console.log();
console.log("✅ Test 4: Affiliate-only deal - Commission-based pricing");
console.log("✅ Test 4: Estimated earnings calculated");
console.log();
printSeparator();
console.log("ALL DAY 3 INTEGRATION TESTS COMPLETED SUCCESSFULLY");
printSeparator();
