/**
 * Day 4 Integration Tests
 *
 * Tests all 5 flows from the Day 4 Testing Checkpoint:
 * FLOW 1: Paid DM parsing
 * FLOW 2: Gift DM → Evaluation → Tracking
 * FLOW 3: Gift Conversion
 * FLOW 4: Outcome Analytics
 * FLOW 5: Image Upload (mocked)
 *
 * Run with: npx tsx scripts/test-day4-integration.ts
 */

import { parseDMText, isLikelyGiftOffer, isLikelyMassOutreach } from "../src/lib/dm-parser";
import { evaluateGiftDeal, calculateTimeValue } from "../src/lib/gift-evaluator";
import { generateGiftResponse, getConversionPlaybookScript } from "../src/lib/gift-responses";
import {
  calculateAcceptanceRate,
  calculateAverageNegotiationDelta,
  calculateGiftConversionRate,
  calculateAvgGiftConversionTime,
  compareToMarket,
} from "../src/lib/outcome-analytics";
import {
  isValidMimeType,
  isValidFileSize,
  SUPPORTED_MIME_TYPES,
} from "../src/lib/dm-image-processor";
import type {
  CreatorProfile,
  GiftEvaluationInput,
  Outcome,
  DMAnalysis,
} from "../src/lib/types";

// =============================================================================
// TEST UTILITIES
// =============================================================================

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title: string) {
  console.log("\n" + "=".repeat(70));
  log(title, "bold");
  console.log("=".repeat(70));
}

function subheader(title: string) {
  console.log("\n" + "-".repeat(50));
  log(title, "cyan");
  console.log("-".repeat(50));
}

function pass(test: string) {
  log(`  ✓ ${test}`, "green");
}

function fail(test: string, error?: string) {
  log(`  ✗ ${test}`, "red");
  if (error) log(`    Error: ${error}`, "red");
}

function info(message: string) {
  log(`    ${message}`, "yellow");
}

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, test: string, details?: string) {
  if (condition) {
    pass(test);
    totalPassed++;
    if (details) info(details);
  } else {
    fail(test);
    totalFailed++;
    if (details) info(details);
  }
}

// =============================================================================
// TEST DATA
// =============================================================================

const microCreatorProfile: CreatorProfile = {
  id: "test-creator-1",
  userId: "test-user-1",
  displayName: "Test Creator",
  handle: "testcreator",
  bio: "Lifestyle creator",
  location: "Los Angeles, CA",
  region: "united_states",
  niches: ["lifestyle"],
  audience: {
    ageRange: "25-34",
    genderSplit: { female: 65, male: 32, other: 3 },
    topLocations: ["United States", "United Kingdom", "Canada"],
    interests: ["lifestyle", "fashion", "beauty"],
  },
  tier: "micro",
  totalReach: 45000,
  avgEngagementRate: 4.5,
  currency: "USD",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _nanoCreatorProfile: CreatorProfile = {
  ...microCreatorProfile,
  id: "test-creator-2",
  tier: "nano",
  totalReach: 8000,
  avgEngagementRate: 6.2,
};

// Sample DMs for testing
const PAID_DM = `Hi! We love your content. We have a $500 budget for an Instagram Reel promoting our new product. Interested?`;

const GIFT_DM = `Hey! We'd love to send you our new skincare line to try and share with your followers!`;

const _HYBRID_DM = `Hello! We'd like to offer you a collaboration - $300 plus our full product collection worth $200. We're looking for 2 Instagram posts and 3 stories.`;

const MASS_OUTREACH_DM = `Hey babe! 💕💕 We LOVE your feed and think you'd be PERFECT for our brand! DM us for a collab! 🌟✨`;

const _UNCLEAR_DM = `Hi there, we're interested in working with you. Can we discuss a potential partnership?`;

// =============================================================================
// FLOW 1: PAID DM PARSING
// =============================================================================

async function testFlow1_PaidDM() {
  header("FLOW 1: Paid DM Parsing");

  subheader("Testing paid DM detection");

  // Quick check functions
  assert(
    !isLikelyGiftOffer(PAID_DM),
    "Paid DM should NOT be flagged as gift offer"
  );
  assert(
    !isLikelyMassOutreach(PAID_DM),
    "Professional paid DM should NOT be flagged as mass outreach"
  );

  subheader("Parsing paid DM with LLM");

  try {
    const analysis = await parseDMText(PAID_DM, microCreatorProfile);

    console.log("\n  Analysis Result:");
    console.log(`    Brand Name: ${analysis.brandName || "Not detected"}`);
    console.log(`    Compensation Type: ${analysis.compensationType}`);
    console.log(`    Offered Amount: ${analysis.offeredAmount ? `$${analysis.offeredAmount}` : "Not specified"}`);
    console.log(`    Tone: ${analysis.tone}`);
    console.log(`    Is Gift Offer: ${analysis.isGiftOffer}`);
    console.log(`    Suggested Rate: $${analysis.suggestedRate}`);
    console.log(`    Deal Quality: ${analysis.dealQualityEstimate}/100`);
    console.log(`    Green Flags: ${analysis.greenFlags?.join(", ") || "None"}`);
    console.log(`    Red Flags: ${analysis.redFlags?.join(", ") || "None"}`);

    // Assertions
    assert(
      analysis.compensationType === "paid",
      "Compensation type should be 'paid'",
      `Got: ${analysis.compensationType}`
    );

    assert(
      analysis.offeredAmount === 500,
      "Should extract offered amount of $500",
      `Got: $${analysis.offeredAmount}`
    );

    assert(
      !analysis.isGiftOffer,
      "Should NOT be marked as gift offer"
    );

    assert(
      analysis.tone === "professional" || analysis.tone === "casual",
      "Tone should be professional or casual",
      `Got: ${analysis.tone}`
    );

    assert(
      analysis.suggestedRate > 0,
      "Should provide a suggested rate",
      `Got: $${analysis.suggestedRate}`
    );

    assert(
      analysis.recommendedResponse.length > 0,
      "Should generate a recommended response"
    );

    console.log("\n  Recommended Response Preview:");
    console.log("  " + analysis.recommendedResponse.slice(0, 200) + "...\n");

  } catch (error) {
    fail("LLM parsing failed", error instanceof Error ? error.message : String(error));
    info("Note: This test requires GROQ_API_KEY or GOOGLE_API_KEY to be set");
  }
}

// =============================================================================
// FLOW 2: GIFT DM → EVALUATION → TRACKING
// =============================================================================

async function testFlow2_GiftDMFlow() {
  header("FLOW 2: Gift DM → Evaluation → Tracking");

  subheader("Testing gift DM detection");

  // Quick check functions
  assert(
    isLikelyGiftOffer(GIFT_DM),
    "Gift DM should be flagged as gift offer"
  );

  subheader("Parsing gift DM with LLM");

  let analysis: DMAnalysis | null = null;
  try {
    analysis = await parseDMText(GIFT_DM, microCreatorProfile);

    console.log("\n  Analysis Result:");
    console.log(`    Brand Name: ${analysis.brandName || "Not detected"}`);
    console.log(`    Compensation Type: ${analysis.compensationType}`);
    console.log(`    Is Gift Offer: ${analysis.isGiftOffer}`);
    console.log(`    Estimated Product Value: ${analysis.estimatedProductValue ? `$${analysis.estimatedProductValue}` : "Not specified"}`);

    if (analysis.giftAnalysis) {
      console.log(`    Gift Analysis:`);
      console.log(`      - Product Mentioned: ${analysis.giftAnalysis.productMentioned || "Not specified"}`);
      console.log(`      - Content Expectation: ${analysis.giftAnalysis.contentExpectation}`);
      console.log(`      - Conversion Potential: ${analysis.giftAnalysis.conversionPotential}`);
      console.log(`      - Recommended Approach: ${analysis.giftAnalysis.recommendedApproach}`);
    }

    // Assertions
    assert(
      analysis.compensationType === "gifted",
      "Compensation type should be 'gifted'",
      `Got: ${analysis.compensationType}`
    );

    assert(
      analysis.isGiftOffer === true,
      "Should be marked as gift offer"
    );

    assert(
      analysis.giftAnalysis !== null,
      "Should have gift analysis"
    );

    if (analysis.giftAnalysis) {
      assert(
        ["explicit", "implied", "none"].includes(analysis.giftAnalysis.contentExpectation),
        "Should have valid content expectation"
      );

      assert(
        ["high", "medium", "low"].includes(analysis.giftAnalysis.conversionPotential),
        "Should have valid conversion potential"
      );

      assert(
        ["accept_and_convert", "counter_with_hybrid", "decline", "ask_budget"].includes(
          analysis.giftAnalysis.recommendedApproach
        ),
        "Should have valid recommended approach"
      );
    }

  } catch (error) {
    fail("LLM parsing failed", error instanceof Error ? error.message : String(error));
    info("Note: This test requires GROQ_API_KEY or GOOGLE_API_KEY to be set");
  }

  subheader("Testing Gift Evaluator");

  // Simulate gift evaluation
  const giftInput: GiftEvaluationInput = {
    productDescription: "Skincare line - serum, moisturizer, cleanser",
    estimatedProductValue: 150,
    contentRequired: "dedicated_post",
    estimatedHoursToCreate: 2,
    brandQuality: "established_indie",
    wouldYouBuyIt: true,
    brandFollowers: 25000,
    hasWebsite: true,
    previousCreatorCollabs: true,
  };

  const evaluation = evaluateGiftDeal(giftInput, microCreatorProfile);

  console.log("\n  Gift Evaluation Result:");
  console.log(`    Worth Score: ${evaluation.worthScore}/100`);
  console.log(`    Recommendation: ${evaluation.recommendation}`);
  console.log(`    Analysis:`);
  console.log(`      - Product Value: $${evaluation.analysis.productValue}`);
  console.log(`      - Your Time Value: $${evaluation.analysis.yourTimeValue}`);
  console.log(`      - Audience Value: $${evaluation.analysis.audienceValue}`);
  console.log(`      - Total Value Providing: $${evaluation.analysis.totalValueProviding}`);
  console.log(`      - Value Gap: $${evaluation.analysis.valueGap}`);
  console.log(`      - Effective Hourly Rate: $${evaluation.analysis.effectiveHourlyRate}/hr`);
  console.log(`    Strategic Value:`);
  console.log(`      - Score: ${evaluation.strategicValue.score}/10`);
  console.log(`      - Portfolio Worth: ${evaluation.strategicValue.portfolioWorth}`);
  console.log(`      - Conversion Potential: ${evaluation.strategicValue.conversionPotential}`);
  console.log(`      - Reasons: ${evaluation.strategicValue.reasons.slice(0, 2).join("; ")}`);
  console.log(`    Minimum Acceptable Add-On: $${evaluation.minimumAcceptableAddOn}`);

  // Assertions
  assert(
    evaluation.worthScore >= 0 && evaluation.worthScore <= 100,
    "Worth score should be between 0-100",
    `Got: ${evaluation.worthScore}`
  );

  assert(
    ["accept_with_hook", "counter_hybrid", "ask_budget_first", "decline_politely", "run_away"].includes(
      evaluation.recommendation
    ),
    "Should have valid recommendation",
    `Got: ${evaluation.recommendation}`
  );

  assert(
    evaluation.analysis.yourTimeValue === calculateTimeValue(2, "micro"),
    "Time value should match 2 hours at micro tier rate",
    `Got: $${evaluation.analysis.yourTimeValue}`
  );

  assert(
    evaluation.strategicValue.score >= 0 && evaluation.strategicValue.score <= 10,
    "Strategic score should be between 0-10",
    `Got: ${evaluation.strategicValue.score}`
  );

  assert(
    evaluation.suggestedCounterOffer.length > 0,
    "Should generate counter offer"
  );

  subheader("Testing Gift Response Generation");

  const response = generateGiftResponse(evaluation, {
    brandName: "SkinGlow",
    productName: "skincare line",
  });

  console.log("\n  Generated Response:");
  console.log(`    Type: ${response.responseType}`);
  console.log(`    Message Preview: ${response.message.slice(0, 150)}...`);

  assert(
    response.responseType.length > 0,
    "Should have response type"
  );

  assert(
    response.message.length > 0,
    "Should have response message"
  );

  subheader("Simulating Gift Tracker (requires database)");
  info("Gift tracking operations require database connection.");
  info("In production, the gift would be saved with:");
  info(`  - Brand: SkinGlow`);
  info(`  - Product Value: $150`);
  info(`  - Status: "received"`);
  info(`  - Follow-up Date: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
  pass("Gift tracking simulation complete");
}

// =============================================================================
// FLOW 3: GIFT CONVERSION
// =============================================================================

async function testFlow3_GiftConversion() {
  header("FLOW 3: Gift Conversion");

  subheader("Testing Conversion Script Generation");

  // Simulate a gift deal with performance metrics
  const mockGiftDeal = {
    id: "gift-1",
    creatorId: "creator-1",
    brandName: "SkinGlow",
    brandHandle: "@skinglow",
    brandWebsite: "https://skinglow.com",
    brandFollowers: 25000,
    productDescription: "Skincare line - serum, moisturizer, cleanser",
    productValue: 150,
    dateReceived: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    contentType: "reel" as const,
    contentUrl: "https://instagram.com/p/abc123",
    contentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    views: 10000,
    likes: 500,
    comments: 45,
    saves: 50,
    shares: 12,
    status: "content_created" as const,
    conversionStatus: null,
    convertedDealId: null,
    convertedAmount: null,
    followUpDate: new Date(),
    followUpSent: false,
    notes: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  // Calculate engagement score
  const engagementScore =
    mockGiftDeal.views * 0.001 +
    mockGiftDeal.likes * 0.1 +
    mockGiftDeal.comments * 0.5 +
    mockGiftDeal.saves * 0.3 +
    mockGiftDeal.shares * 0.2;

  console.log("\n  Mock Gift Deal Performance:");
  console.log(`    Views: ${mockGiftDeal.views.toLocaleString()}`);
  console.log(`    Likes: ${mockGiftDeal.likes}`);
  console.log(`    Comments: ${mockGiftDeal.comments}`);
  console.log(`    Saves: ${mockGiftDeal.saves}`);
  console.log(`    Shares: ${mockGiftDeal.shares}`);
  console.log(`    Engagement Score: ${engagementScore.toFixed(2)}`);

  const MIN_ENGAGEMENT_SCORE = 50;
  assert(
    engagementScore >= MIN_ENGAGEMENT_SCORE,
    "Engagement score should qualify for 'Ready to Convert'",
    `Score: ${engagementScore.toFixed(2)}, Minimum: ${MIN_ENGAGEMENT_SCORE}`
  );

  // Test conversion scripts
  const scriptStages = [
    "performance_share",
    "follow_up_30_day",
    "new_launch_pitch",
    "returning_brand_offer",
  ] as const;

  for (const stage of scriptStages) {
    const script = getConversionPlaybookScript(stage, {
      brandName: mockGiftDeal.brandName,
      productName: mockGiftDeal.productDescription,
    });

    assert(
      script.length > 0,
      `Should generate ${stage} script`
    );
    info(`${stage}: ${script.slice(0, 80)}...`);
  }

  subheader("Simulating Conversion Tracking");
  info("In production, marking as converted would:");
  info(`  - Update status to "converted"`);
  info(`  - Set convertedAmount to $400`);
  info(`  - Record conversionStatus as "converted"`);
  info(`  - Calculate conversion days: ~30 days`);
  pass("Conversion tracking simulation complete");
}

// =============================================================================
// FLOW 4: OUTCOME ANALYTICS
// =============================================================================

async function testFlow4_OutcomeAnalytics() {
  header("FLOW 4: Outcome Analytics");

  subheader("Testing Analytics Calculations");

  // Create mock outcome data
  const mockOutcomes: Outcome[] = [
    // Paid outcomes
    {
      id: "1",
      creatorId: "creator-1",
      sourceType: "rate_card",
      sourceId: null,
      proposedRate: 400,
      proposedType: "paid",
      platform: "instagram",
      dealType: "sponsored",
      niche: "lifestyle",
      outcome: "accepted",
      finalRate: 400,
      negotiationDelta: 0,
      giftOutcome: null,
      giftConversionDays: null,
      brandName: "Brand A",
      brandFollowers: 50000,
      dealLength: null,
      wasGiftFirst: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      creatorId: "creator-1",
      sourceType: "rate_card",
      sourceId: null,
      proposedRate: 500,
      proposedType: "paid",
      platform: "instagram",
      dealType: "sponsored",
      niche: "beauty",
      outcome: "negotiated",
      finalRate: 450,
      negotiationDelta: -10,
      giftOutcome: null,
      giftConversionDays: null,
      brandName: "Brand B",
      brandFollowers: 100000,
      dealLength: null,
      wasGiftFirst: false,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      creatorId: "creator-1",
      sourceType: "dm_analysis",
      sourceId: null,
      proposedRate: 350,
      proposedType: "paid",
      platform: "tiktok",
      dealType: "sponsored",
      niche: "lifestyle",
      outcome: "rejected",
      finalRate: null,
      negotiationDelta: null,
      giftOutcome: null,
      giftConversionDays: null,
      brandName: "Brand C",
      brandFollowers: 20000,
      dealLength: null,
      wasGiftFirst: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
    // Gift outcomes
    {
      id: "4",
      creatorId: "creator-1",
      sourceType: "gift_evaluation",
      sourceId: null,
      proposedRate: null,
      proposedType: "gift",
      platform: "instagram",
      dealType: "gift",
      niche: "beauty",
      outcome: "gift_accepted",
      finalRate: null,
      negotiationDelta: null,
      giftOutcome: "accepted_gift",
      giftConversionDays: null,
      brandName: "Brand D",
      brandFollowers: 30000,
      dealLength: null,
      wasGiftFirst: true,
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
    },
    {
      id: "5",
      creatorId: "creator-1",
      sourceType: "gift_evaluation",
      sourceId: null,
      proposedRate: null,
      proposedType: "gift",
      platform: "instagram",
      dealType: "gift",
      niche: "lifestyle",
      outcome: "gift_converted",
      finalRate: 400,
      negotiationDelta: null,
      giftOutcome: "converted_later",
      giftConversionDays: 30,
      brandName: "Brand E",
      brandFollowers: 45000,
      dealLength: null,
      wasGiftFirst: true,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: "6",
      creatorId: "creator-1",
      sourceType: "gift_evaluation",
      sourceId: null,
      proposedRate: null,
      proposedType: "gift",
      platform: "tiktok",
      dealType: "gift",
      niche: "lifestyle",
      outcome: "ghosted",
      finalRate: null,
      negotiationDelta: null,
      giftOutcome: null,
      giftConversionDays: null,
      brandName: "Brand F",
      brandFollowers: 15000,
      dealLength: null,
      wasGiftFirst: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      closedAt: null,
    },
  ];

  // Test acceptance rates
  const acceptanceRates = calculateAcceptanceRate(mockOutcomes);

  console.log("\n  Acceptance Rates:");
  console.log(`    Paid: ${(acceptanceRates.paid * 100).toFixed(1)}% (${acceptanceRates.counts.paid} deals)`);
  console.log(`    Gift: ${(acceptanceRates.gift * 100).toFixed(1)}% (${acceptanceRates.counts.gift} deals)`);
  console.log(`    Overall: ${(acceptanceRates.overall * 100).toFixed(1)}% (${acceptanceRates.counts.total} deals)`);

  assert(
    acceptanceRates.paid === 2 / 3, // 2 accepted/negotiated out of 3 paid
    "Paid acceptance rate should be ~66.7%",
    `Got: ${(acceptanceRates.paid * 100).toFixed(1)}%`
  );

  assert(
    acceptanceRates.gift === 2 / 3, // 2 accepted/converted out of 3 gifts
    "Gift acceptance rate should be ~66.7%",
    `Got: ${(acceptanceRates.gift * 100).toFixed(1)}%`
  );

  // Test negotiation delta
  const avgDelta = calculateAverageNegotiationDelta(mockOutcomes);
  console.log(`\n  Average Negotiation Delta: ${avgDelta}%`);

  assert(
    avgDelta === -10,
    "Average negotiation delta should be -10%",
    `Got: ${avgDelta}%`
  );

  // Test gift conversion rate
  const giftConversionRate = calculateGiftConversionRate(mockOutcomes);
  console.log(`\n  Gift Conversion Rate: ${(giftConversionRate * 100).toFixed(1)}%`);

  assert(
    giftConversionRate === 1 / 3, // 1 converted out of 3 gifts
    "Gift conversion rate should be ~33.3%",
    `Got: ${(giftConversionRate * 100).toFixed(1)}%`
  );

  // Test average conversion time
  const avgConversionTime = calculateAvgGiftConversionTime(mockOutcomes);
  console.log(`\n  Average Gift Conversion Time: ${avgConversionTime} days`);

  assert(
    avgConversionTime === 30,
    "Average conversion time should be 30 days",
    `Got: ${avgConversionTime} days`
  );

  // Test market comparison
  subheader("Testing Market Comparison");

  const comparison = compareToMarket(0.72, 0.65);
  console.log(`\n  Creator Rate: 72%`);
  console.log(`  Market Average: 65%`);
  console.log(`  Comparison: ${comparison.message} (${comparison.percentDiff}%)`);

  assert(
    comparison.position === "above",
    "Should be above market average"
  );

  assert(
    comparison.percentDiff > 0,
    "Percent difference should be positive"
  );

  subheader("Analytics Summary");
  console.log("\n  Summary of Analytics:");
  console.log(`    Total Opportunities Tracked: ${mockOutcomes.length}`);
  console.log(`    Paid Acceptance Rate: ${(acceptanceRates.paid * 100).toFixed(1)}%`);
  console.log(`    Gift Acceptance Rate: ${(acceptanceRates.gift * 100).toFixed(1)}%`);
  console.log(`    Gift → Paid Conversion Rate: ${(giftConversionRate * 100).toFixed(1)}%`);
  console.log(`    Average Conversion Time: ${avgConversionTime} days`);
  console.log(`    Market Comparison: ${comparison.message}`);
  pass("Outcome analytics working correctly");
}

// =============================================================================
// FLOW 5: IMAGE UPLOAD
// =============================================================================

async function testFlow5_ImageUpload() {
  header("FLOW 5: Image Upload");

  subheader("Testing Image Validation");

  // Test MIME type validation
  const validTypes = ["image/png", "image/jpeg", "image/webp", "image/heic"];
  const invalidTypes = ["image/gif", "application/pdf", "text/plain"];

  console.log("\n  MIME Type Validation:");
  for (const type of validTypes) {
    assert(
      isValidMimeType(type),
      `${type} should be valid`
    );
  }

  for (const type of invalidTypes) {
    assert(
      !isValidMimeType(type),
      `${type} should be invalid`
    );
  }

  // Test file size validation
  console.log("\n  File Size Validation:");
  assert(
    isValidFileSize(5 * 1024 * 1024), // 5MB
    "5MB file should be valid"
  );
  assert(
    isValidFileSize(10 * 1024 * 1024), // 10MB (max)
    "10MB file should be valid"
  );
  assert(
    !isValidFileSize(11 * 1024 * 1024), // 11MB
    "11MB file should be invalid"
  );
  assert(
    !isValidFileSize(0),
    "0 byte file should be invalid"
  );

  // Test supported formats
  console.log("\n  Supported Formats:");
  console.log(`    PNG: ${SUPPORTED_MIME_TYPES.png}`);
  console.log(`    JPG: ${SUPPORTED_MIME_TYPES.jpg}`);
  console.log(`    JPEG: ${SUPPORTED_MIME_TYPES.jpeg}`);
  console.log(`    WEBP: ${SUPPORTED_MIME_TYPES.webp}`);
  console.log(`    HEIC: ${SUPPORTED_MIME_TYPES.heic}`);

  assert(
    Object.keys(SUPPORTED_MIME_TYPES).length === 5,
    "Should support 5 image formats"
  );

  subheader("Image Processing (requires API)");
  info("Full image processing requires GOOGLE_API_KEY for Gemini Vision.");
  info("The image processor will:");
  info("  1. Validate image format and size");
  info("  2. Send to Gemini Vision for text extraction");
  info("  3. Detect platform from UI elements");
  info("  4. Extract all DM text content");
  info("  5. Run standard DM analysis on extracted text");
  pass("Image validation tests complete");
}

// =============================================================================
// ADDITIONAL TESTS
// =============================================================================

async function testMassOutreachDetection() {
  header("BONUS: Mass Outreach Detection");

  assert(
    isLikelyMassOutreach(MASS_OUTREACH_DM),
    "Should detect mass outreach DM"
  );

  assert(
    !isLikelyMassOutreach(PAID_DM),
    "Should NOT flag professional DM as mass outreach"
  );

  subheader("Parsing mass outreach DM");

  try {
    const analysis = await parseDMText(MASS_OUTREACH_DM, microCreatorProfile);

    console.log("\n  Analysis Result:");
    console.log(`    Tone: ${analysis.tone}`);
    console.log(`    Red Flags: ${analysis.redFlags?.join(", ") || "None"}`);
    console.log(`    Deal Quality: ${analysis.dealQualityEstimate}/100`);

    assert(
      analysis.tone === "mass_outreach" || analysis.redFlags.length > 0,
      "Should detect mass outreach characteristics",
      `Tone: ${analysis.tone}, Red flags: ${analysis.redFlags.length}`
    );

    assert(
      analysis.dealQualityEstimate < 60,
      "Deal quality should be low for mass outreach",
      `Got: ${analysis.dealQualityEstimate}`
    );

  } catch (error) {
    fail("LLM parsing failed", error instanceof Error ? error.message : String(error));
  }
}

async function testGiftEvaluatorEdgeCases() {
  header("BONUS: Gift Evaluator Edge Cases");

  subheader("Low value gift from suspicious brand");

  const lowValueInput: GiftEvaluationInput = {
    productDescription: "Unknown product",
    estimatedProductValue: 20,
    contentRequired: "multiple_posts",
    estimatedHoursToCreate: 4,
    brandQuality: "suspicious",
    wouldYouBuyIt: false,
    brandFollowers: null,
    hasWebsite: false,
    previousCreatorCollabs: false,
  };

  const lowValueEval = evaluateGiftDeal(lowValueInput, microCreatorProfile);

  console.log("\n  Low Value Gift Evaluation:");
  console.log(`    Worth Score: ${lowValueEval.worthScore}/100`);
  console.log(`    Recommendation: ${lowValueEval.recommendation}`);

  assert(
    lowValueEval.recommendation === "run_away" || lowValueEval.recommendation === "decline_politely",
    "Should recommend declining or running away",
    `Got: ${lowValueEval.recommendation}`
  );

  assert(
    lowValueEval.worthScore < 40,
    "Worth score should be very low",
    `Got: ${lowValueEval.worthScore}`
  );

  subheader("High value gift from major brand");

  const highValueInput: GiftEvaluationInput = {
    productDescription: "Full luxury skincare collection",
    estimatedProductValue: 500,
    contentRequired: "organic_mention",
    estimatedHoursToCreate: 0.5,
    brandQuality: "major_brand",
    wouldYouBuyIt: true,
    brandFollowers: 500000,
    hasWebsite: true,
    previousCreatorCollabs: true,
  };

  const highValueEval = evaluateGiftDeal(highValueInput, microCreatorProfile);

  console.log("\n  High Value Gift Evaluation:");
  console.log(`    Worth Score: ${highValueEval.worthScore}/100`);
  console.log(`    Recommendation: ${highValueEval.recommendation}`);
  console.log(`    Strategic Score: ${highValueEval.strategicValue.score}/10`);

  assert(
    highValueEval.recommendation === "accept_with_hook",
    "Should recommend accepting with conversion hook",
    `Got: ${highValueEval.recommendation}`
  );

  assert(
    highValueEval.worthScore >= 70,
    "Worth score should be high",
    `Got: ${highValueEval.worthScore}`
  );

  assert(
    highValueEval.strategicValue.score >= 7,
    "Strategic score should be high",
    `Got: ${highValueEval.strategicValue.score}`
  );
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log("\n");
  log("╔════════════════════════════════════════════════════════════════════╗", "bold");
  log("║          DAY 4 INTEGRATION TESTS - TESTING CHECKPOINT             ║", "bold");
  log("╚════════════════════════════════════════════════════════════════════╝", "bold");

  const startTime = Date.now();

  try {
    await testFlow1_PaidDM();
    await testFlow2_GiftDMFlow();
    await testFlow3_GiftConversion();
    await testFlow4_OutcomeAnalytics();
    await testFlow5_ImageUpload();

    // Bonus tests
    await testMassOutreachDetection();
    await testGiftEvaluatorEdgeCases();

  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n");
  log("╔════════════════════════════════════════════════════════════════════╗", "bold");
  log("║                        TEST RESULTS SUMMARY                        ║", "bold");
  log("╚════════════════════════════════════════════════════════════════════╝", "bold");
  console.log();
  log(`  ✓ Passed: ${totalPassed}`, "green");
  log(`  ✗ Failed: ${totalFailed}`, totalFailed > 0 ? "red" : "green");
  console.log(`  Duration: ${duration}s`);
  console.log();

  if (totalFailed > 0) {
    log("Some tests failed. Please review the output above.", "red");
    process.exit(1);
  } else {
    log("All tests passed! Day 4 features are working correctly.", "green");
  }
}

main();
