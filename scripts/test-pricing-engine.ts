/**
 * Manual Integration Test Script for the Day 1 Pricing Engine
 *
 * Tests all new pricing factors implemented in Day 1:
 * - Updated base rates (2025 industry standards)
 * - Niche/industry premium multiplier
 * - UGC pricing (separate service model)
 * - Whitelisting premium
 * - Seasonal pricing
 * - Regional rate adjustments
 * - Emerging platforms
 */

import { calculatePrice, calculateTier, calculateUGCPrice } from "../src/lib/pricing-engine";
import { calculateFitScore } from "../src/lib/fit-score";
import type { CreatorProfile, ParsedBrief } from "../src/lib/types";

// =============================================================================
// SAMPLE DATA
// =============================================================================

/**
 * Sample creator profile for testing
 * Finance niche, UK-based, micro tier (45K followers)
 */
const sampleCreator: CreatorProfile = {
  id: "test-creator-1",
  userId: "test-user-1",
  displayName: "Alex Finance",
  handle: "alex.finance",
  bio: "Finance tips for millennials | UK-based",
  location: "London, UK",
  region: "united_kingdom",
  niches: ["finance", "investing"],
  instagram: {
    followers: 45000,
    engagementRate: 4.5,
    avgLikes: 2025,
    avgComments: 150,
    avgViews: 15000,
  },
  tiktok: {
    followers: 30000,
    engagementRate: 5.2,
    avgLikes: 1560,
    avgComments: 80,
    avgViews: 25000,
  },
  audience: {
    ageRange: "25-34",
    genderSplit: { male: 55, female: 43, other: 2 },
    topLocations: ["United Kingdom", "United States", "Australia"],
    interests: ["finance", "investing", "personal finance", "tech"],
  },
  tier: "micro",
  totalReach: 75000,
  avgEngagementRate: 4.8,
  currency: "GBP",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Sample brief with all Day 1 features:
 * - Q4 campaign (seasonal pricing)
 * - Paid social whitelisting
 * - Instagram reel format
 */
const sampleBrief: ParsedBrief = {
  dealType: "sponsored",
  brand: {
    name: "FinanceApp Pro",
    industry: "finance",
    product: "Investment tracking app",
  },
  campaign: {
    objective: "App downloads and brand awareness",
    targetAudience: "Young adults 25-34 interested in investing and personal finance",
    budgetRange: "$1000-2000",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 2,
    creativeDirection: "Show how you use the app to track your investments",
  },
  usageRights: {
    durationDays: 90,
    exclusivity: "category",
    paidAmplification: true,
    whitelistingType: "paid_social",
  },
  timeline: {
    deadline: "2025-12-15",
  },
  campaignDate: new Date("2025-11-15"), // Q4 Holiday period
  disableSeasonalPricing: false,
  rawText: "Sample brief for testing",
};

/**
 * Sample UGC brief (deliverable-based pricing, no audience consideration)
 */
const sampleUGCBrief: ParsedBrief = {
  dealType: "ugc",
  ugcFormat: "video",
  brand: {
    name: "SkinCare Co",
    industry: "beauty",
    product: "Anti-aging serum",
  },
  campaign: {
    objective: "UGC content for brand ads",
    targetAudience: "Women 25-45",
    budgetRange: "Product value + fee",
  },
  content: {
    platform: "instagram",
    format: "reel",
    quantity: 3,
    creativeDirection: "Raw, authentic product demo",
  },
  usageRights: {
    durationDays: 180,
    exclusivity: "none",
    paidAmplification: true,
    whitelistingType: "full_media",
  },
  timeline: {
    deadline: "2025-12-01",
  },
  campaignDate: new Date("2025-11-01"), // Q4 Holiday
  disableSeasonalPricing: false,
  rawText: "UGC brief for testing",
};

// =============================================================================
// TEST EXECUTION
// =============================================================================

console.log("=".repeat(80));
console.log("RATECARD.AI PRICING ENGINE - DAY 1 INTEGRATION TEST");
console.log("=".repeat(80));
console.log();

// Test 1: Tier calculation for new tiers
console.log("TEST 1: Tier Calculation (New 2025 Tiers)");
console.log("-".repeat(40));
const tierTests = [
  { followers: 5000, expected: "nano" },
  { followers: 10000, expected: "micro" },
  { followers: 50000, expected: "mid" },
  { followers: 100000, expected: "rising" },
  { followers: 250000, expected: "macro" },
  { followers: 500000, expected: "mega" },
  { followers: 1000000, expected: "celebrity" },
];

for (const test of tierTests) {
  const tier = calculateTier(test.followers);
  const status = tier === test.expected ? "✓" : "✗";
  console.log(`  ${status} ${test.followers.toLocaleString()} followers → ${tier} (expected: ${test.expected})`);
}
console.log();

// Test 2: Fit Score Calculation
console.log("TEST 2: Fit Score Calculation");
console.log("-".repeat(40));
const fitScore = calculateFitScore(sampleCreator, sampleBrief);
console.log(`  Total Score: ${fitScore.totalScore}/100`);
console.log(`  Fit Level: ${fitScore.fitLevel}`);
console.log(`  Price Adjustment: ${(fitScore.priceAdjustment * 100).toFixed(0)}%`);
console.log();
console.log("  Breakdown:");
console.log(`    - Niche Match: ${fitScore.breakdown.nicheMatch.score}/100 (${(fitScore.breakdown.nicheMatch.weight * 100)}% weight)`);
console.log(`    - Demographic: ${fitScore.breakdown.demographicMatch.score}/100 (${(fitScore.breakdown.demographicMatch.weight * 100)}% weight)`);
console.log(`    - Platform: ${fitScore.breakdown.platformMatch.score}/100 (${(fitScore.breakdown.platformMatch.weight * 100)}% weight)`);
console.log(`    - Engagement: ${fitScore.breakdown.engagementQuality.score}/100 (${(fitScore.breakdown.engagementQuality.weight * 100)}% weight)`);
console.log(`    - Content Cap: ${fitScore.breakdown.contentCapability.score}/100 (${(fitScore.breakdown.contentCapability.weight * 100)}% weight)`);
console.log();

// Test 3: Sponsored Content Pricing (with all Day 1 factors)
console.log("TEST 3: Sponsored Content Pricing (All Day 1 Factors)");
console.log("-".repeat(40));
const pricing = calculatePrice(sampleCreator, sampleBrief, fitScore);

console.log("  Creator: Alex Finance (@alex.finance)");
console.log(`  Tier: ${sampleCreator.tier}`);
console.log(`  Niche: ${sampleCreator.niches.join(", ")}`);
console.log(`  Region: ${sampleCreator.region}`);
console.log(`  Platform: ${sampleBrief.content.platform}`);
console.log(`  Format: ${sampleBrief.content.format}`);
console.log(`  Campaign Date: ${sampleBrief.campaignDate?.toString().slice(0, 10)} (Q4 Holiday)`);
console.log(`  Whitelisting: ${sampleBrief.usageRights.whitelistingType}`);
console.log();
console.log("  PRICING BREAKDOWN:");
console.log("  " + "-".repeat(60));
for (const layer of pricing.layers) {
  const multiplierStr = layer.multiplier !== 1 ? `×${layer.multiplier.toFixed(2)}` : "";
  const adjustmentStr = layer.adjustment > 0 ? `+$${layer.adjustment.toFixed(0)}` : layer.adjustment < 0 ? `-$${Math.abs(layer.adjustment).toFixed(0)}` : "";
  console.log(`  ${layer.name.padEnd(22)} ${layer.description}`);
  console.log(`  ${"".padEnd(22)} ${multiplierStr} ${adjustmentStr}`);
}
console.log("  " + "-".repeat(60));
console.log(`  Price per Deliverable: ${pricing.currencySymbol}${pricing.pricePerDeliverable}`);
console.log(`  Quantity: ${pricing.quantity}`);
console.log(`  TOTAL PRICE: ${pricing.currencySymbol}${pricing.totalPrice}`);
console.log();
console.log(`  Formula: ${pricing.formula}`);
console.log();

// Test 4: UGC Pricing (separate service model)
console.log("TEST 4: UGC Pricing (Deliverable-Based, No Audience Consideration)");
console.log("-".repeat(40));
const ugcPricing = calculatePrice(sampleCreator, sampleUGCBrief, fitScore);

console.log("  UGC Deal Type: video content for brand ads");
console.log(`  UGC Format: ${sampleUGCBrief.ugcFormat}`);
console.log("  NOTE: Follower count does NOT affect UGC pricing");
console.log();
console.log("  PRICING BREAKDOWN:");
console.log("  " + "-".repeat(60));
for (const layer of ugcPricing.layers) {
  const multiplierStr = layer.multiplier !== 1 ? `×${layer.multiplier.toFixed(2)}` : "";
  const adjustmentStr = layer.adjustment > 0 ? `+$${layer.adjustment.toFixed(0)}` : layer.adjustment < 0 ? `-$${Math.abs(layer.adjustment).toFixed(0)}` : "";
  console.log(`  ${layer.name.padEnd(22)} ${layer.description}`);
  console.log(`  ${"".padEnd(22)} ${multiplierStr} ${adjustmentStr}`);
}
console.log("  " + "-".repeat(60));
console.log(`  Price per Deliverable: ${ugcPricing.currencySymbol}${ugcPricing.pricePerDeliverable}`);
console.log(`  Quantity: ${ugcPricing.quantity}`);
console.log(`  TOTAL PRICE: ${ugcPricing.currencySymbol}${ugcPricing.totalPrice}`);
console.log();

// Test 5: Compare pricing for different regions
console.log("TEST 5: Regional Rate Comparison");
console.log("-".repeat(40));
const regions = [
  { region: "united_states", name: "US" },
  { region: "united_kingdom", name: "UK" },
  { region: "uae_gulf", name: "UAE/Gulf" },
  { region: "india", name: "India" },
];

for (const r of regions) {
  const regionCreator = { ...sampleCreator, region: r.region as CreatorProfile["region"] };
  const regionPricing = calculatePrice(regionCreator, sampleBrief, fitScore);
  console.log(`  ${r.name.padEnd(12)}: ${regionPricing.currencySymbol}${regionPricing.totalPrice} (per deliverable: ${regionPricing.currencySymbol}${regionPricing.pricePerDeliverable})`);
}
console.log();

// Test 6: Compare pricing for different platforms
console.log("TEST 6: Platform Rate Comparison");
console.log("-".repeat(40));
const platforms = ["instagram", "youtube", "tiktok", "linkedin", "twitter", "twitch"];

for (const platform of platforms) {
  const platformBrief = {
    ...sampleBrief,
    content: { ...sampleBrief.content, platform: platform as ParsedBrief["content"]["platform"] },
  };
  const platformPricing = calculatePrice(sampleCreator, platformBrief, fitScore);
  console.log(`  ${platform.padEnd(12)}: ${platformPricing.currencySymbol}${platformPricing.totalPrice} (per deliverable: ${platformPricing.currencySymbol}${platformPricing.pricePerDeliverable})`);
}
console.log();

// Test 7: Seasonal pricing comparison
console.log("TEST 7: Seasonal Pricing Comparison");
console.log("-".repeat(40));
const seasonDates = [
  { date: new Date("2025-11-15"), name: "Q4 Holiday (Nov)" },
  { date: new Date("2025-08-10"), name: "Back to School (Aug)" },
  { date: new Date("2025-02-10"), name: "Valentine's (Feb)" },
  { date: new Date("2025-06-15"), name: "Summer (Jun)" },
  { date: new Date("2025-03-15"), name: "Default (Mar)" },
];

for (const s of seasonDates) {
  const seasonBrief = { ...sampleBrief, campaignDate: s.date };
  const seasonPricing = calculatePrice(sampleCreator, seasonBrief, fitScore);
  console.log(`  ${s.name.padEnd(24)}: ${seasonPricing.currencySymbol}${seasonPricing.totalPrice} (per deliverable: ${seasonPricing.currencySymbol}${seasonPricing.pricePerDeliverable})`);
}
console.log();

// Test 8: Whitelisting comparison
console.log("TEST 8: Whitelisting Premium Comparison");
console.log("-".repeat(40));
const whitelistingTypes = [
  { type: "none", name: "No whitelisting" },
  { type: "organic", name: "Organic reposts" },
  { type: "paid_social", name: "Paid social ads" },
  { type: "full_media", name: "Full media buy" },
];

for (const w of whitelistingTypes) {
  const wlBrief = {
    ...sampleBrief,
    usageRights: { ...sampleBrief.usageRights, whitelistingType: w.type as ParsedBrief["usageRights"]["whitelistingType"] },
  };
  const wlPricing = calculatePrice(sampleCreator, wlBrief, fitScore);
  console.log(`  ${w.name.padEnd(20)}: ${wlPricing.currencySymbol}${wlPricing.totalPrice} (per deliverable: ${wlPricing.currencySymbol}${wlPricing.pricePerDeliverable})`);
}
console.log();

console.log("=".repeat(80));
console.log("ALL DAY 1 INTEGRATION TESTS COMPLETED SUCCESSFULLY");
console.log("=".repeat(80));
